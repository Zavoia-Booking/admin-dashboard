import { useTranslation } from "react-i18next";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertTriangle, GripVertical } from "lucide-react";
import { cn } from "../../../../../shared/lib/utils";
import { Switch } from "../../../../../shared/components/ui/switch";
import type { SectionEntry } from "../../../types";
import type { SectionMeta } from "./sectionCatalog";

interface SectionCardProps {
  entry: SectionEntry;
  meta: SectionMeta | null;
  /** 1-based position, shown as the editorial index (01, 02, …) and a drag affordance. */
  index: number;
  selected: boolean;
  expanded?: boolean;
  onSelect: () => void;
  onToggleVisible: () => void;
}

/**
 * One editorial row in the section list: a drag handle, a position index + thin type icon, the name and
 * a quiet meta on the right, and a monochrome visibility toggle. Borderless — the list's hairlines and
 * the selected shade (owned by SectionBuilder) carry the structure. Reorder by dragging the handle or
 * with the ↑/↓ buttons in the open inspector.
 */
export function SectionCard({
  entry,
  meta,
  index,
  selected,
  expanded,
  onSelect,
  onToggleVisible,
}: SectionCardProps) {
  const { t } = useTranslation("marketplace");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.type,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  };

  const Icon = meta?.icon ?? AlertTriangle;
  const label = meta ? t(meta.labelKey) : entry.type;
  const variantLabel =
    meta && meta.variants.length > 1
      ? t(meta.variants.find((v) => v.id === entry.variant)?.labelKey ?? "")
      : "";
  const meta_right = selected
    ? t("businessPage.builder.card.editing")
    : !entry.visible
      ? t("businessPage.builder.card.hidden")
      : variantLabel || t("businessPage.builder.card.edit");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("group flex items-center gap-2.5 px-3 py-3", isDragging && "opacity-90")}
    >
      {/* drag handle */}
      <button
        type="button"
        aria-label={t("businessPage.builder.card.drag")}
        className={cn(
          "shrink-0 cursor-grab touch-none rounded-md p-0.5 text-foreground-3/60 outline-none",
          "transition-colors duration-150 hover:text-foreground-1 focus-visible:ring-2 focus-visible:ring-ring/50 active:cursor-grabbing",
        )}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden />
      </button>

      {/* index + icon + name + meta = open settings */}
      <button
        type="button"
        onClick={onSelect}
        aria-expanded={!!expanded}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <span
          className={cn(
            "w-5 text-right text-[12px] font-medium tabular-nums transition-colors duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
            selected ? "text-primary" : "text-foreground-3",
          )}
        >
          {String(index).padStart(2, "0")}
        </span>
        <span
          className={cn(
            "shrink-0 transition-colors duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
            selected ? "text-foreground-1" : "text-foreground-3",
            !entry.visible && !selected && "opacity-60",
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
        </span>
        <span
          className={cn(
            "truncate text-[14px] transition-colors duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
            selected
              ? "font-semibold text-foreground-1"
              : entry.visible
                ? "font-medium text-foreground-1"
                : "font-medium text-foreground-3",
          )}
        >
          {label}
        </span>
        <span className="ml-auto shrink-0 text-[12px] text-foreground-3">{meta_right}</span>
      </button>

      {/* visibility — monochrome (ink), not the app's accent switch */}
      <Switch
        checked={entry.visible}
        onCheckedChange={onToggleVisible}
        aria-label={
          entry.visible ? t("businessPage.builder.card.hide") : t("businessPage.builder.card.show")
        }
        className="data-[state=checked]:!bg-foreground-1"
      />
    </div>
  );
}

export default SectionCard;
