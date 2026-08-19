import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Check,
  GripVertical,
  Images,
  MoreHorizontal,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Badge } from "../../../../shared/components/ui/badge";
import { Button } from "../../../../shared/components/ui/button";
import { Progress } from "../../../../shared/components/ui/progress";
import { Switch } from "../../../../shared/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../shared/components/ui/dropdown-menu";
import { modalHelperSmall } from "../../../../shared/components/ui/modal-tokens";
import { cn } from "../../../../shared/lib/utils";
import { OptionalCopyOverride } from "./OptionalCopyOverride";
import { localeCopyIsHidden, setLocaleCopyHidden } from "./copyBlankState";
import {
  autoFillGalleryImageRefs,
  collectGalleryImages,
  currentGalleryImageRefs,
  DEFAULT_GALLERY_IMAGES,
  galleryImageRefId,
  MAX_GALLERY_IMAGES,
  MIN_GALLERY_IMAGES,
  resolveGalleryImages,
  type ResolvedGalleryImage,
} from "./gallerySelection";
import type {
  GalleryConfig,
  GalleryImageRef,
  WebsiteBuilderLocation,
} from "../../types";
import type { WebsiteDraftIssue } from "./draftValidation";

interface GalleryEditorProps {
  config: GalleryConfig;
  locations: WebsiteBuilderLocation[];
  locale: "en" | "ro";
  onConfigChange: (patch: Partial<GalleryConfig>) => void;
  blockingIssues?: WebsiteDraftIssue[];
}

const GALLERY_LIBRARY_BENTO_CLASSES = [
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-2 row-span-1",
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-2 row-span-1",
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-2 row-span-1",
  "col-span-1 row-span-1",
] as const;

function getGalleryLibraryBentoClass(index: number): string {
  return GALLERY_LIBRARY_BENTO_CLASSES[index % GALLERY_LIBRARY_BENTO_CLASSES.length]
    ?? "col-span-1 row-span-1";
}

