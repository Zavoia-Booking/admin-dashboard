import { useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { useTranslation } from "react-i18next";
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
import { Monitor, Smartphone, ArrowUpRight } from "lucide-react";
import { cn } from "../../../../../shared/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../../../shared/components/ui/dialog";
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
} from "../../../types";
import { SECTION_META, isKnownSectionType, PINNED_TYPES, REQUIRED_TYPES } from "./sectionCatalog";
import { SectionCard } from "./SectionCard";
import { SettingsPanel } from "./SettingsPanel";
import { LivePreview, marqueeItems, MARQUEE_MIN_ITEMS, UNNUMBERED, type PreviewData, type PreviewReview, type RatingBars } from "./LivePreview";
import { AutoHeight } from "./AutoHeight";
import { useLocationTagDictionaries } from "../../../hooks/useLocationTagDictionaries";

/** House ease-out (mirrors --ease-out-strong in globals.css). */
const EASE = "ease-[cubic-bezier(0.23,1,0.32,1)]";

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
  // Sections are edited and previewed in the owner's app language (no language toggle).
  const locale: "en" | "ro" = i18n.language?.toLowerCase().startsWith("ro") ? "ro" : "en";
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  // Resolve the location-tag dictionaries once (session-cached fetch) and feed them into previewData so the
  // Locations section renders tags without its own authenticated fetch.
  const { dictionaries: tagDictionaries } = useLocationTagDictionaries();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Drag stays on the vertical axis and inside the section list (never floats out of the column).
  const listRef = useRef<HTMLDivElement | null>(null);
  const modifiers = useMemo(() => [restrictToVerticalAxis, restrictToContainer(listRef)], []);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = props.layout.findIndex((s) => s.type === active.id);
    const to = props.layout.findIndex((s) => s.type === over.id);
    if (from !== -1 && to !== -1) props.reorderSections(from, to);
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
  const displaySections = props.layout
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.type !== "marquee" || marqueeReady);

  const items = displaySections.map(({ entry }) => entry.type);
  const shown = displaySections.filter(({ entry }) => entry.visible).length;

  const renderSettings = (entry: SectionEntry, index: number) => {
    const meta = isKnownSectionType(entry.type) ? SECTION_META[entry.type] : null;
    const hasVariants = !!meta && meta.variants.length > 1;
    // The section's real "0N —" ordinal in the full page, so the scoped preview stays in sync with the rest.
    const previewNumber =
      props.layout.slice(0, index).filter((s) => s.visible && !UNNUMBERED.has(s.type)).length + 1;
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
              {/* Editor seam for future paid variants/skins: gate each `v` here by entitlement (e.g. a lock pill + upgrade prompt). */}
              {meta!.variants.map((v) => {
                const active = entry.variant === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => props.setSectionVariant(index, v.id)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-[12.5px] font-medium outline-none transition-[color,background-color,box-shadow,transform] duration-200 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring/50",
                      EASE,
                      active
                        ? "bg-surface text-primary-700 shadow-sm dark:text-primary-400"
                        : "text-foreground-3 hover:text-foreground-2",
                    )}
                  >
                    {t(v.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>
        )}
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
          onTurnOffSection={() => {
            if (entry.visible) props.toggleSectionVisible(index);
            setOpenType(null);
          }}
          onFaqChange={props.setFaqItems}
          onAnnouncementChange={props.setAnnouncementContent}
          onAboutChange={props.setAboutContent}
          onTaglineChange={props.setTagline}
        />
        </fieldset>
        <div className="border-t border-border pt-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-[5px] w-[5px] rounded-full bg-primary" aria-hidden />
            <span className="text-[11px] font-semibold uppercase text-foreground-3">
              {t("businessPage.builder.sectionPreview")}
            </span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-background">
            <LivePreview layout={[{ ...entry, visible: true }]} data={previewData} chrome={false} startNumber={previewNumber} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="overflow-hidden rounded-[1.5rem] border border-border bg-surface shadow-xs">
        <div className="px-5 py-5 sm:px-6 lg:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[12px] text-foreground-3">
                <span className="inline-flex items-center gap-2 font-medium text-foreground-2">
                  <span className="size-1.5 rounded-full bg-primary" aria-hidden />
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
              <h2 className="text-balance text-[23px] font-semibold leading-tight text-foreground-1 sm:text-[26px]">
                {t("businessPage.builder.studioTitle")}
              </h2>
              <p className="mt-1.5 max-w-[58ch] text-pretty text-sm leading-6 text-foreground-3">
                {t("businessPage.builder.studioHelper")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className={cn(
                "group inline-flex h-10 shrink-0 items-center gap-2 self-start rounded-full border border-border bg-surface-hover px-3.5 text-[13px] font-semibold text-foreground-2 outline-none",
                "transition-[transform,border-color,background-color] duration-150 hover:border-border-strong hover:bg-surface-active active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-focus",
                EASE,
              )}
            >
              {t("businessPage.builder.openPreview")}
              <span
                className={cn(
                  "grid size-6 place-items-center rounded-full bg-surface text-foreground-2 ring-1 ring-border-subtle",
                  "transition-[transform,color] duration-150 group-hover:text-foreground-1",
                  "group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-active:scale-95",
                  EASE,
                )}
              >
                <ArrowUpRight className="size-3.5" strokeWidth={1.7} aria-hidden />
              </span>
            </button>
          </div>
        </div>

        {/* brand band + section list, stacked full-width — the brand controls moved above the list so the
            list and each section's scoped preview get the whole module width */}
        <div className="border-t border-border">
          {/* brand band — above the list */}
          <div className="bg-surface px-5 py-4 sm:px-6 lg:px-7">{props.brandPanel}</div>

          {/* sections — the page contents, set as a ruled editorial index */}
          <div className="border-t border-border bg-surface-hover/35 px-5 py-5 sm:px-6 lg:px-7">
            <div className="mb-4 flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
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
                      const open = openType === entry.type;
                      return (
                        <Collapsible
                          key={entry.type}
                          open={open}
                          onOpenChange={(next) => setOpenType(next ? entry.type : null)}
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
                            expanded={open}
                            locked={PINNED_TYPES.has(entry.type)}
                            required={REQUIRED_TYPES.has(entry.type)}
                            needsAttention={
                              (entry.type === "about" && !!props.aboutError) ||
                              (entry.type === "announcement" && !!props.announcementError)
                            }
                            onSelect={() => setOpenType(open ? null : entry.type)}
                            onToggleVisible={() => {
                              const turningOn = !entry.visible;
                              // Re-enabling a locations section that has everything hidden restores all
                              // locations, so it can never be on with nothing to show.
                              if (turningOn && entry.type === "locations") {
                                const hiddenIds = (entry.config?.hiddenLocationIds as number[] | undefined) ?? [];
                                if (props.locations.length > 0 && props.locations.every((l) => hiddenIds.includes(l.id))) {
                                  props.setSectionConfig(index, { hiddenLocationIds: [] });
                                }
                              }
                              props.toggleSectionVisible(index);
                              // Expand a section when it's switched on; collapse it when switched off.
                              if (turningOn) setOpenType(entry.type);
                              else if (open) setOpenType(null);
                            }}
                          />
                          <CollapsibleContent>
                            <AutoHeight className="relative pb-6 pl-[72px] pr-4 pt-3 sm:pl-[87px]">
                              <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:duration-300 motion-safe:delay-75">
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
          </div>
        </div>

      </div>

      {/* fullscreen */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="flex max-h-[90vh] w-full max-w-[min(1280px,calc(100%-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(1280px,calc(100%-2rem))]">
          <DialogHeader className="flex flex-row items-center justify-between gap-2 space-y-0 border-b border-border p-4 pr-12 text-left">
            <DialogTitle className="flex items-center gap-2 text-[11px] font-semibold uppercase text-foreground-2">
              <span className="h-[5px] w-[5px] rounded-full bg-primary" aria-hidden />
              {t("businessPage.builder.previewLabel")}
            </DialogTitle>
            <div className="flex items-center gap-4 text-[12px]">
              <DeviceToggle device={device} setDevice={setDevice} t={t} />
            </div>
          </DialogHeader>
          <div className="overflow-y-auto bg-surface-hover dark:bg-neutral-900/40">
            <div className={cn("mx-auto", device === "mobile" ? "max-w-[390px] p-3" : "max-w-none")}>
              <LivePreview layout={props.layout} data={previewData} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------------------

function DeviceToggle({
  device,
  setDevice,
  t,
}: {
  device: "desktop" | "mobile";
  setDevice: (v: "desktop" | "mobile") => void;
  t: (k: string) => string;
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <button
        type="button"
        onClick={() => setDevice("desktop")}
        aria-label={t("businessPage.builder.deviceDesktop")}
        aria-pressed={device === "desktop"}
        className={cn(
          "transition-colors duration-150 ease-out",
          device === "desktop" ? "text-foreground-1" : "text-foreground-3 hover:text-foreground-2",
        )}
      >
        <Monitor className="size-[15px]" strokeWidth={1.5} />
      </button>
      <button
        type="button"
        onClick={() => setDevice("mobile")}
        aria-label={t("businessPage.builder.deviceMobile")}
        aria-pressed={device === "mobile"}
        className={cn(
          "transition-colors duration-150 ease-out",
          device === "mobile" ? "text-foreground-1" : "text-foreground-3 hover:text-foreground-2",
        )}
      >
        <Smartphone className="size-[15px]" strokeWidth={1.5} />
      </button>
    </span>
  );
}

export default SectionBuilder;
