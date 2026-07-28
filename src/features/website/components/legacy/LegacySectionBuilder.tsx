import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { showUndoToast } from "../../../../shared/components/ui/undo-toast";
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
import { Monitor, Smartphone, Tablet, ArrowUpRight, LockOpen } from "lucide-react";
import { cn } from "../../../../shared/lib/utils";
import { useFormatPrice } from "../../../../shared/hooks/useFormatPrice";
import { useIsMobile } from "../../../../shared/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../../shared/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../../../../shared/components/ui/sheet";
import { Button } from "../../../../shared/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
} from "../../../../shared/components/ui/collapsible";
import type {
  Business,
  SectionEntry,
  GalleryConfig,
  WebsiteBuilderLocation,
  FaqItem,
  AnnouncementContent,
  WebsiteVariantCatalogEntry,
  WebsiteSectionCatalogEntry,
} from "../../types";
import { SECTION_META, isKnownSectionType, PINNED_TYPES, REQUIRED_TYPES } from "../builder/sectionCatalog";
import { SectionCard } from "../builder/SectionCard";
import { VariantPurchaseDialog } from "../builder/VariantPurchaseDialog";
import { variantPriceLabel } from "../builder/pricing";
import { SectionStylePicker, VariantPickerSkeleton, EASE, type WebsiteT, type SectionStyleOption } from "../builder/SectionStylePicker";
import { SettingsPanel } from "../builder/SettingsPanel";
import { LivePreview, marqueeItems, MARQUEE_MIN_ITEMS, UNNUMBERED, type PreviewData, type PreviewReview, type RatingBars } from "../builder/LivePreview";
import { AutoHeight } from "../builder/AutoHeight";
import { useLocationTagDictionaries } from "../../../marketplace/hooks/useLocationTagDictionaries";
import { isGallerySelectionIncomplete } from "../builder/gallerySelection";
import {
  MIN_TEAM_MEMBERS,
  MIN_TESTIMONIAL_REVIEWS,
  reviewCount,
  teamMemberCount,
} from "../builder/sectionDataRequirements";
import { resolvePreviewLocations } from "../builder/locationSelection";
import {
  buildSectionRowInfo,
  filterOfferedSections,
  sectionSummaryWithVariant,
} from "../builder/sectionBuilderModel";
import { heroVariantRequiresCoverImage } from "../builder/heroCoverRequirement";

const SECTION_PREVIEW_PREF_KEY = "zavoia:business-page-section-preview";
const PREVIEW_DEVICE_PREF_KEY = "zavoia:website-builder-preview-device";

type PreviewScope = "page" | "section";
type PreviewDevice = "desktop" | "tablet" | "mobile";
type WorkspacePane = "editor" | "preview";

interface LegacySectionBuilderProps {
  /** Workspace request (publish-blocker chips) to open/scroll to a section; nonce re-fires it. */
  focusSection?: { type: string; nonce: number } | null;
  layout: SectionEntry[];
  reorderSections: (from: number, to: number) => void;
  toggleSectionVisible: (index: number) => void;
  // Type-keyed operations for undo closures — indices captured at action time go stale
  // once the layout changes again, so Undo resolves its target by section type instead.
  moveSectionOfType: (type: string, to: number) => void;
  setSectionVisibleByType: (type: string, visible: boolean) => void;
  setSectionConfigByType: (type: string, config: Record<string, unknown>) => void;
  setSectionVariant: (index: number, variant: string) => void;
  setSectionConfig: (index: number, config: Record<string, unknown>) => void;
  fontKey: string;
  faqItems: FaqItem[];
  setFaqItems: (items: FaqItem[]) => void;
  announcementContent: AnnouncementContent;
  setAnnouncementContent: (value: AnnouncementContent) => void;
  aboutContent: string;
  setAboutContent: (value: string) => void;
  establishedYear: number | null;
  setEstablishedYear: (value: number | null) => void;
  establishedYearError?: string | null;
  /** The Brand column (logo / color / tagline / typeface / cover / link) rendered to the right of the list. */
  brandPanel: ReactNode;
  /** Pending-unlocks trigger (sheet) rendered with the workspace controls below xl. */
  cartControl?: ReactNode;
  /** Pending-unlocks panel docked under the live preview inside the sticky aside (xl only). */
  unlockTray?: ReactNode;
  // Preview inputs (read from the live form + listing data)
  business: Business | null;
  locations: WebsiteBuilderLocation[];
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
  /** Server variant catalog with per-business ownership; inactive owned entries remain selectable. */
  variantCatalog?: WebsiteVariantCatalogEntry[];
  /** ACTIVE section catalog with per-business ownership. Once {@link catalogLoaded} is true it is
   *  authoritative: only its content types render (chrome always renders). Before then, all render. */
  sectionCatalog?: WebsiteSectionCatalogEntry[];
  /** Plan includes the website builder (purchasing needs Plus/trial; locked pills still render without it). */
  hasWebsiteBuilder?: boolean;
  /** The catalog fetch is in flight — while true AND both catalogs are still empty, price-dependent
   *  affordances render a neutral skeleton instead of briefly showing as unlocked (catalog fetch
   *  *failure* keeps the deliberate free-render fallback; this only covers the loading window). */
  isCatalogLoading?: boolean;
  /** The catalog has loaded SUCCESSFULLY at least once. Until then the builder stays permissive
   *  (every implemented section renders) so a first-load or transient failure never empties it;
   *  once true the catalog is authoritative — only offered content sections render. */
  catalogLoaded?: boolean;
  /** A checkout session is being created (buy button busy until the Stripe redirect). */
  isVariantCheckoutLoading?: boolean;
  purchaseActionsReady?: boolean;
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
  /** Native (Capacitor) app — store policy: no purchase surfaces (prices/Buy/cart) render; preview-before-buy stays fully functional. */
  isNative?: boolean;
}

/**
 * Business-page studio — at desktop, a focused editor rail sits beside a sticky live preview. Tablet
 * intentionally switches between the two panes; phone keeps editing direct and opens preview as a layer.
 * Reorder remains keyboard and pointer accessible, with explicit move actions where dragging is awkward.
 */
