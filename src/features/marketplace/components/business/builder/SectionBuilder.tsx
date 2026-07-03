import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Monitor, Smartphone, ArrowUpRight, Lock, ShoppingCart, Sparkles } from "lucide-react";
import { cn } from "../../../../../shared/lib/utils";
import { useFormatPrice } from "../../../../../shared/hooks/useFormatPrice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../../../shared/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../../../../../shared/components/ui/sheet";
import { Button } from "../../../../../shared/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
} from "../../../../../shared/components/ui/collapsible";
import type {
  Business,
  SectionEntry,
  LocationWithAssignments,
  FaqItem,
  AnnouncementContent,
  WebsiteVariantCatalogEntry,
  WebsiteSectionCatalogEntry,
} from "../../../types";
import { SECTION_META, isKnownSectionType, PINNED_TYPES, REQUIRED_TYPES } from "./sectionCatalog";
import { SectionCard } from "./SectionCard";
import { VariantPurchaseDialog, variantPriceLabel } from "./VariantPurchaseDialog";
import { SettingsPanel } from "./SettingsPanel";
import { LivePreview, marqueeItems, MARQUEE_MIN_ITEMS, UNNUMBERED, type PreviewData, type PreviewReview, type RatingBars } from "./LivePreview";
import { AutoHeight } from "./AutoHeight";
import { useLocationTagDictionaries } from "../../../hooks/useLocationTagDictionaries";
import { aboutHeadline } from "./aboutContent";

/** House ease-out (mirrors --ease-out-strong in globals.css). */
const EASE = "ease-[cubic-bezier(0.23,1,0.32,1)]";
const SECTION_PREVIEW_PREF_KEY = "zavoia:business-page-section-preview";

type PreviewScope = "page" | "section";
type MarketplaceT = (key: string, options?: Record<string, unknown>) => string;

interface SectionRowInfo {
  summary: string;
  status?: SectionCardStatus;
  noData?: boolean;
}

interface UndoToastOptions {
  title: string;
  description?: string;
  undoLabel: string;
  onUndo: () => void;
}

type SelectedAddOnKind = "section" | "variant";

interface SelectedAddOn {
  key: string;
  kind: SelectedAddOnKind;
  sectionType: string;
  sectionIndex: number;
  sectionLabel: string;
  itemLabel: string;
  sku?: string;
  priceMinor?: number;
  currency?: string;
}

const isAddOnVariant = (variant?: SectionVariant | null) => variant?.access === "add_on";

const includedVariantIdFor = (meta: SectionMeta) =>
  meta.variants.find((variant) => !isAddOnVariant(variant))?.id ?? meta.variants[0]?.id;

