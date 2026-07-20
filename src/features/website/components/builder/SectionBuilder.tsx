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
  type TransitionEvent as ReactTransitionEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
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
  PanelLeft,
  PanelRight,
} from "lucide-react";
import { cn } from "../../../../shared/lib/utils";
import { websiteToast as toast } from "../../websiteToast";
import { useFormatPrice } from "../../../../shared/hooks/useFormatPrice";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../../shared/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "../../../../shared/components/ui/drawer";
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
import { useIsMobile } from "../../../../shared/hooks/use-mobile";
import type {
  Business,
  SectionEntry,
  WebsiteBuilderLocation,
  FaqItem,
  AnnouncementContent,
  WebsiteVariantCatalogEntry,
  WebsiteSectionCatalogEntry,
  GalleryConfig,
} from "../../types";
import type { PreviewOnlyVariantSelections } from "../../checkoutIntent";
import { SECTION_META, isKnownSectionType, PINNED_TYPES, REQUIRED_TYPES } from "./sectionCatalog";
import { SectionCard } from "./SectionCard";
import { VariantPurchaseDialog } from "./VariantPurchaseDialog";
import { variantPriceLabel } from "./pricing";
import { SectionStylePicker, VariantPickerSkeleton, EASE, type WebsiteT, type SectionStyleOption } from "./SectionStylePicker";
import { SettingsPanel } from "./SettingsPanel";
import { SectionReadinessPanel } from "./SectionReadinessPanel";
import {
  findIncompleteFaqTarget,
  isFaqItemComplete,
  type WebsiteReadinessIssue,
  type WebsiteReadinessSectionType,
} from "./sectionReadiness";
import type { WebsiteSectionFocusRequest } from "../../hooks/useWebsiteWorkspaceController";
import { LivePreview, marqueeItems, MARQUEE_MIN_ITEMS, type PreviewReview, type RatingBars } from "./LivePreview";
import { ScaledPreview } from "./preview/ScaledPreview";
import type { PreviewData } from "./preview/shared/types";
import { useAtelierCompactLayout } from "../atelier/useAtelierCompactLayout";
import { useLocationTagDictionaries } from "../../../marketplace/hooks/useLocationTagDictionaries";
import { resolvePreviewLocations } from "./locationSelection";
import {
  collectGalleryImages,
  MIN_GALLERY_IMAGES,
  resolveGalleryImages,
} from "./gallerySelection";
import {
  getWebsiteSectionGuidance,
  type WebsiteSectionGuidance,
} from "./sectionGuidance";
import { heroVariantRequiresCoverImage } from "./heroCoverRequirement";
import type { WebsiteDraftIssue } from "./draftValidation";
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
  isTeamLocked,
  isTestimonialsLocked,
  MIN_TEAM_MEMBERS,
  MIN_TESTIMONIAL_REVIEWS,
  overlayPreviewVariants,
  reviewCount,
  sectionSummaryWithVariant,
  teamMemberCount,
} from "./sectionBuilderModel";

const PREVIEW_DEVICE_PREF_KEY = "zavoia:website-builder-preview-device";
const WEBSITE_BUILDER_UNDO_TOAST_ID_PREFIX = "website-builder-undo";
const WEBSITE_BUILDER_UNDO_DURATION = 6500;

type PreviewScope = "page" | "section";
type PreviewDevice = "desktop" | "tablet" | "mobile";

interface AtelierPreviewViewport {
  virtualWidth: number;
  scale: number;
  frameStyle: CSSProperties;
  clipStyle: CSSProperties;
  pageStyle: CSSProperties;
}

interface UndoToastOperation {
  toastKey: string;
  title: string;
  onUndo: () => void;
}

interface SectionDataLock {
  current: number;
  required: number;
  reason: string;
  eyebrow: string;
  title: string;
  description: string;
  progressLabel: string;
  actionLabel?: string;
  actionPath?: string;
}

interface SectionGuidanceCardModel {
  ariaLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  current?: number;
  required?: number;
  progressLabel?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

type GalleryRecoveryMode = "select" | "include" | "manage";

function galleryRecoveryMode(
  entry: SectionEntry,
  locations: WebsiteBuilderLocation[],
): GalleryRecoveryMode {
  const config = (entry.config ?? {}) as GalleryConfig;
  const selectedIds = new Set(resolveGalleryImages(config, locations).map((image) => image.id));
  const includedImages = collectGalleryImages(locations, config);
  if (
    includedImages.length >= MIN_GALLERY_IMAGES &&
    includedImages.some((image) => !selectedIds.has(image.id))
  ) {
    return "select";
  }
  const allImages = collectGalleryImages(locations);
  return allImages.length >= MIN_GALLERY_IMAGES ? "include" : "manage";
}

/** Full previews keep local UI (accordions, selectors, galleries and carousels) live, while
 * owner-facing preview safety prevents the embedded draft from navigating the dashboard document. */
const blockUnsafePreviewActivation = (event: ReactMouseEvent<HTMLElement>) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target?.closest('a[href], form button[type="submit"]')) return;
  event.preventDefault();
  event.stopPropagation();
};

const blockPreviewSubmit = (event: FormEvent<HTMLElement>) => {
  event.preventDefault();
  event.stopPropagation();
};

const PREVIEW_FOCUS_CONTEXT = 56;
const PREVIEW_ACTIVE_MARKER_RATIO = 0.38;

/**
 * A primitive key for the exact section render the preview should follow. Keeping config out of this
 * key means typing in an editor never pulls the preview back, while visibility and both saved and
 * preview-only style changes do issue a fresh focus request.
 */
const previewFocusRenderKey = (layout: SectionEntry[], focusType?: string | null) => {
  if (!focusType) return "top";
  const entry = layout.find((section) => section.type === focusType);
  return `${focusType}:${entry?.variant ?? "missing"}:${entry?.visible ? "visible" : "hidden"}`;
};

/** Scroll only the logical preview viewport; `scrollIntoView` can also move the dashboard around it. */
const scrollPreviewToSection = (
  scrollNode: HTMLElement,
  pageNode: HTMLElement,
  focusType: string,
) => {
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const behavior: ScrollBehavior = reduceMotion ? "auto" : "smooth";
  const maxTop = Math.max(0, scrollNode.scrollHeight - scrollNode.clientHeight);

  if (
    focusType === "top" ||
    focusType === "nav" ||
    focusType === "announcement" ||
    focusType === "hero"
  ) {
    scrollNode.scrollTo({ top: 0, behavior });
    return true;
  }
  if (focusType === "footer") {
    scrollNode.scrollTo({ top: maxTop, behavior });
    return true;
  }

  const target = Array.from(
    pageNode.querySelectorAll<HTMLElement>("[data-preview-section]"),
  ).find((node) => node.dataset.previewSection === focusType);
  if (!target) return false;

  const scrollRect = scrollNode.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const measuredScale = scrollNode.offsetWidth > 0
    ? scrollRect.width / scrollNode.offsetWidth
    : 1;
  const scale = Number.isFinite(measuredScale) && measuredScale > 0 ? measuredScale : 1;
  // A short Strip disappears beneath the sticky nav when it uses the same top offset as a full section.
  // Align its midpoint with the preview's active-section marker so the band stays visibly selected.
  const focusContext = focusType === "marquee"
    ? scrollNode.clientHeight * PREVIEW_ACTIVE_MARKER_RATIO - target.offsetHeight / 2
    : PREVIEW_FOCUS_CONTEXT;
  const top = scrollNode.scrollTop
    + (targetRect.top - scrollRect.top) / scale
    - focusContext;
  scrollNode.scrollTo({ top: Math.min(maxTop, Math.max(0, top)), behavior });
  return true;
};

/** Wait for the scaled preview to commit and lay out. A short retry covers gated/just-enabled sections. */
const schedulePreviewSectionFocus = (
  getScrollNode: () => HTMLElement | null,
  getPageNode: () => HTMLElement | null,
  focusType: string,
) => {
  let frame = 0;
  let retries = 2;
  const focus = () => {
    const scrollNode = getScrollNode();
    const pageNode = getPageNode();
    if (scrollNode && pageNode && scrollPreviewToSection(scrollNode, pageNode, focusType)) return;
    if (retries <= 0) return;
    retries -= 1;
    frame = window.requestAnimationFrame(focus);
  };
  // Two frames avoid measuring a stale wrapper while a style swap is committing its own layout effects.
  frame = window.requestAnimationFrame(() => {
    frame = window.requestAnimationFrame(focus);
  });
  return () => window.cancelAnimationFrame(frame);
};

interface SectionBuilderProps {
  /** Workspace request (publish-blocker chips) to open/scroll to a section; nonce re-fires it. */
  focusSection?: WebsiteSectionFocusRequest | null;
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
  /** Exact draft-save blockers used by rows, inspectors, fields, and header recovery. */
  blockingIssues: WebsiteDraftIssue[];
  /** Canonical publish-readiness collection shared with the header and Publish review. */
  publishReadinessIssues: WebsiteReadinessIssue[];
  aboutContent: string;
  setAboutContent: (value: string) => void;
  establishedYear: number | null;
  setEstablishedYear: (value: number | null) => void;
  establishedYearError?: string | null;
  /** The Brand column (logo / color / tagline / typeface / cover / link) rendered to the right of the list. */
  brandPanel: ReactNode;
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
  /** Distinguishes a valid empty quote result from initial/loading/failed review requests. */
  reviewsReady?: boolean;
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
  /** A save/checkout coordinator owns the current premium selection snapshot. */
  purchaseMutationsBlocked?: boolean;
  /** Stripe checkout redirects away, so it waits until the explicit draft save is clean. */
  checkoutBlocked?: boolean;
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
  /** Preview-only locked styles are controlled by the shell so Discard and Publish review can reset them. */
  previewOnlyVariantSelections?: PreviewOnlyVariantSelections;
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
  const navigate = useNavigate();
  const isAtelierCompact = useAtelierCompactLayout();
  const isMobile = useIsMobile();
  const undoToastGenerationRef = useRef(new Map<string, number>());
  const undoToastIdRef = useRef(new Map<string, string>());

  const clearUndoToast = useCallback((toastKey: string, generation: number) => {
    if (undoToastGenerationRef.current.get(toastKey) !== generation) return;
    undoToastIdRef.current.delete(toastKey);
  }, []);

  /**
   * Keep a compact Undo notification for every changed section. Different sections remain
   * independently visible; only a newer gesture on the exact same section/action replaces
   * its prior Undo, preventing conflicting callbacks without hiding other changes.
   */
  const showUndoToast = useCallback(
    (operation: UndoToastOperation) => {
      const currentToastId = undoToastIdRef.current.get(operation.toastKey);
      let toastId: string;
      if (
        currentToastId !== undefined &&
        toast.getToasts().some((candidate) => candidate.id === currentToastId)
      ) {
        toastId = currentToastId;
      } else {
        const nextGeneration = (undoToastGenerationRef.current.get(operation.toastKey) ?? 0) + 1;
        // Reuse an id only while that toast is live. Sonner keeps a dismissed toast mounted
        // through its exit animation; a fresh notification needs a fresh id so the old cleanup
        // cannot remove the next Undo affordance.
        toastId = `${WEBSITE_BUILDER_UNDO_TOAST_ID_PREFIX}-${operation.toastKey}-${nextGeneration}`;
        undoToastIdRef.current.set(operation.toastKey, toastId);
      }

      const generation = (undoToastGenerationRef.current.get(operation.toastKey) ?? 0) + 1;
      undoToastGenerationRef.current.set(operation.toastKey, generation);

      toast.message(
        operation.title,
        {
          id: toastId,
          className: "website-toast--undo",
          closeButton: false,
          // Sonner only restarts a running timer when its duration changes. Alternating by
          // one millisecond is imperceptible, while a replacement receives a full Undo window.
          duration: WEBSITE_BUILDER_UNDO_DURATION + (generation % 2),
          action: {
            label: t("businessPage.builder.toast.undo"),
            onClick: () => {
              if (undoToastGenerationRef.current.get(operation.toastKey) !== generation) return;
              undoToastGenerationRef.current.set(operation.toastKey, generation + 1);
              undoToastIdRef.current.delete(operation.toastKey);
              operation.onUndo();
              toast.dismiss(toastId);
            },
          },
          onDismiss: () => clearUndoToast(operation.toastKey, generation),
          onAutoClose: () => clearUndoToast(operation.toastKey, generation),
        },
      );
    },
    [clearUndoToast, t],
  );