function SortableGalleryImage({
  image,
  index,
  total,
  showLocationName,
  onMove,
  onRemove,
}: {
  image: ResolvedGalleryImage;
  index: number;
  total: number;
  showLocationName: boolean;
  onMove: (from: number, to: number) => void;
  onRemove: (image: ResolvedGalleryImage) => void;
}) {
  const { t } = useTranslation("website");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
    transition: { duration: 180, easing: "ease-out" },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex min-w-0 items-center gap-2 rounded-lg border border-border bg-surface px-1.5 py-1.5",
        isDragging && "relative z-20 shadow-md",
      )}
    >
      <button
        type="button"
        data-vaul-no-drag=""
        className="grid size-11 shrink-0 touch-none cursor-grab place-items-center rounded-md text-foreground-3 outline-none transition-colors duration-150 hover:bg-surface-hover hover:text-foreground-1 active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-ring/60"
        aria-label={t("businessPage.builder.settings.gallery.reorderImage", { number: index + 1 })}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" strokeWidth={1.8} aria-hidden />
      </button>
      <img
        src={image.src}
        alt=""
        loading="lazy"
        decoding="async"
        className="size-11 shrink-0 rounded-md object-cover"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] font-medium text-foreground-1">
          {image.alt || t("businessPage.builder.settings.gallery.untitledImage")}
        </span>
        <span className="mt-0.5 block truncate text-[10px] text-foreground-3">
          {index + 1} / {total}
          {showLocationName ? ` · ${image.locationName}` : null}
        </span>
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="grid size-11 shrink-0 place-items-center rounded-md text-foreground-3 outline-none transition-colors duration-150 hover:bg-surface-hover hover:text-foreground-1 focus-visible:ring-2 focus-visible:ring-ring/60"
            aria-label={t("businessPage.builder.settings.gallery.imageActions", { number: index + 1 })}
          >
            <MoreHorizontal className="size-4" strokeWidth={1.8} aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-[72] min-w-44">
          <DropdownMenuItem disabled={index === 0} onSelect={() => onMove(index, index - 1)}>
            <ArrowUp className="size-4" strokeWidth={1.8} aria-hidden />
            {t("businessPage.builder.settings.gallery.moveEarlier")}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={index === total - 1} onSelect={() => onMove(index, index + 1)}>
            <ArrowDown className="size-4" strokeWidth={1.8} aria-hidden />
            {t("businessPage.builder.settings.gallery.moveLater")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onRemove(image)} className="text-destructive focus:text-destructive">
            <Trash2 className="size-4" strokeWidth={1.8} aria-hidden />
            {t("businessPage.builder.settings.gallery.removeImage")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** Curated website Gallery sourced from the business's per-location portfolio library. */
export function GalleryEditor({
  config,
  locations,
  locale,
  onConfigChange,
  blockingIssues = [],
}: GalleryEditorProps) {
  const { t } = useTranslation("website");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const allLocationIds = locations.map((location) => location.id);
  const includedIds = new Set(config.includedLocationIds ?? allLocationIds);
  const selectedImages = resolveGalleryImages(config, locations);
  const selectedRefs = selectedImages.map((image) => image.ref);
  const selectedIds = new Set(selectedImages.map((image) => image.id));
  const availableImages = collectGalleryImages(locations, config);
  const autoFillRefs = autoFillGalleryImageRefs(locations, config, DEFAULT_GALLERY_IMAGES);
  const autoFillCount = autoFillRefs.length;
  const showRecommendation =
    selectedImages.length >= MIN_GALLERY_IMAGES &&
    selectedImages.length < DEFAULT_GALLERY_IMAGES &&
    availableImages.length >= DEFAULT_GALLERY_IMAGES;
  const showLocationPicker =
    locations.length !== 1 || !includedIds.has(locations[0].id);
  const managePhotosPath = locations.length === 1
    ? `/marketplace?tab=locations&locationId=${locations[0].id}`
    : "/marketplace?tab=locations";
  const headingError = blockingIssues.find(
    (issue) => issue.controlId === "gallery-heading" && (!issue.locale || issue.locale === locale),
  )?.message;

  const setHeading = (value: string) => {
    const current = config.heading ?? { en: "", ro: "" };
    const next = { ...current, [locale]: value };
    const hasOverride = next.en.trim() !== "" || next.ro.trim() !== "";
    onConfigChange({ heading: hasOverride ? next : undefined });
  };
  const setHeadingBlank = (blank: boolean) => onConfigChange({
    headingHidden: setLocaleCopyHidden(config.headingHidden, locale, blank),
  });

  const commitRefs = (refs: GalleryImageRef[]) => onConfigChange({ imageRefs: refs.slice(0, MAX_GALLERY_IMAGES) });

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= selectedRefs.length || from === to) return;
    commitRefs(arrayMove(selectedRefs, from, to));
  };

  const removeImage = (image: ResolvedGalleryImage) => {
    commitRefs(selectedRefs.filter((ref) => galleryImageRefId(ref) !== image.id));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = selectedImages.findIndex((image) => image.id === active.id);
    const to = selectedImages.findIndex((image) => image.id === over.id);
    if (from >= 0 && to >= 0) moveImage(from, to);
  };

  const toggleLocation = (locationId: number, include: boolean) => {
    const next = new Set(includedIds);
    if (include) next.add(locationId);
    else next.delete(locationId);
    const nextIncluded = allLocationIds.filter((id) => next.has(id));
    const nextRefs = currentGalleryImageRefs(config, locations).filter((ref) => next.has(ref.locationId));
    onConfigChange({ includedLocationIds: nextIncluded, imageRefs: nextRefs });
  };

  const toggleImage = (image: ResolvedGalleryImage) => {
    if (selectedIds.has(image.id)) {
      removeImage(image);
      return;
    }
    if (selectedRefs.length >= MAX_GALLERY_IMAGES) return;
    commitRefs([...selectedRefs, image.ref]);
  };

  const autoFill = () => {
    commitRefs(autoFillRefs);
  };

  return (
    <div className="space-y-5">
      <p className={modalHelperSmall}>{t("businessPage.builder.settings.galleryHint")}</p>

      <OptionalCopyOverride
        idBase="gallery-heading"
        locale={locale}
        label={t("businessPage.builder.settings.headingLabel")}
        defaultText={t("businessPage.builder.preview.galleryHeading")}
        value={config.heading?.[locale] ?? ""}
        blank={localeCopyIsHidden(config.headingHidden, locale)}
        onChange={setHeading}
        onBlankChange={setHeadingBlank}
        maxLength={80}
        rows={2}
        externalError={headingError}
      />

      {showRecommendation ? (
        <section
          className="space-y-2.5 rounded-xl border border-border bg-surface-hover/50 px-3.5 py-3"
          aria-label={t("businessPage.builder.settings.gallery.recommendationAria", {
            current: selectedImages.length,
            recommended: DEFAULT_GALLERY_IMAGES,
          })}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <p className="font-mono text-[10px] font-semibold uppercase text-foreground-3">
                {t("businessPage.builder.settings.gallery.recommendationEyebrow")}
              </p>
              <h4 className="text-balance text-[13px] font-semibold text-foreground-1">
                {t("businessPage.builder.settings.gallery.recommendationTitle", {
                  count: DEFAULT_GALLERY_IMAGES,
                })}
              </h4>
              <p className="text-pretty text-[11.5px] leading-[1.55] text-foreground-3">
                {t("businessPage.builder.settings.gallery.recommendationBody", {
                  minimum: MIN_GALLERY_IMAGES,
                  recommended: DEFAULT_GALLERY_IMAGES,
                  maximum: MAX_GALLERY_IMAGES,
                })}
              </p>
            </div>
            <span className="shrink-0 font-mono text-[11px] font-medium tabular-nums text-foreground-2">
              {selectedImages.length}/{DEFAULT_GALLERY_IMAGES}
            </span>
          </div>
          <Progress
            value={(selectedImages.length / DEFAULT_GALLERY_IMAGES) * 100}
            className="h-1 bg-border [&>div]:bg-foreground-2"
            aria-label={t("businessPage.builder.settings.gallery.recommendationProgress", {
              current: selectedImages.length,
              minimum: MIN_GALLERY_IMAGES,
              recommended: DEFAULT_GALLERY_IMAGES,
              maximum: MAX_GALLERY_IMAGES,
            })}
          />
        </section>
      ) : null}

      {showLocationPicker ? (
        <section className="space-y-3 border-t border-border-subtle pt-5">
          <div>
            <h4 className="text-[12px] font-semibold text-foreground-1">
              {t("businessPage.builder.settings.gallery.locationsTitle")}
            </h4>
            <p className="mt-1 text-[11px] leading-relaxed text-foreground-3">
              {t("businessPage.builder.settings.gallery.locationsHint")}
            </p>
          </div>
          {locations.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-[11px] text-foreground-3">
              {t("businessPage.builder.settings.locationsNone")}
            </p>
          ) : (
            <div className="space-y-1.5">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-medium text-foreground-1">{location.name}</span>
                    <span className="mt-0.5 block text-[10px] text-foreground-3">
                      {t("businessPage.builder.settings.gallery.locationPhotos", {
                        count: location.portfolioImages?.length ?? 0,
                      })}
                    </span>
                  </span>
                  <Switch
                    data-gallery-location-source
                    checked={includedIds.has(location.id)}
                    onCheckedChange={(checked) => toggleLocation(location.id, checked)}
                    aria-label={t("businessPage.builder.settings.gallery.includeLocation", { name: location.name })}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      <section className="space-y-3 border-t border-border-subtle pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-[12px] font-semibold text-foreground-1">
              {t("businessPage.builder.settings.gallery.selectedTitle")}
            </h4>
            <p className="mt-1 text-[11px] leading-relaxed text-foreground-3">
              {t("businessPage.builder.settings.gallery.selectedCount", {
                count: selectedImages.length,
                max: MAX_GALLERY_IMAGES,
              })}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            rounded="default"
            onClick={autoFill}
            disabled={autoFillCount === 0}
          >
            <RefreshCw className="size-3.5" strokeWidth={1.8} aria-hidden />
            {t("businessPage.builder.settings.gallery.autoFill", { count: autoFillCount })}
          </Button>
        </div>

        {selectedImages.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-3 py-5 text-center">
            <Images className="mx-auto size-5 text-foreground-3" strokeWidth={1.5} aria-hidden />
            <p className="mt-2 text-[11px] text-foreground-3">
              {t("businessPage.builder.settings.gallery.selectedEmpty")}
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={selectedImages.map((image) => image.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1.5">
                {selectedImages.map((image, index) => (
                  <SortableGalleryImage
                    key={image.id}
                    image={image}
                    index={index}
                    total={selectedImages.length}
                    showLocationName={locations.length > 1}
                    onMove={moveImage}
                    onRemove={removeImage}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </section>

      <section
        id="gallery-photo-library"
        className="space-y-4 border-t border-border-subtle pt-5"
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-[180px] flex-1">
              <h4 className="text-[12px] font-semibold text-foreground-1">
                {t("businessPage.builder.settings.gallery.libraryTitle")}
              </h4>
              <p className="mt-1 max-w-[42ch] text-[11px] leading-relaxed text-foreground-3">
                {t("businessPage.builder.settings.gallery.libraryHint")}
              </p>
            </div>
            <Link
              id="gallery-manage-photos"
              to={managePhotosPath}
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-[11px] font-semibold text-foreground-1 outline-none transition-[border-color,background-color,transform] duration-150 ease-out hover:border-border-strong hover:bg-surface-hover active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring/70"
            >
              {t("businessPage.builder.settings.gallery.managePhotos")}
              <ArrowUpRight className="size-3.5" strokeWidth={1.8} aria-hidden />
            </Link>
          </div>

          <div className="flex items-center gap-3" aria-hidden="true">
            <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-hover">
              <span
                className="block h-full rounded-full bg-foreground-1 transition-[width] duration-300 ease-out"
                style={{ width: `${(selectedImages.length / MAX_GALLERY_IMAGES) * 100}%` }}
              />
            </span>
            <span className="shrink-0 font-mono text-[10px] font-semibold tabular-nums text-foreground-3">
              {selectedImages.length}/{MAX_GALLERY_IMAGES}
            </span>
          </div>
        </div>

        {availableImages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface-hover/35 px-4 py-6 text-center">
            <Images className="mx-auto size-5 text-foreground-3" strokeWidth={1.5} aria-hidden />
            <p className="mt-2 text-[11px] text-foreground-3">
              {t("businessPage.builder.settings.gallery.libraryEmpty")}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {locations
              .filter((location) => includedIds.has(location.id))
              .map((location) => {
                const images = collectGalleryImages([location]);
                if (images.length === 0) return null;
                const locationSelectedCount = images.filter((image) => selectedIds.has(image.id)).length;
                return (
                  <div key={location.id} className="space-y-2.5">
                    {locations.length > 1 ? (
                      <div className="flex min-w-0 items-end justify-between gap-3 border-b border-border-subtle pb-2">
                        <span className="min-w-0">
                          <span className="block truncate text-[11px] font-semibold text-foreground-1">
                            {location.name}
                          </span>
                          <span className="mt-0.5 block text-[10px] text-foreground-3">
                            {t("businessPage.builder.settings.gallery.locationPhotos", { count: images.length })}
                          </span>
                        </span>
                        <span className="shrink-0 font-mono text-[9px] font-semibold tabular-nums text-foreground-3">
                          {t("businessPage.builder.settings.gallery.selectedCount", {
                            count: locationSelectedCount,
                            max: images.length,
                          })}
                        </span>
                      </div>
                    ) : null}
                    <div className="grid auto-rows-[118px] grid-cols-2 gap-2 min-[520px]:auto-rows-[136px]">
                      {images.map((image, imageIndex) => {
                        const selected = selectedIds.has(image.id);
                        const disabled = !selected && selectedImages.length >= MAX_GALLERY_IMAGES;
                        return (
                          <button
                            key={image.id}
                            data-gallery-image-option
                            type="button"
                            aria-pressed={selected}
                            aria-label={
                              selected
                                ? t("businessPage.builder.settings.gallery.deselectImage", {
                                    name: image.alt || location.name,
                                  })
                                : t("businessPage.builder.settings.gallery.selectImage", {
                                    name: image.alt || location.name,
                                  })
                            }
                            disabled={disabled}
                            onClick={() => toggleImage(image)}
                            className={cn(
                              "group relative overflow-hidden rounded-xl bg-surface outline-none",
                              "shadow-[0_1px_3px_rgba(0,0,0,0.10)] transition-[opacity,transform,box-shadow] duration-150 ease-out hover:shadow-md active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-foreground-1/60 focus-visible:ring-offset-2",
                              getGalleryLibraryBentoClass(imageIndex),
                              disabled && "cursor-not-allowed opacity-40",
                            )}
                          >
                            <img
                              src={image.src}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              className="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.035]"
                            />
                            {image.featured ? (
                              <Badge
                                variant="secondary"
                                className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50/90 px-2 py-0.5 text-[10px] font-bold text-neutral-900 shadow-sm backdrop-blur-sm"
                              >
                                <span className="size-1.5 rounded-full bg-purple-500" aria-hidden />
                                {t("businessPage.builder.settings.gallery.featured")}
                              </Badge>
                            ) : null}
                            {selected ? (
                              <span className="absolute right-2 top-2 z-10 grid size-7 place-items-center rounded-full bg-white text-neutral-900 shadow-md ring-1 ring-black/10">
                                <Check className="size-4" strokeWidth={2.5} aria-hidden />
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default GalleryEditor;