const formatAddOnPrice = (priceMinor: number | undefined, currency: string | undefined, locale: "en" | "ro") => {
  if (typeof priceMinor !== "number") return null;
  const fractionDigits = priceMinor % 100 === 0 ? 0 : 2;
  return new Intl.NumberFormat(locale === "ro" ? "ro-RO" : "en-US", {
    style: "currency",
    currency: currency ?? "EUR",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(priceMinor / 100);
};

const firstLocaleText = (value: { en?: string; ro?: string } | undefined, locale: "en" | "ro") =>
  value?.[locale]?.trim() || value?.en?.trim() || value?.ro?.trim() || "";

const portfolioPhotoCount = (locations: LocationWithAssignments[]) =>
  locations.reduce((count, location) => count + (location.portfolioImages?.length ?? 0), 0);

const teamMemberCount = (locations: LocationWithAssignments[]) => {
  const ids = new Set<number | string>();
  locations.forEach((location) => {
    location.teamMembers?.forEach((member) => {
      ids.add(member.id ?? `${member.firstName ?? ""}-${member.lastName ?? ""}`);
    });
  });
  return ids.size;
};

const reviewCount = (locations: LocationWithAssignments[], reviews?: PreviewReview[]) => {
  const aggregate = locations.reduce((count, location) => count + (location.totalReviews ?? 0), 0);
  return Math.max(aggregate, reviews?.length ?? 0);
};

const showUndoToast = ({ title, description, undoLabel, onUndo }: UndoToastOptions) => {
  toast.custom(
    (toastId) => (
      <div className="flex w-[min(420px,calc(100vw-2rem))] items-center justify-between gap-5 rounded-md border border-border bg-surface px-4 py-3 shadow-sm">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground-1">{title}</p>
          {description ? (
            <p className="mt-1 truncate text-xs text-foreground-3 dark:text-foreground-2">{description}</p>
          ) : null}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          rounded="default"
          className="h-8 shrink-0 px-3 text-xs font-semibold"
          onClick={() => {
            onUndo();
            toast.dismiss(toastId);
          }}
        >
          {undoLabel}
        </Button>
      </div>
    ),
    { duration: 5000 },
  );
};

/**
 * Keep a dragged row clamped vertically inside `ref`'s element. Mirrors @dnd-kit's internal
 * restrictToBoundingRect, but bounds to a specific container (the section list) instead of the
 * dragging node's immediate parent: our per-card wrappers make the built-in restrictToParentElement
 * clamp to a single card. Pairs with restrictToVerticalAxis, which zeroes the horizontal transform.
 */
const restrictToContainer =
  (ref: RefObject<HTMLElement | null>): Modifier =>
  ({ transform, draggingNodeRect }) => {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds || !draggingNodeRect) return transform;
    if (draggingNodeRect.top + transform.y <= bounds.top) {
      return { ...transform, y: bounds.top - draggingNodeRect.top };
    }
    if (draggingNodeRect.bottom + transform.y >= bounds.bottom) {
      return { ...transform, y: bounds.bottom - draggingNodeRect.bottom };
    }
    return transform;
  };

interface SectionBuilderProps {
  layout: SectionEntry[];
  reorderSections: (from: number, to: number) => void;
  toggleSectionVisible: (index: number) => void;
  setSectionVariant: (index: number, variant: string) => void;
  setSectionConfig: (index: number, config: Record<string, unknown>) => void;
  fontKey: string;
  faqItems: FaqItem[];
  setFaqItems: (items: FaqItem[]) => void;
  announcementContent: AnnouncementContent;
  setAnnouncementContent: (value: AnnouncementContent) => void;
  aboutContent: string;
  setAboutContent: (value: string) => void;
  /** The Brand column (logo / color / tagline / typeface / cover / link) rendered to the right of the list. */
  brandPanel: ReactNode;
  // Preview inputs (read from the live form + listing data)
  business: Business | null;
  locations: LocationWithAssignments[];
  heroImageUrl: string | null;
  tagline: string;
  setTagline: (value: string) => void;
  taglineError?: string;
  /** Publish-blocking errors surfaced as a pulsing cue on the matching section card. */
  aboutError?: string | null;
  announcementError?: string | null;
  canWrite: boolean;
  brandColorHex: string;
  useBusinessEmail: boolean;
  email: string;
  useBusinessPhone: boolean;
  phone: string;
  /** Real 5★ quotes for the Reviews section preview (from the reviews API). */
  reviews?: PreviewReview[];
  /** Per team-member rating keyed by member id (from the reviews stats endpoint). */
  teamRatings?: Record<number, { rating: number; count: number }>;
  /** Business-wide per-star review counts (from the reviews stats endpoint) for the distribution bars. */
  ratingDistribution?: RatingBars;
  // The builder offering is server-driven: the SECTION catalog decides which section cards
  // render (locked while paid + not unlocked), and the VARIANT catalog decides which variant
  // pills render beyond each section's base variant (matched by sectionType:variantKey).
  /** ACTIVE variant catalog with per-business ownership; absent/empty = only base variants render. */
  variantCatalog?: WebsiteVariantCatalogEntry[];
  /** ACTIVE section catalog with per-business ownership; absent/empty = all implemented sections render free. */
  sectionCatalog?: WebsiteSectionCatalogEntry[];
  /** Plan includes the website builder (purchasing needs Plus/trial; locked pills still render without it). */
  hasWebsiteBuilder?: boolean;
  /** A checkout session is being created (buy button busy until the Stripe redirect). */
  isVariantCheckoutLoading?: boolean;
  /** Confirmed purchase → create the Stripe checkout session and redirect. */
  onBuyVariant?: (variant: WebsiteVariantCatalogEntry) => void;
  /** Confirmed section unlock → create the Stripe checkout session and redirect. */
  onBuySection?: (section: WebsiteSectionCatalogEntry) => void;
  /** Variant ids queued in the shopping cart (marks pills and toggles the dialog's cart button). */
  cartVariantIds?: number[];
  /** Section catalog ids queued in the shopping cart. */
  cartSectionIds?: number[];
  /** Add to / remove from the shopping cart (combined checkout via the cart bar). */
  onToggleCartVariant?: (variant: WebsiteVariantCatalogEntry) => void;
  /** Add a section unlock to / remove it from the shopping cart. */
  onToggleCartSection?: (section: WebsiteSectionCatalogEntry) => void;
}

/**
 * Business-page studio — one editorial module: a header, then the section list (left) beside the brand
 * controls (right). Opening a section reveals its editor plus a scoped preview of just that section;
 * the whole page opens in a fullscreen dialog via "Open preview". Reorder via drag or the ↑/↓ buttons.
 * Near-monochrome chrome; the only colour lives inside the rendered preview.
 */
export function SectionBuilder(props: SectionBuilderProps) {
  const { t, i18n } = useTranslation("marketplace");
  const [openType, setOpenType] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewScope, setPreviewScope] = useState<PreviewScope>("page");
  const [previewFocusType, setPreviewFocusType] = useState<string | null>(null);
  const [addOnsOpen, setAddOnsOpen] = useState(false);
  // Sections are edited and previewed in the owner's app language (no language toggle).
  const locale: "en" | "ro" = i18n.language?.toLowerCase().startsWith("ro") ? "ro" : "en";
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [sectionPreviewOpen, setSectionPreviewOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(SECTION_PREVIEW_PREF_KEY) !== "hidden";
  });
  const previewScrollRef = useRef<HTMLDivElement | null>(null);

  // Resolve the location-tag dictionaries once (session-cached fetch) and feed them into previewData so the
  // Locations section renders tags without its own authenticated fetch.
  const { dictionaries: tagDictionaries } = useLocationTagDictionaries();

  // Paid variants: catalog lookup by (sectionType, variantKey) + the entry pending purchase
  // confirmation. A locked pill (paid + unowned) opens the dialog instead of selecting.
  const { formatPrice } = useFormatPrice();
  const [purchaseTarget, setPurchaseTarget] = useState<WebsiteVariantCatalogEntry | null>(null);
  const variantCatalog = props.variantCatalog;
  const catalogByKey = useMemo(() => {
    const map = new Map<string, WebsiteVariantCatalogEntry>();
    for (const entry of variantCatalog ?? []) {
      map.set(`${entry.sectionType}:${entry.variantKey}`, entry);
    }
    return map;
  }, [variantCatalog]);
  // Server-designated base per section (the catalog row flagged isBase — free, always offered).
  const baseKeyByType = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of variantCatalog ?? []) {
      if (entry.isBase) map.set(entry.sectionType, entry.variantKey);
    }
    return map;
  }, [variantCatalog]);

  // Server-driven SECTION offering: lookup by type + the entry pending an unlock purchase.
  // A locked card (paid + not unlocked) routes every interaction to the purchase dialog.
  const sectionCatalog = props.sectionCatalog;
  const sectionCatalogByType = useMemo(() => {
    const map = new Map<string, WebsiteSectionCatalogEntry>();
    for (const entry of sectionCatalog ?? []) {
      map.set(entry.sectionType, entry);
    }
    return map;
  }, [sectionCatalog]);
  const [sectionPurchaseTarget, setSectionPurchaseTarget] = useState<WebsiteSectionCatalogEntry | null>(null);
  // Required chrome (nav/hero/footer) is never locked — every page needs it regardless of catalog data.
  const lockedSectionEntry = (type: string): WebsiteSectionCatalogEntry | null => {
    if (REQUIRED_TYPES.has(type)) return null;
    const entry = sectionCatalogByType.get(type);
    return entry && entry.priceMinor > 0 && !entry.owned ? entry : null;
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Drag stays on the vertical axis and inside the section list (never floats out of the column).
  const listRef = useRef<HTMLDivElement | null>(null);
  const modifiers = useMemo(() => [restrictToVerticalAxis, restrictToContainer(listRef)], []);

  const setPreviewTrayOpen = useCallback((open: boolean) => {
    setSectionPreviewOpen(open);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SECTION_PREVIEW_PREF_KEY, open ? "shown" : "hidden");
    }
  }, []);

  const openPreview = useCallback(
    (scope: PreviewScope, focusType?: string | null) => {
      setPreviewScope(scope);
      setPreviewFocusType(focusType ?? openType);
      setPreviewOpen(true);
    },
    [openType],
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = props.layout.findIndex((s) => s.type === active.id);
    const to = props.layout.findIndex((s) => s.type === over.id);
    if (from !== -1 && to !== -1) {
      const moved = props.layout[from];
      const label = isKnownSectionType(moved.type) ? t(SECTION_META[moved.type].labelKey) : moved.type;
      props.reorderSections(from, to);
      showUndoToast({
        title: t("businessPage.builder.toast.sectionMoved", { section: label }),
        undoLabel: t("businessPage.builder.toast.undo"),
        onUndo: () => props.reorderSections(to, from),
      });
    }
  };

  const previewData: PreviewData = useMemo(
    () => ({
      businessName: props.business?.name ?? "",
      logo: props.business?.logo ?? null,
      heroImageUrl: props.heroImageUrl,
      tagline: props.tagline,
      aboutContent: props.aboutContent,
      email: props.useBusinessEmail ? props.business?.email ?? "" : props.email,
      phone: props.useBusinessPhone ? props.business?.phone ?? "" : props.phone,
      social: {
        instagram: props.business?.instagramUrl,
        facebook: props.business?.facebookUrl,
        tiktok: props.business?.tiktokUrl,
        website: props.business?.websiteUrl,
        pinterest: props.business?.pinterestUrl,
      },
      locations: props.locations,
      faq: props.faqItems,
      announcement: props.announcementContent,
      brandColor: props.brandColorHex,
      fontKey: props.fontKey,
      locale,
      reviews: props.reviews,
      teamRatings: props.teamRatings,
      ratingDistribution: props.ratingDistribution,
      tagDictionaries,
    }),
    [
      props.business,
      props.heroImageUrl,
      props.tagline,
      props.aboutContent,
      props.useBusinessEmail,
      props.email,
      props.useBusinessPhone,
      props.phone,
      props.locations,
      props.faqItems,
      props.announcementContent,
      props.brandColorHex,
      props.fontKey,
      locale,
      props.reviews,
      props.teamRatings,
      props.ratingDistribution,
      tagDictionaries,
    ],
  );

  // The marquee only reads as an intentional band with enough services to scroll; below the threshold it's
  // pointless, so drop the section from the builder entirely (it also self-hides on render). Both gate on the
  // same helper so the card and the rendered band never disagree. Indices into props.layout are preserved so
  // visibility/variant handlers stay correct; the displayed ordinal counts the shown cards.
  const marqueeReady = marqueeItems(props.locations).length >= MARQUEE_MIN_ITEMS;
  // The section list itself is server-driven: once the catalog is loaded, a card renders only when
  // the server offers its type (locked while paid + not unlocked). Safeguards: required chrome
  // (nav/hero/footer) always renders; a section already VISIBLE in the saved layout is grandfathered
  // (never silently dropped from the list); an empty/missing catalog falls back to everything; and a
  // catalog type with no implemented component is ignored via the layout match (the layout only
  // carries implemented or saved types, and unknown saved types were already render-skipped).
  const displaySections = props.layout
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.type !== "marquee" || marqueeReady)
    .filter(({ entry }) => {
      if (!sectionCatalog || sectionCatalog.length === 0) return true;
      if (REQUIRED_TYPES.has(entry.type)) return true;
      if (sectionCatalogByType.has(entry.type)) return true;
      return entry.visible;
    });

  const items = displaySections.map(({ entry }) => entry.type);
  const shown = displaySections.filter(({ entry }) => entry.visible).length;

  const selectedAddOns = useMemo<SelectedAddOn[]>(() => {
    return props.layout.flatMap((entry, sectionIndex) => {
      if (!entry.visible || !isKnownSectionType(entry.type)) return [];
      const meta = SECTION_META[entry.type];
      const sectionLabel = t(meta.labelKey);
      const addOns: SelectedAddOn[] = [];

      if (meta.access === "add_on") {
        addOns.push({
          key: `section:${entry.type}`,
          kind: "section",
          sectionType: entry.type,
          sectionIndex,
          sectionLabel,
          itemLabel: t("businessPage.builder.addOns.sectionAddOn"),
          sku: meta.addOnSku,
          priceMinor: meta.addOnPriceMinor,
          currency: meta.addOnCurrency,
        });
      }

      const activeVariant = meta.variants.find((variant) => variant.id === entry.variant);
      if (activeVariant && isAddOnVariant(activeVariant)) {
        addOns.push({
          key: `variant:${entry.type}:${activeVariant.id}`,
          kind: "variant",
          sectionType: entry.type,
          sectionIndex,
          sectionLabel,
          itemLabel: t(activeVariant.labelKey),
          sku: activeVariant.addOnSku,
          priceMinor: activeVariant.addOnPriceMinor,
          currency: activeVariant.addOnCurrency,
        });
      }

      return addOns;
    });
  }, [props.layout, t]);

  const selectedAddOnTotal = useMemo(() => {
    if (selectedAddOns.length === 0) return null;
    const currencies = new Set(selectedAddOns.map((item) => item.currency ?? "EUR"));
    const allPriced = selectedAddOns.every((item) => typeof item.priceMinor === "number");
    if (!allPriced || currencies.size !== 1) return null;
    const currency = Array.from(currencies)[0];
    const totalMinor = selectedAddOns.reduce((total, item) => total + (item.priceMinor ?? 0), 0);
    return formatAddOnPrice(totalMinor, currency, locale);
  }, [locale, selectedAddOns]);

  const previewNumberFor = useCallback(
    (index: number) =>
      props.layout.slice(0, index).filter((s) => s.visible && !UNNUMBERED.has(s.type)).length + 1,
    [props.layout],
  );

  const rowInfoFor = useCallback(
    (entry: SectionEntry): SectionRowInfo => {
      const fixed = REQUIRED_TYPES.has(entry.type);
      const meta = isKnownSectionType(entry.type) ? SECTION_META[entry.type] : null;
      const activeVariant = meta?.variants.find((variant) => variant.id === entry.variant);
      const addOnStatus: SectionCardStatus | undefined =
        entry.visible && (meta?.access === "add_on" || isAddOnVariant(activeVariant))
          ? { label: t("businessPage.builder.addOns.selectedAddOn"), tone: "neutral" }
          : undefined;
      const hiddenStatus: SectionCardStatus | undefined = !entry.visible
        ? meta?.access === "add_on"
          ? { label: t("businessPage.builder.addOns.addOn"), tone: "neutral" }
          : { label: t("businessPage.builder.summary.hidden"), tone: "muted" }
        : undefined;
      const fixedStatus: SectionCardStatus | undefined = fixed
        ? { label: t("businessPage.builder.summary.fixed"), tone: "neutral" }
        : undefined;

      const noDataStatus: SectionCardStatus = {
        label: t("businessPage.builder.summary.noData"),
        tone: "warning",
      };
      const needsContentStatus: SectionCardStatus = {
        label: t("businessPage.builder.summary.needsContent"),
        tone: "danger",
      };

      const withStatus = (
        summary: string,
        status?: SectionCardStatus,
        noData = false,
      ): SectionRowInfo => ({
        summary,
        status: hiddenStatus ?? status ?? addOnStatus ?? fixedStatus,
        noData,
      });

      switch (entry.type) {
        case "announcement": {
          const message = firstLocaleText(props.announcementContent.message, locale);
          const needsContent = entry.visible && !!props.announcementError;
          return withStatus(
            message || t("businessPage.builder.summary.noMessage"),
            needsContent ? needsContentStatus : undefined,
            !message,
          );
        }
        case "nav":
          return withStatus(t("businessPage.builder.summary.logoLinksBooking"));
        case "hero": {
          const hasCover = !!props.heroImageUrl;
          const hasSubtitle = props.tagline.trim().length > 0;
          return withStatus(
            hasCover
              ? t("businessPage.builder.summary.coverSet")
              : hasSubtitle
                ? t("businessPage.builder.summary.subtitleSet")
                : t("businessPage.builder.summary.addSubtitle"),
            props.taglineError ? needsContentStatus : undefined,
          );
        }
        case "marquee": {
          const count = marqueeItems(props.locations).length;
          return withStatus(t("businessPage.builder.summary.services", { count }));
        }
        case "about": {
          const headline = aboutHeadline(props.aboutContent);
          const needsContent = entry.visible && !!props.aboutError;
          return withStatus(
            headline || t("businessPage.builder.summary.noHeadline"),
            needsContent ? needsContentStatus : undefined,
            !headline,
          );
        }
        case "locations": {
          const hiddenIds = (entry.config?.hiddenLocationIds as number[] | undefined) ?? [];
          const total = props.locations.length;
          const visible = props.locations.filter((location) => !hiddenIds.includes(location.id)).length;
          return withStatus(
            total > 0
              ? t("businessPage.builder.summary.locationsShown", { shown: visible, total })
              : t("businessPage.builder.summary.locationsEmpty"),
            total === 0 || visible === 0 ? noDataStatus : undefined,
            total === 0 || visible === 0,
          );
        }
        case "gallery": {
          const count = portfolioPhotoCount(props.locations);
          return withStatus(
            count > 0
              ? t("businessPage.builder.summary.photos", { count })
              : t("businessPage.builder.summary.photosEmpty"),
            count === 0 ? noDataStatus : undefined,
            count === 0,
          );
        }
        case "team": {
          const count = teamMemberCount(props.locations);
          return withStatus(
            count > 0
              ? t("businessPage.builder.summary.members", { count })
              : t("businessPage.builder.summary.membersEmpty"),
            count === 0 ? noDataStatus : undefined,
            count === 0,
          );
        }
        case "interlude": {
          const count = portfolioPhotoCount(props.locations);
          return withStatus(
            count > 0
              ? t("businessPage.builder.summary.usesPortfolioPhoto")
              : t("businessPage.builder.summary.noPortfolioPhoto"),
            count === 0 ? noDataStatus : undefined,
            count === 0,
          );
        }
        case "testimonials": {
          const count = reviewCount(props.locations, props.reviews);
          return withStatus(
            count > 0
              ? t("businessPage.builder.summary.reviews", { count })
              : t("businessPage.builder.summary.reviewsEmpty"),
            count === 0 ? noDataStatus : undefined,
            count === 0,
          );
        }
        case "faq": {
          const count = props.faqItems.length;
          return withStatus(
            count > 0
              ? t("businessPage.builder.summary.questions", { count })
              : t("businessPage.builder.summary.questionsEmpty"),
            count === 0 ? noDataStatus : undefined,
            count === 0,
          );
        }
        case "footer":
          return withStatus(t("businessPage.builder.summary.footerContent"));
        default:
          return withStatus(t("businessPage.builder.summary.generated"));
      }
    },
    [
      locale,
      props.aboutContent,
      props.aboutError,
      props.announcementContent.message,
      props.announcementError,
      props.faqItems.length,
      props.heroImageUrl,
      props.locations,
      props.reviews,
      props.tagline,
      props.taglineError,
      t,
    ],
  );

  const toggleVisibleWithFeedback = useCallback(
    (entry: SectionEntry, index: number) => {
      const turningOn = !entry.visible;
      props.toggleSectionVisible(index);
      const label = isKnownSectionType(entry.type) ? t(SECTION_META[entry.type].labelKey) : entry.type;
      showUndoToast({
        title: t(turningOn ? "businessPage.builder.toast.sectionShown" : "businessPage.builder.toast.sectionHidden", {
          section: label,
        }),
        undoLabel: t("businessPage.builder.toast.undo"),
        onUndo: () => props.toggleSectionVisible(index),
      });
    },
    [props.toggleSectionVisible, t],
  );

  const removeSelectedAddOn = useCallback(
    (item: SelectedAddOn) => {
      if (item.kind === "section") {
        props.toggleSectionVisible(item.sectionIndex);
        if (openType === item.sectionType) setOpenType(null);
        return;
      }

      if (!isKnownSectionType(item.sectionType)) return;
      const includedVariantId = includedVariantIdFor(SECTION_META[item.sectionType]);
      if (!includedVariantId) return;
      props.setSectionVariant(item.sectionIndex, includedVariantId);
    },
    [openType, props.setSectionVariant, props.toggleSectionVisible],
  );

  const handleUnlockSelected = useCallback(() => {
    toast.info(t("businessPage.builder.addOns.checkoutPending"));
  }, [t]);

  const previewFocusIndex = previewFocusType
    ? props.layout.findIndex((section) => section.type === previewFocusType)
    : -1;
  const previewFocusEntry = previewFocusIndex >= 0 ? props.layout[previewFocusIndex] : null;
  const modalSectionMode = previewScope === "section" && !!previewFocusEntry;
  const modalLayout = modalSectionMode
    ? [{ ...previewFocusEntry!, visible: true }]
    : props.layout;
  const modalStartNumber = modalSectionMode ? previewNumberFor(previewFocusIndex) : 1;
  const modalChrome = !modalSectionMode;
  const previewFocusLabel =
    previewFocusEntry && isKnownSectionType(previewFocusEntry.type)
      ? t(SECTION_META[previewFocusEntry.type].labelKey)
      : null;

  useEffect(() => {
    if (!previewOpen || previewScope !== "page" || !previewFocusType) return;
    const container = previewScrollRef.current;
    if (!container) return;
    const target = Array.from(container.querySelectorAll<HTMLElement>("[data-preview-section]")).find(
      (node) => node.dataset.previewSection === previewFocusType,
    );
    if (!target) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  }, [device, previewFocusType, previewOpen, previewScope, props.layout]);

  const renderSettings = (entry: SectionEntry, index: number) => {
    const meta = isKnownSectionType(entry.type) ? SECTION_META[entry.type] : null;
    // Server-driven pills, matched against the components implemented in code (SECTION_META): a
    // catalog key with no matching component is simply ignored, so a backend typo can't break the
    // builder. The server-designated base always renders; when the server names none — or an
    // unknown key — the first registered variant stands in. The saved variant also stays visible
    // even if it left the catalog, so the active state never silently vanishes.
    const serverBase = baseKeyByType.get(entry.type);
    const baseId =
      meta && serverBase && meta.variants.some((v) => v.id === serverBase)
        ? serverBase
        : meta?.variants[0]?.id;
    const variants = meta
      ? meta.variants.filter(
          (v) => v.id === baseId || v.id === entry.variant || catalogByKey.has(`${entry.type}:${v.id}`),
        )
      : [];
    const hasVariants = variants.length > 1;
    // The section's real "0N —" ordinal in the full page, so the scoped preview stays in sync with the rest.
    const previewNumber = previewNumberFor(index);
    const sectionPreviewMotionKey = `${entry.type}:${entry.variant}:${device}`;
    return (
      <div className="space-y-4">
        <fieldset
          disabled={!entry.visible}
          className={cn(
            "m-0 min-w-0 space-y-4 border-0 p-0",
            !entry.visible && "pointer-events-none opacity-60 transition-opacity duration-200",
          )}
        >
        {hasVariants && (
          <div className="flex flex-col items-start gap-1.5">
            <span className="text-[11px] font-semibold uppercase text-foreground-3">
              {t("businessPage.builder.variantLabel")}
            </span>
            <div className="inline-flex rounded-lg bg-surface-hover p-0.5" role="group">
              {/* Each pill's state comes from the catalog entry: paid + unowned = a lock pill that
                  opens the purchase dialog (selection is replaced, so an unowned paid variant can't
                  be saved); paid + owned = selectable with a subtle premium spark; free = plain. */}
              {variants.map((v) => {
                const active = entry.variant === v.id;
                const catalogEntry = catalogByKey.get(`${entry.type}:${v.id}`);
                const paid = !!catalogEntry && catalogEntry.priceMinor > 0;
                const lockedVariant = paid && !catalogEntry.owned;
                if (lockedVariant) {
                  const price = variantPriceLabel(formatPrice, catalogEntry);
                  const inCart = (props.cartVariantIds ?? []).includes(catalogEntry.id);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setPurchaseTarget(catalogEntry)}
                      aria-pressed={active}
                      aria-label={t("businessPage.paidVariants.lockedAria", {
                        name: t(v.labelKey),
                        price,
                      })}
                      title={
                        inCart
                          ? t("businessPage.paidVariants.inCartTitle", { price })
                          : t("businessPage.paidVariants.lockedTitle", { price })
                      }
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium outline-none transition-[color,background-color,box-shadow,transform] duration-200 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring/50",
                        EASE,
                        // The saved variant can itself be locked (it turned paid after being saved) —
                        // keep the active plate so the state reads, but the lock stays.
                        active
                          ? "bg-surface text-foreground-2 shadow-sm"
                          : "text-foreground-3 hover:text-foreground-2",
                      )}
                    >
                      {inCart ? (
                        <ShoppingCart className="h-3 w-3 shrink-0 text-primary" strokeWidth={2} aria-hidden />
                      ) : (
                        <Lock className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
                      )}
                      {t(v.labelKey)}
                      <span className="text-[11px] font-normal text-foreground-3">{price}</span>
                    </button>
                  );
                }
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => props.setSectionVariant(index, v.id)}
                    aria-pressed={active}
                    title={paid ? t("businessPage.paidVariants.ownedTitle") : undefined}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium outline-none transition-[color,background-color,box-shadow,transform] duration-200 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring/50",
                      EASE,
                      active
                        ? "bg-surface text-primary-700 shadow-sm dark:text-primary-400"
                        : "text-foreground-3 hover:text-foreground-2",
                    )}
                  >
                    {t(v.labelKey)}
                    {paid && (
                      <Sparkles className="h-3 w-3 shrink-0 text-primary" strokeWidth={1.8} aria-hidden />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          {hasVariants && meta ? (
            <SectionStylePicker
              entry={entry}
              index={index}
              meta={meta}
              disabled={!entry.visible || !props.canWrite}
              locale={locale}
              onVariantChange={props.setSectionVariant}
              t={t}
            />
          ) : null}
          {previewingAddOnStyle || previewingAddOnSection ? (
            <div className="mb-3 rounded-xl border border-border-subtle bg-surface-hover/50 px-3 py-2.5 text-[12px] leading-5 text-foreground-2">
              <span className="font-semibold text-foreground-1">
                {previewingAddOnStyle
                  ? t("businessPage.builder.addOns.previewingStyle")
                  : t("businessPage.builder.addOns.previewingSection")}
              </span>{" "}
              {t("businessPage.builder.addOns.previewingAddOnHelper")}
            </div>
          ) : null}
          <Collapsible open={sectionPreviewOpen}>
            <CollapsibleContent>
              <AutoHeight className="pt-1">
                <div className="overflow-hidden rounded-xl border border-border bg-background">
                  <div
                    className={cn(
                      "mx-auto transform-gpu transition-[max-width,transform] duration-200 motion-reduce:transition-none",
                      EASE,
                    )}
                    style={{ maxWidth: device === "mobile" ? 390 : "100%" }}
                  >
                    <div
                      key={sectionPreviewMotionKey}
                      className={cn(
                        "transform-gpu motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:duration-200",
                        EASE,
                      )}
                    >
                      <LivePreview
                        layout={[{ ...entry, visible: true }]}
                        data={previewData}
                        chrome={false}
                        startNumber={previewNumber}
                      />
                    </div>
                  </div>
                </div>
              </AutoHeight>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="overflow-hidden rounded-[1.5rem] border border-border bg-surface shadow-xs">
        <div className="px-4 py-4 sm:px-5 lg:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[12px] text-foreground-3">
                <span className="inline-flex items-center gap-2 font-medium text-foreground-2">
                  {t("businessPage.builder.eyebrow")}
                </span>
                <span className="h-1 w-1 rounded-full bg-border-subtle" aria-hidden />
                <span className="tabular-nums">
                  <span className="font-semibold text-foreground-1">
                    {String(shown).padStart(2, "0")}
                  </span>
                  {" / "}
                  {String(displaySections.length).padStart(2, "0")}{" "}
                  {t("businessPage.builder.sectionsVisible")}
                </span>
              </div>
              <h2 className="text-balance text-[21px] font-semibold leading-tight text-foreground-1 sm:text-[23px]">
                {t("businessPage.builder.studioTitle")}
              </h2>
              <p className="mt-1 max-w-[58ch] text-pretty text-[13px] leading-5 text-foreground-3">
                {t("businessPage.builder.studioHelper")}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="default"
              rounded="default"
              onClick={() => openPreview("page", openType)}
              className={cn(
                "h-9 shrink-0 self-start px-3.5 text-[13px] font-semibold",
                "transition-[transform,border-color,background-color] duration-150 active:scale-[0.98]",
                EASE,
              )}
            >
              {t("businessPage.builder.openPreview")}
              <ArrowUpRight className="size-3.5" strokeWidth={1.8} aria-hidden />
            </Button>
          </div>
        </div>

        {/* brand band + section list, stacked full-width — the brand controls moved above the list so the
            list and each section's scoped preview get the whole module width */}
        <div className="border-t border-border">
          {/* brand band — above the list */}
          <div className="bg-surface px-4 py-3.5 sm:px-5 lg:px-6">{props.brandPanel}</div>

          {/* sections — the page contents, set as a ruled editorial index */}
          <div className="border-t border-border bg-surface-hover/35 px-3 py-3.5 sm:px-4 lg:px-5">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-[15px] font-semibold text-foreground-1">
                  {t("businessPage.builder.title")}
                </h3>
                <p className="mt-1 max-w-[60ch] text-pretty text-[13px] leading-5 text-foreground-3">
                  {t("businessPage.builder.sectionsHelper")}
                </p>
              </div>
            </div>

            {/* bracketed sheet with a hairline spine in the left margin */}
            <div className="relative overflow-hidden rounded-2xl border border-border bg-surface">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-[72px] z-0 w-px bg-border-subtle"
              />
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={modifiers}
                onDragStart={() => setOpenType(null)}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={items} strategy={verticalListSortingStrategy}>
                  <div ref={listRef} className="relative">
                    {displaySections.map(({ entry, index }, pos) => {
                      // A paid, not-yet-unlocked section: the card renders locked and every
                      // interaction (expand, toggle) opens the unlock purchase dialog instead.
                      const paidLocked = lockedSectionEntry(entry.type);
                      const open = openType === entry.type && !paidLocked;
                      return (
                        <Collapsible
                          key={entry.type}
                          open={open}
                          onOpenChange={(next) => {
                            if (paidLocked) {
                              if (next) setSectionPurchaseTarget(paidLocked);
                              return;
                            }
                            setOpenType(next ? entry.type : null);
                          }}
                          className={cn(
                            "relative",
                            open && "z-10",
                            pos > 0 &&
                              "before:pointer-events-none before:absolute before:left-[72px] before:right-[18px] before:top-0 before:z-0 before:h-px before:bg-border-subtle before:content-['']",
                          )}
                        >
                          <SectionCard
                            entry={entry}
                            meta={isKnownSectionType(entry.type) ? SECTION_META[entry.type] : null}
                            index={pos + 1}
                            summary={rowInfo.summary}
                            status={rowInfo.status}
                            expanded={open}
                            locked={PINNED_TYPES.has(entry.type)}
                            required={REQUIRED_TYPES.has(entry.type)}
                            needsAttention={
                              (entry.type === "about" && !!props.aboutError) ||
                              (entry.type === "announcement" && !!props.announcementError)
                            }
                            paidLocked={!!paidLocked}
                            priceLabel={paidLocked ? variantPriceLabel(formatPrice, paidLocked) : undefined}
                            inCart={!!paidLocked && (props.cartSectionIds ?? []).includes(paidLocked.id)}
                            onSelect={() => {
                              if (paidLocked) {
                                setSectionPurchaseTarget(paidLocked);
                                return;
                              }
                              setOpenType(open ? null : entry.type);
                            }}
                            onToggleVisible={() => {
                              if (paidLocked) {
                                setSectionPurchaseTarget(paidLocked);
                                return;
                              }
                              const turningOn = !entry.visible;
                              // Re-enabling a locations section that has everything hidden restores all
                              // locations, so it can never be on with nothing to show.
                              if (turningOn && entry.type === "locations") {
                                const hiddenIds = (entry.config?.hiddenLocationIds as number[] | undefined) ?? [];
                                if (props.locations.length > 0 && props.locations.every((l) => hiddenIds.includes(l.id))) {
                                  props.setSectionConfig(index, { hiddenLocationIds: [] });
                                }
                              }
                              toggleVisibleWithFeedback(entry, index);
                              // Expand a section when it's switched on; collapse it when switched off.
                              if (turningOn) setOpenType(entry.type);
                              else if (open) setOpenType(null);
                            }}
                          />
                          <CollapsibleContent>
                            <AutoHeight className="relative pb-5 pl-[72px] pr-4 pt-3 sm:pl-[87px]">
                              <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:duration-200">
                                {renderSettings(entry, index)}
                              </div>
                            </AutoHeight>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            {selectedAddOns.length > 0 ? (
              <div
                className={cn(
                  "sticky bottom-3 z-20 mt-3 flex flex-col gap-3 rounded-xl border border-border bg-surface px-3.5 py-3 shadow-sm",
                  "sm:flex-row sm:items-center sm:justify-between",
                )}
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-foreground-1">
                    {selectedAddOnTotal
                      ? t("businessPage.builder.addOns.selectedWithTotal", {
                          count: selectedAddOns.length,
                          total: selectedAddOnTotal,
                        })
                      : t("businessPage.builder.addOns.selected", { count: selectedAddOns.length })}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-5 text-foreground-3">
                    {t("businessPage.builder.addOns.unlockHelper")}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    rounded="default"
                    onClick={() => setAddOnsOpen(true)}
                    className={cn(
                      "h-8 px-3 text-[12px] font-semibold",
                      "transition-[transform,border-color,background-color] duration-150 active:scale-[0.98]",
                      EASE,
                    )}
                  >
                    {t("businessPage.builder.addOns.review")}
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    rounded="default"
                    onClick={handleUnlockSelected}
                    className={cn(
                      "h-8 px-3 text-[12px] font-semibold",
                      "transition-[transform,background-color] duration-150 active:scale-[0.98]",
                      EASE,
                    )}
                  >
                    {t("businessPage.builder.addOns.unlockSelected")}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

      </div>

      {/* fullscreen */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="flex max-h-[90vh] w-full max-w-[min(1280px,calc(100%-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(1280px,calc(100%-2rem))]">
          <DialogHeader className="flex flex-row items-center justify-between gap-3 space-y-0 border-b border-border p-4 pr-12 text-left">
            <DialogTitle className="min-w-0 text-[12px] font-semibold text-foreground-1">
              <span className="block truncate">
                {modalSectionMode && previewFocusLabel
                  ? t("businessPage.builder.currentSectionPreview", { section: previewFocusLabel })
                  : t("businessPage.builder.previewLabel")}
              </span>
            </DialogTitle>
            <div className="flex shrink-0 items-center gap-3 text-[12px]">
              <div className="hidden rounded-lg border border-border bg-surface-hover p-0.5 sm:inline-flex">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  rounded="default"
                  onClick={() => setPreviewScope("page")}
                  aria-pressed={previewScope === "page"}
                  className={cn(
                    "h-7 px-3 text-[12px] font-medium shadow-none transition-[background-color,color,transform] duration-150 active:scale-[0.98]",
                    previewScope === "page"
                      ? "bg-surface text-foreground-1 shadow-xs hover:bg-surface"
                      : "text-foreground-3 hover:bg-transparent hover:text-foreground-2",
                  )}
                >
                  {t("businessPage.builder.fullPage")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  rounded="default"
                  onClick={() => previewFocusEntry && setPreviewScope("section")}
                  disabled={!previewFocusEntry}
                  aria-pressed={previewScope === "section"}
                  className={cn(
                    "h-7 px-3 text-[12px] font-medium shadow-none transition-[background-color,color,transform] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45",
                    previewScope === "section"
                      ? "bg-surface text-foreground-1 shadow-xs hover:bg-surface"
                      : "text-foreground-3 hover:bg-transparent hover:text-foreground-2",
                  )}
                >
                  {t("businessPage.builder.currentSection")}
                </Button>
              </div>
              {selectedAddOns.length > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  rounded="default"
                  onClick={() => setAddOnsOpen(true)}
                  className="hidden h-7 px-2.5 text-[12px] font-semibold shadow-none sm:inline-flex"
                >
                  {t("businessPage.builder.addOns.previewingAddOns", { count: selectedAddOns.length })}
                </Button>
              ) : null}
              <DeviceToggle device={device} setDevice={setDevice} t={t} />
            </div>
          </DialogHeader>
          <div ref={previewScrollRef} className="overflow-y-auto bg-surface-hover dark:bg-neutral-900/40">
            <div className={cn("mx-auto", device === "mobile" ? "max-w-[390px] p-3" : "max-w-none")}>
              <LivePreview
                layout={modalLayout}
                data={previewData}
                chrome={modalChrome}
                startNumber={modalStartNumber}
                focusType={modalChrome ? previewFocusType ?? undefined : undefined}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* paid-variant purchase confirmation → Stripe checkout redirect (or add-to-cart) */}
      <VariantPurchaseDialog
        variant={purchaseTarget}
        onOpenChange={(open) => {
          if (!open) setPurchaseTarget(null);
        }}
        hasWebsiteBuilder={props.hasWebsiteBuilder ?? true}
        isLoading={props.isVariantCheckoutLoading ?? false}
        onBuy={(variant) => props.onBuyVariant?.(variant)}
        inCart={!!purchaseTarget && (props.cartVariantIds ?? []).includes(purchaseTarget.id)}
        onToggleCart={props.onToggleCartVariant}
      />

      {/* section unlock confirmation → the same Stripe checkout flow (or add-to-cart) */}
      <VariantPurchaseDialog
        variant={sectionPurchaseTarget}
        onOpenChange={(open) => {
          if (!open) setSectionPurchaseTarget(null);
        }}
        hasWebsiteBuilder={props.hasWebsiteBuilder ?? true}
        isLoading={props.isVariantCheckoutLoading ?? false}
        onBuy={(section) => props.onBuySection?.(section)}
        inCart={!!sectionPurchaseTarget && (props.cartSectionIds ?? []).includes(sectionPurchaseTarget.id)}
        onToggleCart={props.onToggleCartSection}
      />
    </>
  );
}

// ---------------------------------------------------------------------------

function SectionStylePicker({
  entry,
  index,
  meta,
  disabled,
  locale,
  onVariantChange,
  t,
}: {
  entry: SectionEntry;
  index: number;
  meta: SectionMeta;
  disabled: boolean;
  locale: "en" | "ro";
  onVariantChange: (index: number, variant: string) => void;
  t: MarketplaceT;
}) {
  return (
    <div className="mb-3 rounded-xl border border-border bg-surface px-3 py-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground-3">
            {t("businessPage.builder.addOns.sectionStyle")}
          </span>
          <p className="mt-1 text-[12px] leading-5 text-foreground-3">
            {t("businessPage.builder.addOns.sectionStyleHelper")}
          </p>
        </div>
      </div>

      <div className="mt-2.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4" role="radiogroup">
        {meta.variants.map((variant) => {
          const active = entry.variant === variant.id;
          const addOn = isAddOnVariant(variant);
          const price = formatAddOnPrice(variant.addOnPriceMinor, variant.addOnCurrency, locale);
          const badge = active && addOn
            ? t("businessPage.builder.addOns.selectedAddOn")
            : addOn
              ? price ?? t("businessPage.builder.addOns.addOn")
              : t("businessPage.builder.addOns.included");

          return (
            <button
              key={variant.id}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onVariantChange(index, variant.id)}
              className={cn(
                "group min-h-[58px] rounded-lg border px-3 py-2.5 text-left outline-none",
                "transition-[transform,border-color,background-color,box-shadow,color] duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
                EASE,
                active
                  ? "border-border-strong bg-surface shadow-xs"
                  : "border-border bg-background hover:border-border-strong hover:bg-surface-hover/45",
              )}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0 truncate text-[13px] font-semibold text-foreground-1">
                  {t(variant.labelKey)}
                </span>
                {active ? (
                  <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-foreground-1 text-surface">
                    <Check className="size-3" strokeWidth={2.4} aria-hidden />
                  </span>
                ) : null}
              </span>
              <span
                className={cn(
                  "mt-2 inline-flex max-w-full items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                  addOn
                    ? active
                      ? "border-border-strong bg-surface-hover text-foreground-1"
                      : "border-border bg-surface-hover/70 text-foreground-2"
                    : "border-border-subtle bg-transparent text-foreground-3",
                )}
              >
                <span className="truncate">{badge}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DeviceToggle({
  device,
  setDevice,
  t,
}: {
  device: "desktop" | "mobile";
  setDevice: (v: "desktop" | "mobile") => void;
  t: MarketplaceT;
}) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-surface p-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        rounded="default"
        onClick={() => setDevice("desktop")}
        aria-label={t("businessPage.builder.deviceDesktop")}
        aria-pressed={device === "desktop"}
        className={cn(
          "size-7 shadow-none transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96]",
          device === "desktop"
            ? "bg-surface-hover text-foreground-1 hover:bg-surface-hover"
            : "text-foreground-3 hover:bg-transparent hover:text-foreground-2",
        )}
      >
        <Monitor className="size-[15px]" strokeWidth={1.5} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        rounded="default"
        onClick={() => setDevice("mobile")}
        aria-label={t("businessPage.builder.deviceMobile")}
        aria-pressed={device === "mobile"}
        className={cn(
          "size-7 shadow-none transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96]",
          device === "mobile"
            ? "bg-surface-hover text-foreground-1 hover:bg-surface-hover"
            : "text-foreground-3 hover:bg-transparent hover:text-foreground-2",
        )}
      >
        <Smartphone className="size-[15px]" strokeWidth={1.5} />
      </Button>
    </span>
  );
}

export default SectionBuilder;