  useEffect(
    () => () => {
      undoToastGenerationRef.current.clear();
      undoToastIdRef.current.forEach((toastId) => toast.dismiss(toastId));
      undoToastIdRef.current.clear();
    },
    [],
  );

  const [openType, setOpenType] = useState<string | null>(null);
  const [renderedInspectorType, setRenderedInspectorType] = useState<string | null>(null);
  const [renderedCompactType, setRenderedCompactType] = useState<string | null>(null);
  // Keep a recovery inspector editable through the keystroke that fixes its final issue. Without
  // this latch, hidden/paid sections disable or unmount the focused field as soon as validation clears.
  const [repairSessionType, setRepairSessionType] = useState<string | null>(null);
  const [sectionDragging, setSectionDragging] = useState(false);
  const [observedPreviewType, setObservedPreviewType] = useState<string | null>(null);
  const activePreviewType = isAtelierCompact ? openType : observedPreviewType;
  const [previewOpen, setPreviewOpen] = useState(false);
  const resolvedPreviewOpen = previewOpen || !!props.shellPreviewOpen;
  const [previewScope, setPreviewScope] = useState<PreviewScope>("page");
  const [previewFocusType, setPreviewFocusType] = useState<string | null>(null);
  // Let the full preview resolve the configured first visible location, then control all preview
  // surfaces from one selection after either the preview or the Locations inspector reports it.
  const [previewSelectedLocationId, setPreviewSelectedLocationId] = useState<
    number | null | undefined
  >(undefined);
  const [editorPanelCollapsed, setEditorPanelCollapsed] = useState(false);
  const editorPanelId = useId();
  // Sections are edited and previewed in the owner's app language (no language toggle).
  const locale: "en" | "ro" = i18n.language?.toLowerCase().startsWith("ro") ? "ro" : "en";
  const serviceLocations = useMemo(
    () => resolvePreviewLocations(props.layout, props.locations),
    [props.layout, props.locations],
  );
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
  const previewReturnElementRef = useRef<HTMLElement | null>(null);
  const previewReturnSectionTypeRef = useRef<string | null>(null);
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
  const controlledPreviewOnlyVariants = props.previewOnlyVariantSelections;
  const [previewOnlyVariantByType, setPreviewVariantByType] =
    useState<PreviewOnlyVariantSelections>(() => ({
      ...(controlledPreviewOnlyVariants ?? {}),
    }));
  const previewOnlyVariantsRef = useRef<PreviewOnlyVariantSelections>({
    ...(controlledPreviewOnlyVariants ?? {}),
  });
  const updatePreviewOnlyVariants = useCallback(
    (
      update: (
        current: PreviewOnlyVariantSelections,
      ) => PreviewOnlyVariantSelections,
    ) => {
      if (props.purchaseMutationsBlocked) return;
      const next = update(previewOnlyVariantsRef.current);
      previewOnlyVariantsRef.current = next;
      setPreviewVariantByType(next);
      onPreviewOnlyVariantsChange?.(next);
    },
    [onPreviewOnlyVariantsChange, props.purchaseMutationsBlocked],
  );
  useEffect(() => {
    if (!controlledPreviewOnlyVariants) return;
    const current = previewOnlyVariantsRef.current;
    const currentKeys = Object.keys(current);
    const nextKeys = Object.keys(controlledPreviewOnlyVariants);
    if (
      currentKeys.length === nextKeys.length &&
      nextKeys.every((key) => current[key] === controlledPreviewOnlyVariants[key])
    ) return;
    const next = { ...controlledPreviewOnlyVariants };
    previewOnlyVariantsRef.current = next;
    setPreviewVariantByType(next);
  }, [controlledPreviewOnlyVariants]);
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
  const paidOnlyVariantSectionTypes = useMemo(() => {
    const paidOnlyTypes = new Set<string>();
    if (!props.catalogLoaded) return paidOnlyTypes;

    const implementedByType = new Map<string, WebsiteVariantCatalogEntry[]>();
    for (const catalogEntry of variantCatalog ?? []) {
      if (
        !isKnownSectionType(catalogEntry.sectionType) ||
        !SECTION_META[catalogEntry.sectionType].variants.some(
          (variant) => variant.id === catalogEntry.variantKey,
        )
      ) continue;
      const entries = implementedByType.get(catalogEntry.sectionType) ?? [];
      entries.push(catalogEntry);
      implementedByType.set(catalogEntry.sectionType, entries);
    }

    for (const [type, entries] of implementedByType) {
      if (
        !baseKeyByType.has(type) &&
        entries.length > 0 &&
        entries.every((catalogEntry) => catalogEntry.priceMinor > 0)
      ) paidOnlyTypes.add(type);
    }
    return paidOnlyTypes;
  }, [baseKeyByType, props.catalogLoaded, variantCatalog]);

  // A paid-only section can be enabled as a local preview while its dormant draft entry remains
  // hidden. Once checkout confirms ownership, commit both the chosen style and that original
  // enable intent; otherwise a successful purchase would make the preview disappear while leaving
  // the section unexpectedly off.
  useEffect(() => {
    if (!props.canWrite || !props.catalogLoaded) return;

    const completedTypes: string[] = [];
    for (const [type, variantKey] of Object.entries(previewOnlyVariantByType)) {
      if (!paidOnlyVariantSectionTypes.has(type)) continue;
      const index = props.layout.findIndex((section) => section.type === type);
      if (index < 0 || props.layout[index].visible) continue;
      const catalogEntry = catalogByKey.get(`${type}:${variantKey}`);
      if (!catalogEntry?.owned) continue;

      if (props.layout[index].variant !== variantKey) {
        props.setSectionVariant(index, variantKey);
      }
      props.setSectionVisibleByType(type, true);
      completedTypes.push(type);
    }

    if (completedTypes.length === 0) return;
    const completed = new Set(completedTypes);
    updatePreviewOnlyVariants((current) => {
      const next = { ...current };
      completed.forEach((type) => delete next[type]);
      return next;
    });
  }, [
    catalogByKey,
    previewOnlyVariantByType,
    paidOnlyVariantSectionTypes,
    props.canWrite,
    props.catalogLoaded,
    props.layout,
    props.setSectionVariant,
    props.setSectionVisibleByType,
    updatePreviewOnlyVariants,
  ]);

  // State only records a selection while it is still preview-only. Deriving the valid subset means
  // ownership or a successful save naturally resolves it without an extra state-reset render.
  const previewVariantByType = useMemo(
    () =>
      derivePreviewOnlyVariants(
        previewOnlyVariantByType,
        props.layout,
        catalogByKey,
        paidOnlyVariantSectionTypes,
      ),
    [catalogByKey, paidOnlyVariantSectionTypes, previewOnlyVariantByType, props.layout],
  );

