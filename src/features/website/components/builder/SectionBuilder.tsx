import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
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
import {
  Monitor,
  Smartphone,
  Tablet,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  Lock,
  LockOpen,
  PanelLeft,
} from "lucide-react";
import { cn } from "../../../../shared/lib/utils";
import { useFormatPrice } from "../../../../shared/hooks/useFormatPrice";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Switch } from "../../../../shared/components/ui/switch";
import { Collapsible } from "../../../../shared/components/ui/collapsible";
import type {
  Business,
  SectionEntry,
  LocationWithAssignments,
  FaqItem,
  AnnouncementContent,
  WebsiteVariantCatalogEntry,
  WebsiteSectionCatalogEntry,
} from "../../types";
import type { PreviewOnlyVariantSelections } from "../../checkoutIntent";
import { SECTION_META, isKnownSectionType, PINNED_TYPES, REQUIRED_TYPES } from "./sectionCatalog";
import { SectionCard } from "./SectionCard";
import { VariantPurchaseDialog } from "./VariantPurchaseDialog";
import { variantPriceLabel } from "./pricing";
import { SectionStylePicker, VariantPickerSkeleton, EASE, type WebsiteT, type SectionStyleOption } from "./SectionStylePicker";
import { SettingsPanel } from "./SettingsPanel";
import { LivePreview, marqueeItems, MARQUEE_MIN_ITEMS, type PreviewReview, type RatingBars } from "./LivePreview";
import { ScaledPreview } from "./preview/ScaledPreview";
import type { PreviewData } from "./preview/shared/types";
import { useAtelierCompactLayout } from "../atelier/useAtelierCompactLayout";
import { useLocationTagDictionaries } from "../../../marketplace/hooks/useLocationTagDictionaries";
import {
  buildPreviewData,
  buildSectionCatalogModel,
  buildSectionRowInfo,
  derivePreviewOnlyVariants,
  filterOfferedSections,
  getDisplaySections,
  getLockedSectionEntry,
  getPreviewNumber,
  isCatalogPending,
  isPaidCatalogEntryLocked,
  isSectionOffered as sectionIsOffered,
  overlayPreviewVariants,
} from "./sectionBuilderModel";

const PREVIEW_DEVICE_PREF_KEY = "zavoia:website-builder-preview-device";

type PreviewScope = "page" | "section";
type PreviewDevice = "desktop" | "tablet" | "mobile";

interface AtelierPreviewViewport {
  virtualWidth: number;
  scale: number;
  showBrowserChrome: boolean;
  frameStyle: CSSProperties;
  clipStyle: CSSProperties;
  pageStyle: CSSProperties;
}

interface UndoToastOptions {
  title: string;
  description?: string;
  undoLabel: string;
  onUndo: () => void;
}

const showUndoToast = ({ title, description, undoLabel, onUndo }: UndoToastOptions) => {
  toast.custom(
    (toastId) => (
      <div className="flex max-w-[calc(100vw-2rem)] items-center justify-between gap-4 rounded-full bg-[#1c1c1a] px-4 py-2.5 text-[#faf8f3] shadow-[0_8px_26px_rgb(0_0_0/24%)]">
        <div className="min-w-0 text-[12.5px] leading-tight">
          <p className="truncate font-medium">{title}</p>
          {description ? (
            <p className="mt-0.5 truncate text-[11px] text-[#faf8f3]/65">{description}</p>
          ) : null}
        </div>
        <button
          type="button"
          style={{ minWidth: 0, minHeight: 0 }}
          className="shrink-0 border-0 bg-transparent p-0 text-[12px] font-semibold text-[#faf8f3] underline decoration-[#faf8f3]/45 underline-offset-4 outline-none hover:decoration-[#faf8f3] focus-visible:ring-2 focus-visible:ring-[#faf8f3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c1c1a]"
          onClick={() => {
            onUndo();
            toast.dismiss(toastId);
          }}
        >
          {undoLabel}
        </button>
      </div>
    ),
    { duration: 5000, position: "bottom-center" },
  );
};

/** Full previews keep local UI (accordions, selectors and carousels) live, while owner-facing
 * preview safety prevents the embedded draft from navigating the dashboard document. Gallery
 * zoom is held back too because its current lightbox intentionally portals to document.body. */
const blockUnsafePreviewActivation = (event: ReactMouseEvent<HTMLElement>) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target?.closest('a[href], form button[type="submit"], [data-gimg]')) return;
  event.preventDefault();
  event.stopPropagation();
};

const blockPreviewSubmit = (event: FormEvent<HTMLElement>) => {
  event.preventDefault();
  event.stopPropagation();
};

interface SectionBuilderProps {
  /** Workspace request (publish-blocker chips) to open/scroll to a section; nonce re-fires it. */
  focusSection?: { type: string; nonce: number } | null;
  /** Workspace/header entry point into the same production full-page preview dialog. */
  shellPreviewOpen?: boolean;
  onShellPreviewOpenChange?: (open: boolean) => void;
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
  /** The Brand column (logo / color / tagline / typeface / cover / link) rendered to the right of the list. */
  brandPanel: ReactNode;
  /** Pending-unlocks trigger (sheet) rendered with the workspace controls below xl. */
  cartControl?: ReactNode;
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
  /** Independent commerce entitlement. Locked styles may still be previewed when false,
   *  but no cart or checkout action is presented. */
  canPurchase: boolean;
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
  /** Fresh catalog ownership/pricing is available and no prior checkout return owns reconciliation. */
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
  /** Reports the exact locked style currently rendered preview-only, for checkout-return recovery. */
  onPreviewOnlyVariantsChange?: (selections: PreviewOnlyVariantSelections) => void;
  /** Native (Capacitor) app — store policy: no purchase surfaces (prices/Buy/cart) render; preview-before-buy stays fully functional. */
  isNative?: boolean;
}

/**
 * Business-page studio — at desktop, a focused editor rail sits beside a sticky live preview. Tablet
 * intentionally switches between the two panes; phone keeps editing direct and opens preview as a layer.
 * Reorder remains keyboard and pointer accessible, with explicit move actions where dragging is awkward.
 */
