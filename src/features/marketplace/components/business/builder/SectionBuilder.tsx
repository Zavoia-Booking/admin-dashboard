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
import { Monitor, Smartphone, ChevronUp, ChevronDown, ArrowUpRight } from "lucide-react";
import { cn } from "../../../../../shared/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../../../shared/components/ui/dialog";
import type {
  Business,
  SectionEntry,
  LocationWithAssignments,
  FaqItem,
  AnnouncementContent,
} from "../../../types";
import { SECTION_META, isKnownSectionType } from "./sectionCatalog";
import { SectionCard } from "./SectionCard";
import { SettingsPanel } from "./SettingsPanel";
import { LivePreview, type PreviewData, type PreviewReview } from "./LivePreview";

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
  const [locale, setLocale] = useState<"en" | "ro">(() =>
    i18n.language?.toLowerCase().startsWith("ro") ? "ro" : "en",
  );
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

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
    ],
  );

  const items = props.layout.map((s) => s.type);
  const shown = props.layout.filter((s) => s.visible).length;

  const renderSettings = (entry: SectionEntry, index: number) => {
    const meta = isKnownSectionType(entry.type) ? SECTION_META[entry.type] : null;
    const needsLocale = entry.type === "faq" || entry.type === "announcement";
    const canUp = index > 0;
    const canDown = index < props.layout.length - 1;
    const moveBtn =
      "rounded-md p-1 text-foreground-3 outline-none transition-colors duration-150 hover:text-foreground-1 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-30";
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-5">
            {meta &&
              meta.variants.length > 1 &&
              meta.variants.map((v) => {
                const active = entry.variant === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => props.setSectionVariant(index, v.id)}
                    className={cn(
                      "relative pb-1 text-[12.5px] font-medium outline-none transition-colors duration-200",
                      EASE,
                      active ? "text-foreground-1" : "text-foreground-3 hover:text-foreground-2",
                    )}
                  >
                    {t(v.labelKey)}
                    {active && <span className="absolute -bottom-px left-0 h-[2px] w-full bg-foreground-1" />}
                  </button>
                );
              })}
          </div>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              disabled={!canUp}
              onClick={() => props.reorderSections(index, index - 1)}
              aria-label={t("businessPage.builder.moveUp")}
              className={moveBtn}
            >
              <ChevronUp className="h-4 w-4" strokeWidth={1.6} />
            </button>
            <button
              type="button"
              disabled={!canDown}
              onClick={() => props.reorderSections(index, index + 1)}
              aria-label={t("businessPage.builder.moveDown")}
              className={moveBtn}
            >
              <ChevronDown className="h-4 w-4" strokeWidth={1.6} />
            </button>
          </div>
        </div>
        {needsLocale && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-foreground-3">
              {t("businessPage.builder.contentLanguage")}
            </span>
            <LangToggle locale={locale} setLocale={setLocale} />
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
          onFaqChange={props.setFaqItems}
          onAnnouncementChange={props.setAnnouncementContent}
          onAboutChange={props.setAboutContent}
          onTaglineChange={props.setTagline}
        />
        <div className="pt-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-[5px] w-[5px] rounded-full bg-primary" aria-hidden />
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-foreground-3">
              {t("businessPage.builder.sectionPreview")}
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <LivePreview layout={[{ ...entry, visible: true }]} data={previewData} chrome={false} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        {/* header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-5">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-foreground-3">
              {t("businessPage.builder.eyebrow")}
            </span>
            <h2 className="mt-1.5 text-[20px] font-semibold tracking-[-0.02em] text-foreground-1">
              {t("businessPage.builder.studioTitle")}
            </h2>
            <p className="mt-1 text-[13.5px] leading-relaxed text-foreground-3">
              {t("businessPage.builder.studioHelper")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className={cn(
              "group mt-1 inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-foreground-2",
              "transition-colors duration-150 hover:text-foreground-1",
              EASE,
            )}
          >
            {t("businessPage.builder.openPreview")}
            <ArrowUpRight
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              strokeWidth={1.7}
            />
          </button>
        </div>

        {/* sections | brand */}
        <div className="grid border-t border-border md:grid-cols-[1fr_320px]">
          {/* sections */}
          <div className="px-6 py-5 md:border-r md:border-border">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-foreground-3">
                {t("businessPage.builder.sectionsLabel")}
              </span>
              <span className="text-[12px] text-foreground-3">
                {t("businessPage.builder.sectionsShown", { shown, total: props.layout.length })}
              </span>
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={modifiers}
              onDragStart={() => setOpenType(null)}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={items} strategy={verticalListSortingStrategy}>
                <div ref={listRef} className="divide-y divide-border">
                  {props.layout.map((entry, index) => {
                    const open = openType === entry.type;
                    const card = (
                      <SectionCard
                        entry={entry}
                        meta={isKnownSectionType(entry.type) ? SECTION_META[entry.type] : null}
                        index={index + 1}
                        selected={open}
                        expanded={open}
                        onSelect={() => setOpenType(open ? null : entry.type)}
                        onToggleVisible={() => props.toggleSectionVisible(index)}
                      />
                    );
                    if (!open) return <div key={entry.type}>{card}</div>;
                    return (
                      <div key={entry.type} className="-mx-3 rounded-lg bg-surface-hover px-3">
                        {card}
                        <div
                          className={cn(
                            "border-t border-border/60 pb-5 pl-12 pt-4",
                            "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 duration-200",
                            EASE,
                          )}
                        >
                          {renderSettings(entry, index)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* brand */}
          <div className="px-6 py-5">{props.brandPanel}</div>
        </div>

      </div>

      {/* fullscreen */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="flex max-h-[90vh] w-full max-w-[min(1280px,calc(100%-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(1280px,calc(100%-2rem))]">
          <DialogHeader className="flex flex-row items-center justify-between gap-2 space-y-0 border-b border-border p-4 pr-12 text-left">
            <DialogTitle className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-foreground-2">
              <span className="h-[5px] w-[5px] rounded-full bg-primary" aria-hidden />
              {t("businessPage.builder.previewLabel")}
            </DialogTitle>
            <div className="flex items-center gap-4 text-[12px]">
              <LangToggle locale={locale} setLocale={setLocale} />
              <DeviceToggle device={device} setDevice={setDevice} t={t} />
            </div>
          </DialogHeader>
          <div className="overflow-y-auto bg-surface-hover dark:bg-neutral-900/40">
            <div className={cn("mx-auto", device === "mobile" ? "max-w-[390px] p-3" : "max-w-none")}>
              <LivePreview layout={props.layout} data={previewData} selectedType={openType} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------------------

function LangToggle({
  locale,
  setLocale,
}: {
  locale: "en" | "ro";
  setLocale: (v: "en" | "ro") => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={cn(
          "transition-colors duration-150",
          locale === "en" ? "font-medium text-foreground-1" : "text-foreground-3 hover:text-foreground-2",
        )}
      >
        EN
      </button>
      <span className="text-border-strong" aria-hidden>
        ·
      </span>
      <button
        type="button"
        onClick={() => setLocale("ro")}
        className={cn(
          "transition-colors duration-150",
          locale === "ro" ? "font-medium text-foreground-1" : "text-foreground-3 hover:text-foreground-2",
        )}
      >
        RO
      </button>
    </span>
  );
}

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
          "transition-colors duration-150",
          device === "desktop" ? "text-foreground-1" : "text-foreground-3 hover:text-foreground-2",
        )}
      >
        <Monitor className="h-[15px] w-[15px]" strokeWidth={1.5} />
      </button>
      <button
        type="button"
        onClick={() => setDevice("mobile")}
        aria-label={t("businessPage.builder.deviceMobile")}
        aria-pressed={device === "mobile"}
        className={cn(
          "transition-colors duration-150",
          device === "mobile" ? "text-foreground-1" : "text-foreground-3 hover:text-foreground-2",
        )}
      >
        <Smartphone className="h-[15px] w-[15px]" strokeWidth={1.5} />
      </button>
    </span>
  );
}

export default SectionBuilder;