  const layoutWithPreviewVariants = useMemo(
    () => overlayPreviewVariants(
      props.layout,
      previewVariantByType,
      paidOnlyVariantSectionTypes,
    ),
    [paidOnlyVariantSectionTypes, previewVariantByType, props.layout],
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

  /**
   * Resolve the style that represents an optional, variant-funded section when the authoritative
   * catalog deliberately has no base row. Prefer the dormant key when it is owned, then any owned
   * option, then the dormant purchasable key, then the first purchasable option. Returning null preserves the established enable flow for every
   * section that has a base/free style or an incomplete catalog.
   */
  const paidOnlyEnableVariant = useCallback(
    (entry: SectionEntry): WebsiteVariantCatalogEntry | null => {
      if (
        !catalogAuthoritative ||
        !paidOnlyVariantSectionTypes.has(entry.type) ||
        !isKnownSectionType(entry.type)
      ) return null;

      const implementedEntries = SECTION_META[entry.type].variants.flatMap((variant) => {
        const catalogEntry = catalogByKey.get(`${entry.type}:${variant.id}`);
        return catalogEntry ? [catalogEntry] : [];
      });
      if (implementedEntries.length === 0) return null;

      const usableEntries = implementedEntries.filter(
        (catalogEntry) => catalogEntry.owned || catalogEntry.available !== false,
      );
      const savedEntry = usableEntries.find(
        (catalogEntry) => catalogEntry.variantKey === entry.variant,
      );
      return (savedEntry?.owned ? savedEntry : null)
        ?? usableEntries.find((catalogEntry) => catalogEntry.owned)
        ?? savedEntry
        ?? usableEntries[0]
        ?? null;
    },
    [catalogAuthoritative, catalogByKey, paidOnlyVariantSectionTypes],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Drag stays on the vertical axis and inside the section list (never floats out of the column).
  const listRef = useRef<HTMLDivElement | null>(null);
  // Header/Publish review focus requests are events, not persistent selection state. Remember the
  // last nonce so later form edits cannot replay an old request and pull the owner out of the
  // section they chose manually.
  const handledFocusRequestNonceRef = useRef<number | null>(null);
  const openInspector = useCallback(
    (type: string) => {
      if (!isAtelierCompact) {
        setRenderedInspectorType(type);
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
    setOpenType(null);
    setRepairSessionType(null);
    shouldFocusInspectorRef.current = false;
  }, []);
  useEffect(() => {
    if (!openType) setRepairSessionType(null);
  }, [openType]);
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
      const resolvedFocusType = focusType === undefined ? openType : focusType;
      previewReturnElementRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      previewReturnSectionTypeRef.current =
        resolvedFocusType && isKnownSectionType(resolvedFocusType) ? resolvedFocusType : null;
      setPreviewScope(scope);
      setPreviewFocusType(resolvedFocusType);
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
      previewReturnElementRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      previewReturnSectionTypeRef.current = null;
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
        toastKey: `reorder-${moved.type}`,
        title: t("businessPage.builder.toast.sectionMoved", { section: label }),
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
        establishedYear: props.establishedYear,
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
  // The Business profile URL is not the generated Website Builder domain.
  const previewDomain = null;
  const previewViewport = useMemo<AtelierPreviewViewport | null>(() => {
    if (previewStage.width <= 0 || previewStage.height <= 0) return null;

    if (device === "desktop") {
      const cardWidth = Math.max(1, Math.min(previewStage.width - 40, 1560));
      const cardHeight = Math.max(152, previewStage.height - 20);
      const clipHeight = cardHeight;
      const scale = cardWidth / 1280;

      return {
        virtualWidth: 1280,
        scale,
        frameStyle: {
          width: cardWidth,
          height: cardHeight,
          borderRadius: 12,
          clipPath: "inset(0 round 12px)",
          border: "1px solid rgb(28 28 26 / 10%)",
          background: "var(--atelier-surface-strong)",
          boxShadow: "0 6px 16px rgb(28 28 26 / 7%), 0 18px 40px rgb(28 28 26 / 10%)",
        },
        clipStyle: {
          width: cardWidth,
          height: clipHeight,
          clipPath: "inset(0)",
        },
        pageStyle: {
          width: 1280,
          height: clipHeight / scale,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          // Logical viewport height the heroes read as their full-bleed min-height (mirrors the site's 100svh).
          "--mc-vph": `${clipHeight / scale}px`,
        } as CSSProperties,
      };
    }

    const virtualWidth = device === "tablet" ? 834 : 390;
    const virtualHeight = device === "tablet" ? 1080 : 800;
    const scale = Math.min(
      (previewStage.height - 36) / (virtualHeight + 20),
      (previewStage.width - 80) / (virtualWidth + 20),
      1,
    );
    const padding = Math.max(1, Math.round(10 * scale));
    // The transformed page can land on a fractional physical pixel while the device clip must use whole
    // pixels. Keep the clip one pixel inside the rendered page on the far edges so its light background
    // cannot show as a right/bottom seam over dark sections; derive the frame from that clip so the bezel
    // remains perfectly symmetrical. The page itself retains the truthful logical device dimensions.
    const clipWidth = Math.max(1, Math.floor(virtualWidth * scale) - 1);
    const clipHeight = Math.max(1, Math.floor(virtualHeight * scale) - 1);
    const cardWidth = clipWidth + padding * 2;
    const cardHeight = clipHeight + padding * 2;
    const radius = Math.max(4, Math.round(30 * scale));
    const clipRadius = Math.max(4, Math.round(21 * scale));

    return {
      virtualWidth,
      scale,
      frameStyle: {
        width: cardWidth,
        height: cardHeight,
        borderRadius: radius,
        clipPath: `inset(0 round ${radius}px)`,
        background: "#1c1c1a",
        padding,
        boxShadow: "0 6px 16px rgb(28 28 26 / 12%), 0 18px 40px rgb(28 28 26 / 16%)",
      },
      clipStyle: {
        width: clipWidth,
        height: clipHeight,
        borderRadius: clipRadius,
        clipPath: `inset(0 round ${clipRadius}px)`,
        background: "var(--atelier-surface-strong)",
      },
      pageStyle: {
        width: virtualWidth,
        height: virtualHeight,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        "--mc-vph": `${virtualHeight}px`,
      } as CSSProperties,
    };
  }, [device, previewStage]);

  // Data-driven sections stay discoverable even before they have enough source content. Their rows remain
  // inspectable, while visibility, style and settings controls are gated until each established minimum is met.
  const marqueeItemCount = marqueeItems(props.locations).length;
  const marqueeReady = marqueeItemCount >= MARQUEE_MIN_ITEMS;
  const servicesLocked = !marqueeReady;

  const teamCount = teamMemberCount(props.locations);
  const teamLocked = isTeamLocked(props.locations);
  const teamRemaining = Math.max(0, MIN_TEAM_MEMBERS - teamCount);

  // Reviews needs a critical mass before it's worth showing. Below the threshold the section can't be turned
  // on (its toggle is disabled with a reason) and any existing enabled state is forced off, so it never
  // renders or publishes with too few reviews. The count comes from the reviews the builder already loads.
  const reviewsCount = reviewCount(props.locations, props.reviews);
  const reviewsLocked = isTestimonialsLocked(props.locations, props.reviews);
  const reviewsRemaining = Math.max(0, MIN_TESTIMONIAL_REVIEWS - reviewsCount);
  const reviewsLockReason = t("businessPage.builder.card.reviewsLocked", { count: MIN_TESTIMONIAL_REVIEWS });
  const effectiveFooterEmail = props.useBusinessEmail
    ? props.business?.email ?? ""
    : props.email;
  const effectiveFooterPhone = props.useBusinessPhone
    ? props.business?.phone ?? ""
    : props.phone;
  const hasFooterContact = [
    effectiveFooterEmail,
    effectiveFooterPhone,
    props.business?.websiteUrl ?? "",
  ].some((value) => value.trim().length > 0);
  const dataLockByType = useMemo(() => {
    const locks = new Map<string, SectionDataLock>();

    if (servicesLocked) {
      const remaining = Math.max(0, MARQUEE_MIN_ITEMS - marqueeItemCount);
      locks.set("marquee", {
        current: marqueeItemCount,
        required: MARQUEE_MIN_ITEMS,
        reason: t("businessPage.builder.card.servicesLocked", { count: MARQUEE_MIN_ITEMS }),
        eyebrow: t("businessPage.builder.settings.servicesLockedEyebrow"),
        title:
          marqueeItemCount === 0
            ? t("businessPage.builder.settings.servicesLockedTitleEmpty", {
                count: MARQUEE_MIN_ITEMS,
              })
            : t("businessPage.builder.settings.servicesLockedTitle", { count: remaining }),
        description: t("businessPage.builder.settings.servicesLockedBody", {
          count: MARQUEE_MIN_ITEMS,
        }),
        progressLabel: t("businessPage.builder.summary.servicesProgress", {
          count: marqueeItemCount,
          required: MARQUEE_MIN_ITEMS,
        }),
        actionLabel: props.locations.length > 0
          ? t("businessPage.builder.settings.servicesLockedAction")
          : t("businessPage.builder.settings.addLocationAction"),
        actionPath: props.locations.length > 0 ? "/services?open=add" : "/locations",
      });
    }

    if (teamLocked) {
      locks.set("team", {
        current: teamCount,
        required: MIN_TEAM_MEMBERS,
        reason: t("businessPage.builder.card.teamLocked", { count: MIN_TEAM_MEMBERS }),
        eyebrow: t("businessPage.builder.settings.teamLockedEyebrow"),
        title:
          teamCount === 0
            ? t("businessPage.builder.settings.teamLockedTitleEmpty", {
                count: MIN_TEAM_MEMBERS,
              })
            : t("businessPage.builder.settings.teamLockedTitle", { count: teamRemaining }),
        description: t("businessPage.builder.settings.teamLockedBody", {
          count: MIN_TEAM_MEMBERS,
        }),
        progressLabel: t("businessPage.builder.summary.membersProgress", {
          count: teamCount,
          required: MIN_TEAM_MEMBERS,
        }),
        actionLabel: props.locations.length > 0
          ? t("businessPage.builder.settings.teamLockedAction")
          : t("businessPage.builder.settings.addLocationAction"),
        actionPath: props.locations.length > 0 ? "/team-members?action=invite" : "/locations",
      });
    }

    if (reviewsLocked) {
      locks.set("testimonials", {
        current: reviewsCount,
        required: MIN_TESTIMONIAL_REVIEWS,
        reason: reviewsLockReason,
        eyebrow: t("businessPage.builder.settings.reviewsLockedEyebrow"),
        title:
          reviewsCount === 0
            ? t("businessPage.builder.settings.reviewsLockedTitleEmpty", {
                count: MIN_TESTIMONIAL_REVIEWS,
              })
            : t("businessPage.builder.settings.reviewsLockedTitle", {
                count: reviewsRemaining,
              }),
        description: t("businessPage.builder.settings.reviewsLockedBody", {
          count: MIN_TESTIMONIAL_REVIEWS,
        }),
        progressLabel: t("businessPage.builder.summary.reviewsProgress", {
          count: reviewsCount,
          required: MIN_TESTIMONIAL_REVIEWS,
        }),
        actionLabel: t("businessPage.builder.settings.reviewsLockedAction"),
        actionPath: "/marketplace?tab=reviews",
      });
    }

    return locks;
  }, [
    marqueeItemCount,
    reviewsCount,
    reviewsLockReason,
    reviewsLocked,
    reviewsRemaining,
    servicesLocked,
    props.locations.length,
    t,
    teamCount,
    teamLocked,
    teamRemaining,
  ]);
  const readinessIssues = props.publishReadinessIssues;
  const readinessIssueByType = useMemo(
    () => new Map(readinessIssues.map((issue) => [issue.type, issue])),
    [readinessIssues],
  );
  const readinessIssueTypes = useMemo(
    () => new Set(readinessIssues.map((issue) => issue.type)),
    [readinessIssues],
  );
  const blockingIssuesByType = useMemo(() => {
    const grouped = new Map<string, WebsiteDraftIssue[]>();
    for (const issue of props.blockingIssues) {
      const current = grouped.get(issue.type) ?? [];
      current.push(issue);
      grouped.set(issue.type, current);
    }
    return grouped;
  }, [props.blockingIssues]);
  const blockingIssueTypes = useMemo(
    () => new Set(props.blockingIssues.filter((issue) => issue.surface === "section").map((issue) => issue.type)),
    [props.blockingIssues],
  );
  const brandBlockingIssue = props.blockingIssues.find((issue) => issue.surface === "brand") ?? null;
  const { canWrite, layout: currentLayout, setSectionVisibleByType } = props;
  useEffect(() => {
    if (!canWrite) return;
    for (const type of ["marquee", "team", "testimonials"] as const) {
      if (!dataLockByType.has(type)) continue;
      const section = currentLayout.find((entry) => entry.type === type);
      if (section?.visible) setSectionVisibleByType(type, false);
    }
  }, [canWrite, currentLayout, dataLockByType, setSectionVisibleByType]);
  // The section list is server-driven via isSectionOffered: required chrome always shows, and once the
  // catalog is authoritative only its content types survive (a card never renders for a type the server
  // doesn't offer — so future paid-only or unseeded sections stay hidden rather than blank). A catalog type
  // with no implemented component is ignored via the layout match.
  // A catalog change must never hide the only route to a field/readiness blocker. Keep the
  // normal offering gate for the rendered website, but temporarily retain an affected draft row
  // in the editor so the owner can repair it or turn that section off.
  const isSectionAvailableForEditing = useCallback(
    (type: string) =>
      isSectionOffered(type) ||
      blockingIssueTypes.has(type) ||
      readinessIssueTypes.has(type as WebsiteReadinessSectionType),
    [blockingIssueTypes, isSectionOffered, readinessIssueTypes],
  );
  const displaySections = useMemo(
    () => getDisplaySections(props.layout, isSectionAvailableForEditing),
    [isSectionAvailableForEditing, props.layout],
  );
  const summaryLayout = useMemo(
    () => filterOfferedSections(layoutWithPreviewVariants, isSectionAvailableForEditing),
    [isSectionAvailableForEditing, layoutWithPreviewVariants],
  );

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
      layout: summaryLayout,
      business: props.business,
      selectedLocationId: previewSelectedLocationId,
      announcementContent: props.announcementContent,
      announcementError:
        blockingIssuesByType.get("announcement")?.[0]?.message ?? props.announcementError,
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

  const focusReadinessTarget = useCallback((selector: string, fallbackSelector?: string) => {
    const focus = () => {
      const target = document.querySelector<HTMLElement>(selector) ??
        (fallbackSelector ? document.querySelector<HTMLElement>(fallbackSelector) : null);
      if (!target) return;
      const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      window.requestAnimationFrame(() => target.focus({ preventScroll: true }));
    };
    window.requestAnimationFrame(focus);
  }, []);

  const revealFaqField = useCallback((index: number, field: "question" | "answer") => {
    const selector = `#faq-${field}-${index}`;
    const reveal = () => {
      if (!document.querySelector(selector)) {
        document.getElementById(`faq-item-trigger-${index}`)?.click();
      }
      window.requestAnimationFrame(() => focusReadinessTarget(selector));
    };
    window.requestAnimationFrame(reveal);
  }, [focusReadinessTarget]);

  const focusBlockingIssue = useCallback((issue: WebsiteDraftIssue) => {
    if (!props.canWrite) return;
    const reveal = () => {
      if (
        issue.type === "faq" &&
        issue.itemIndex != null &&
        (issue.field === "question" || issue.field === "answer")
      ) {
        revealFaqField(issue.itemIndex, issue.field);
        return;
      }
      focusReadinessTarget(`#${issue.controlId}`);
    };

    if (issue.locale && issue.locale !== locale) {
      void i18n.changeLanguage(issue.locale).then(() => {
        window.requestAnimationFrame(reveal);
      });
      return;
    }
    reveal();
  }, [focusReadinessTarget, i18n, locale, props.canWrite, revealFaqField]);

  const openInspectorAtBlockingIssue = useCallback((type: string) => {
    openInspector(type);
    const issues = blockingIssuesByType.get(type) ?? [];
    const issue = issues.find((candidate) => !candidate.locale || candidate.locale === locale) ?? issues[0];
    if (issue) {
      // Recovery has a more specific focus destination than the inspector heading. Prevent the
      // opacity-transition autofocus from stealing focus back after the field has been reached.
      shouldFocusInspectorRef.current = false;
      setRepairSessionType(type);
      window.requestAnimationFrame(() => focusBlockingIssue(issue));
    } else {
      setRepairSessionType(null);
    }
  }, [blockingIssuesByType, focusBlockingIssue, locale, openInspector]);

  const focusReadinessIssue = useCallback(
    (issue: WebsiteReadinessIssue) => {
      if (!props.canWrite) return;

      if (issue.type === "hero") {
        focusReadinessTarget("#hero-cover-upload");
        return;
      }
      if (issue.type === "about") {
        focusReadinessTarget(
          issue.field === "headline"
            ? "#business-page-about-title"
            : "#business-page-about-body",
        );
        return;
      }
      if (issue.type === "announcement") {
        focusReadinessTarget(
          issue.field === "cta-label"
            ? "#announcement-cta-label"
            : issue.field === "cta-url"
              ? "#announcement-cta-url"
              : "#announcement-message",
        );
        return;
      }
      if (issue.type === "gallery") {
        const galleryEntry = props.layout.find((entry) => entry.type === "gallery");
        const recovery = galleryEntry
          ? galleryRecoveryMode(galleryEntry, props.locations)
          : "manage";
        if (recovery === "select") {
          focusReadinessTarget(
            '#gallery-photo-library [data-gallery-image-option][aria-pressed="false"]:not(:disabled)',
            "#gallery-manage-photos",
          );
        } else if (recovery === "include") {
          focusReadinessTarget(
            '[data-gallery-location-source][data-state="unchecked"]',
            "#gallery-manage-photos",
          );
        } else if (props.locations.length === 0) {
          navigate("/locations");
        } else if (props.locations.length === 1) {
          navigate(`/marketplace?tab=locations&locationId=${props.locations[0].id}`);
        } else {
          navigate("/marketplace?tab=locations");
        }
        return;
      }
      if (issue.type !== "faq") return;

      const incompleteTarget = findIncompleteFaqTarget(props.faqItems, locale);
      if (incompleteTarget?.itemIndex != null && incompleteTarget.field) {
        const targetLocale = incompleteTarget.locale ?? locale;
        const targetField = incompleteTarget.field;
        if (targetLocale !== locale) {
          void i18n.changeLanguage(targetLocale).then(() => {
            revealFaqField(incompleteTarget.itemIndex!, targetField);
          });
        } else {
          revealFaqField(incompleteTarget.itemIndex, targetField);
        }
        return;
      }

      const blankIndex = props.faqItems.findIndex((item) => !isFaqItemComplete(item));
      if (blankIndex >= 0) {
        revealFaqField(blankIndex, "question");
        return;
      }

      const nextIndex = props.faqItems.length;
      props.setFaqItems([
        ...props.faqItems,
        { q: { en: "", ro: "" }, a: { en: "", ro: "" } },
      ]);
      window.requestAnimationFrame(() => {
        focusReadinessTarget(`#faq-question-${nextIndex}`);
      });
    },
    [
      focusReadinessTarget,
      i18n,
      locale,
      props.canWrite,
      props.faqItems,
      props.layout,
      props.locations,
      props.setFaqItems,
      revealFaqField,
      navigate,
    ],
  );

  useEffect(() => {
    if (isAtelierCompact) {
      setRenderedInspectorType(null);
      if (openType) setRenderedCompactType(openType);
    } else if (openType) {
      setRenderedCompactType(null);
      setRenderedInspectorType(openType);
    } else {
      setRenderedCompactType(null);
    }
  }, [isAtelierCompact, openType]);

  useEffect(() => {
    if (!isAtelierCompact || openType || !renderedCompactType) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // Keep the last editor mounted for exactly its visual exit so Vaul/Radix can finish
    // dismissing before the expensive compact preview is restored underneath it.
    const closeDelay = reduceMotion ? 0 : isMobile ? 260 : 310;
    const timeout = window.setTimeout(() => setRenderedCompactType(null), closeDelay);
    return () => window.clearTimeout(timeout);
  }, [isAtelierCompact, isMobile, openType, renderedCompactType]);

  const inspectorType = openType ?? (isAtelierCompact ? renderedCompactType : renderedInspectorType);
  const selectedSectionPosition = inspectorType
    ? displaySections.findIndex(({ entry }) => entry.type === inspectorType)
    : -1;
  const selectedSectionCandidate =
    selectedSectionPosition >= 0 ? displaySections[selectedSectionPosition] : null;
  // A catalog can finish loading while an inspector is already open. Normally a paid/locked
  // section returns to its purchase action. A stored field blocker is the one exception: its
  // settings must remain mounted long enough to repair without granting access to its style.
  const selectedSection =
    selectedSectionCandidate &&
    isKnownSectionType(selectedSectionCandidate.entry.type) &&
    (
      !lockedSectionEntry(selectedSectionCandidate.entry.type) ||
      blockingIssueTypes.has(selectedSectionCandidate.entry.type) ||
      repairSessionType === selectedSectionCandidate.entry.type
    )
      ? selectedSectionCandidate
      : null;
  const selectedPreviewEntry = selectedSection
    ? layoutWithPreviewVariants[selectedSection.index] ?? selectedSection.entry
    : null;
  const selectedSectionInfo = selectedPreviewEntry ? rowInfoFor(selectedPreviewEntry) : null;
  const selectedSectionSummary = selectedPreviewEntry && selectedSectionInfo
    ? sectionSummaryWithVariant(selectedPreviewEntry, selectedSectionInfo.summary, t)
    : null;
  const selectedSectionType = selectedSection?.entry.type;
  const desktopInspectorOpen =
    !isAtelierCompact && !!openType && selectedSectionType === openType && !!selectedSectionInfo;
  const previewPeekViewingLabel = openType && isKnownSectionType(openType)
    ? t(SECTION_META[openType].labelKey)
    : t(SECTION_META.hero.labelKey);
  useEffect(() => {
    if (isAtelierCompact || !openType) shouldFocusInspectorRef.current = false;
  }, [isAtelierCompact, openType]);

  const handleInspectorTransitionEnd = useCallback(
    (event: ReactTransitionEvent<HTMLDivElement>) => {
      if (
        isAtelierCompact ||
        event.target !== event.currentTarget ||
        event.propertyName !== "opacity"
      ) {
        return;
      }

      if (openType) {
        if (shouldFocusInspectorRef.current) {
          inspectorHeadingRef.current?.focus();
          shouldFocusInspectorRef.current = false;
        }
        return;
      }

      setRenderedInspectorType(null);
      const restoreType = restoreInspectorFocusTypeRef.current;
      if (!restoreType) return;
      listRef.current
        ?.querySelector<HTMLButtonElement>(`[data-builder-section="${restoreType}"] button[aria-expanded]`)
        ?.focus();
    },
    [isAtelierCompact, openType],
  );

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
      setRenderedInspectorType(candidate.entry.type);
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
      const previewOnlyVariant = turningOn
        ? undefined
        : previewOnlyVariantsRef.current[entry.type];
      if (previewOnlyVariant) {
        updatePreviewOnlyVariants((current) => {
          if (!current[entry.type]) return current;
          const next = { ...current };
          delete next[entry.type];
          return next;
        });
      }
      props.setSectionVisibleByType(entry.type, turningOn);
      const label = isKnownSectionType(entry.type) ? t(SECTION_META[entry.type].labelKey) : entry.type;
      showUndoToast({
        toastKey: `visibility-${entry.type}`,
        title: t(turningOn ? "businessPage.builder.toast.sectionShown" : "businessPage.builder.toast.sectionHidden", {
          section: label,
        }),
        onUndo: () => {
          props.setSectionVisibleByType(entry.type, entry.visible);
          if (restoreConfig) props.setSectionConfigByType(entry.type, restoreConfig);
          if (previewOnlyVariant) {
            updatePreviewOnlyVariants((current) =>
              current[entry.type]
                ? current
                : { ...current, [entry.type]: previewOnlyVariant },
            );
          }
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
  const modalLayout = useMemo(
    () => modalSectionMode && previewFocusEntry
      ? [{ ...previewFocusEntry, visible: true }]
      : filterOfferedSections(layoutWithPreviewVariants, isSectionOffered),
    [isSectionOffered, layoutWithPreviewVariants, modalSectionMode, previewFocusEntry],
  );
  const workspaceLayout = useMemo(
    () => filterOfferedSections(layoutWithPreviewVariants, isSectionOffered),
    [isSectionOffered, layoutWithPreviewVariants],
  );
  const workspaceFocusKey = previewFocusRenderKey(workspaceLayout, openType);
  const workspacePreviewReady = previewViewport !== null;

  const modalStartNumber = modalSectionMode ? previewNumberFor(previewFocusIndex) : 1;
  const modalChrome = !modalSectionMode;
  const previewFocusLabel =
    previewFocusEntry && isKnownSectionType(previewFocusEntry.type)
      ? t(SECTION_META[previewFocusEntry.type].labelKey)
      : null;

  // Publish-blocker chips in the workspace header jump here: open the section (or its unlock
  // dialog when the whole section is locked) and bring the row into view.
  const focusSection = props.focusSection;
  useEffect(() => {
    if (!focusSection || handledFocusRequestNonceRef.current === focusSection.nonce) return;
    const { type, readinessIssue, blockingIssue } = focusSection;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const frame = window.requestAnimationFrame(() => {
      // Mark it handled only when the scheduled navigation actually runs. This remains safe under
      // Strict Mode's setup/cleanup replay, where the first scheduled frame is cancelled.
      handledFocusRequestNonceRef.current = focusSection.nonce;
      if (type === "brand") {
        returnToSectionList();
        window.requestAnimationFrame(() => {
          const brandSlot = document.getElementById("brand-settings");
          brandSlot?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
          if (blockingIssue) window.requestAnimationFrame(() => focusBlockingIssue(blockingIssue));
        });
        return;
      }
      const locked = lockedSectionEntry(type);
      // A malformed saved value must remain repairable even if the containing section has since
      // become paid/unowned. This opens settings only; it does not unlock or preview the section.
      if (locked && !blockingIssue) {
        if (!props.isNative) setSectionPurchaseTarget(locked);
      } else {
        if (blockingIssue) setRepairSessionType(type);
        openInspector(type);
        if (blockingIssue || readinessIssue) shouldFocusInspectorRef.current = false;
        if (blockingIssue) {
          window.requestAnimationFrame(() => focusBlockingIssue(blockingIssue));
        } else if (readinessIssue) {
          window.requestAnimationFrame(() => focusReadinessIssue(readinessIssue));
        }
      }
      const row = listRef.current?.querySelector<HTMLElement>(`[data-builder-section="${type}"]`);
      row?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [
    focusBlockingIssue,
    focusReadinessIssue,
    focusSection,
    lockedSectionEntry,
    openInspector,
    props.isNative,
    returnToSectionList,
  ]);

  // Keep the section being edited in view inside the embedded preview. Calculate against the actual
  // preview scroller instead of `scrollIntoView`, which can otherwise move an ancestor dashboard pane.
  // The focused render key covers every effective style and visibility transition without refocusing
  // while the owner types into ordinary section settings.
  useEffect(() => {
    if (isAtelierCompact || !openType || !workspacePreviewReady) return;
    return schedulePreviewSectionFocus(
      () => workspacePreviewScrollRef.current,
      () => workspacePreviewPageRef.current,
      openType,
    );
  }, [device, isAtelierCompact, openType, workspaceFocusKey, workspacePreviewReady]);

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
        const marker = containerRect.top + containerRect.height * PREVIEW_ACTIVE_MARKER_RATIO;
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

  const focusVariantOption = (variantId: string) => {
    const option = document.querySelector<HTMLButtonElement>(
      `[data-section-variant="${variantId}"]`,
    );
    if (!option || option.disabled) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    option.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    window.requestAnimationFrame(() => {
      option.focus({ preventScroll: true });
      option.click();
    });
  };

  const guidanceCardFor = (
    guidance: WebsiteSectionGuidance,
    availableVariantIds: ReadonlySet<string>,
  ): SectionGuidanceCardModel => {
    const setupEyebrow = t("businessPage.builder.settings.guidance.setupEyebrow");
    const recommendationEyebrow = t(
      "businessPage.builder.settings.guidance.recommendationEyebrow",
    );

    switch (guidance.kind) {
      case "nav-empty-links": {
        const title = t("businessPage.builder.settings.guidance.navEmptyTitle");
        return {
          ariaLabel: title,
          eyebrow: t("businessPage.builder.settings.guidance.navigationEyebrow"),
          title,
          description: t("businessPage.builder.settings.guidance.navEmptyBody"),
          actionLabel: t("businessPage.builder.settings.guidance.reviewSectionsAction"),
          onAction: returnToSectionList,
        };
      }
      case "services-no-locations": {
        const title = t("businessPage.builder.settings.guidance.servicesNoLocationsTitle");
        return {
          ariaLabel: title,
          eyebrow: setupEyebrow,
          title,
          description: t("businessPage.builder.settings.guidance.servicesNoLocationsBody"),
          actionLabel: t("businessPage.builder.settings.addLocationAction"),
          onAction: () => navigate("/locations"),
        };
      }
      case "services-no-visible-locations": {
        const title = t("businessPage.builder.settings.guidance.servicesNoVisibleLocationsTitle");
        return {
          ariaLabel: title,
          eyebrow: setupEyebrow,
          title,
          description: t(
            "businessPage.builder.settings.guidance.servicesNoVisibleLocationsBody",
          ),
          actionLabel: t("businessPage.builder.settings.guidance.reviewLocationsAction"),
          onAction: () => openInspector("locations"),
        };
      }
      case "services-empty": {
        const title = t("businessPage.builder.settings.guidance.servicesEmptyTitle");
        return {
          ariaLabel: title,
          eyebrow: setupEyebrow,
          title,
          description: t("businessPage.builder.settings.guidance.servicesEmptyBody"),
          actionLabel: t("businessPage.builder.settings.guidance.manageServiceCatalogAction"),
          onAction: () => navigate("/services"),
          secondaryActionLabel: t(
            "businessPage.builder.settings.guidance.manageAssignmentsAction",
          ),
          onSecondaryAction: () =>
            navigate(`/assignments?locationId=${guidance.locationId}`),
        };
      }
      case "services-location-empty": {
        const title = t("businessPage.builder.settings.guidance.servicesLocationEmptyTitle", {
          name: guidance.locationName,
        });
        return {
          ariaLabel: title,
          eyebrow: recommendationEyebrow,
          title,
          description: t("businessPage.builder.settings.guidance.servicesLocationEmptyBody", {
            name: guidance.locationName,
          }),
          current: guidance.current,
          required: guidance.required,
          progressLabel: t(
            "businessPage.builder.settings.guidance.serviceLocationProgress",
            { current: guidance.current, required: guidance.required },
          ),
          actionLabel: t("businessPage.builder.settings.guidance.manageLocationAssignmentsAction", {
            name: guidance.locationName,
          }),
          onAction: () => navigate(`/assignments?locationId=${guidance.locationId}`),
        };
      }
      case "locations-none": {
        const title = t("businessPage.builder.settings.guidance.locationsNoneTitle");
        return {
          ariaLabel: title,
          eyebrow: setupEyebrow,
          title,
          description: t("businessPage.builder.settings.guidance.locationsNoneBody"),
          current: 0,
          required: 1,
          progressLabel: t("businessPage.builder.settings.guidance.locationsNoneProgress"),
          actionLabel: t("businessPage.builder.settings.addLocationAction"),
          onAction: () => navigate("/locations"),
        };
      }
      case "locations-photos": {
        const title = t("businessPage.builder.settings.guidance.locationPhotosTitle", {
          count: guidance.missingCount,
        });
        const photoPath = guidance.missingCount === 1
          ? `/marketplace?tab=locations&locationId=${guidance.missingLocationId}`
          : "/marketplace?tab=locations";
        return {
          ariaLabel: title,
          eyebrow: recommendationEyebrow,
          title,
          description: t("businessPage.builder.settings.guidance.locationPhotosBody"),
          current: guidance.current,
          required: guidance.required,
          progressLabel: t("businessPage.builder.settings.guidance.locationPhotosProgress", {
            current: guidance.current,
            required: guidance.required,
          }),
          actionLabel: guidance.missingCount === 1
            ? t("businessPage.builder.settings.guidance.addLocationPhotoAction", {
                name: guidance.missingLocationName,
              })
            : t("businessPage.builder.settings.guidance.manageLocationPhotosAction"),
          onAction: () => navigate(photoPath),
        };
      }
      case "reviews-no-quotes": {
        const title = t("businessPage.builder.settings.guidance.reviewsNoQuotesTitle");
        const canPreviewShowcase = props.canWrite && availableVariantIds.has("default");
        return {
          ariaLabel: title,
          eyebrow: t("businessPage.builder.settings.guidance.styleFitEyebrow"),
          title,
          description: t("businessPage.builder.settings.guidance.reviewsNoQuotesBody"),
          actionLabel: canPreviewShowcase
            ? t("businessPage.builder.settings.guidance.previewShowcaseAction")
            : t("businessPage.builder.settings.reviewsLockedAction"),
          onAction: canPreviewShowcase
            ? () => focusVariantOption("default")
            : () => navigate("/marketplace?tab=reviews"),
        };
      }
      case "footer-no-locations": {
        const title = t("businessPage.builder.settings.guidance.footerNoLocationsTitle");
        return {
          ariaLabel: title,
          eyebrow: t("businessPage.builder.settings.guidance.footerContentEyebrow"),
          title,
          description: t("businessPage.builder.settings.guidance.footerNoLocationsBody"),
          actionLabel: t("businessPage.builder.settings.addLocationAction"),
          onAction: () => navigate("/locations"),
        };
      }
      case "footer-no-contact": {
        const title = t("businessPage.builder.settings.guidance.footerNoContactTitle");
        return {
          ariaLabel: title,
          eyebrow: t("businessPage.builder.settings.guidance.footerContentEyebrow"),
          title,
          description: t("businessPage.builder.settings.guidance.footerNoContactBody"),
          actionLabel: t("businessPage.builder.settings.guidance.editBusinessProfileAction"),
          onAction: () => navigate("/account?tab=profile"),
        };
      }
    }
  };

  const renderSettings = (entry: SectionEntry, index: number) => {
    const meta = isKnownSectionType(entry.type) ? SECTION_META[entry.type] : null;
    // Data-gated sections remain inspectable, but style and settings controls stay unavailable until the
    // source data reaches the section's established minimum.
    const dataLock = dataLockByType.get(entry.type);
    const dataLocked = !!dataLock;
    const dataLockActionPath = dataLock?.actionPath;
    // Server-driven pills, matched against the components implemented in code (SECTION_META): a
    // catalog key with no matching component is simply ignored, so a backend typo can't break the
    // builder. The server-designated base always renders. Before catalog authority is established,
    // the first registered variant remains the resilient fallback; an authoritative no-base
    // catalog intentionally gets no pseudo-Included option. A saved variant also stays visible if it
    // left a conventional catalog; paid-only types omit an orphan key so it can never read as Included.
    const serverBase = baseKeyByType.get(entry.type);
    const baseId =
      meta && serverBase && meta.variants.some((v) => v.id === serverBase)
        ? serverBase
        : !catalogAuthoritative
          ? meta?.variants[0]?.id
          : undefined;
    const variants = meta
      ? meta.variants.filter((v) =>
          v.id === baseId ||
          catalogByKey.has(`${entry.type}:${v.id}`) ||
          (
            v.id === entry.variant &&
            (!catalogAuthoritative || !paidOnlyVariantSectionTypes.has(entry.type))
          ),
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
      previewVariantByType[entry.type] === previewVariantId &&
      isPaidCatalogEntryLocked(previewCatalogEntry);
    const previewEnablingHiddenSection = !entry.visible && previewingLockedVariant;
    const hiddenPaidOnlyPurchasePreview =
      !entry.visible &&
      paidOnlyVariantSectionTypes.has(entry.type) &&
      !!props.canPurchase &&
      !props.isNative;
    const repairingBlockingIssue =
      blockingIssueTypes.has(entry.type) || repairSessionType === entry.type;
    const sectionLocked = lockedSectionEntry(entry.type);
    const styleControlsDisabled =
      (!entry.visible && !previewEnablingHiddenSection && !hiddenPaidOnlyPurchasePreview) ||
      !!sectionLocked ||
      dataLocked ||
      props.purchaseMutationsBlocked === true;
    const settingsDisabled =
      (!entry.visible &&
        !(entry.type === "announcement" && previewEnablingHiddenSection) &&
        !repairingBlockingIssue) ||
      !props.canWrite ||
      (dataLocked && !repairingBlockingIssue);
    const lockedCatalogEntryForAction = previewingLockedVariant
      ? previewCatalogEntry
      : activeVariantLocked
        ? activeCatalogEntry
        : null;
    const stylePickerPending = catalogPending && (meta?.variants.length ?? 0) > 1;
    const showStyleGroup = stylePickerPending || hasVariants || !!lockedCatalogEntryForAction;
    // The section's real "0N —" ordinal in the full page, so the scoped preview stays in sync with the rest.
    const previewNumber = previewNumberFor(index);
    const sectionGuidance = getWebsiteSectionGuidance({
      entry,
      previewVariant: previewVariantId,
      layout: props.layout,
      locations: props.locations,
      serviceLocations,
      selectedLocationId: previewSelectedLocationId,
      totalReviewCount: reviewsCount,
      eligibleQuoteCount: props.reviewsReady ? props.reviews?.length ?? 0 : -1,
      hasFooterContact,
    });
    const guidanceCard = sectionGuidance
      ? guidanceCardFor(
          sectionGuidance,
          new Set(variantOptions.map((option) => option.variant.id)),
        )
      : null;
    const savedReadinessIssue = readinessIssueByType.get(
      entry.type as WebsiteReadinessSectionType,
    );
    // The inspector follows the style currently on screen, including a preview-only premium style.
    // Publish readiness remains based on the saved layout; this local projection only controls the
    // contextual Hero requirement card while the owner browses between styles.
    const readinessIssue: WebsiteReadinessIssue | undefined = entry.type === "hero"
      ? heroVariantRequiresCoverImage(previewVariantId) && !props.heroImageUrl
        ? { type: "hero", field: "cover", current: 0, required: 1 }
        : undefined
      : savedReadinessIssue;
    const readinessCopyKey = readinessIssue
      ? `businessPage.builder.settings.readiness.${readinessIssue.type}`
      : null;
    const galleryRecovery = readinessIssue?.type === "gallery"
      ? galleryRecoveryMode(entry, props.locations)
      : null;
    const galleryRemaining = readinessIssue?.type === "gallery"
      ? Math.max(0, MIN_GALLERY_IMAGES - (readinessIssue.current ?? 0))
      : 0;
    const readinessTitle = readinessIssue?.type === "gallery"
      ? props.locations.length === 0
        ? t("businessPage.builder.settings.readiness.gallery.noLocationsTitle")
        : galleryRecovery === "include"
          ? t("businessPage.builder.settings.readiness.gallery.includeTitle")
          : galleryRecovery === "manage"
            ? t("businessPage.builder.settings.readiness.gallery.manageTitle", {
                count: galleryRemaining,
              })
            : t("businessPage.builder.settings.readiness.gallery.selectTitle", {
                count: galleryRemaining,
              })
      : readinessCopyKey
        ? t(`${readinessCopyKey}.title`, { count: readinessIssue?.required })
        : "";
    const readinessDescription = readinessIssue?.type === "gallery"
      ? props.locations.length === 0
        ? t("businessPage.builder.settings.readiness.gallery.noLocationsBody")
        : t(`businessPage.builder.settings.readiness.gallery.${galleryRecovery ?? "manage"}Body`)
      : readinessCopyKey
        ? t(`${readinessCopyKey}.body`)
        : "";
    const readinessActionLabel = readinessIssue?.type === "gallery"
      ? props.locations.length === 0
        ? t("businessPage.builder.settings.addLocationAction")
        : t(`businessPage.builder.settings.readiness.gallery.${galleryRecovery ?? "manage"}Action`)
      : readinessCopyKey
        ? t(`${readinessCopyKey}.action`)
        : "";
    // About and Announcement place the cue beside their field; data-backed gates use `dataLock` above.
    // Hero, Gallery and FAQ use the generic top requirement panel.
    const showReadinessPanel =
      readinessIssue?.type === "hero" ||
      readinessIssue?.type === "gallery" ||
      readinessIssue?.type === "faq";
    return (
      <div className="atelier-inspector-settings-stack">
        {dataLock ? (
          <SectionReadinessPanel
            ariaLabel={dataLock.reason}
            eyebrow={dataLock.eyebrow}
            title={dataLock.title}
            description={dataLock.description}
            current={dataLock.current}
            required={dataLock.required}
            progressLabel={dataLock.progressLabel}
            actionLabel={dataLock.actionLabel}
            onAction={
              dataLockActionPath
                ? () => navigate(dataLockActionPath)
                : undefined
            }
          />
        ) : showReadinessPanel && readinessIssue && readinessCopyKey ? (
          <SectionReadinessPanel
            ariaLabel={readinessTitle}
            eyebrow={t("businessPage.builder.settings.readiness.eyebrow")}
            title={readinessTitle}
            description={readinessDescription}
            current={readinessIssue.current}
            required={readinessIssue.required}
            progressLabel={
              readinessIssue.current != null && readinessIssue.required != null
                ? t("businessPage.builder.settings.readiness.progress", {
                    current: readinessIssue.current,
                    required: readinessIssue.required,
                  })
                : undefined
            }
            actionLabel={props.canWrite ? readinessActionLabel : undefined}
            onAction={props.canWrite ? () => focusReadinessIssue(readinessIssue) : undefined}
          />
        ) : guidanceCard ? (
          <SectionReadinessPanel
            tone="recommendation"
            ariaLabel={guidanceCard.ariaLabel}
            eyebrow={guidanceCard.eyebrow}
            title={guidanceCard.title}
            description={guidanceCard.description}
            current={guidanceCard.current}
            required={guidanceCard.required}
            progressLabel={guidanceCard.progressLabel}
            actionLabel={guidanceCard.actionLabel}
            onAction={guidanceCard.onAction}
            secondaryActionLabel={guidanceCard.secondaryActionLabel}
            onSecondaryAction={guidanceCard.onSecondaryAction}
          />
        ) : null}

        {showStyleGroup ? (
          <section className="atelier-inspector-group atelier-inspector-style-group">
            <fieldset
              disabled={styleControlsDisabled}
              className={cn(
                "atelier-inspector-style-fieldset m-0 min-w-0 space-y-4 border-0 p-0",
                styleControlsDisabled && "pointer-events-none opacity-60 transition-opacity duration-200",
              )}
            >
              {/* Skeleton only where a picker can plausibly appear. The static meta count is a pre-fetch
                  heuristic: single-variant sections never get a picker, so they skip the skeleton entirely;
                  a multi-variant section can still resolve to nothing if the server's ACTIVE catalog narrows
                  the set below 2 — accepted, since the alternative (no skeleton) pops the picker in late for
                  the common full-catalog case. */}
              {stylePickerPending ? (
                <VariantPickerSkeleton />
              ) : hasVariants ? (
                <SectionStylePicker
                  entry={entry}
                  variants={variantOptions}
                  selectedVariantId={previewVariantId}
                  previewOnlyVariantId={previewVariantByType[entry.type]}
                  disabled={styleControlsDisabled}
                  isOptionDisabled={(option) => (!props.canWrite || dataLocked) && !option.locked}
                  onSelect={(option) => {
                    const revealCoverRequirement =
                      entry.type === "hero" &&
                      !props.heroImageUrl &&
                      heroVariantRequiresCoverImage(option.variant.id);
                    if (option.locked && option.catalogEntry) {
                      updatePreviewOnlyVariants((current) => ({
                        ...current,
                        [entry.type]: option.variant.id,
                      }));
                      if (revealCoverRequirement) {
                        focusReadinessTarget("#hero-cover-upload");
                      }
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
                    if (previewEnablingHiddenSection) {
                      props.setSectionVisibleByType(entry.type, true);
                    }
                    if (revealCoverRequirement) {
                      focusReadinessTarget("#hero-cover-upload");
                    }
                  }}
                  t={t}
                  isNative={props.isNative}
                  previewData={previewData}
                  previewNumber={previewNumber}
                  presentation="atelier"
                />
              ) : null}
            </fieldset>

            {lockedCatalogEntryForAction && !dataLocked ? (
              <div className="atelier-premium-warning flex flex-col gap-3 rounded-xl border border-warning-border bg-warning-bg px-3 py-2.5 text-[12px] leading-5 text-warning">
                <div className="atelier-premium-warning-copy flex min-w-0 items-start gap-2.5">
                  <span className="atelier-premium-warning-icon-shell" aria-hidden>
                    <Lock className="atelier-premium-warning-icon size-3.5" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0">
                    {/* Two different truths: a browsed locked style is NOT in the draft; a locked
                        style the draft already carries IS saved — and blocks publish. */}
                    <p className="atelier-premium-warning-title">
                      {previewingLockedVariant
                        ? t("businessPage.paidVariants.previewingLockedTitle")
                        : t("businessPage.paidVariants.appliedLockedTitle")}
                    </p>
                    <p className="atelier-premium-warning-helper">
                      {props.isNative
                        ? t("businessPage.paidVariants.nativeHint")
                        : !props.canPurchase
                          ? t("businessPage.paidVariants.purchaseUnavailable")
                          : previewingLockedVariant
                            ? t("businessPage.paidVariants.previewingLockedHelper")
                            : t("businessPage.paidVariants.appliedLockedHelper")}
                    </p>
                  </div>
                </div>
                {!props.isNative && props.canPurchase && (
                  <div className="atelier-premium-warning-actions flex shrink-0 flex-wrap items-center gap-2">
                    {props.onToggleCartVariant ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        rounded="default"
                        disabled={props.purchaseActionsReady === false}
                        onClick={() => props.onToggleCartVariant?.(lockedCatalogEntryForAction)}
                        className="atelier-premium-warning-secondary min-h-11 px-3 text-[12px] font-semibold xl:h-8 xl:min-h-0"
                      >
                        {(props.cartVariantIds ?? []).includes(lockedCatalogEntryForAction.id)
                          ? t("businessPage.paidVariants.previewRemoveFromCart")
                          : t("businessPage.paidVariants.previewAddToCart")}
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      rounded="default"
                      disabled={props.purchaseActionsReady === false}
                      onClick={() => setPurchaseTarget(lockedCatalogEntryForAction)}
                      className="atelier-premium-warning-primary min-h-11 px-3 text-[12px] font-semibold xl:h-8 xl:min-h-0"
                    >
                      {t("businessPage.paidVariants.previewBuy", {
                        price: variantPriceLabel(formatPrice, lockedCatalogEntryForAction),
                      })}
                    </Button>
                  </div>
                )}
              </div>
            ) : null}
          </section>
        ) : null}

        <fieldset
          disabled={settingsDisabled}
          className={cn(
            "atelier-inspector-content-fieldset m-0 min-w-0 border-0 p-0",
            settingsDisabled && "pointer-events-none opacity-60 transition-opacity duration-200",
          )}
        >
          <SettingsPanel
            entry={entry}
            index={index}
            locations={props.locations}
            serviceLocations={serviceLocations}
            faqItems={props.faqItems}
            announcementContent={props.announcementContent}
            blockingIssues={blockingIssuesByType.get(entry.type) ?? []}
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
            variant="atelier"
          />
        </fieldset>
      </div>
    );
  };

  const renderCompactSectionEditor = () => {
    if (
      !isAtelierCompact ||
      !selectedSection ||
      !selectedPreviewEntry ||
      !selectedSectionSummary
    ) return null;

    const { entry, index } = selectedSection;
    const entryDataLock = dataLockByType.get(entry.type);
    const entryDataLocked = !!entryDataLock;
    const previewEnablingHiddenSection =
      !entry.visible && previewVariantByType[entry.type] != null;
    const paidOnlyVariant = !lockedSectionEntry(entry.type) && !entryDataLocked
      ? paidOnlyEnableVariant(entry)
      : null;

    return (
      <CompactSectionEditorSurface
        phone={isMobile}
        open={openType === entry.type}
        onOpenChange={(next) => setOpenType(next ? entry.type : null)}
        onRestoreFocus={() => {
          listRef.current
            ?.querySelector<HTMLButtonElement>(
              `[data-builder-section="${entry.type}"] .atelier-section-card-select`,
            )
            ?.focus({ preventScroll: true });
        }}
        title={isKnownSectionType(entry.type) ? t(SECTION_META[entry.type].labelKey) : entry.type}
        description={selectedSectionSummary}
        headerEnd={
          REQUIRED_TYPES.has(entry.type) ? (
            <span className="atelier-sheet-fixed">
              {t("businessPage.builder.inspectorAlwaysOn")}
            </span>
          ) : (
            <Switch
              checked={(entry.visible || previewEnablingHiddenSection) && !entryDataLocked}
              disabled={!props.canWrite || entryDataLocked}
              onCheckedChange={() => {
                if (previewEnablingHiddenSection) {
                  updatePreviewOnlyVariants((current) => {
                    if (!current[entry.type]) return current;
                    const next = { ...current };
                    delete next[entry.type];
                    return next;
                  });
                  setOpenType(null);
                  return;
                }
                if (!entry.visible && paidOnlyVariant) {
                  if (!paidOnlyVariant.owned) {
                    updatePreviewOnlyVariants((current) => ({
                      ...current,
                      [entry.type]: paidOnlyVariant.variantKey,
                    }));
                    return;
                  }
                  if (entry.variant !== paidOnlyVariant.variantKey) {
                    props.setSectionVariant(index, paidOnlyVariant.variantKey);
                  }
                }
                toggleVisibleWithFeedback(entry);
              }}
              aria-label={
                entryDataLocked
                  ? entryDataLock?.reason
                  : entry.visible || previewEnablingHiddenSection
                    ? t("businessPage.builder.card.hide")
                    : t("businessPage.builder.card.show")
              }
            />
          )
        }
        previewAvailable={selectedPreviewEntry.visible}
        onOpenPreview={() => openPreview("page", entry.type)}
      >
        {renderSettings(entry, index)}
      </CompactSectionEditorSurface>
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
                  "min-h-11 shrink-0 px-3.5 text-[13px] font-semibold min-[920px]:hidden",
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
        <div
          className={cn(
            "atelier-editor-content border-t border-border-subtle",
            desktopInspectorOpen && "atelier-editor-content--inspecting",
          )}
        >
          <div
            className="atelier-editor-list-view website-atelier-scrollbar"
            aria-hidden={desktopInspectorOpen}
            inert={desktopInspectorOpen}
          >
          {/* brand band — above the list */}
          <div
            id="brand-settings"
            className="atelier-brand-slot relative bg-surface px-4 py-3.5 sm:px-5 lg:px-6"
          >
            {brandBlockingIssue ? (
              <span
                className="absolute right-3 top-3 z-10 flex size-4 items-center justify-center sm:right-4"
                title={brandBlockingIssue.message}
                aria-hidden
              >
                <span
                  className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-20 motion-reduce:animate-none"
                  style={{ animationDuration: "3s" }}
                  aria-hidden
                />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
            ) : null}
            {props.brandPanel}
          </div>

          {isAtelierCompact ? (
            <div className="atelier-mobile-preview-peek">
              <div className="atelier-mobile-preview-peek-visual" aria-hidden inert>
                <span className="atelier-mobile-preview-label">
                  <span>{t("businessPage.builder.livePreview")}</span>
                  <span className="atelier-mobile-preview-state">{previewPeekViewingLabel}</span>
                </span>
                {!openType && !renderedCompactType && !resolvedPreviewOpen ? (
                  <ScaledPreview
                    layout={workspaceLayout}
                    data={previewData}
                    selectedLocationId={previewSelectedLocationId}
                    onSelectedLocationChange={setPreviewSelectedLocationId}
                    virtualWidth={1280}
                    className="atelier-mobile-preview-canvas"
                  />
                ) : (
                  <span className="atelier-mobile-preview-canvas" aria-hidden />
                )}
                <span className="atelier-mobile-preview-open">
                  <ArrowUpRight className="size-3.5" strokeWidth={1.8} aria-hidden />
                  {t("businessPage.builder.previewExpand")}
                </span>
              </div>
              <button
                type="button"
                className="atelier-mobile-preview-peek-action website-atelier-focus website-atelier-press"
                onClick={() => openPreview("page", openType)}
                aria-label={t("businessPage.builder.openPreview")}
              />
            </div>
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
                    {displaySections.map(({ entry, index }) => {
                      const readOnly = !isKnownSectionType(entry.type);
                      const editingDisabled = !props.canWrite;
                      // A paid, not-yet-unlocked section: the card renders locked and every
                      // interaction (expand, toggle) opens the unlock purchase dialog instead.
                      const paidLocked = lockedSectionEntry(entry.type);
                      const repairingPaidLockedBlocker =
                        !!paidLocked && (
                          blockingIssueTypes.has(entry.type) || repairSessionType === entry.type
                        );
                      const entryDataLock = dataLockByType.get(entry.type);
                      const entryDataLocked = !!entryDataLock;
                      const open =
                        openType === entry.type && (!paidLocked || repairingPaidLockedBlocker) && !readOnly;
                      const previewEntry = layoutWithPreviewVariants[index] ?? entry;
                      const previewEnablingHiddenSection =
                        !entry.visible && previewVariantByType[entry.type] != null;
                      const paidOnlyVariant = !paidLocked && !entryDataLocked
                        ? paidOnlyEnableVariant(entry)
                        : null;
                      const rowInfo = rowInfoFor(previewEntry);
                      const rowSummary = sectionSummaryWithVariant(previewEntry, rowInfo.summary, t);
                      return (
                        <Collapsible
                          key={entry.type}
                          data-builder-section={entry.type}
                          open={open}
                          onOpenChange={(next) => {
                            if (paidLocked && !repairingPaidLockedBlocker) {
                              if (next && !props.isNative) setSectionPurchaseTarget(paidLocked);
                              return;
                            }
                            if (readOnly) return;
                            if (next) openInspectorAtBlockingIssue(entry.type);
                            else if (isAtelierCompact) setOpenType(null);
                            else returnToSectionList();
                          }}
                          className={cn(
                            "relative",
                            open && "z-10",
                          )}
                        >
                          <SectionCard
                            entry={previewEntry}
                            meta={isKnownSectionType(entry.type) ? SECTION_META[entry.type] : null}
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
                              blockingIssueTypes.has(entry.type) ||
                              (entry.type === "hero"
                                ? heroVariantRequiresCoverImage(previewEntry.variant) && !props.heroImageUrl
                                : readinessIssueTypes.has(entry.type as WebsiteReadinessSectionType)) ||
                              (entry.type === "about" && !!props.aboutError) ||
                              (entry.type === "announcement" && !!props.announcementError)
                            }
                            paidLocked={!!paidLocked}
                            paidLockedInteractive={repairingPaidLockedBlocker || !props.isNative}
                            priceLabel={paidLocked ? variantPriceLabel(formatPrice, paidLocked) : undefined}
                            hidePrice={props.isNative}
                            inCart={!!paidLocked && (props.cartSectionIds ?? []).includes(paidLocked.id)}
                            pending={catalogPending && !REQUIRED_TYPES.has(entry.type)}
                            dataLocked={entryDataLocked}
                            dataLockedReason={entryDataLock?.reason}
                            onSelect={() => {
                              if (paidLocked && !repairingPaidLockedBlocker) {
                                if (!props.isNative) setSectionPurchaseTarget(paidLocked);
                                return;
                              }
                              if (readOnly) return;
                              if (open) {
                                if (isAtelierCompact) setOpenType(null);
                                else returnToSectionList();
                              } else {
                                openInspectorAtBlockingIssue(entry.type);
                              }
                            }}
                            onToggleVisible={() => {
                              if (paidLocked) {
                                if (!props.isNative) setSectionPurchaseTarget(paidLocked);
                                return;
                              }
                              if (readOnly || editingDisabled || entryDataLocked) return;
                              if (previewEnablingHiddenSection) {
                                updatePreviewOnlyVariants((current) => {
                                  if (!current[entry.type]) return current;
                                  const next = { ...current };
                                  delete next[entry.type];
                                  return next;
                                });
                                if (open) {
                                  if (isAtelierCompact) setOpenType(null);
                                  else returnToSectionList();
                                }
                                return;
                              }
                              const turningOn = !entry.visible;
                              if (turningOn && paidOnlyVariant) {
                                if (!paidOnlyVariant.owned) {
                                  updatePreviewOnlyVariants((current) => ({
                                    ...current,
                                    [entry.type]: paidOnlyVariant.variantKey,
                                  }));
                                  openInspector(entry.type);
                                  return;
                                }
                                if (entry.variant !== paidOnlyVariant.variantKey) {
                                  props.setSectionVariant(index, paidOnlyVariant.variantKey);
                                }
                              }
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
                        </Collapsible>
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
              {renderCompactSectionEditor()}
            </div>

          </div>
          </div>

          {!isAtelierCompact ? (
            <div
              className="atelier-editor-inspector website-atelier-scrollbar"
              aria-hidden={!desktopInspectorOpen}
              inert={!desktopInspectorOpen}
              onTransitionEnd={handleInspectorTransitionEnd}
            >
              {selectedSection && selectedSectionInfo ? (
                <>
                  <div className="atelier-inspector-sticky-header">
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
                        <p>{selectedSectionSummary}</p>
                      </div>
                      {REQUIRED_TYPES.has(selectedSection.entry.type) ? (
                        <span className="atelier-inspector-fixed">
                          {t("businessPage.builder.inspectorAlwaysOn")}
                        </span>
                      ) : (
                        (() => {
                          const inspectorDataLock = dataLockByType.get(selectedSection.entry.type);
                          const inspectorDataLocked = !!inspectorDataLock;
                          const inspectorSectionLocked = !!lockedSectionEntry(selectedSection.entry.type);
                          const inspectorPreviewEnabled =
                            !selectedSection.entry.visible &&
                            previewVariantByType[selectedSection.entry.type] != null;
                          const inspectorPaidOnlyVariant = !inspectorDataLocked
                            ? paidOnlyEnableVariant(selectedSection.entry)
                            : null;
                          return (
                            <Switch
                              checked={(selectedSection.entry.visible || inspectorPreviewEnabled) && !inspectorDataLocked}
                              disabled={
                                !props.canWrite ||
                                inspectorDataLocked ||
                                (inspectorSectionLocked && !selectedSection.entry.visible)
                              }
                              onCheckedChange={() => {
                                if (inspectorSectionLocked && !selectedSection.entry.visible) return;
                                if (inspectorPreviewEnabled) {
                                  updatePreviewOnlyVariants((current) => {
                                    if (!current[selectedSection.entry.type]) return current;
                                    const next = { ...current };
                                    delete next[selectedSection.entry.type];
                                    return next;
                                  });
                                  returnToSectionList();
                                  return;
                                }
                                if (!selectedSection.entry.visible && inspectorPaidOnlyVariant) {
                                  if (!inspectorPaidOnlyVariant.owned) {
                                    updatePreviewOnlyVariants((current) => ({
                                      ...current,
                                      [selectedSection.entry.type]: inspectorPaidOnlyVariant.variantKey,
                                    }));
                                    return;
                                  }
                                  if (selectedSection.entry.variant !== inspectorPaidOnlyVariant.variantKey) {
                                    props.setSectionVariant(
                                      selectedSection.index,
                                      inspectorPaidOnlyVariant.variantKey,
                                    );
                                  }
                                }
                                toggleVisibleWithFeedback(selectedSection.entry);
                              }}
                              aria-label={
                                inspectorDataLocked
                                  ? inspectorDataLock?.reason
                                  : selectedSection.entry.visible || inspectorPreviewEnabled
                                    ? t("businessPage.builder.card.hide")
                                    : t("businessPage.builder.card.show")
                              }
                            />
                          );
                        })()
                      )}
                    </div>
                  </div>
                  <div className="atelier-inspector-settings">
                    {renderSettings(selectedSection.entry, selectedSection.index)}
                  </div>
                </>
              ) : null}
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
                  {editorPanelCollapsed ? (
                    <PanelRight className="size-[17px]" strokeWidth={1.7} aria-hidden />
                  ) : (
                    <PanelLeft className="size-[17px]" strokeWidth={1.7} aria-hidden />
                  )}
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
                  <div className="atelier-preview-device-frame" style={previewViewport.frameStyle}>
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
                            selectedLocationId={previewSelectedLocationId}
                            onSelectedLocationChange={setPreviewSelectedLocationId}
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

      {/* The full preview follows the same 920px presentation boundary as the rest of Atelier. */}
      <Dialog open={resolvedPreviewOpen} onOpenChange={handlePreviewOpenChange}>
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const originalTarget = previewReturnElementRef.current;
            const sectionType = previewReturnSectionTypeRef.current;
            window.requestAnimationFrame(() => {
              const fallback = sectionType
                ? listRef.current?.querySelector<HTMLButtonElement>(
                    `[data-builder-section="${sectionType}"] .atelier-section-card-select`,
                  )
                : null;
              const target = sectionType
                ? fallback ?? (originalTarget?.isConnected ? originalTarget : null)
                : originalTarget?.isConnected
                  ? originalTarget
                  : null;
              target?.focus({ preventScroll: true });
              previewReturnElementRef.current = null;
              previewReturnSectionTypeRef.current = null;
            });
          }}
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
              active={resolvedPreviewOpen}
              device={compactPreviewDevice === "desktop" ? "desktop" : "mobile"}
              layout={modalLayout}
              data={previewData}
              chrome={modalChrome}
              startNumber={modalStartNumber}
              focusType={modalChrome ? previewFocusType ?? undefined : undefined}
              selectedLocationId={previewSelectedLocationId}
              onSelectedLocationChange={setPreviewSelectedLocationId}
              locationScope={modalChrome ? undefined : serviceLocations}
            />
          ) : (
            <LogicalFullPreviewCanvas
              scrollRef={previewScrollRef}
              active={resolvedPreviewOpen}
              device={device}
              layout={modalLayout}
              data={previewData}
              chrome={modalChrome}
              startNumber={modalStartNumber}
              focusType={modalChrome ? previewFocusType ?? undefined : undefined}
              selectedLocationId={previewSelectedLocationId}
              onSelectedLocationChange={setPreviewSelectedLocationId}
              locationScope={modalChrome ? undefined : serviceLocations}
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
        checkoutBlocked={props.checkoutBlocked}
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
        checkoutBlocked={props.checkoutBlocked}
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
  active,
  device,
  layout,
  data,
  chrome,
  startNumber,
  focusType,
  selectedLocationId,
  onSelectedLocationChange,
  locationScope,
}: {
  scrollRef: RefObject<HTMLDivElement | null>;
  active: boolean;
  device: PreviewDevice;
  layout: SectionEntry[];
  data: PreviewData;
  chrome: boolean;
  startNumber: number;
  focusType?: string;
  selectedLocationId?: number | null;
  onSelectedLocationChange: (locationId: number | null) => void;
  locationScope?: WebsiteBuilderLocation[];
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
  const previewReady = scale > 0;
  const focusKey = previewFocusRenderKey(layout, focusType);

  // This preview owns its focus timing because its logical scroller is mounted only after the stage
  // has been measured. A parent effect can run before that node exists and permanently miss the request.
  useEffect(() => {
    if (!active || !previewReady) return;
    return schedulePreviewSectionFocus(
      () => scrollRef.current,
      () => pageRef.current,
      focusType ?? "top",
    );
  }, [active, chrome, device, focusKey, focusType, previewReady, scrollRef]);

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
            clipPath: device === "desktop" ? "inset(0)" : "inset(0 round 10px)",
          }}
        >
          <div
            ref={scrollRef}
            className="atelier-preview-logical-scroll website-atelier-scrollbar"
            style={{
              width: virtualWidth,
              height: logicalViewportHeight,
              transform: `scale(${scale})`,
              "--mc-vph": `${logicalViewportHeight}px`,
            } as CSSProperties}
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
                selectedLocationId={selectedLocationId}
                onSelectedLocationChange={onSelectedLocationChange}
                locationScope={locationScope}
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
  active,
  device,
  layout,
  data,
  chrome,
  startNumber,
  focusType,
  selectedLocationId,
  onSelectedLocationChange,
  locationScope,
}: {
  scrollRef: RefObject<HTMLDivElement | null>;
  active: boolean;
  device: "desktop" | "mobile";
  layout: SectionEntry[];
  data: PreviewData;
  chrome: boolean;
  startNumber: number;
  focusType?: string;
  selectedLocationId?: number | null;
  onSelectedLocationChange: (locationId: number | null) => void;
  locationScope?: WebsiteBuilderLocation[];
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
  const previewReady = stage.width > 0 && stage.height > 0 && scale > 0;
  const focusKey = previewFocusRenderKey(layout, focusType);

  useEffect(() => {
    if (!active || !previewReady) return;
    return schedulePreviewSectionFocus(
      () => scrollRef.current,
      () => pageRef.current,
      focusType ?? "top",
    );
  }, [active, device, focusKey, focusType, previewReady, scrollRef]);

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
                "--mc-vph": `${virtualViewportHeight}px`,
              } as CSSProperties}
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
                  selectedLocationId={selectedLocationId}
                  onSelectedLocationChange={onSelectedLocationChange}
                  locationScope={locationScope}
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

function CompactSectionEditorSurface({
  phone,
  open,
  onOpenChange,
  onRestoreFocus,
  title,
  description,
  headerEnd,
  previewAvailable,
  onOpenPreview,
  children,
}: {
  phone: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestoreFocus: () => void;
  title: string;
  description: string;
  headerEnd: ReactNode;
  previewAvailable: boolean;
  onOpenPreview: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation("website");
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const skipFocusRestoreRef = useRef(false);

  const handleOpenChange = (next: boolean) => {
    if (next) skipFocusRestoreRef.current = false;
    onOpenChange(next);
  };
  const handleOpenAutoFocus = (event: Event) => {
    event.preventDefault();
    titleRef.current?.focus({ preventScroll: true });
  };
  const handleCloseAutoFocus = (event: Event) => {
    event.preventDefault();
    if (!skipFocusRestoreRef.current) onRestoreFocus();
    skipFocusRestoreRef.current = false;
  };
  const handlePreview = () => {
    // The full Preview owns focus next; returning to the section row here would fight its autofocus.
    skipFocusRestoreRef.current = true;
    onOpenChange(false);
    onOpenPreview();
  };
  const editorBody = (
    <div
      data-vaul-no-drag={phone ? "" : undefined}
      className={cn(
        "website-atelier-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4",
        previewAvailable
          ? "pb-5"
          : "pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]",
      )}
    >
      {children}
    </div>
  );
  const previewAction = previewAvailable ? (
    <Button
      type="button"
      variant="outline"
      size="default"
      rounded="default"
      aria-label={t("businessPage.builder.currentSectionPreview", { section: title })}
      onClick={handlePreview}
      className="h-11 w-full text-[12.5px] font-medium"
    >
      <Eye className="size-3.5" strokeWidth={1.75} aria-hidden />
      {t("businessPage.builder.workspacePreview")}
    </Button>
  ) : null;

  if (!phone) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="bottom"
          portalContainer={
            typeof document === "undefined"
              ? null
              : document.getElementById("website-builder-main")
          }
          overlayClassName="!absolute z-[70] bg-[rgba(23,22,20,0.4)]"
          showCloseButton={false}
          onOpenAutoFocus={handleOpenAutoFocus}
          onCloseAutoFocus={handleCloseAutoFocus}
          className="website-atelier atelier-section-editor-sheet z-[71] !absolute !flex !max-h-[86dvh] flex-col gap-0 overflow-hidden rounded-t-[18px] border-x-0 border-b-0 border-[var(--atelier-border)] bg-[var(--atelier-paper)] px-0 pb-0 text-[var(--atelier-ink)] outline-none"
        >
          <SheetHeader className="shrink-0 flex-row items-start gap-3 px-4 pb-3 pt-4 text-left">
            <div className="min-w-0 flex-1">
              <SheetTitle
                ref={titleRef}
                tabIndex={-1}
                className="break-words text-[17px] leading-tight tracking-[-0.01em] outline-none"
              >
                {title}
              </SheetTitle>
              <SheetDescription className="mt-0.5 break-words text-[12px] leading-[1.45]">
                {description}
              </SheetDescription>
            </div>
            <div className="mt-0.5 shrink-0">{headerEnd}</div>
          </SheetHeader>
          {editorBody}
          {previewAction ? (
            <div className="atelier-section-editor-footer mt-0 shrink-0 border-t border-[var(--atelier-border-soft)] bg-[var(--atelier-paper)] px-4 py-3">
              {previewAction}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer
      open={open}
      onOpenChange={handleOpenChange}
      autoFocus
      handleOnly
      repositionInputs={false}
    >
      <DrawerContent
        onOpenAutoFocus={handleOpenAutoFocus}
        onCloseAutoFocus={handleCloseAutoFocus}
        overlayClassName="!z-[70] bg-[rgba(23,22,20,0.4)]"
        className="website-atelier atelier-section-editor-sheet atelier-section-editor-drawer !z-[71] !h-[85dvh] !max-h-[85dvh] gap-0 overflow-hidden rounded-t-[18px] border-x-0 border-b-0 border-[var(--atelier-border)] !bg-[var(--atelier-paper)] px-0 pb-0 text-[var(--atelier-ink)] outline-none"
      >
        <DrawerHeader className="shrink-0 flex-row items-start gap-3 px-4 pb-3 pt-4 text-left">
          <div className="min-w-0 flex-1">
            <DrawerTitle
              ref={titleRef}
              tabIndex={-1}
              className="break-words text-left text-[17px] leading-tight tracking-[-0.01em] outline-none"
            >
              {title}
            </DrawerTitle>
            <DrawerDescription className="mt-0.5 break-words text-left text-[12px] leading-[1.45]">{description}</DrawerDescription>
          </div>
          <div data-vaul-no-drag="" className="mt-0.5 shrink-0">{headerEnd}</div>
        </DrawerHeader>
        {editorBody}
        {previewAction ? (
          <DrawerFooter data-vaul-no-drag="" className="atelier-section-editor-footer mt-0 shrink-0 gap-0 border-t border-[var(--atelier-border-soft)] bg-[var(--atelier-paper)] px-4 py-3">
            {previewAction}
          </DrawerFooter>
        ) : null}
      </DrawerContent>
    </Drawer>
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