export function LegacySectionBuilder(props: LegacySectionBuilderProps) {
  const { t, i18n } = useTranslation("website");
  const isMobile = useIsMobile();
  const [openType, setOpenType] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewScope, setPreviewScope] = useState<PreviewScope>("page");
  const [previewFocusType, setPreviewFocusType] = useState<string | null>(null);
  const [workspacePane, setWorkspacePane] = useState<WorkspacePane>("editor");
  // Sections are edited and previewed in the owner's app language (no language toggle).
  const locale: "en" | "ro" = i18n.language?.toLowerCase().startsWith("ro") ? "ro" : "en";
  const serviceLocations = useMemo(
    () => resolvePreviewLocations(props.layout, props.locations),
    [props.layout, props.locations],
  );
  const [previewSelectedLocationId, setPreviewSelectedLocationId] = useState<
    number | null | undefined
  >(undefined);
  const [device, setDevice] = useState<PreviewDevice>(() => {
    if (typeof window === "undefined") return "desktop";
    const saved = window.localStorage.getItem(PREVIEW_DEVICE_PREF_KEY);
    return saved === "desktop" || saved === "tablet" || saved === "mobile" ? saved : "desktop";
  });
  const [sectionPreviewOpen, setSectionPreviewOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(SECTION_PREVIEW_PREF_KEY) !== "hidden";
  });
  const previewScrollRef = useRef<HTMLDivElement | null>(null);
  const workspacePreviewScrollRef = useRef<HTMLDivElement | null>(null);
  // Preview sections switch to their desktop treatment at the 576px container threshold. When
  // the preview column is narrower (tight xl viewports with the sidebar expanded), the
  // "Desktop" toggle cannot render true desktop — say so instead of silently lying.
  const [previewNarrow, setPreviewNarrow] = useState(false);
  useEffect(() => {
    const el = workspacePreviewScrollRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setPreviewNarrow(width > 0 && width < 576);
    });
    observer.observe(el);
    return () => observer.disconnect();
    // Re-attach when the aside (which owns the ref) mounts on pane/viewport changes.
  }, [isMobile, workspacePane]);

  // Resolve the location-tag dictionaries once (session-cached fetch) and feed them into previewData so the
  // Locations section renders tags without its own authenticated fetch.
  const { dictionaries: tagDictionaries } = useLocationTagDictionaries();

  const setPreviewDevice = useCallback((next: PreviewDevice) => {
    setDevice(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PREVIEW_DEVICE_PREF_KEY, next);
    }
  }, []);

  // Paid variants: catalog lookup by (sectionType, variantKey) + the entry pending purchase
  // confirmation. A locked pill can be selected for a local, preview-only render; it is not
  // written into pageLayout until it is bought/owned.
  const { formatPrice } = useFormatPrice();
  const [purchaseTarget, setPurchaseTarget] = useState<WebsiteVariantCatalogEntry | null>(null);
  const [previewOnlyVariantByType, setPreviewVariantByType] = useState<Record<string, string>>({});
  const variantCatalog = props.variantCatalog;
  const catalogByKey = useMemo(() => {
    const map = new Map<string, WebsiteVariantCatalogEntry>();
    for (const entry of variantCatalog ?? []) {
      map.set(`${entry.sectionType}:${entry.variantKey}`, entry);
    }
    return map;
  }, [variantCatalog]);

  // State only records a selection while it is still preview-only. Deriving the valid subset means
  // ownership or a successful save naturally resolves it without an extra state-reset render.
  const previewVariantByType = useMemo(() => {
    const next: Record<string, string> = {};
    for (const [type, variantKey] of Object.entries(previewOnlyVariantByType)) {
      const saved = props.layout.find((section) => section.type === type);
      const catalogEntry = catalogByKey.get(`${type}:${variantKey}`);
      const stillPreviewOnly =
        !!saved &&
        saved.variant !== variantKey &&
        !!catalogEntry &&
        catalogEntry.priceMinor > 0 &&
        !catalogEntry.owned;
      if (stillPreviewOnly) next[type] = variantKey;
    }
    return next;
  }, [catalogByKey, previewOnlyVariantByType, props.layout]);

  const layoutWithPreviewVariants = useMemo(
    () =>
      props.layout.map((section) => {
        const previewVariant = previewVariantByType[section.type];
        return previewVariant ? { ...section, variant: previewVariant } : section;
      }),
    [previewVariantByType, props.layout],
  );
  // Preview-only styles render in the workspace preview but are NOT in the draft — the badge
  // keeps the preview honest about what Publish would actually ship.
  const previewOnlyCount = Object.keys(previewVariantByType).length;
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
  const ownedVariantSectionTypes = useMemo(
    () => new Set((variantCatalog ?? []).filter((entry) => entry.owned).map((entry) => entry.sectionType)),
    [variantCatalog],
  );
  const [sectionPurchaseTarget, setSectionPurchaseTarget] = useState<WebsiteSectionCatalogEntry | null>(null);
  // First load only (not the empty-catalog failure fallback, which has already resolved by the
  // time isCatalogLoading goes false): both catalogs are still empty AND the fetch is in flight.
  const catalogPending = !!props.isCatalogLoading && (variantCatalog?.length ?? 0) === 0 && (sectionCatalog?.length ?? 0) === 0;
  // Required chrome (nav/hero/footer) is never locked — every page needs it regardless of catalog data.
  const lockedSectionEntry = useCallback(
    (type: string): WebsiteSectionCatalogEntry | null => {
      if (REQUIRED_TYPES.has(type)) return null;
      const entry = sectionCatalogByType.get(type);
      return entry && entry.priceMinor > 0 && !entry.owned ? entry : null;
    },
    [sectionCatalogByType],
  );

  // Once the catalog has successfully loaded it governs which CONTENT sections exist at all. Before
  // then (never loaded, still loading, or a fetch that failed before any success) it stays permissive
  // so the builder is never emptied by a transient error — see props.catalogLoaded.
  const catalogAuthoritative = !!props.catalogLoaded;
  // Single source of truth for "may this section appear (in the list AND the preview)". Required chrome
  // always appears; before a successful load everything appears; after, only catalogued content types
  // or a type with a permanently owned style may remain visible.
  // Deliberately NOT implicitly unlocked by entry.visible: content sections default to visible, so a visible
  // gate would leak every un-offered section on a fresh page — exactly what the catalog must suppress.
  const isSectionOffered = useCallback(
    (type: string) => {
      // A stored section from a newer registry has no catalog row in this dashboard, but
      // remains visible as a read-only row so it cannot disappear during an older-client edit.
      if (!isKnownSectionType(type)) return true;
      if (REQUIRED_TYPES.has(type)) return true;
      if (!catalogAuthoritative) return true;
      return sectionCatalogByType.has(type) || ownedVariantSectionTypes.has(type);
    },
    [catalogAuthoritative, ownedVariantSectionTypes, sectionCatalogByType],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Drag stays on the vertical axis and inside the section list (never floats out of the column).
  const listRef = useRef<HTMLDivElement | null>(null);
  const restrictToList: Modifier = ({ transform, draggingNodeRect }) => {
    const bounds = listRef.current?.getBoundingClientRect();
    if (!bounds || !draggingNodeRect) return transform;
    if (draggingNodeRect.top + transform.y <= bounds.top) {
      return { ...transform, y: bounds.top - draggingNodeRect.top };
    }
    if (draggingNodeRect.bottom + transform.y >= bounds.bottom) {
      return { ...transform, y: bounds.bottom - draggingNodeRect.bottom };
    }
    return transform;
  };
  const modifiers = [restrictToVerticalAxis, restrictToList];

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
      const target = props.layout[to];
      const range = props.layout.slice(Math.min(from, to), Math.max(from, to) + 1);
      if (
        !isKnownSectionType(moved.type) ||
        !isKnownSectionType(target.type) ||
        range.some((section) => !isKnownSectionType(section.type))
      ) {
        return;
      }
      const label = isKnownSectionType(moved.type) ? t(SECTION_META[moved.type].labelKey) : moved.type;
      props.reorderSections(from, to);
      showUndoToast({
        title: t("businessPage.builder.toast.sectionMoved", { section: label }),
        undoLabel: t("businessPage.builder.toast.undo"),
        onUndo: () => props.moveSectionOfType(moved.type, from),
      });
    }
  };

  const previewData: PreviewData = useMemo(
    () => ({
      businessName: props.business?.name ?? "",
      businessTimezone: props.business?.timezone?.trim() || "UTC",
      logo: props.business?.logo ?? null,
      heroImageUrl: props.heroImageUrl,
      tagline: props.tagline,
      aboutContent: props.aboutContent,
      establishedYear: props.establishedYear,
      businessCurrency: props.business?.businessCurrency?.trim().toUpperCase() || "EUR",
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
      props.establishedYear,
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

  // Data-backed sections stay discoverable while their toggles remain unavailable until their established
  // minimum is met. Existing stale visible states are corrected below and publish readiness independently
  // blocks a read-only/publish-only user from bypassing the same rules.
  const marqueeItemCount = marqueeItems(props.locations).length;
  const teamCount = teamMemberCount(props.locations);
  const reviewsCount = reviewCount(props.locations, props.reviews);
  const dataLockedTypes = useMemo(
    () =>
      new Set<string>([
        ...(marqueeItemCount < MARQUEE_MIN_ITEMS ? ["marquee"] : []),
        ...(teamCount < MIN_TEAM_MEMBERS ? ["team"] : []),
        ...(reviewsCount < MIN_TESTIMONIAL_REVIEWS ? ["testimonials"] : []),
      ]),
    [marqueeItemCount, reviewsCount, teamCount],
  );
  const dataLockedReason = (type: string) => {
    if (type === "marquee") {
      return t("businessPage.builder.card.servicesLocked", { count: MARQUEE_MIN_ITEMS });
    }
    if (type === "team") {
      return t("businessPage.builder.card.teamLocked", { count: MIN_TEAM_MEMBERS });
    }
    if (type === "testimonials") {
      return t("businessPage.builder.card.reviewsLocked", {
        count: MIN_TESTIMONIAL_REVIEWS,
      });
    }
    return undefined;
  };

  useEffect(() => {
    if (!props.canWrite) return;
    for (const type of dataLockedTypes) {
      const section = props.layout.find((entry) => entry.type === type);
      if (section?.visible) props.setSectionVisibleByType(type, false);
    }
  }, [
    dataLockedTypes,
    props.canWrite,
    props.layout,
    props.setSectionVisibleByType,
  ]);
  // The section list is server-driven via isSectionOffered: required chrome always shows, and once the
  // catalog is authoritative only its content types survive (a card never renders for a type the server
  // doesn't offer — so future paid-only or unseeded sections stay hidden rather than blank). The marquee
  // A catalog type with no implemented component is ignored via the layout match (the layout only carries
  // implemented or saved types).
  const displaySections = props.layout
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => isSectionOffered(entry.type));

  const items = displaySections.map(({ entry }) => entry.type);
  const shown = displaySections.filter(({ entry }) => entry.visible).length;
  const movableDisplaySections = displaySections.filter(
    ({ entry }) =>
      isKnownSectionType(entry.type) &&
      !PINNED_TYPES.has(entry.type) &&
      !lockedSectionEntry(entry.type) &&
      !catalogPending,
  );

  const moveSection = (fromLayoutIndex: number, direction: -1 | 1) => {
    const currentPosition = movableDisplaySections.findIndex(({ index }) => index === fromLayoutIndex);
    const target = movableDisplaySections[currentPosition + direction];
    if (currentPosition < 0 || !target) return;

    const moved = props.layout[fromLayoutIndex];
    if (!moved || !isKnownSectionType(moved.type)) return;
    const label = t(SECTION_META[moved.type].labelKey);
    props.reorderSections(fromLayoutIndex, target.index);
    showUndoToast({
      title: t("businessPage.builder.toast.sectionMoved", { section: label }),
      undoLabel: t("businessPage.builder.toast.undo"),
      onUndo: () => props.moveSectionOfType(moved.type, fromLayoutIndex),
    });
  };

  const canMoveSection = (layoutIndex: number, direction: -1 | 1) => {
    const position = movableDisplaySections.findIndex(({ index }) => index === layoutIndex);
    return position >= 0 && !!movableDisplaySections[position + direction];
  };

  const previewNumberFor = useCallback(
    (index: number) =>
      props.layout
        .slice(0, index)
        .filter((s) => s.visible && !UNNUMBERED.has(s.type) && isSectionOffered(s.type)).length + 1,
    [props.layout, isSectionOffered],
  );

  const summaryLayout = filterOfferedSections(layoutWithPreviewVariants, isSectionOffered);

  const rowInfoFor = (entry: SectionEntry) =>
    buildSectionRowInfo(entry, {
      t,
      locale,
      layout: summaryLayout,
      business: props.business,
      selectedLocationId: previewSelectedLocationId,
      announcementContent: props.announcementContent,
      announcementError: props.announcementError,
      heroImageUrl: props.heroImageUrl,
      tagline: props.tagline,
      taglineError: props.taglineError,
      aboutContent: props.aboutContent,
      aboutError: props.aboutError,
      locations: props.locations,
      serviceLocations,
      marqueeItemCount,
      reviews: props.reviews,
      faqItems: props.faqItems,
      sectionCatalogByType,
      variantCatalogByKey: catalogByKey,
    });

  /**
   * Show/hide with an Undo toast. Everything is keyed by section type — never by index — so
   * Undo still hits the right section after later reorders. `restoreConfig` reverts config a
   * cascade changed alongside visibility (e.g. hiding the last location also hid the section:
   * Undo must bring that location back, or it restores an enabled-but-empty section).
   */
  const toggleVisibleWithFeedback = (entry: SectionEntry, restoreConfig?: Record<string, unknown>) => {
      const turningOn = !entry.visible;
      props.setSectionVisibleByType(entry.type, turningOn);
      const label = isKnownSectionType(entry.type) ? t(SECTION_META[entry.type].labelKey) : entry.type;
      showUndoToast({
        title: t(turningOn ? "businessPage.builder.toast.sectionShown" : "businessPage.builder.toast.sectionHidden", {
          section: label,
        }),
        undoLabel: t("businessPage.builder.toast.undo"),
        onUndo: () => {
          props.setSectionVisibleByType(entry.type, entry.visible);
          if (restoreConfig) props.setSectionConfigByType(entry.type, restoreConfig);
        },
      });
  };

  const previewFocusIndex = previewFocusType
    ? props.layout.findIndex((section) => section.type === previewFocusType)
    : -1;
  const previewFocusEntry = previewFocusIndex >= 0 ? layoutWithPreviewVariants[previewFocusIndex] : null;
  const modalSectionMode = previewScope === "section" && !!previewFocusEntry;
  // The full-page preview mirrors the real page: gate it by the same offering as the section list, so an
  // un-offered content section never appears in the preview either. Section-scoped mode targets a single
  // already-offered card (the owner opened it), so it renders as-is.
  const modalLayout = modalSectionMode
    ? [{ ...previewFocusEntry!, visible: true }]
    : layoutWithPreviewVariants.filter((entry) => isSectionOffered(entry.type));
  const workspaceLayout = layoutWithPreviewVariants.filter((entry) => isSectionOffered(entry.type));
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
  }, [device, layoutWithPreviewVariants, previewFocusType, previewOpen, previewScope]);

  // Publish-blocker chips in the workspace header jump here: open the section (or its unlock
  // dialog when the whole section is locked) and bring the row into view.
  const focusSection = props.focusSection;
  useEffect(() => {
    if (!focusSection) return;
    const { type } = focusSection;
    const locked = lockedSectionEntry(type);
    const row = listRef.current?.querySelector<HTMLElement>(`[data-builder-section="${type}"]`);
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const frame = window.requestAnimationFrame(() => {
      if (locked) {
        setSectionPurchaseTarget(locked);
      } else {
        setOpenType(type);
      }
      row?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusSection, lockedSectionEntry]);

  // On desktop, and whenever tablet switches to Preview, keep the section currently being edited in view.
  // The renderer is unchanged; this is only the surrounding viewport following the user's context.
  useEffect(() => {
    if (!openType) return;
    const container = workspacePreviewScrollRef.current;
    if (!container) return;
    const target = Array.from(container.querySelectorAll<HTMLElement>("[data-preview-section]")).find(
      (node) => node.dataset.previewSection === openType,
    );
    if (!target) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const frame = window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [device, openType, workspacePane]);

  const focusHeroCoverUpload = useCallback(() => {
    const reveal = () => {
      const target = document.getElementById("hero-cover-upload");
      if (!target) return;
      const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      window.requestAnimationFrame(() => target.focus({ preventScroll: true }));
    };
    window.requestAnimationFrame(reveal);
  }, []);

  const renderSettings = (entry: SectionEntry, index: number) => {
    const dataLocked = dataLockedTypes.has(entry.type);
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
    const variantOptions: SectionStyleOption[] = variants.map((variant) => {
      const catalogEntry = catalogByKey.get(`${entry.type}:${variant.id}`);
      const paid = !!catalogEntry && catalogEntry.priceMinor > 0;
      return {
        variant,
        catalogEntry,
        paid,
        locked: paid && !catalogEntry.owned,
        owned: paid && catalogEntry.owned,
        inCart: !!catalogEntry && (props.cartVariantIds ?? []).includes(catalogEntry.id),
        priceLabel: catalogEntry ? variantPriceLabel(formatPrice, catalogEntry) : null,
      };
    });
    const hasVariants = variantOptions.length > 1;
    const activeCatalogEntry = catalogByKey.get(`${entry.type}:${entry.variant}`);
    const activeVariantLocked =
      !!activeCatalogEntry && activeCatalogEntry.priceMinor > 0 && !activeCatalogEntry.owned;
    const previewVariantId = previewVariantByType[entry.type] ?? entry.variant;
    const previewEntry =
      previewVariantId === entry.variant ? entry : { ...entry, variant: previewVariantId };
    const previewCatalogEntry = catalogByKey.get(`${entry.type}:${previewVariantId}`);
    const previewingLockedVariant =
      previewVariantId !== entry.variant &&
      !!previewCatalogEntry &&
      previewCatalogEntry.priceMinor > 0 &&
      !previewCatalogEntry.owned;
    const lockedCatalogEntryForAction = previewingLockedVariant
      ? previewCatalogEntry
      : activeVariantLocked
        ? activeCatalogEntry
        : null;
    // The section's real "0N —" ordinal in the full page, so the scoped preview stays in sync with the rest.
    const previewNumber = previewNumberFor(index);
    const sectionPreviewMotionKey = `${entry.type}:${previewVariantId}:${device}`;
    return (
      <div className="space-y-4">
        <fieldset
          disabled={!entry.visible || !props.canWrite || dataLocked}
          className={cn(
            "m-0 min-w-0 space-y-4 border-0 p-0",
            (!entry.visible || !props.canWrite || dataLocked) && "pointer-events-none opacity-60 transition-opacity duration-200",
          )}
        >
          {/* Skeleton only where a picker can plausibly appear. The static meta count is a pre-fetch
              heuristic: single-variant sections never get a picker, so they skip the skeleton entirely;
              a multi-variant section can still resolve to nothing if the server's ACTIVE catalog narrows
              the set below 2 — accepted, since the alternative (no skeleton) pops the picker in late for
              the common full-catalog case. */}
          {catalogPending && (meta?.variants.length ?? 0) > 1 ? (
            <VariantPickerSkeleton />
          ) : hasVariants ? (
            <SectionStylePicker
              entry={entry}
              variants={variantOptions}
              selectedVariantId={previewVariantId}
              disabled={!entry.visible || !props.canWrite || dataLocked}
              onSelect={(option) => {
                const revealCoverRequirement =
                  entry.type === "hero" &&
                  !props.heroImageUrl &&
                  heroVariantRequiresCoverImage(option.variant.id);
                if (option.locked && option.catalogEntry) {
                  setPreviewVariantByType((current) => ({
                    ...current,
                    [entry.type]: option.variant.id,
                  }));
                  if (!sectionPreviewOpen) setPreviewTrayOpen(true);
                  if (revealCoverRequirement) focusHeroCoverUpload();
                  return;
                }
                setPreviewVariantByType((current) => {
                  if (!current[entry.type]) return current;
                  const next = { ...current };
                  delete next[entry.type];
                  return next;
                });
                props.setSectionVariant(index, option.variant.id);
                if (revealCoverRequirement) focusHeroCoverUpload();
              }}
              t={t}
              isNative={props.isNative}
              previewData={previewData}
              previewNumber={previewNumber}
            />
          ) : null}

          {lockedCatalogEntryForAction ? (
            <div className="flex flex-col gap-3 rounded-xl border border-warning-border bg-warning-bg px-3 py-2.5 text-[12px] leading-5 text-warning sm:flex-row sm:items-center sm:justify-between">
              <p className="min-w-0">
                {/* Two different truths: a browsed locked style is NOT in the draft; a locked
                    style the draft already carries IS saved — and blocks publish. */}
                <span className="font-semibold">
                  {previewingLockedVariant
                    ? t("businessPage.paidVariants.previewingLockedTitle")
                    : t("businessPage.paidVariants.appliedLockedTitle")}
                </span>{" "}
                {props.isNative
                  ? t("businessPage.paidVariants.nativeHint")
                  : previewingLockedVariant
                    ? t("businessPage.paidVariants.previewingLockedHelper")
                    : t("businessPage.paidVariants.appliedLockedHelper")}
              </p>
              {!props.isNative && (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {props.onToggleCartVariant ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      rounded="default"
                      onClick={() => props.onToggleCartVariant?.(lockedCatalogEntryForAction)}
                      className="min-h-11 border-warning-border bg-surface px-3 text-[12px] font-semibold text-foreground-1 hover:bg-surface-hover xl:h-8 xl:min-h-0"
                    >
                      <LockOpen className="size-3.5" strokeWidth={1.8} aria-hidden />
                      {(props.cartVariantIds ?? []).includes(lockedCatalogEntryForAction.id)
                        ? t("businessPage.paidVariants.removeFromCart")
                        : t("businessPage.paidVariants.addToCart")}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    rounded="default"
                    onClick={() => setPurchaseTarget(lockedCatalogEntryForAction)}
                    className="min-h-11 px-3 text-[12px] font-semibold xl:h-8 xl:min-h-0"
                  >
                    {t("businessPage.paidVariants.buy", {
                      price: variantPriceLabel(formatPrice, lockedCatalogEntryForAction),
                    })}
                  </Button>
                </div>
              )}
            </div>
          ) : null}

          <SettingsPanel
            entry={entry}
            index={index}
            locations={props.locations}
            serviceLocations={serviceLocations}
            faqItems={props.faqItems}
            announcementContent={props.announcementContent}
            aboutContent={props.aboutContent}
            businessDescription={props.business?.description ?? null}
            establishedYear={props.establishedYear}
            establishedYearError={props.establishedYearError}
            tagline={props.tagline}
            taglineError={props.taglineError}
            heroImageUrl={props.heroImageUrl}
            canWrite={props.canWrite}
            locale={locale}
            onConfigChange={props.setSectionConfig}
            onTurnOffSection={(restoreConfig) => {
              toggleVisibleWithFeedback(entry, restoreConfig);
              if (openType === entry.type) setOpenType(null);
            }}
            onFaqChange={props.setFaqItems}
            onAnnouncementChange={props.setAnnouncementContent}
            onAboutChange={props.setAboutContent}
            onEstablishedYearChange={props.setEstablishedYear}
            onTaglineChange={props.setTagline}
            selectedPreviewLocationId={previewSelectedLocationId}
            onPreviewLocationSelect={setPreviewSelectedLocationId}
            previewVariant={previewVariantId}
          />
        </fieldset>

        <div className="rounded-lg border border-border-subtle bg-surface p-3 md:hidden">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase text-foreground-3">
                {t("businessPage.builder.sectionPreview")}
              </p>
              <p className="mt-0.5 text-[12.5px] leading-5 text-foreground-3">
                {t("businessPage.builder.previewHelper")}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                rounded="default"
                onClick={() => setPreviewTrayOpen(!sectionPreviewOpen)}
                className={cn("min-h-11 px-3 text-[12px] font-semibold xl:h-8 xl:min-h-0", EASE)}
              >
                {sectionPreviewOpen ? t("businessPage.builder.hidePreview") : t("businessPage.builder.showPreview")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                rounded="default"
                onClick={() => openPreview("page", entry.type)}
                className={cn("min-h-11 px-3 text-[12px] font-semibold xl:h-8 xl:min-h-0", EASE)}
              >
                {t("businessPage.builder.previewExpand")}
                <ArrowUpRight className="size-3.5" strokeWidth={1.8} aria-hidden />
              </Button>
            </div>
          </div>

          <Collapsible open={sectionPreviewOpen}>
            <CollapsibleContent>
              <AutoHeight>
                <div className="overflow-hidden rounded-lg border border-border-subtle bg-background">
                  <div
                    className={cn(
                      "mx-auto transform-gpu transition-[max-width,transform] duration-200 motion-reduce:transition-none",
                      EASE,
                    )}
                      style={{ maxWidth: device === "mobile" ? 390 : device === "tablet" ? 768 : "100%" }}
                  >
                    <div
                      key={sectionPreviewMotionKey}
                      className={cn(
                        "transform-gpu motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:duration-200",
                        EASE,
                      )}
                    >
                      <LivePreview
                        layout={[{ ...previewEntry, visible: true }]}
                        data={previewData}
                        chrome={false}
                        startNumber={previewNumber}
                        selectedLocationId={previewSelectedLocationId}
                        onSelectedLocationChange={setPreviewSelectedLocationId}
                        locationScope={serviceLocations}
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
      <div className="xl:grid xl:grid-cols-[minmax(400px,460px)_minmax(0,1fr)] xl:items-start xl:gap-4">
        <section className={cn("min-w-0", workspacePane === "preview" && "md:max-xl:hidden")}>
          <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-xs">
        <div className="px-4 py-4 sm:px-5 lg:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="mb-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[12px] text-foreground-3">
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase text-foreground-3">
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
              <h2 className="text-balance text-[17px] font-semibold leading-tight text-foreground-1 sm:text-[18px]">
                {t("businessPage.builder.studioTitle")}
              </h2>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 self-start md:self-auto">
              <WorkspacePaneToggle workspacePane={workspacePane} setWorkspacePane={setWorkspacePane} t={t} />
              {/* At xl the pending unlocks live docked under the sticky preview instead. */}
              <div className="contents xl:hidden">{props.cartControl}</div>
              <Button
                type="button"
                variant="outline"
                size="default"
                rounded="default"
                onClick={() => openPreview("page", openType)}
                className={cn(
                  "min-h-11 shrink-0 px-3.5 text-[13px] font-semibold md:h-9 md:min-h-0 md:max-xl:hidden",
                  "transition-[transform,border-color,background-color] duration-150 active:scale-[0.98]",
                  EASE,
                )}
              >
                {t("businessPage.builder.openPreview")}
                <ArrowUpRight className="size-3.5" strokeWidth={1.8} aria-hidden />
              </Button>
            </div>
          </div>
        </div>

        {/* brand band + section list, stacked full-width — the brand controls moved above the list so the
            list and each section's scoped preview get the whole module width */}
        <div className="border-t border-border-subtle">
          {/* brand band — above the list */}
          <div className="bg-surface px-4 py-3.5 sm:px-5 lg:px-6">{props.brandPanel}</div>

          {/* sections — the page contents, set as a ruled editorial index */}
          <div className="border-t border-border-subtle bg-surface-hover/35 px-3 py-3.5 sm:px-4 lg:px-5">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-[14px] font-semibold text-foreground-1">
                  {t("businessPage.builder.title")}
                </h3>
                <p className="mt-1 max-w-[60ch] text-pretty text-[13px] leading-5 text-foreground-3">
                  {t("businessPage.builder.sectionsHelper")}
                </p>
              </div>
            </div>

            {/* bracketed sheet with a hairline spine in the left margin */}
            <div className="relative overflow-hidden rounded-lg border border-border-subtle bg-surface">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-[72px] z-0 hidden w-px bg-border-subtle sm:block"
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
                      const readOnly = !isKnownSectionType(entry.type);
                      // A paid, not-yet-unlocked section: the card renders locked and every
                      // interaction (expand, toggle) opens the unlock purchase dialog instead.
                      const paidLocked = lockedSectionEntry(entry.type);
                      const open = openType === entry.type && !paidLocked && !readOnly;
                      const previewEntry = layoutWithPreviewVariants[index] ?? entry;
                      const rowInfo = rowInfoFor(previewEntry);
                      const rowSummary = sectionSummaryWithVariant(previewEntry, rowInfo.summary, t);
                      const dataLocked = dataLockedTypes.has(entry.type);
                      return (
                        <Collapsible
                          key={entry.type}
                          data-builder-section={entry.type}
                          open={open}
                          onOpenChange={(next) => {
                            if (readOnly) return;
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
                              "before:pointer-events-none before:absolute before:left-4 before:right-[18px] before:top-0 before:z-0 before:h-px before:bg-border-subtle before:content-[''] sm:before:left-[72px]",
                          )}
                        >
                          <SectionCard
                            entry={previewEntry}
                            meta={isKnownSectionType(entry.type) ? SECTION_META[entry.type] : null}
                            summary={rowSummary}
                            status={rowInfo.status}
                            expanded={open}
                            previewOnlyPremium={previewVariantByType[entry.type] != null}
                            locked={PINNED_TYPES.has(entry.type)}
                            readOnly={readOnly}
                            required={REQUIRED_TYPES.has(entry.type)}
                            needsAttention={
                              (entry.type === "hero" &&
                                heroVariantRequiresCoverImage(previewEntry.variant) &&
                                !props.heroImageUrl) ||
                              (entry.type === "about" && !!props.aboutError) ||
                              (entry.type === "announcement" && !!props.announcementError) ||
                              (entry.type === "gallery" &&
                                entry.visible &&
                                isGallerySelectionIncomplete(
                                  (entry.config ?? {}) as GalleryConfig,
                                  props.locations,
                                ))
                            }
                            paidLocked={!!paidLocked}
                            priceLabel={paidLocked ? variantPriceLabel(formatPrice, paidLocked) : undefined}
                            hidePrice={props.isNative}
                            inCart={!!paidLocked && (props.cartSectionIds ?? []).includes(paidLocked.id)}
                            pending={catalogPending && !REQUIRED_TYPES.has(entry.type)}
                            dataLocked={dataLocked}
                            dataLockedReason={dataLockedReason(entry.type)}
                            canMoveUp={canMoveSection(index, -1)}
                            canMoveDown={canMoveSection(index, 1)}
                            onSelect={() => {
                              if (readOnly) return;
                              if (paidLocked) {
                                setSectionPurchaseTarget(paidLocked);
                                return;
                              }
                              setOpenType(open ? null : entry.type);
                            }}
                            onToggleVisible={() => {
                              if (readOnly || dataLocked) return;
                              if (paidLocked) {
                                setSectionPurchaseTarget(paidLocked);
                                return;
                              }
                              const turningOn = !entry.visible;
                              // Re-enabling a locations section that has everything hidden restores all
                              // locations, so it can never be on with nothing to show. Undo puts the
                              // hidden set back alongside re-hiding the section.
                              let restoreConfig: Record<string, unknown> | undefined;
                              if (turningOn && entry.type === "locations") {
                                const hiddenIds = (entry.config?.hiddenLocationIds as number[] | undefined) ?? [];
                                if (props.locations.length > 0 && props.locations.every((l) => hiddenIds.includes(l.id))) {
                                  props.setSectionConfig(index, { hiddenLocationIds: [] });
                                  restoreConfig = { hiddenLocationIds: hiddenIds };
                                }
                              }
                              toggleVisibleWithFeedback(entry, restoreConfig);
                              // Expand a section when it's switched on; collapse it when switched off.
                              if (turningOn) setOpenType(entry.type);
                              else if (open) setOpenType(null);
                            }}
                            onMoveUp={() => moveSection(index, -1)}
                            onMoveDown={() => moveSection(index, 1)}
                          />
                          <CollapsibleContent className="hidden md:block">
                            <AutoHeight className="relative pb-5 pl-4 pr-3 pt-3 sm:pl-[87px] sm:pr-4">
                              <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:duration-200">
                                {renderSettings(entry, index)}
                              </div>
                            </AutoHeight>
                          </CollapsibleContent>
                          {isMobile && open ? (
                            <MobileSectionEditorSheet
                              open={open}
                              onOpenChange={(next) => setOpenType(next ? entry.type : null)}
                              title={isKnownSectionType(entry.type) ? t(SECTION_META[entry.type].labelKey) : entry.type}
                              description={rowSummary}
                            >
                              {renderSettings(entry, index)}
                            </MobileSectionEditorSheet>
                          ) : null}
                        </Collapsible>
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

          </div>
        </div>

          </div>
        </section>

        {/* Not mounted at all on phones — CSS-hiding would still load the preview's images and
            run its effects on exactly the devices most sensitive to that cost. */}
        {/* Sticky lives on the ASIDE (the grid item) — its containing block is the grid area
            (full row height) even with items-start, so it has real travel. A sticky child of the
            aside would have none: items-start collapses the aside to the child's own height. */}
        {!isMobile && (
        <aside
          className={cn(
            "hidden min-w-0",
            workspacePane === "preview" ? "md:max-xl:block" : "md:max-xl:hidden",
            "xl:sticky xl:top-16 xl:block xl:self-start",
          )}
        >
          <div className="flex min-h-[calc(100dvh-10rem)] flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-xs xl:max-h-[calc(100dvh-5rem)] xl:min-h-0">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="truncate text-[13px] font-semibold text-foreground-1">
                    {t("businessPage.builder.previewLabel")}
                  </p>
                  {previewOnlyCount > 0 && (
                    <span
                      className="inline-flex shrink-0 items-center rounded-full border border-warning-border bg-warning-bg px-2 py-0.5 text-[11px] font-semibold text-warning"
                      title={t("businessPage.paidVariants.previewOnlyHint")}
                    >
                      {t("businessPage.paidVariants.previewOnlyCount", { count: previewOnlyCount })}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[12px] text-foreground-3">
                  {t("businessPage.builder.fullPage")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <WorkspacePaneToggle workspacePane={workspacePane} setWorkspacePane={setWorkspacePane} t={t} />
                <div className="md:max-xl:contents xl:hidden">{props.cartControl}</div>
                <DeviceToggle device={device} setDevice={setPreviewDevice} t={t} />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  rounded="default"
                  onClick={() => openPreview("page", openType)}
                  aria-label={t("businessPage.builder.openPreview")}
                  title={t("businessPage.builder.openPreview")}
                  className="size-9"
                >
                  <ArrowUpRight className="size-4" strokeWidth={1.8} aria-hidden />
                </Button>
              </div>
            </div>
            {device === "desktop" && previewNarrow && (
              <p className="border-b border-border-subtle bg-surface px-4 py-1.5 text-[11px] leading-4 text-foreground-3">
                {t("businessPage.builder.previewNarrowHint")}
              </p>
            )}
            <div
              ref={workspacePreviewScrollRef}
              className="min-h-0 flex-1 overflow-y-auto bg-surface-hover dark:bg-neutral-900/40"
            >
              <div
                className={cn(
                  "mx-auto w-full transform-gpu transition-[max-width] duration-200 motion-reduce:transition-none",
                  device === "mobile"
                    ? "max-w-[390px] p-3"
                    : device === "tablet"
                      ? "max-w-[768px] p-3"
                      : "max-w-[1280px]",
                )}
              >
                <LivePreview
                  layout={workspaceLayout}
                  data={previewData}
                  focusType={openType ?? undefined}
                  selectedLocationId={previewSelectedLocationId}
                  onSelectedLocationChange={setPreviewSelectedLocationId}
                />
              </div>
            </div>
            {/* Pending unlocks dock: rides the sticky panel so the queued purchases and their
                total never scroll out of view. Below xl the trigger in the pane header owns this. */}
            {props.unlockTray ? <div className="hidden xl:block">{props.unlockTray}</div> : null}
          </div>
        </aside>
        )}
      </div>

      {/* fullscreen preview layer — direct and full-height below the md mobile breakpoint
          (768px, matching useIsMobile and the pane system), dialog-sized above it. */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="flex max-h-[90vh] w-full max-w-[min(1280px,calc(100%-2rem))] flex-col gap-0 overflow-hidden p-0 max-md:top-0 max-md:left-0 max-md:h-[100dvh] max-md:max-h-none max-md:max-w-none max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-none max-md:border-0 md:max-w-[min(1280px,calc(100%-2rem))]">
          <DialogHeader className="flex flex-col items-stretch justify-between gap-3 space-y-0 border-b border-border p-4 pr-12 text-left max-md:pt-[calc(1rem+env(safe-area-inset-top))] md:flex-row md:items-center">
            <DialogTitle className="min-w-0 text-[13px] font-semibold text-foreground-1">
              <span className="block truncate">
                {modalSectionMode && previewFocusLabel
                  ? t("businessPage.builder.currentSectionPreview", { section: previewFocusLabel })
                  : t("businessPage.builder.previewLabel")}
              </span>
            </DialogTitle>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] md:shrink-0 md:justify-end">
              <div className="inline-flex min-h-10 rounded-lg border border-border bg-surface-hover p-0.5 md:min-h-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  rounded="default"
                  onClick={() => setPreviewScope("page")}
                  aria-pressed={previewScope === "page"}
                  className={cn(
                    "h-9 px-3 text-[12px] font-medium shadow-none transition-[background-color,color,transform] duration-150 active:scale-[0.98] md:h-7",
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
                    "h-9 px-3 text-[12px] font-medium shadow-none transition-[background-color,color,transform] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 md:h-7",
                    previewScope === "section"
                      ? "bg-surface text-foreground-1 shadow-xs hover:bg-surface"
                      : "text-foreground-3 hover:bg-transparent hover:text-foreground-2",
                  )}
                >
                  {t("businessPage.builder.currentSection")}
                </Button>
              </div>
              <DeviceToggle device={device} setDevice={setPreviewDevice} t={t} />
            </div>
          </DialogHeader>
          <div ref={previewScrollRef} className="overflow-y-auto bg-surface-hover pb-[env(safe-area-inset-bottom)] dark:bg-neutral-900/40">
            <div
              className={cn(
                "mx-auto w-full",
                device === "mobile"
                  ? "max-w-[390px] p-3"
                  : device === "tablet"
                    ? "max-w-[768px] p-3"
                    : "max-w-[1280px]",
              )}
            >
              <LivePreview
                layout={modalLayout}
                data={previewData}
                chrome={modalChrome}
                startNumber={modalStartNumber}
                focusType={modalChrome ? previewFocusType ?? undefined : undefined}
                selectedLocationId={previewSelectedLocationId}
                onSelectedLocationChange={setPreviewSelectedLocationId}
                locationScope={modalChrome ? undefined : serviceLocations}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* paid style confirmation → Stripe payment redirect (or queue in the unlock tray) */}
      <VariantPurchaseDialog
        variant={purchaseTarget}
        kind="variant"
        onOpenChange={(open) => {
          if (!open) setPurchaseTarget(null);
        }}
        hasWebsiteBuilder={props.hasWebsiteBuilder ?? true}
        isLoading={props.isVariantCheckoutLoading ?? false}
        isBlocked={props.purchaseActionsReady === false}
        onBuy={(variant) => props.onBuyVariant?.(variant)}
        inCart={!!purchaseTarget && (props.cartVariantIds ?? []).includes(purchaseTarget.id)}
        onToggleCart={props.onToggleCartVariant}
        pendingCount={(props.cartVariantIds?.length ?? 0) + (props.cartSectionIds?.length ?? 0)}
      />

      {/* section unlock confirmation → the same Stripe payment flow (or queue in the tray) */}
      <VariantPurchaseDialog
        variant={sectionPurchaseTarget}
        kind="section"
        onOpenChange={(open) => {
          if (!open) setSectionPurchaseTarget(null);
        }}
        hasWebsiteBuilder={props.hasWebsiteBuilder ?? true}
        isLoading={props.isVariantCheckoutLoading ?? false}
        isBlocked={props.purchaseActionsReady === false}
        onBuy={(section) => props.onBuySection?.(section)}
        inCart={!!sectionPurchaseTarget && (props.cartSectionIds ?? []).includes(sectionPurchaseTarget.id)}
        onToggleCart={props.onToggleCartSection}
        pendingCount={(props.cartVariantIds?.length ?? 0) + (props.cartSectionIds?.length ?? 0)}
      />
    </>
  );
}

// ---------------------------------------------------------------------------

function MobileSectionEditorSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        overlayClassName="z-[70]"
        className="z-[70] !h-[100dvh] !max-h-[100dvh] gap-0 rounded-none border-0 p-0"
      >
        <SheetHeader className="border-b border-border px-4 py-3.5 pr-14 text-left">
          <SheetTitle className="truncate text-[15px]">{title}</SheetTitle>
          <SheetDescription className="mt-0.5 truncate text-[12px]">{description}</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function WorkspacePaneToggle({
  workspacePane,
  setWorkspacePane,
  t,
}: {
  workspacePane: WorkspacePane;
  setWorkspacePane: (pane: WorkspacePane) => void;
  t: WebsiteT;
}) {
  return (
    <div
      className="hidden overflow-hidden rounded-lg border border-border bg-surface-hover p-0.5 md:inline-flex xl:hidden"
      role="tablist"
      aria-label={t("businessPage.builder.previewLabel")}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        rounded="default"
        role="tab"
        aria-selected={workspacePane === "editor"}
        onClick={() => setWorkspacePane("editor")}
        className={cn(
          "min-h-11 px-3 text-[12px] font-semibold shadow-none",
          workspacePane === "editor"
            ? "bg-surface text-foreground-1 shadow-xs hover:bg-surface"
            : "text-foreground-3 hover:bg-transparent hover:text-foreground-2",
        )}
      >
        {t("businessPage.builder.workspaceEditor")}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        rounded="default"
        role="tab"
        aria-selected={workspacePane === "preview"}
        onClick={() => setWorkspacePane("preview")}
        className={cn(
          "min-h-11 px-3 text-[12px] font-semibold shadow-none",
          workspacePane === "preview"
            ? "bg-surface text-foreground-1 shadow-xs hover:bg-surface"
            : "text-foreground-3 hover:bg-transparent hover:text-foreground-2",
        )}
      >
        {t("businessPage.builder.workspacePreview")}
      </Button>
    </div>
  );
}

function DeviceToggle({
  device,
  setDevice,
  t,
}: {
  device: PreviewDevice;
  setDevice: (v: PreviewDevice) => void;
  t: WebsiteT;
}) {
  const options: Array<{ id: PreviewDevice; label: string; Icon: typeof Monitor }> = [
    { id: "desktop", label: t("businessPage.builder.deviceDesktop"), Icon: Monitor },
    { id: "tablet", label: t("businessPage.builder.deviceTablet"), Icon: Tablet },
    { id: "mobile", label: t("businessPage.builder.deviceMobile"), Icon: Smartphone },
  ];

  return (
    <span className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-surface p-0.5">
      {options.map(({ id, label, Icon }) => (
        <Button
          key={id}
          type="button"
          variant="ghost"
          size="icon"
          rounded="default"
          onClick={() => setDevice(id)}
          aria-label={label}
          aria-pressed={device === id}
          title={label}
          className={cn(
            "size-11 shadow-none transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96] xl:size-8",
            device === id
              ? "bg-surface-hover text-foreground-1 hover:bg-surface-hover"
              : "text-foreground-3 hover:bg-transparent hover:text-foreground-2",
          )}
        >
          <Icon className="size-[15px]" strokeWidth={1.5} aria-hidden />
        </Button>
      ))}
    </span>
  );
}

export default LegacySectionBuilder;