export function SectionBuilder(props: SectionBuilderProps) {
  const { t, i18n } = useTranslation("website");
  const isAtelierCompact = useAtelierCompactLayout();
  const [openType, setOpenType] = useState<string | null>(null);
  const [sectionDragging, setSectionDragging] = useState(false);
  const [observedPreviewType, setObservedPreviewType] = useState<string | null>(null);
  const activePreviewType = isAtelierCompact ? openType : observedPreviewType;
  const [previewOpen, setPreviewOpen] = useState(false);
  const resolvedPreviewOpen = previewOpen || !!props.shellPreviewOpen;
  const [previewScope, setPreviewScope] = useState<PreviewScope>("page");
  const [previewFocusType, setPreviewFocusType] = useState<string | null>(null);
  const [editorPanelCollapsed, setEditorPanelCollapsed] = useState(false);
  const editorPanelId = useId();
  // Sections are edited and previewed in the owner's app language (no language toggle).
  const locale: "en" | "ro" = i18n.language?.toLowerCase().startsWith("ro") ? "ro" : "en";
  const [device, setDevice] = useState<PreviewDevice>(() => {
    if (typeof window === "undefined") return "desktop";
    const saved = window.localStorage.getItem(PREVIEW_DEVICE_PREF_KEY);
    return saved === "desktop" || saved === "tablet" || saved === "mobile" ? saved : "desktop";
  });
  // The compact, full-screen preview has its own two-device control. It intentionally
  // starts on phone every time the builder mounts and never inherits a persisted tablet
  // choice from the desktop workspace.
  const [compactPreviewDevice, setCompactPreviewDevice] = useState<PreviewDevice>("mobile");
  const previewScrollRef = useRef<HTMLDivElement | null>(null);
  const workspacePreviewStageRef = useRef<HTMLDivElement | null>(null);
  const workspacePreviewScrollRef = useRef<HTMLDivElement | null>(null);
  const workspacePreviewPageRef = useRef<HTMLDivElement | null>(null);
  const previousShellPreviewOpenRef = useRef(false);
  const inspectorHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const restoreInspectorFocusTypeRef = useRef<string | null>(null);
  const shouldFocusInspectorRef = useRef(false);
  const [previewStage, setPreviewStage] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = workspacePreviewStageRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const rect = entry.target.getBoundingClientRect();
      setPreviewStage((current) =>
        Math.abs(current.width - rect.width) < 1 && Math.abs(current.height - rect.height) < 1
          ? current
          : { width: rect.width, height: rect.height },
      );
    });
    observer.observe(el);
    return () => observer.disconnect();
    // Re-attach when the aside (which owns the ref) mounts on pane/viewport changes.
  }, [isAtelierCompact]);

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
  const onPreviewOnlyVariantsChange = props.onPreviewOnlyVariantsChange;
  const [previewOnlyVariantByType, setPreviewVariantByType] =
    useState<PreviewOnlyVariantSelections>({});
  const previewOnlyVariantsRef = useRef<PreviewOnlyVariantSelections>({});
  const updatePreviewOnlyVariants = useCallback(
    (
      update: (
        current: PreviewOnlyVariantSelections,
      ) => PreviewOnlyVariantSelections,
    ) => {
      const next = update(previewOnlyVariantsRef.current);
      previewOnlyVariantsRef.current = next;
      setPreviewVariantByType(next);
      onPreviewOnlyVariantsChange?.(next);
    },
    [onPreviewOnlyVariantsChange],
  );
  const variantCatalog = props.variantCatalog;
  const sectionCatalog = props.sectionCatalog;
  const {
    variantByKey: catalogByKey,
    baseVariantKeyByType: baseKeyByType,
    sectionByType: sectionCatalogByType,
    ownedVariantSectionTypes,
  } = useMemo(
    () => buildSectionCatalogModel(variantCatalog, sectionCatalog),
    [sectionCatalog, variantCatalog],
  );

  // State only records a selection while it is still preview-only. Deriving the valid subset means
  // ownership or a successful save naturally resolves it without an extra state-reset render.
  const previewVariantByType = useMemo(
    () => derivePreviewOnlyVariants(previewOnlyVariantByType, props.layout, catalogByKey),
    [catalogByKey, previewOnlyVariantByType, props.layout],
  );

  const layoutWithPreviewVariants = useMemo(
    () => overlayPreviewVariants(props.layout, previewVariantByType),
    [previewVariantByType, props.layout],
  );
  // Preview-only styles render in the workspace preview but are NOT in the draft — the badge
  // keeps the preview honest about what Publish would actually ship.

  // Server-driven SECTION offering: lookup by type + the entry pending an unlock purchase.
  // A locked card (paid + not unlocked) routes every interaction to the purchase dialog.
  const [sectionPurchaseTarget, setSectionPurchaseTarget] = useState<WebsiteSectionCatalogEntry | null>(null);
  // First load only (not the empty-catalog failure fallback, which has already resolved by the
  // time isCatalogLoading goes false): both catalogs are still empty AND the fetch is in flight.
  const catalogPending = isCatalogPending(props.isCatalogLoading, variantCatalog, sectionCatalog);
  // Required chrome (nav/hero/footer) is never locked — every page needs it regardless of catalog data.
  const lockedSectionEntry = useCallback(
    (type: string): WebsiteSectionCatalogEntry | null =>
      getLockedSectionEntry(type, sectionCatalogByType),
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
    (type: string) =>
      sectionIsOffered(type, catalogAuthoritative, sectionCatalogByType, ownedVariantSectionTypes),
    [catalogAuthoritative, ownedVariantSectionTypes, sectionCatalogByType],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Drag stays on the vertical axis and inside the section list (never floats out of the column).
  const listRef = useRef<HTMLDivElement | null>(null);
  const openInspector = useCallback(
    (type: string) => {
      if (!isAtelierCompact) {
        restoreInspectorFocusTypeRef.current = type;
        shouldFocusInspectorRef.current = true;
      }
      setOpenType(type);
      // The Atelier compact reference scrolls its live preview as soon as a section row opens.
      // Retain that section for the header-triggered full preview as well as the preview peek.
      setPreviewFocusType(type);
    },
    [isAtelierCompact],
  );
  const returnToSectionList = useCallback(() => {
    const restoreType = restoreInspectorFocusTypeRef.current;
    setOpenType(null);
    shouldFocusInspectorRef.current = false;
    if (isAtelierCompact || !restoreType) return;
    window.requestAnimationFrame(() => {
      listRef.current
        ?.querySelector<HTMLButtonElement>(`[data-builder-section="${restoreType}"] button[aria-expanded]`)
        ?.focus();
    });
  }, [isAtelierCompact]);
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

  const openPreview = useCallback(
    (scope: PreviewScope, focusType?: string | null) => {
      setPreviewScope(scope);
      setPreviewFocusType(focusType === undefined ? openType : focusType);
      setPreviewOpen(true);
    },
    [openType],
  );

  // The workspace header is a global "Preview" entry point. It must always open the whole
  // page from the top-level context, never inherit a section-only scope from an earlier
  // inspector preview.
  useEffect(() => {
    const requested = !!props.shellPreviewOpen;
    if (requested && !previousShellPreviewOpenRef.current) {
      setPreviewScope("page");
      setPreviewFocusType(null);
      setCompactPreviewDevice("mobile");
    }
    previousShellPreviewOpenRef.current = requested;
  }, [props.shellPreviewOpen]);
  const handlePreviewOpenChange = (open: boolean) => {
    setPreviewOpen(open);
    props.onShellPreviewOpenChange?.(open);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setSectionDragging(false);
    if (!props.canWrite) return;
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

  const previewData = useMemo(
    () =>
      buildPreviewData({
        business: props.business,
        heroImageUrl: props.heroImageUrl,
        tagline: props.tagline,
        aboutContent: props.aboutContent,
        useBusinessEmail: props.useBusinessEmail,
        email: props.email,
        useBusinessPhone: props.useBusinessPhone,
        phone: props.phone,
        locations: props.locations,
        faqItems: props.faqItems,
        announcementContent: props.announcementContent,
        brandColorHex: props.brandColorHex,
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
  // The Business profile may contain an external website URL, but it is not the Website Builder's
  // public domain. Do not surface it in the browser chrome until the builder API exposes an
  // authoritative generated URL.
  const previewDomain = null;
  const previewViewport = useMemo<AtelierPreviewViewport | null>(() => {
    if (previewStage.width <= 0 || previewStage.height <= 0) return null;

    if (device === "desktop") {
      const cardWidth = Math.max(1, Math.min(previewStage.width - 40, 1560));
      const cardHeight = Math.max(152, previewStage.height - 20);
      const clipHeight = Math.max(120, cardHeight - 32);
      const scale = cardWidth / 1280;

      return {
        virtualWidth: 1280,
        scale,
        showBrowserChrome: true,
        frameStyle: {
          width: cardWidth,
          height: cardHeight,
          borderRadius: 12,
          border: "1px solid rgb(28 28 26 / 10%)",
          background: "var(--atelier-surface-strong)",
          boxShadow: "0 6px 16px rgb(28 28 26 / 7%), 0 18px 40px rgb(28 28 26 / 10%)",
        },
        clipStyle: { width: cardWidth, height: clipHeight },
        pageStyle: {
          width: 1280,
          height: clipHeight / scale,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        },
      };
    }

    const virtualWidth = device === "tablet" ? 834 : 390;
    const virtualHeight = device === "tablet" ? 1080 : 800;
    const scale = Math.min(
      (previewStage.height - 36) / (virtualHeight + 20),
      (previewStage.width - 80) / (virtualWidth + 20),
      1,
    );
    const cardWidth = Math.max(1, Math.round((virtualWidth + 20) * scale));
    const cardHeight = Math.max(1, Math.round((virtualHeight + 20) * scale));
    const padding = Math.max(1, Math.round(10 * scale));
    const clipWidth = Math.max(1, Math.round(virtualWidth * scale));
    const clipHeight = Math.max(1, Math.round(virtualHeight * scale));
    const radius = Math.max(4, Math.round(30 * scale));

    return {
      virtualWidth,
      scale,
      showBrowserChrome: false,
      frameStyle: {
        width: cardWidth,
        height: cardHeight,
        borderRadius: radius,
        background: "#1c1c1a",
        padding,
        boxShadow: "0 6px 16px rgb(28 28 26 / 12%), 0 18px 40px rgb(28 28 26 / 16%)",
      },
      clipStyle: {
        width: clipWidth,
        height: clipHeight,
        borderRadius: Math.max(4, Math.round(21 * scale)),
        background: "var(--atelier-surface-strong)",
      },
      pageStyle: {
        width: virtualWidth,
        height: clipHeight / scale,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      },
    };
  }, [device, previewStage]);

  // The marquee only reads as an intentional band with enough services to scroll; below the threshold it's
  // pointless, so drop the section from the builder entirely (it also self-hides on render). Both gate on the
  // same helper so the card and the rendered band never disagree. Indices into props.layout are preserved so
  // visibility/variant handlers stay correct; the displayed ordinal counts the shown cards.
  const marqueeItemCount = marqueeItems(props.locations).length;
  const marqueeReady = marqueeItemCount >= MARQUEE_MIN_ITEMS;
  // The section list is server-driven via isSectionOffered: required chrome always shows, and once the
  // catalog is authoritative only its content types survive (a card never renders for a type the server
  // doesn't offer — so future paid-only or unseeded sections stay hidden rather than blank). The marquee
  // additionally self-gates on having enough services. A catalog type with no implemented component is
  // ignored via the layout match (the layout only carries implemented or saved types).
  const displaySections = getDisplaySections(props.layout, marqueeReady, isSectionOffered);

  const items = displaySections.map(({ entry }) => entry.type);
  const shown = displaySections.filter(({ entry }) => entry.visible).length;
  const previewNumberFor = useCallback(
    (index: number) => getPreviewNumber(props.layout, index, isSectionOffered),
    [props.layout, isSectionOffered],
  );

  const rowInfoFor = (entry: SectionEntry) =>
    buildSectionRowInfo(entry, {
      t,
      locale,
      announcementContent: props.announcementContent,
      announcementError: props.announcementError,
      heroImageUrl: props.heroImageUrl,
      tagline: props.tagline,
      taglineError: props.taglineError,
      aboutContent: props.aboutContent,
      aboutError: props.aboutError,
      locations: props.locations,
      marqueeItemCount,
      reviews: props.reviews,
      faqItems: props.faqItems,
      sectionCatalogByType,
      variantCatalogByKey: catalogByKey,
    });

  const selectedSectionPosition = openType
    ? displaySections.findIndex(({ entry }) => entry.type === openType)
    : -1;
  const selectedSectionCandidate =
    selectedSectionPosition >= 0 ? displaySections[selectedSectionPosition] : null;
  // A catalog can finish loading while an inspector is already open. Never leave that
  // editor mounted if the section resolves to paid/locked (or the workspace becomes
  // read-only); the overview remains available and the row exposes the truthful action.
  const selectedSection =
    selectedSectionCandidate &&
    isKnownSectionType(selectedSectionCandidate.entry.type) &&
    !lockedSectionEntry(selectedSectionCandidate.entry.type)
      ? selectedSectionCandidate
      : null;
  const selectedSectionInfo = selectedSection ? rowInfoFor(selectedSection.entry) : null;
  const selectedSectionType = selectedSection?.entry.type;
  const previewPeekViewingLabel = openType && isKnownSectionType(openType)
    ? t(SECTION_META[openType].labelKey)
    : t(SECTION_META.hero.labelKey);
  useEffect(() => {
    if (isAtelierCompact || !selectedSectionType || !shouldFocusInspectorRef.current) return;
    const frame = window.requestAnimationFrame(() => {
      inspectorHeadingRef.current?.focus();
      shouldFocusInspectorRef.current = false;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isAtelierCompact, selectedSectionType]);

  const inspectorSectionPositions = displaySections.flatMap((candidate, position) =>
    isKnownSectionType(candidate.entry.type) && !lockedSectionEntry(candidate.entry.type)
      ? [position]
      : [],
  );
  const selectedInspectorPosition = inspectorSectionPositions.indexOf(selectedSectionPosition);
  const canStepInspector = selectedInspectorPosition >= 0 && inspectorSectionPositions.length > 1;
  const selectAdjacentInspectorSection = (direction: -1 | 1) => {
    if (!canStepInspector) return;
    const nextInspectorPosition =
      (selectedInspectorPosition + direction + inspectorSectionPositions.length) %
      inspectorSectionPositions.length;
    const nextDisplayPosition = inspectorSectionPositions[nextInspectorPosition];
    const candidate = nextDisplayPosition == null ? null : displaySections[nextDisplayPosition];
    if (candidate) {
      restoreInspectorFocusTypeRef.current = candidate.entry.type;
      setOpenType(candidate.entry.type);
      setPreviewFocusType(candidate.entry.type);
    }
  };

  /**
   * Show/hide with an Undo toast. Everything is keyed by section type — never by index — so
   * Undo still hits the right section after later reorders. `restoreConfig` reverts config a
   * cascade changed alongside visibility (e.g. hiding the last location also hid the section:
   * Undo must bring that location back, or it restores an enabled-but-empty section).
   */
  const toggleVisibleWithFeedback = (entry: SectionEntry, restoreConfig?: Record<string, unknown>) => {
      if (!props.canWrite) return;
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
  // The compact Atelier preview is intentionally a full-site surface, matching the supplied
  // mobile design. Desktop retains the existing focused-section mode.
  const modalSectionMode = !isAtelierCompact && previewScope === "section" && !!previewFocusEntry;
  // The full-page preview mirrors the real page: gate it by the same offering as the section list, so an
  // un-offered content section never appears in the preview either. Section-scoped mode targets a single
  // already-offered card (the owner opened it), so it renders as-is.
  const modalLayout = modalSectionMode
    ? [{ ...previewFocusEntry!, visible: true }]
    : filterOfferedSections(layoutWithPreviewVariants, isSectionOffered);
  const workspaceLayout = filterOfferedSections(layoutWithPreviewVariants, isSectionOffered);

  const modalStartNumber = modalSectionMode ? previewNumberFor(previewFocusIndex) : 1;
  const modalChrome = !modalSectionMode;
  const previewFocusLabel =
    previewFocusEntry && isKnownSectionType(previewFocusEntry.type)
      ? t(SECTION_META[previewFocusEntry.type].labelKey)
      : null;

  useEffect(() => {
    if (isAtelierCompact || !resolvedPreviewOpen || previewScope !== "page" || !previewFocusType) return;
    const container = previewScrollRef.current;
    if (!container) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = reduceMotion ? "auto" : "smooth";
    if (
      previewFocusType === "nav" ||
      previewFocusType === "announcement" ||
      previewFocusType === "hero"
    ) {
      container.scrollTo({ top: 0, behavior });
      return;
    }
    if (previewFocusType === "footer") {
      container.scrollTo({ top: container.scrollHeight, behavior });
      return;
    }
    const target = Array.from(container.querySelectorAll<HTMLElement>("[data-preview-section]")).find(
      (node) => node.dataset.previewSection === previewFocusType,
    );
    if (!target) return;
    window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior, block: "start" });
    });
  }, [device, isAtelierCompact, layoutWithPreviewVariants, previewFocusType, previewScope, resolvedPreviewOpen]);

  useEffect(() => {
    if (!resolvedPreviewOpen || previewScope !== "page" || previewFocusType) return;
    const frame = window.requestAnimationFrame(() => {
      previewScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [previewFocusType, previewScope, resolvedPreviewOpen]);

  // Publish-blocker chips in the workspace header jump here: open the section (or its unlock
  // dialog when the whole section is locked) and bring the row into view.
  const focusSection = props.focusSection;
  useEffect(() => {
    if (!focusSection) return;
    const { type } = focusSection;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const frame = window.requestAnimationFrame(() => {
      const locked = lockedSectionEntry(type);
      if (locked) {
        if (!props.isNative) setSectionPurchaseTarget(locked);
      } else {
        openInspector(type);
      }
      const row = listRef.current?.querySelector<HTMLElement>(`[data-builder-section="${type}"]`);
      row?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusSection, lockedSectionEntry, openInspector, props.isNative]);

  // Keep the section being edited in view inside the embedded preview. Calculate against the actual
  // preview scroller instead of `scrollIntoView`, which can otherwise move an ancestor dashboard pane.
  useEffect(() => {
    if (!openType) return;
    const container = workspacePreviewScrollRef.current;
    const pageNode = workspacePreviewPageRef.current;
    if (!container || !pageNode || !previewViewport) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = reduceMotion ? "auto" : "smooth";
    if (openType === "nav" || openType === "announcement" || openType === "hero") {
      container.scrollTo({ top: 0, behavior });
      return;
    }
    if (openType === "footer") {
      container.scrollTo({ top: container.scrollHeight, behavior });
      return;
    }
    const target = Array.from(pageNode.querySelectorAll<HTMLElement>("[data-preview-section]")).find(
      (node) => node.dataset.previewSection === openType,
    );
    if (!target) return;
    const frame = window.requestAnimationFrame(() => {
      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const top = Math.max(
        0,
        container.scrollTop +
          (targetRect.top - containerRect.top) / previewViewport.scale -
          56,
      );
      container.scrollTo({ top, behavior });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [device, openType, previewViewport]);

  // Match the Atelier reference's current-section indicator: the active row is whichever
  // preview section crosses a point 38% down the visible preview viewport. This remains
  // independent from the inspector's expanded row.
  useEffect(() => {
    if (isAtelierCompact) return;
    const container = workspacePreviewScrollRef.current;
    if (!container) return;
    let frame = 0;

    const updateActiveSection = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const containerRect = container.getBoundingClientRect();
        const marker = containerRect.top + containerRect.height * 0.38;
        const sections = Array.from(
          container.querySelectorAll<HTMLElement>("[data-preview-section]"),
        );
        if (sections.length === 0) {
          setObservedPreviewType(null);
          return;
        }
        const crossing = sections.find((section) => {
          const rect = section.getBoundingClientRect();
          return rect.top <= marker && rect.bottom > marker;
        });
        const nearest = crossing ?? sections.reduce((best, section) => {
          const bestDistance = Math.abs(best.getBoundingClientRect().top - marker);
          const distance = Math.abs(section.getBoundingClientRect().top - marker);
          return distance < bestDistance ? section : best;
        });
        setObservedPreviewType(nearest.dataset.previewSection ?? null);
      });
    };

    updateActiveSection();
    container.addEventListener("scroll", updateActiveSection, { passive: true });
    const observer = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(updateActiveSection);
    observer?.observe(container);
    return () => {
      window.cancelAnimationFrame(frame);
      container.removeEventListener("scroll", updateActiveSection);
      observer?.disconnect();
    };
  }, [device, isAtelierCompact, layoutWithPreviewVariants, previewStage.height, previewStage.width]);

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
    const activeVariantLocked = isPaidCatalogEntryLocked(activeCatalogEntry);
    const previewVariantId = previewVariantByType[entry.type] ?? entry.variant;
    const previewCatalogEntry = catalogByKey.get(`${entry.type}:${previewVariantId}`);
    const previewingLockedVariant =
      previewVariantId !== entry.variant &&
      isPaidCatalogEntryLocked(previewCatalogEntry);
    const lockedCatalogEntryForAction = previewingLockedVariant
      ? previewCatalogEntry
      : activeVariantLocked
        ? activeCatalogEntry
        : null;
    // The section's real "0N —" ordinal in the full page, so the scoped preview stays in sync with the rest.
    const previewNumber = previewNumberFor(index);
    return (
      <div className="atelier-inspector-settings-stack">
        <fieldset
          disabled={!entry.visible}
          className={cn(
            "atelier-inspector-style-fieldset m-0 min-w-0 space-y-4 border-0 p-0",
            !entry.visible && "pointer-events-none opacity-60 transition-opacity duration-200",
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
              disabled={!entry.visible}
              isOptionDisabled={(option) => !props.canWrite && !option.locked}
              onSelect={(option) => {
                if (option.locked && option.catalogEntry) {
                  updatePreviewOnlyVariants((current) => ({
                    ...current,
                    [entry.type]: option.variant.id,
                  }));
                  return;
                }
                if (!props.canWrite) return;
                updatePreviewOnlyVariants((current) => {
                  if (!current[entry.type]) return current;
                  const next = { ...current };
                  delete next[entry.type];
                  return next;
                });
                props.setSectionVariant(index, option.variant.id);
              }}
              t={t}
              isNative={props.isNative}
              previewData={previewData}
              previewNumber={previewNumber}
              presentation="atelier"
            />
          ) : null}
        </fieldset>

        {lockedCatalogEntryForAction ? (
          <div className="atelier-premium-warning flex flex-col gap-3 rounded-xl border border-warning-border bg-warning-bg px-3 py-2.5 text-[12px] leading-5 text-warning">
              <div className="atelier-premium-warning-copy flex min-w-0 items-start gap-2.5">
                <Lock className="atelier-premium-warning-icon mt-0.5 size-3.5 shrink-0" strokeWidth={1.8} aria-hidden />
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
                  : !props.canPurchase
                    ? t("businessPage.paidVariants.purchaseUnavailable")
                  : previewingLockedVariant
                    ? t("businessPage.paidVariants.previewingLockedHelper")
                    : t("businessPage.paidVariants.appliedLockedHelper")}
                </p>
              </div>
              {!props.isNative && props.canPurchase && (
                <div className="atelier-premium-warning-actions flex shrink-0 flex-wrap items-center gap-2">
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

        <fieldset
          disabled={!entry.visible || !props.canWrite}
          className={cn(
            "m-0 min-w-0 border-0 p-0",
            (!entry.visible || !props.canWrite) && "pointer-events-none opacity-60 transition-opacity duration-200",
          )}
        >
          <SettingsPanel
            entry={entry}
            index={index}
            locations={props.locations}
            faqItems={props.faqItems}
            announcementContent={props.announcementContent}
            aboutContent={props.aboutContent}
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
            onTaglineChange={props.setTagline}
            variant="atelier"
          />
        </fieldset>
      </div>
    );
  };

  return (
    <>
      <div
        className={cn(
          "atelier-builder-layout",
          editorPanelCollapsed && "atelier-builder-layout--editor-collapsed",
        )}
      >
        <section id={editorPanelId} className="atelier-editor-panel min-w-0">
          <div className="atelier-editor-surface overflow-hidden rounded-lg border border-border bg-surface shadow-xs">
        <div className="atelier-editor-heading px-4 py-4 sm:px-5 lg:px-6">
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
        <div className="atelier-editor-content border-t border-border-subtle">
          <div
            className={cn(
              "atelier-editor-list-view website-atelier-scrollbar",
              !isAtelierCompact && selectedSection && "hidden",
            )}
          >
          {/* brand band — above the list */}
          <div className="atelier-brand-slot bg-surface px-4 py-3.5 sm:px-5 lg:px-6">{props.brandPanel}</div>

          {isAtelierCompact ? (
            <button
              type="button"
              className="atelier-mobile-preview-peek website-atelier-focus website-atelier-press"
              onClick={() => openPreview("page", openType)}
              aria-label={t("businessPage.builder.openPreview")}
            >
              <span className="atelier-mobile-preview-label">
                <span>{t("businessPage.builder.livePreview")}</span>
                <span className="atelier-mobile-preview-state">{previewPeekViewingLabel}</span>
              </span>
              <ScaledPreview
                layout={workspaceLayout}
                data={previewData}
                focusType={openType ?? undefined}
                virtualWidth={1280}
                className="atelier-mobile-preview-canvas"
              />
              <span className="atelier-mobile-preview-open">
                <ArrowUpRight className="size-3.5" strokeWidth={1.8} aria-hidden />
                {t("businessPage.builder.previewExpand")}
              </span>
            </button>
          ) : null}

            {/* sections — the page contents, set as a quiet editorial index */}
          <div className="atelier-section-panel border-t border-border-subtle bg-surface-hover/35 px-3 py-3.5 sm:px-4 lg:px-5">
              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-[14px] font-semibold text-foreground-1">
                  {t("businessPage.builder.title")}
                </h3>
                <p className="mt-1 max-w-[60ch] text-pretty text-[13px] leading-5 text-foreground-3">
                  {t("businessPage.builder.sectionsHelper")}
                </p>
              </div>
              <span className="atelier-section-count">
                {t("businessPage.builder.sectionsLiveCount", {
                  shown,
                  total: displaySections.length,
                })}
              </span>
            </div>

            <div className="atelier-section-list relative">
              <DndContext
                sensors={props.canWrite ? sensors : undefined}
                collisionDetection={closestCenter}
                modifiers={modifiers}
                onDragStart={() => {
                  setSectionDragging(true);
                  setOpenType(null);
                }}
                onDragCancel={() => setSectionDragging(false)}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={items} strategy={verticalListSortingStrategy}>
                  <div ref={listRef} className="relative">
                    {displaySections.map(({ entry, index }, pos) => {
                      const readOnly = !isKnownSectionType(entry.type);
                      const editingDisabled = !props.canWrite;
                      // A paid, not-yet-unlocked section: the card renders locked and every
                      // interaction (expand, toggle) opens the unlock purchase dialog instead.
                      const paidLocked = lockedSectionEntry(entry.type);
                      const open = openType === entry.type && !paidLocked && !readOnly;
                      const previewEntry = layoutWithPreviewVariants[index] ?? entry;
                      const rowInfo = rowInfoFor(previewEntry);
                      const rowVariant = isKnownSectionType(entry.type)
                        ? SECTION_META[entry.type].variants.find((variant) => variant.id === previewEntry.variant)
                        : null;
                      const rowSummary = rowVariant
                        ? `${t(rowVariant.labelKey)} · ${rowInfo.summary}`
                        : rowInfo.summary;
                      return (
                        <Collapsible
                          key={entry.type}
                          data-builder-section={entry.type}
                          open={open}
                          onOpenChange={(next) => {
                            if (paidLocked) {
                              if (next && !props.isNative) setSectionPurchaseTarget(paidLocked);
                              return;
                            }
                            if (readOnly) return;
                            if (next) openInspector(entry.type);
                            else if (isAtelierCompact) setOpenType(null);
                            else returnToSectionList();
                          }}
                          className={cn(
                            "relative",
                            open && "z-10",
                          )}
                        >
                          <SectionCard
                            entry={entry}
                            meta={isKnownSectionType(entry.type) ? SECTION_META[entry.type] : null}
                            index={pos + 1}
                            summary={rowSummary}
                            status={rowInfo.status}
                            expanded={open}
                            active={activePreviewType === entry.type}
                            previewOnlyPremium={previewVariantByType[entry.type] != null}
                            locked={PINNED_TYPES.has(entry.type)}
                            readOnly={readOnly}
                            editingDisabled={editingDisabled}
                            required={REQUIRED_TYPES.has(entry.type)}
                            needsAttention={
                              (entry.type === "about" && !!props.aboutError) ||
                              (entry.type === "announcement" && !!props.announcementError)
                            }
                            paidLocked={!!paidLocked}
                            paidLockedInteractive={!props.isNative}
                            priceLabel={paidLocked ? variantPriceLabel(formatPrice, paidLocked) : undefined}
                            hidePrice={props.isNative}
                            inCart={!!paidLocked && (props.cartSectionIds ?? []).includes(paidLocked.id)}
                            pending={catalogPending && !REQUIRED_TYPES.has(entry.type)}
                            onSelect={() => {
                              if (paidLocked) {
                                if (!props.isNative) setSectionPurchaseTarget(paidLocked);
                                return;
                              }
                              if (readOnly) return;
                              if (open) {
                                if (isAtelierCompact) setOpenType(null);
                                else returnToSectionList();
                              } else {
                                openInspector(entry.type);
                              }
                            }}
                            onToggleVisible={() => {
                              if (paidLocked) {
                                if (!props.isNative) setSectionPurchaseTarget(paidLocked);
                                return;
                              }
                              if (readOnly || editingDisabled) return;
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
                              if (turningOn) openInspector(entry.type);
                              else if (open) {
                                if (isAtelierCompact) setOpenType(null);
                                else returnToSectionList();
                              }
                            }}
                          />
                          {isAtelierCompact && open ? (
                            <MobileSectionEditorSheet
                              open={open}
                              onOpenChange={(next) => setOpenType(next ? entry.type : null)}
                              title={isKnownSectionType(entry.type) ? t(SECTION_META[entry.type].labelKey) : entry.type}
                              description={
                                rowInfo.status
                                  ? `${rowInfo.status.label} · ${rowInfo.summary}`
                                  : rowInfo.summary
                              }
                              headerEnd={
                                REQUIRED_TYPES.has(entry.type) ? (
                                  <span className="atelier-sheet-fixed">
                                    {t("businessPage.builder.inspectorAlwaysOn")}
                                  </span>
                                ) : (
                                  <Switch
                                    checked={entry.visible}
                                    disabled={!props.canWrite}
                                    onCheckedChange={() => toggleVisibleWithFeedback(entry)}
                                    aria-label={
                                      entry.visible
                                        ? t("businessPage.builder.card.hide")
                                        : t("businessPage.builder.card.show")
                                    }
                                  />
                                )
                              }
                              onOpenPreview={() => openPreview("page", null)}
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

          {!isAtelierCompact && selectedSection && selectedSectionInfo ? (
            <div className="atelier-editor-inspector website-atelier-scrollbar">
              <div className="atelier-inspector-navigation">
                <button
                  type="button"
                  onClick={returnToSectionList}
                  className="atelier-inspector-back website-atelier-focus website-atelier-press"
                >
                  <ChevronLeft className="size-3" strokeWidth={2} aria-hidden />
                  {t("businessPage.builder.allSections")}
                </button>
                <span className="flex-1" />
                <button
                  type="button"
                  onClick={() => selectAdjacentInspectorSection(-1)}
                  disabled={!canStepInspector}
                  className="atelier-inspector-step website-atelier-focus website-atelier-press"
                  aria-label={t("businessPage.builder.previousSection")}
                >
                  <ChevronLeft className="size-3.5" strokeWidth={1.9} aria-hidden />
                </button>
                <span className="atelier-inspector-position" aria-live="polite">
                  <span aria-hidden>
                    {selectedSectionPosition + 1} / {displaySections.length}
                  </span>
                  <span className="sr-only">
                    {t("businessPage.builder.inspectorPosition", {
                      section: isKnownSectionType(selectedSection.entry.type)
                        ? t(SECTION_META[selectedSection.entry.type].labelKey)
                        : selectedSection.entry.type,
                      current: selectedSectionPosition + 1,
                      total: displaySections.length,
                    })}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => selectAdjacentInspectorSection(1)}
                  disabled={!canStepInspector}
                  className="atelier-inspector-step website-atelier-focus website-atelier-press"
                  aria-label={t("businessPage.builder.nextSection")}
                >
                  <ChevronRight className="size-3.5" strokeWidth={1.9} aria-hidden />
                </button>
              </div>
              <div className="atelier-inspector-heading">
                <div className="min-w-0 flex-1">
                  <h2 ref={inspectorHeadingRef} tabIndex={-1}>
                    {isKnownSectionType(selectedSection.entry.type)
                      ? t(SECTION_META[selectedSection.entry.type].labelKey)
                      : selectedSection.entry.type}
                  </h2>
                  <p>
                    {selectedSectionInfo.status
                      ? `${selectedSectionInfo.status.label} · ${selectedSectionInfo.summary}`
                      : selectedSectionInfo.summary}
                  </p>
                </div>
                {REQUIRED_TYPES.has(selectedSection.entry.type) ? (
                  <span className="atelier-inspector-fixed">
                    {t("businessPage.builder.inspectorAlwaysOn")}
                  </span>
                ) : (
                  <Switch
                    checked={selectedSection.entry.visible}
                    disabled={!props.canWrite}
                    onCheckedChange={() => toggleVisibleWithFeedback(selectedSection.entry)}
                    aria-label={
                      selectedSection.entry.visible
                        ? t("businessPage.builder.card.hide")
                        : t("businessPage.builder.card.show")
                    }
                  />
                )}
              </div>
              <div className="atelier-inspector-settings">
                {renderSettings(selectedSection.entry, selectedSection.index)}
              </div>
            </div>
          ) : null}
        </div>

          </div>
        </section>

        {/* Not mounted at all on phones — CSS-hiding would still load the preview's images and
            run its effects on exactly the devices most sensitive to that cost. */}
        {/* Sticky lives on the ASIDE (the grid item) — its containing block is the grid area
            (full row height) even with items-start, so it has real travel. A sticky child of the
            aside would have none: items-start collapses the aside to the child's own height. */}
        {!isAtelierCompact && (
          <aside className="atelier-preview-stage min-w-0">
            <div className="atelier-preview-stage-frame">
              <div className="atelier-preview-toolbar">
                <button
                  type="button"
                  onClick={() => setEditorPanelCollapsed((collapsed) => !collapsed)}
                  aria-controls={editorPanelId}
                  aria-expanded={!editorPanelCollapsed}
                  aria-label={
                    editorPanelCollapsed
                      ? t("businessPage.builder.showSectionsPanel")
                      : t("businessPage.builder.hideSectionsPanel")
                  }
                  title={
                    editorPanelCollapsed
                      ? t("businessPage.builder.showSectionsPanel")
                      : t("businessPage.builder.hideSectionsPanel")
                  }
                  className="atelier-preview-panel-toggle website-atelier-focus website-atelier-press"
                >
                  <PanelLeft className="size-[17px]" strokeWidth={1.7} aria-hidden />
                </button>
                {previewStage.width >= 1020 ? (
                  <span className="atelier-preview-toolbar-label">{t("businessPage.builder.draftPreview")}</span>
                ) : null}
                <span className="min-w-0 flex-1" />
                <DeviceToggle device={device} setDevice={setPreviewDevice} t={t} />
                {previewViewport ? (
                  <span className="atelier-preview-zoom tabular-nums" aria-live="polite">
                    {Math.round(previewViewport.scale * 100)}%
                  </span>
                ) : null}
              </div>
              <div ref={workspacePreviewStageRef} className="atelier-preview-canvas">
                {previewViewport ? (
                  <div
                    className={cn(
                      "atelier-preview-device-frame",
                      previewViewport.showBrowserChrome && "atelier-preview-browser",
                    )}
                    style={previewViewport.frameStyle}
                  >
                    {previewViewport.showBrowserChrome ? (
                      <div className="atelier-preview-browser-chrome" aria-hidden>
                        <span className="atelier-preview-browser-dots"><i /><i /><i /></span>
                        {previewDomain ? (
                          <span className="atelier-preview-browser-status">
                            {previewDomain}
                            <span className="text-[var(--atelier-muted-soft)]"> · </span>
                            {t("businessPage.builder.draft")}
                          </span>
                        ) : (
                          <span className="atelier-preview-browser-fill" />
                        )}
                        <span className="atelier-preview-browser-spacer" />
                      </div>
                    ) : null}
                    <div
                      className="atelier-preview-device-clip"
                      style={previewViewport.clipStyle}
                    >
                      <div
                        ref={workspacePreviewScrollRef}
                        className="atelier-preview-logical-scroll website-atelier-scrollbar"
                        style={previewViewport.pageStyle}
                        role="region"
                        aria-label={t("businessPage.builder.draftPreview")}
                        tabIndex={0}
                      >
                        <div
                          ref={workspacePreviewPageRef}
                          className="atelier-preview-virtual-page"
                          onClickCapture={blockUnsafePreviewActivation}
                          onAuxClickCapture={blockUnsafePreviewActivation}
                          onContextMenuCapture={blockUnsafePreviewActivation}
                          onSubmitCapture={blockPreviewSubmit}
                        >
                          <LivePreview
                            layout={workspaceLayout}
                            data={previewData}
                            focusType={openType ?? undefined}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
                {sectionDragging ? <div className="atelier-preview-drag-shield" aria-hidden /> : null}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Compact purchase review is a viewport-level control. Keeping it outside the desktop
          editor heading prevents that hidden heading from removing the bar below 920px. */}
      {props.cartControl}

      {/* The full preview follows the same 920px presentation boundary as the rest of Atelier. */}
      <Dialog open={resolvedPreviewOpen} onOpenChange={handlePreviewOpenChange}>
        <DialogContent
          overlayClassName="z-[74]"
          className="website-atelier atelier-preview-dialog z-[75] flex h-[90vh] max-h-[90vh] w-full max-w-[min(1280px,calc(100%-2rem))] flex-col gap-0 overflow-hidden p-0 md:max-w-[min(1280px,calc(100%-2rem))]"
        >
          <DialogHeader
            className={cn(
              "atelier-preview-dialog-header flex flex-col items-stretch justify-between gap-3 space-y-0 border-b border-border p-4 pr-12 text-left md:flex-row md:items-center",
              isAtelierCompact && "atelier-preview-dialog-header--mobile",
            )}
          >
            <DialogTitle
              className={cn(
                "min-w-0 text-[13px] font-semibold text-foreground-1",
                isAtelierCompact && "atelier-preview-dialog-title--mobile",
              )}
            >
              <span className="block truncate">
                {isAtelierCompact ? (
                  previewDomain ? (
                    <>
                      {previewDomain}
                      <span className="text-[color:rgb(250_248_243/32%)]"> · </span>
                      {t("businessPage.builder.draft")}
                    </>
                  ) : (
                    t("businessPage.builder.draftPreview")
                  )
                ) : modalSectionMode && previewFocusLabel ? (
                  t("businessPage.builder.currentSectionPreview", { section: previewFocusLabel })
                ) : (
                  t("businessPage.builder.previewLabel")
                )}
              </span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t("businessPage.builder.previewDialogDescription")}
            </DialogDescription>
            <div
              className={cn(
                "atelier-preview-dialog-controls flex flex-wrap items-center justify-between gap-2 text-[12px] md:shrink-0 md:justify-end",
                isAtelierCompact && "atelier-preview-dialog-controls--mobile",
              )}
            >
              {!isAtelierCompact ? (
                <div
                  className="inline-flex min-h-10 rounded-lg border border-border bg-surface-hover p-0.5 md:min-h-0"
                  role="group"
                  aria-label={t("businessPage.builder.previewLabel")}
                >
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
              ) : null}
              <DeviceToggle
                device={isAtelierCompact ? compactPreviewDevice : device}
                setDevice={isAtelierCompact ? setCompactPreviewDevice : setPreviewDevice}
                t={t}
                compact={isAtelierCompact}
                className={isAtelierCompact ? "atelier-preview-mobile-devices" : undefined}
              />
            </div>
          </DialogHeader>
          {isAtelierCompact ? (
            <CompactFullPreview
              scrollRef={previewScrollRef}
              device={compactPreviewDevice === "desktop" ? "desktop" : "mobile"}
              layout={modalLayout}
              data={previewData}
              chrome={modalChrome}
              startNumber={modalStartNumber}
              focusType={modalChrome ? previewFocusType ?? undefined : undefined}
            />
          ) : (
            <LogicalFullPreviewCanvas
              scrollRef={previewScrollRef}
              device={device}
              layout={modalLayout}
              data={previewData}
              chrome={modalChrome}
              startNumber={modalStartNumber}
              focusType={modalChrome ? previewFocusType ?? undefined : undefined}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* paid style confirmation → Stripe payment redirect (or queue in the unlock tray) */}
      <VariantPurchaseDialog
        variant={purchaseTarget}
        kind="variant"
        canPurchase={props.canPurchase}
        onOpenChange={(open) => {
          if (!open) setPurchaseTarget(null);
        }}
        hasWebsiteBuilder={props.hasWebsiteBuilder ?? true}
        isLoading={props.isVariantCheckoutLoading ?? false}
        isBlocked={props.purchaseActionsReady === false}
        onBuy={props.onBuyVariant}
        inCart={!!purchaseTarget && (props.cartVariantIds ?? []).includes(purchaseTarget.id)}
        onToggleCart={props.onToggleCartVariant}
        pendingCount={(props.cartVariantIds?.length ?? 0) + (props.cartSectionIds?.length ?? 0)}
      />

      {/* section unlock confirmation → the same Stripe payment flow (or queue in the tray) */}
      <VariantPurchaseDialog
        variant={props.isNative ? null : sectionPurchaseTarget}
        kind="section"
        canPurchase={props.canPurchase}
        onOpenChange={(open) => {
          if (!open) setSectionPurchaseTarget(null);
        }}
        hasWebsiteBuilder={props.hasWebsiteBuilder ?? true}
        isLoading={props.isVariantCheckoutLoading ?? false}
        isBlocked={props.purchaseActionsReady === false}
        onBuy={props.onBuySection}
        inCart={!!sectionPurchaseTarget && (props.cartSectionIds ?? []).includes(sectionPurchaseTarget.id)}
        onToggleCart={props.onToggleCartSection}
        pendingCount={(props.cartVariantIds?.length ?? 0) + (props.cartSectionIds?.length ?? 0)}
      />
    </>
  );
}

// ---------------------------------------------------------------------------

/**
 * Desktop-dialog preview with the same truthful logical device widths as the
 * workspace stage. Narrow browser windows scale a 1280px desktop page instead
 * of silently reflowing it at the dialog's smaller CSS width.
 */
function LogicalFullPreviewCanvas({
  scrollRef,
  device,
  layout,
  data,
  chrome,
  startNumber,
  focusType,
}: {
  scrollRef: RefObject<HTMLDivElement | null>;
  device: PreviewDevice;
  layout: SectionEntry[];
  data: PreviewData;
  chrome: boolean;
  startNumber: number;
  focusType?: string;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [stage, setStage] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const stageNode = stageRef.current;
    if (!stageNode || typeof ResizeObserver === "undefined") return;
    const update = () => {
      const rect = stageNode.getBoundingClientRect();
      setStage((current) =>
        Math.abs(current.width - rect.width) < 1 && Math.abs(current.height - rect.height) < 1
          ? current
          : { width: rect.width, height: rect.height },
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(stageNode);
    return () => observer.disconnect();
  }, []);

  const virtualWidth = device === "desktop" ? 1280 : device === "tablet" ? 834 : 390;
  const horizontalPadding = device === "desktop" ? 0 : 24;
  const availableWidth = Math.max(1, stage.width - horizontalPadding);
  const scale = stage.width > 0 ? Math.min(1, availableWidth / virtualWidth) : 0;
  const frameWidth = Math.max(1, Math.round(virtualWidth * scale));
  const frameHeight = Math.max(1, stage.height - (device === "desktop" ? 0 : 24));
  const logicalViewportHeight = Math.max(1, frameHeight / Math.max(scale, 0.001));

  return (
    <div
      ref={stageRef}
      className="atelier-preview-dialog-canvas min-h-0 flex-1 overflow-hidden bg-surface-hover dark:bg-neutral-900/40"
    >
      {scale > 0 ? (
        <div
          className={cn(
            "relative mx-auto overflow-hidden bg-[#fbfaf7]",
            device !== "desktop" && "my-3 rounded-[10px]",
          )}
          style={{
            width: frameWidth,
            height: frameHeight,
          }}
        >
          <div
            ref={scrollRef}
            className="atelier-preview-logical-scroll website-atelier-scrollbar"
            style={{
              width: virtualWidth,
              height: logicalViewportHeight,
              transform: `scale(${scale})`,
            }}
          >
            <div
              ref={pageRef}
              className="atelier-preview-virtual-page"
              onClickCapture={blockUnsafePreviewActivation}
              onAuxClickCapture={blockUnsafePreviewActivation}
              onContextMenuCapture={blockUnsafePreviewActivation}
              onSubmitCapture={blockPreviewSubmit}
            >
              <LivePreview
                layout={layout}
                data={data}
                chrome={chrome}
                startNumber={startNumber}
                focusType={focusType}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------

/**
 * Full-screen compact preview geometry from the Atelier reference. Phone mode is a
 * logical 390px page fitted into an 800px viewport; desktop mode is a true 1280px
 * page scaled to the available width. The logical scroll viewport is transformed with
 * the page, matching an iframe so sticky site chrome and scroll distance share one
 * coordinate system. Unsafe links and booking submissions remain intercepted.
 */
function CompactFullPreview({
  scrollRef,
  device,
  layout,
  data,
  chrome,
  startNumber,
  focusType,
}: {
  scrollRef: RefObject<HTMLDivElement | null>;
  device: "desktop" | "mobile";
  layout: SectionEntry[];
  data: PreviewData;
  chrome: boolean;
  startNumber: number;
  focusType?: string;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [stage, setStage] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const stageNode = stageRef.current;
    if (!stageNode || typeof ResizeObserver === "undefined") return;
    const update = () => {
      const rect = stageNode.getBoundingClientRect();
      const styles = window.getComputedStyle(stageNode);
      const horizontalPadding =
        (Number.parseFloat(styles.paddingLeft) || 0) +
        (Number.parseFloat(styles.paddingRight) || 0);
      const verticalPadding =
        (Number.parseFloat(styles.paddingTop) || 0) +
        (Number.parseFloat(styles.paddingBottom) || 0);
      const width = Math.max(0, rect.width - horizontalPadding);
      const height = Math.max(0, rect.height - verticalPadding);
      setStage((current) =>
        Math.abs(current.width - width) < 1 && Math.abs(current.height - height) < 1
          ? current
          : { width, height },
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(stageNode);
    return () => observer.disconnect();
  }, []);

  // `stage` is the measured content box, with the 8px side padding and the safe-area-aware
  // bottom padding already removed. Keep the reference's remaining 4px breathing room.
  const availableWidth = Math.max(1, stage.width);
  const availableHeight = Math.max(1, stage.height - 4);
  const virtualWidth = device === "mobile" ? 390 : 1280;
  const scale =
    device === "mobile"
      ? Math.min(availableWidth / 390, availableHeight / 800)
      : availableWidth / 1280;
  const frameWidth = Math.max(1, Math.round(virtualWidth * scale));
  const virtualViewportHeight = Math.max(1, Math.round(availableHeight / Math.max(scale, 0.001)));

  useEffect(() => {
    const scrollNode = scrollRef.current;
    const pageNode = pageRef.current;
    if (!scrollNode || !pageNode || !focusType || stage.width <= 0) return;

    const scrollToFocus = () => {
      const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const behavior: ScrollBehavior = reduceMotion ? "auto" : "smooth";

      if (
        focusType === "top" ||
        focusType === "nav" ||
        focusType === "announcement" ||
        focusType === "hero"
      ) {
        scrollNode.scrollTo({ top: 0, behavior });
        return;
      }
      if (focusType === "footer") {
        scrollNode.scrollTo({ top: scrollNode.scrollHeight, behavior });
        return;
      }

      const target = Array.from(
        pageNode.querySelectorAll<HTMLElement>("[data-preview-section]"),
      ).find((node) => node.dataset.previewSection === focusType);
      if (!target) return;

      const scrollRect = scrollNode.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const top = Math.max(
        0,
        scrollNode.scrollTop + (targetRect.top - scrollRect.top) / scale - 56,
      );
      scrollNode.scrollTo({ top, behavior });
    };

    scrollToFocus();
    const frame = window.requestAnimationFrame(scrollToFocus);
    return () => window.cancelAnimationFrame(frame);
  }, [focusType, scale, scrollRef, stage.width]);

  return (
    <div ref={stageRef} className="atelier-preview-dialog-canvas atelier-preview-dialog-canvas--compact">
      {stage.width > 0 && stage.height > 0 ? (
        <div
          className="atelier-preview-compact-frame"
          style={{ width: frameWidth, height: availableHeight }}
        >
          <div
            className="atelier-preview-compact-clip"
            style={{ width: frameWidth, height: availableHeight }}
          >
            <div
              ref={scrollRef}
              className="atelier-preview-logical-scroll website-atelier-scrollbar"
              style={{
                width: virtualWidth,
                height: virtualViewportHeight,
                transform: `scale(${scale})`,
              }}
            >
              <div
                ref={pageRef}
                className="atelier-preview-virtual-page"
                style={{
                  minHeight: virtualViewportHeight,
                }}
                onClickCapture={blockUnsafePreviewActivation}
                onAuxClickCapture={blockUnsafePreviewActivation}
                onContextMenuCapture={blockUnsafePreviewActivation}
                onSubmitCapture={blockPreviewSubmit}
              >
                <LivePreview
                  layout={layout}
                  data={data}
                  chrome={chrome}
                  startNumber={startNumber}
                  focusType={focusType}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------

function MobileSectionEditorSheet({
  open,
  onOpenChange,
  title,
  description,
  headerEnd,
  onOpenPreview,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  headerEnd: ReactNode;
  onOpenPreview: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation("website");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        portalContainer={typeof document === "undefined" ? null : document.getElementById("website-builder-main")}
        overlayClassName="!absolute z-[70] bg-[rgba(23,22,20,0.4)]"
        showCloseButton={false}
        className="website-atelier website-atelier-scrollbar atelier-section-editor-sheet z-[70] !absolute !block !h-auto !max-h-[86dvh] overflow-y-auto rounded-t-[18px] border-x-0 border-b-0 border-[var(--atelier-border)] bg-[var(--atelier-paper)] px-4 pb-[calc(30px+env(safe-area-inset-bottom))] pt-2 text-[var(--atelier-ink)]"
      >
        <span className="atelier-sheet-grab" aria-hidden />
        <SheetHeader className="flex-row items-start gap-3 p-0 pb-3 text-left">
          <div className="min-w-0 flex-1">
            <SheetTitle className="break-words text-[17px] leading-tight tracking-[-0.01em]">{title}</SheetTitle>
            <SheetDescription className="mt-0.5 break-words text-[12px] leading-[1.45]">{description}</SheetDescription>
          </div>
          <div className="mt-0.5 shrink-0">{headerEnd}</div>
        </SheetHeader>
        {children}
        <Button
          type="button"
          variant="outline"
          size="default"
          rounded="default"
          onClick={() => {
            onOpenChange(false);
            // Let Radix complete the sheet's short exit before a document-level preview dialog
            // mounts. Otherwise the closing z70 sheet can briefly cover the z50 dialog.
            window.setTimeout(onOpenPreview, 180);
          }}
          className="mt-4 h-10 w-full text-[12.5px] font-medium"
        >
          <Eye className="size-3.5" strokeWidth={1.75} aria-hidden />
          {t("businessPage.builder.seeInPreview")}
        </Button>
      </SheetContent>
    </Sheet>
  );
}

function DeviceToggle({
  device,
  setDevice,
  t,
  compact = false,
  className,
}: {
  device: PreviewDevice;
  setDevice: (v: PreviewDevice) => void;
  t: WebsiteT;
  compact?: boolean;
  className?: string;
}) {
  const options: Array<{ id: PreviewDevice; label: string; Icon: typeof Monitor }> = [
    { id: "desktop", label: t("businessPage.builder.deviceDesktop"), Icon: Monitor },
    { id: "tablet", label: t("businessPage.builder.deviceTablet"), Icon: Tablet },
    { id: "mobile", label: t("businessPage.builder.deviceMobile"), Icon: Smartphone },
  ];

  const visibleOptions = compact ? [options[2], options[0]] : options;

  return (
    <span
      className={cn("inline-flex items-center gap-0.5 rounded-lg border border-border bg-surface p-0.5", className)}
      role="group"
      aria-label={t("businessPage.builder.deviceGroup")}
    >
      {visibleOptions.map(({ id, label, Icon }) => (
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
          <Icon className="size-[15px]" strokeWidth={1.7} aria-hidden />
        </Button>
      ))}
    </span>
  );
}

export default SectionBuilder;
