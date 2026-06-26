import { useTranslation } from "react-i18next";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ChevronRight, Pin } from "lucide-react";
import { cn } from "../../../../../shared/lib/utils";
import { Switch } from "../../../../../shared/components/ui/switch";
import type { SectionEntry } from "../../../types";
import type { SectionMeta } from "./sectionCatalog";
import { InfoPulse } from "./InfoHint";

interface SectionCardProps {
  entry: SectionEntry;
  meta: SectionMeta | null;
  /** 1-based position, set as the editorial index (01, 02, …) in the left margin. */
  index: number;
  expanded?: boolean;
  /** Pinned to the top (announcement): not draggable; the grip becomes a static pin indicator. */
  locked?: boolean;
  /** A pulsing Info cue beside the name — set when this section has a mandatory field still empty. */
  needsAttention?: boolean;
  onSelect: () => void;
  onToggleVisible: () => void;
}

/**
 * One row of the page contents — a mono index in the left margin, the section name across the spine,
 * and the show/hide switch at the trailing edge. Reorder grip and chevron stay receded until the row
 * is hovered or opened. The whole row is the expand target; the grip and switch opt back in on top.
 */
export function SectionCard({
  entry,
  meta,
  index,
  expanded,
  locked,
  needsAttention,
  onSelect,
  onToggleVisible,
}: SectionCardProps) {
  const { t } = useTranslation("marketplace");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.type,
    disabled: locked,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  };

  const label = meta ? t(meta.labelKey) : entry.type;
  const live = entry.visible;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/row relative",
        isDragging && "z-20 rounded-md bg-surface shadow-elevated-card",
      )}
    >
      {/* The whole row is the expand target (peer); content sits above it and scales subtly on press. */}
      <button
        type="button"
        onClick={onSelect}
        aria-expanded={!!expanded}
        aria-label={label}
        className="peer absolute inset-0 z-0 rounded-[2px] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60"
      />

      <div
        className={cn(
          "pointer-events-none relative z-[1] grid min-h-[54px] grid-cols-[30px_42px_minmax(0,1fr)_auto] items-center",
          "origin-center transition-transform duration-150 ease-out motion-safe:peer-active:scale-[0.997]",
        )}
      >
        {/* reorder grip (or static pin when locked) — far left, ahead of the index */}
        {locked ? (
          <span
            className="col-start-1 grid h-11 w-[26px] place-items-center justify-self-center text-foreground-3 opacity-40"
            role="img"
            aria-label={t("businessPage.builder.card.pinned")}
            title={t("businessPage.builder.card.pinned")}
          >
            <Pin className="size-[14px]" strokeWidth={1.6} aria-hidden />
          </span>
        ) : (
          <button
            type="button"
            aria-label={t("businessPage.builder.card.drag")}
            className={cn(
              "pointer-events-auto col-start-1 grid h-11 w-[26px] cursor-grab touch-none place-items-center justify-self-center rounded-md text-foreground-3 outline-none",
              "opacity-50 transition-[opacity,color] duration-200",
              "hover:text-foreground-1 hover:opacity-100 active:cursor-grabbing",
              "focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60",
              "sm:opacity-0 sm:group-hover/row:opacity-[0.85]",
            )}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-[18px]" strokeWidth={1.6} aria-hidden />
          </button>
        )}

        {/* index — sits left of the spine */}
        <span
          className={cn(
            "col-start-2 justify-self-end pr-[11px] font-mono text-[13px] tabular-nums transition-colors duration-200",
            expanded
              ? "text-primary-700 dark:text-primary-400"
              : live
                ? "text-foreground-3"
                : "text-foreground-disabled",
          )}
          aria-hidden
        >
          {String(index).padStart(2, "0")}
        </span>

        {/* name — right of the spine */}
        <span className="col-start-3 flex min-w-0 items-center py-2.5 pl-[15px]">
          <span
            className={cn(
              "min-w-0 truncate text-[16px] font-[450] tracking-[-0.008em] transition-colors duration-200",
              live ? "text-foreground-1" : "text-foreground-disabled",
            )}
          >
            {label}
          </span>
          {needsAttention && (
            <span className="ml-2 shrink-0">
              <InfoPulse />
            </span>
          )}
        </span>

        {/* trailing cluster: chevron · switch */}
        <div className="col-start-4 flex items-center gap-0.5 pr-4">
          <ChevronRight
            className={cn(
              "size-[18px] text-foreground-3 transition-[transform,opacity,color] duration-200",
              expanded
                ? "rotate-90 text-primary opacity-100"
                : "opacity-50 sm:-translate-x-[3px] sm:opacity-0 sm:group-hover/row:translate-x-0 sm:group-hover/row:opacity-100",
            )}
            strokeWidth={1.6}
            aria-hidden
          />
          <span className="pointer-events-auto ml-1.5">
            <Switch
              checked={entry.visible}
              onCheckedChange={onToggleVisible}
              aria-label={
                live ? t("businessPage.builder.card.hide") : t("businessPage.builder.card.show")
              }
            />
          </span>
        </div>
      </div>

      {/* open — accent baseline rule, drawn from the spine to the trailing edge */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute bottom-0 left-[72px] right-4 z-[1] h-[1.5px] origin-left rounded-full bg-primary",
          "transition-transform duration-[340ms] ease-[var(--ease-out-strong)]",
          expanded ? "scale-x-100" : "scale-x-0",
        )}
      />
    </div>
  );
}

export default SectionCard;
