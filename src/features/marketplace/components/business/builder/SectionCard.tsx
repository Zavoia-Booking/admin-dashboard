import { useTranslation } from "react-i18next";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ChevronRight, Pin, Lock, ShoppingCart } from "lucide-react";
import { cn } from "../../../../../shared/lib/utils";
import { Switch } from "../../../../../shared/components/ui/switch";
import type { SectionEntry } from "../../../types";
import type { SectionMeta } from "./sectionCatalog";

export type SectionCardStatusTone = "neutral" | "muted" | "warning" | "danger";

export interface SectionCardStatus {
  label: string;
  tone?: SectionCardStatusTone;
}

interface SectionCardProps {
  entry: SectionEntry;
  meta: SectionMeta | null;
  /** 1-based position, set as the editorial index (01, 02, …) in the left margin. */
  index: number;
  /** Short operational summary, e.g. “3 of 4 locations shown” or “12 photos”. */
  summary?: string;
  /** Calm row-level state: Hidden, Fixed, Needs content, No data. */
  status?: SectionCardStatus;
  expanded?: boolean;
  /** Fixed in the page order: not draggable; the grip gutter stays quiet. */
  locked?: boolean;
  /** Always shown (nav / hero / footer): visibility can't be toggled — the switch becomes a static label. */
  required?: boolean;
  /** A pulsing Info cue beside the name — set when this section has a mandatory field still empty. */
  needsAttention?: boolean;
  /** Paid section not yet unlocked: the switch becomes a lock/price button and every tap routes to the purchase dialog. */
  paidLocked?: boolean;
  /** Resolved unlock price label, shown on the lock button while paidLocked. */
  priceLabel?: string;
  /** The section unlock is queued in the shopping cart (swaps the lock icon). */
  inCart?: boolean;
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
  summary,
  status,
  expanded,
  locked,
  required,
  needsAttention,
  paidLocked,
  priceLabel,
  inCart,
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
  const statusTone = status?.tone ?? "neutral";

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
          "pointer-events-none relative z-[1] grid min-h-[58px] grid-cols-[34px_42px_minmax(0,1fr)_auto] items-center",
          "origin-center transition-[background-color,transform] duration-150 ease-out peer-hover:bg-surface-hover/50 motion-safe:peer-active:scale-[0.997]",
          expanded && "bg-surface-hover/60",
        )}
      >
        {/* reorder grip — far left, ahead of the index. Locked rows keep the same quiet gutter. */}
        {locked ? (
          <span
            className="col-start-1 h-11 w-[30px] justify-self-center"
            aria-hidden
          />
        ) : (
          <button
            type="button"
            aria-label={t("businessPage.builder.card.drag")}
            className={cn(
              "pointer-events-auto col-start-1 grid h-11 w-[30px] cursor-grab touch-none place-items-center justify-self-center rounded-md text-foreground-3 outline-none",
              "opacity-50 transition-[opacity,color] duration-200",
              "hover:text-foreground-1 hover:opacity-100 active:cursor-grabbing",
              "focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60",
              "sm:opacity-0 sm:group-hover/row:opacity-[0.85]",
            )}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-[22px]" strokeWidth={1.65} aria-hidden />
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

        {/* name + useful context — right of the spine */}
        <span className="col-start-3 flex min-w-0 flex-col justify-center gap-0.5 py-2.5 pl-[15px]">
          <span className="flex min-w-0 items-center">
            <span
              className={cn(
                "min-w-0 truncate text-[15px] font-medium tracking-[-0.006em] transition-colors duration-200",
                live ? "text-foreground-1" : "text-foreground-disabled",
              )}
            >
              {label}
            </span>
          </span>
          {summary && (
            <span
              className={cn(
                "min-w-0 truncate text-[12px] leading-none transition-colors duration-200",
                live ? "text-foreground-3" : "text-foreground-disabled",
              )}
            >
              {summary}
            </span>
          )}
        </span>

        {/* trailing cluster: chevron · switch */}
        <div className="col-start-4 flex items-center gap-2 pr-4">
          {status && (
            <span
              className={cn(
                "hidden max-w-[124px] truncate rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4 sm:inline-flex",
                statusTone === "danger" &&
                  "border-error-border bg-error-bg text-error",
                statusTone === "warning" &&
                  "border-warning-border bg-warning-bg text-warning",
                statusTone === "muted" &&
                  "border-border-subtle bg-surface-hover text-foreground-3",
                statusTone === "neutral" &&
                  "border-border-subtle bg-surface text-foreground-3",
              )}
            >
              {status.label}
            </span>
          )}
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
            {paidLocked ? (
              /* Locked paid section: a lock/price chip instead of the switch — tapping it
                 opens the purchase dialog (the parent routes onToggleVisible there). */
              <button
                type="button"
                onClick={onToggleVisible}
                aria-label={t("businessPage.paidVariants.lockedAria", { name: label, price: priceLabel ?? "" })}
                title={
                  inCart
                    ? t("businessPage.paidVariants.inCartTitle", { price: priceLabel ?? "" })
                    : t("businessPage.paidVariants.lockedTitle", { price: priceLabel ?? "" })
                }
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-hover px-2.5 py-1 text-[12px] font-medium text-foreground-2 outline-none",
                  "transition-[color,border-color,background-color,transform] duration-150 ease-out hover:border-border-strong hover:text-foreground-1 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-focus",
                )}
              >
                {inCart ? (
                  <ShoppingCart className="h-3 w-3 shrink-0 text-primary" strokeWidth={2} aria-hidden />
                ) : (
                  <Lock className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
                )}
                {priceLabel}
              </button>
            ) : (
              /* Required sections (nav/hero/footer) show the toggle on but locked — no off-brand text tag. */
              <Switch
                checked={entry.visible}
                disabled={required}
                onCheckedChange={onToggleVisible}
                aria-label={
                  required
                    ? t("businessPage.builder.card.alwaysOn")
                    : live
                      ? t("businessPage.builder.card.hide")
                      : t("businessPage.builder.card.show")
                }
              />
            )}
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
