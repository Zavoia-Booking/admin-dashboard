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
  GripVertical,
  Images,
  MoreHorizontal,
  PencilLine,
  RotateCcw,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Switch } from "../../../../shared/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../../shared/components/ui/dropdown-menu";
import { modalHelperSmall } from "../../../../shared/components/ui/modal-tokens";
import { cn } from "../../../../shared/lib/utils";
import type { LocationsConfig, WebsiteBuilderLocation } from "../../types";
import { resolveOrderedLocations } from "./locationSelection";

interface LocationsEditorProps {
  config: LocationsConfig;
  locations: WebsiteBuilderLocation[];
  onConfigChange: (patch: Partial<LocationsConfig>) => void;
  /** `restoreConfig` reverts this cascade's config change when the section-off toast is undone. */
  onTurnOffSection: (restoreConfig?: Record<string, unknown>) => void;
  selectedPreviewLocationId?: number | null;
  onPreviewLocationSelect?: (locationId: number) => void;
}

function SortableLocationRow({
  location,
  index,
  total,
  visibleIndex,
  visibleTotal,
  shown,
  canReorder,
  previewSelected,
  onMove,
  onVisibilityChange,
  onPreviewLocationSelect,
  onEditLocation,
  onManageLocationContent,
}: {
  location: WebsiteBuilderLocation;
  index: number;
  total: number;
  visibleIndex: number | null;
  visibleTotal: number;
  shown: boolean;
  canReorder: boolean;
  previewSelected: boolean;
  onMove: (from: number, to: number) => void;
  onVisibilityChange: (id: number, shown: boolean) => void;
  onPreviewLocationSelect?: (id: number) => void;
  onEditLocation: (id: number) => void;
  onManageLocationContent: (id: number) => void;
}) {
  const { t } = useTranslation("website");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: location.id,
    disabled: !canReorder,
    transition: { duration: 180, easing: "ease-out" },
  });
  const detail = location.addressComponents?.city?.trim() || location.address?.trim();
  const positionDescriptionId = `website-location-position-${location.id}`;
  const content = (
    <>
      <span
        className={cn(
          "block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[12px] font-medium text-foreground-1",
          !shown && "text-foreground-3",
        )}
        title={location.name}
      >
        {location.name}
      </span>
      {canReorder || detail ? (
        <span className="mt-0.5 flex min-w-0 items-center gap-1.5">
          {canReorder ? (
            shown && visibleIndex !== null ? (
              <>
                <span
                  className="shrink-0 font-mono text-[9px] tabular-nums text-foreground-3"
                  aria-hidden
                >
                  {String(visibleIndex + 1).padStart(2, "0")}
                </span>
                <span id={positionDescriptionId} className="sr-only">
                  {t("businessPage.builder.settings.locationPosition", {
                    current: visibleIndex + 1,
                    total: visibleTotal,
                  })}
                </span>
              </>
            ) : (
              <span className="shrink-0 text-[9px] font-semibold text-foreground-3/70">
                {t("businessPage.builder.settings.locationHidden")}
              </span>
            )
          ) : null}
          {detail ? (
            <span
              className={cn(
                "min-w-0 truncate text-[10px] text-foreground-3",
                !shown && "text-foreground-3/55",
              )}
            >
              {detail}
            </span>
          ) : null}
        </span>
      ) : null}
    </>
  );

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex min-w-0 items-center gap-1 rounded-lg border border-border bg-surface px-1.5 py-1.5 transition-[border-color,background-color,box-shadow] duration-150",
        "hover:border-border-strong",
        previewSelected && "border-border-strong bg-surface-hover/65",
        !shown && "bg-surface-hover/45",
        isDragging && "relative z-20 border-border-strong shadow-md",
      )}
    >
      {canReorder ? (
        <button
          type="button"
          className="grid size-11 shrink-0 touch-none cursor-grab place-items-center rounded-md text-foreground-3 outline-none transition-colors duration-150 hover:bg-surface-hover hover:text-foreground-1 active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-ring/60"
          aria-label={t("businessPage.builder.settings.locationReorder", { name: location.name })}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" strokeWidth={1.8} aria-hidden />
        </button>
      ) : null}

      {shown && onPreviewLocationSelect ? (
        <button
          type="button"
          className="w-0 min-w-0 flex-1 rounded-md px-1.5 py-1 text-left outline-none transition-colors duration-150 hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring/60"
          onClick={() => onPreviewLocationSelect(location.id)}
          aria-label={t("businessPage.builder.settings.locationPreview", { name: location.name })}
          aria-describedby={canReorder ? positionDescriptionId : undefined}
          aria-pressed={previewSelected}
        >
          {content}
        </button>
      ) : (
        <span className="w-0 min-w-0 flex-1 px-1.5 py-1">{content}</span>
      )}

      <Switch
        className="mx-1"
        aria-label={t("businessPage.builder.settings.locationVisibility", { name: location.name })}
        checked={shown}
        onCheckedChange={(checked) => onVisibilityChange(location.id, checked)}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="grid size-11 shrink-0 place-items-center rounded-md text-foreground-3 outline-none transition-colors duration-150 hover:bg-surface-hover hover:text-foreground-1 focus-visible:ring-2 focus-visible:ring-ring/60"
            aria-label={t("businessPage.builder.settings.locationActions", { name: location.name })}
          >
            <MoreHorizontal className="size-4" strokeWidth={1.8} aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-[72] min-w-56">
          <DropdownMenuItem onSelect={() => onEditLocation(location.id)}>
            <PencilLine className="size-4" strokeWidth={1.8} aria-hidden />
            {t("businessPage.builder.settings.locationEditDetails")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onManageLocationContent(location.id)}>
            <Images className="size-4" strokeWidth={1.8} aria-hidden />
            {t("businessPage.builder.settings.locationManageContent")}
          </DropdownMenuItem>
          {canReorder ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={index === 0} onSelect={() => onMove(index, index - 1)}>
                <ArrowUp className="size-4" strokeWidth={1.8} aria-hidden />
                {t("businessPage.builder.settings.locationMoveEarlier")}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={index === total - 1}
                onSelect={() => onMove(index, index + 1)}
              >
                <ArrowDown className="size-4" strokeWidth={1.8} aria-hidden />
                {t("businessPage.builder.settings.locationMoveLater")}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * Locations section settings from the design source: display order and visibility. The layout itself remains
 * the section variant picker; amenity-capable layouts always use their designed icon-row treatment.
 */
export function LocationsEditor({
  config,
  locations,
  onConfigChange,
  onTurnOffSection,
  selectedPreviewLocationId,
  onPreviewLocationSelect,
}: LocationsEditorProps) {
  const { t } = useTranslation("website");
  const navigate = useNavigate();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const orderedLocations = resolveOrderedLocations(config, locations);
  const hidden = new Set(config.hiddenLocationIds ?? []);
  const canReorder = orderedLocations.length > 1;
  const visibleLocations = orderedLocations.filter((location) => !hidden.has(location.id));
  const visibleIndexById = new Map(
    visibleLocations.map((location, index) => [location.id, index]),
  );
  const effectivePreviewLocationId = selectedPreviewLocationId === undefined
    ? visibleLocations[0]?.id ?? null
    : selectedPreviewLocationId;
  const hasCustomOrder = orderedLocations.some(
    (location, index) => location.id !== locations[index]?.id,
  );

  const commitOrder = (next: WebsiteBuilderLocation[]) => {
    onConfigChange({ orderedLocationIds: next.map((location) => location.id) });
  };

  const moveLocation = (from: number, to: number) => {
    if (to < 0 || to >= orderedLocations.length || from === to) return;
    commitOrder(arrayMove(orderedLocations, from, to));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = orderedLocations.findIndex((location) => location.id === active.id);
    const to = orderedLocations.findIndex((location) => location.id === over.id);
    if (from >= 0 && to >= 0) moveLocation(from, to);
  };

  const toggleLocation = (id: number, show: boolean) => {
    const next = new Set(hidden);
    if (show) next.delete(id);
    else next.add(id);
    onConfigChange({ hiddenLocationIds: Array.from(next) });
    // Hiding the last visible location turns the whole section off and collapses it. Undo must
    // also bring that location back — hand the pre-toggle hidden set to the section-off toast.
    if (!orderedLocations.some((location) => !next.has(location.id))) {
      onTurnOffSection({ hiddenLocationIds: Array.from(hidden) });
    }
  };

  const resetOrder = () => onConfigChange({ orderedLocationIds: [] });

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className={modalHelperSmall}>
          {t(
            canReorder
              ? "businessPage.builder.settings.locationsOrderHint"
              : "businessPage.builder.settings.locationsHint",
          )}
        </p>
        {orderedLocations.length > 0 ? (
          <div className="flex min-h-7 items-center justify-between gap-3">
            <span className="font-mono text-[9.5px] font-semibold tabular-nums text-foreground-3">
              {t("businessPage.builder.settings.locationsVisibilitySummary", {
                shown: visibleLocations.length,
                hidden: orderedLocations.length - visibleLocations.length,
              })}
            </span>
            {hasCustomOrder ? (
              <button
                type="button"
                onClick={resetOrder}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10.5px] font-semibold text-foreground-3 outline-none transition-[color,background-color,transform] duration-150 hover:bg-surface-hover hover:text-foreground-1 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-focus"
              >
                <RotateCcw className="size-3" strokeWidth={1.8} aria-hidden />
                {t("businessPage.builder.settings.locationsResetOrder")}
              </button>
            ) : null}
          </div>
        ) : null}
        {orderedLocations.length > 0 ? (
          <DndContext
            sensors={canReorder ? sensors : undefined}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={orderedLocations.map((location) => location.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1.5">
                {orderedLocations.map((location, index) => (
                  <SortableLocationRow
                    key={location.id}
                    location={location}
                    index={index}
                    total={orderedLocations.length}
                    visibleIndex={visibleIndexById.get(location.id) ?? null}
                    visibleTotal={visibleLocations.length}
                    shown={!hidden.has(location.id)}
                    canReorder={canReorder}
                    previewSelected={
                      !hidden.has(location.id) && effectivePreviewLocationId === location.id
                    }
                    onMove={moveLocation}
                    onVisibilityChange={toggleLocation}
                    onPreviewLocationSelect={onPreviewLocationSelect}
                    onEditLocation={(id) => navigate(`/locations?locationId=${id}`)}
                    onManageLocationContent={(id) =>
                      navigate(`/marketplace?tab=locations&locationId=${id}`)
                    }
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : null}
      </div>
    </div>
  );
}

export default LocationsEditor;
