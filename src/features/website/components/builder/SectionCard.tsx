import { useTranslation } from "react-i18next";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, ChevronRight, GripVertical, Lock, LockOpen, MoreHorizontal } from "lucide-react";
import { cn } from "../../../../shared/lib/utils";
import { Switch } from "../../../../shared/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../shared/components/ui/dropdown-menu";
import type { SectionEntry } from "../../types";
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
  /** Stored by a newer section registry: visible for continuity, but never editable here. */
  readOnly?: boolean;
  /** Always shown (nav / hero / footer): visibility can't be toggled — the switch becomes a static label. */
  required?: boolean;
  /** A pulsing Info cue beside the name — set when this section has a mandatory field still empty. */
  needsAttention?: boolean;
  /** Paid section not yet unlocked: the switch becomes a lock/price button and every tap routes to the purchase dialog. */
  paidLocked?: boolean;
  /** Resolved unlock price label, shown on the lock button while paidLocked. */
  priceLabel?: string;
  /** Native (Capacitor) app: suppress the price text/aria (store policy — no purchase surfaces). */
  hidePrice?: boolean;
  /** The section unlock is queued in the pending-unlocks tray (swaps the lock icon). */
  inCart?: boolean;
  /** The section catalog is still loading — this row's real lock state isn't known yet, so the
   *  trailing control renders a neutral skeleton instead of a switch that might flip a moment later. */
  pending?: boolean;
  /** Explicit touch fallback for the otherwise drag-first ordering interaction. */
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onSelect: () => void;
  onToggleVisible: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

/**
 * One row of the page contents — a mono index in the left margin, the section name across the spine,
 * and the show/hide switch at the trailing edge. Reorder grip and chevron stay receded until the row
 * is hovered or opened. The title/context region is the explicit expand target, leaving each
 * trailing control independently reachable without an invisible button beneath it.
 */
export function SectionCard({
  entry,
  meta,
  index,
  summary,
  status,
  expanded,
  locked,
  readOnly,
  required,
  needsAttention,
  paidLocked,
  priceLabel,
  hidePrice,
  inCart,
  pending,
  canMoveUp,
  canMoveDown,
  onSelect,
  onToggleVisible,
  onMoveUp,
  onMoveDown,
}: SectionCardProps) {
  const { t } = useTranslation("marketplace");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.type,
    disabled: locked || readOnly || paidLocked || pending,
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
      <div
        className={cn(
          "relative z-[1] grid min-h-[58px] grid-cols-[34px_42px_minmax(0,1fr)_auto] items-center",
          "origin-center transition-[background-color,transform] duration-150 ease-out hover:bg-surface-hover/50 focus-within:bg-surface-hover/50",
          expanded && "bg-surface-hover/60",
        )}
      >
        {/* reorder grip — far left, ahead of the index. Locked rows keep the same quiet gutter. */}
        {locked || readOnly ? (
          <span
            className="col-start-1 h-11 w-[30px] justify-self-center"
            aria-hidden
          />
        ) : (
          <button
            type="button"
            aria-label={t("businessPage.builder.card.drag")}
            className={cn(
              "pointer-events-auto relative col-start-1 grid h-11 w-[30px] cursor-grab touch-none place-items-center justify-self-center rounded-md text-foreground-3 outline-none",
              // Widens the touch target to the ≥44px minimum without changing the visible grip's size —
              // the pseudo-element still dispatches to this button, so drag listeners are unaffected.
              "before:absolute before:-inset-x-2 before:inset-y-0 before:content-['']",
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

        {/* Explicit expand target: only index/title/context toggles the editor. */}
        <button
          type="button"
          onClick={onSelect}
          disabled={readOnly}
          aria-expanded={!!expanded}
          aria-label={label}
          className="col-start-2 col-span-2 flex min-w-0 self-stretch items-center text-left outline-none transition-transform duration-150 ease-out active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60 disabled:cursor-default"
        >
          <span
            className={cn(
              "w-[42px] shrink-0 pr-[11px] text-right font-mono text-[13px] tabular-nums transition-colors duration-200",
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

          <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-2.5 pl-[15px]">
            <span className="flex min-w-0 items-center">
              <span
                className={cn(
                  "min-w-0 truncate text-[15px] font-medium transition-colors duration-200",
                  live ? "text-foreground-1" : "text-foreground-disabled",
                )}
              >
                {label}
              </span>
              {needsAttention ? (
                <span
                  className="ml-2 inline-flex size-1.5 shrink-0 rounded-full bg-error shadow-[0_0_0_3px_var(--color-error-bg)]"
                  aria-label={t("businessPage.builder.summary.needsContent")}
                />
              ) : null}
            </span>
            {summary && (
              <span
                className={cn(
                  "min-w-0 truncate text-[12px] leading-none transition-colors duration-200",
                  live ? "text-foreground-3" : "text-foreground-disabled",
                )}
              >
                {status && (
                  <span
                    className={cn(
                      "font-medium sm:hidden",
                      statusTone === "danger" && "text-error",
                      statusTone === "warning" && "text-warning",
                    )}
                  >
                    {status.label}
                    <span aria-hidden> · </span>
                  </span>
                )}
                {summary}
              </span>
            )}
          </span>

          <ChevronRight
            className={cn(
              "mr-1 size-[18px] shrink-0 text-foreground-3 transition-[transform,opacity,color] duration-200",
              expanded
                ? "rotate-90 text-primary opacity-100"
                : "opacity-50 sm:-translate-x-[3px] sm:opacity-0 sm:group-hover/row:translate-x-0 sm:group-hover/row:opacity-100",
            )}
            strokeWidth={1.6}
            aria-hidden
          />
        </button>

        {/* trailing cluster: status, touch reorder menu, and visibility */}
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
          {!locked && !readOnly && !paidLocked && !pending && (canMoveUp || canMoveDown) ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={t("businessPage.builder.card.drag")}
                  title={t("businessPage.builder.card.drag")}
                  className="grid size-11 place-items-center rounded-md text-foreground-3 outline-none transition-[background-color,color,transform] duration-150 hover:bg-surface-hover hover:text-foreground-1 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-focus xl:hidden"
                >
                  <MoreHorizontal className="size-4" strokeWidth={1.8} aria-hidden />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-44">
                <DropdownMenuItem disabled={!canMoveUp} onSelect={onMoveUp}>
                  <ArrowUp className="size-4" strokeWidth={1.8} aria-hidden />
                  {t("businessPage.builder.moveUp")}
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!canMoveDown} onSelect={onMoveDown}>
                  <ArrowDown className="size-4" strokeWidth={1.8} aria-hidden />
                  {t("businessPage.builder.moveDown")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          <span className="ml-1.5">
            {readOnly ? (
              <span
                className="inline-flex size-11 items-center justify-center text-foreground-3"
                title={status?.label}
                aria-label={status?.label}
              >
                <Lock className="size-4" strokeWidth={1.8} aria-hidden />
              </span>
            ) : pending ? (
              <span className="inline-block h-5 w-9 animate-pulse rounded-full bg-surface-hover" aria-hidden />
            ) : paidLocked ? (
              /* Locked paid section: a lock/price chip instead of the switch — tapping it
                 opens the purchase dialog (the parent routes onToggleVisible there). */
              <button
                type="button"
                onClick={onToggleVisible}
                aria-label={
                  hidePrice
                    ? t("businessPage.paidVariants.sectionLockedAriaNative", { name: label })
                    : t("businessPage.paidVariants.sectionLockedAria", { name: label, price: priceLabel ?? "" })
                }
                title={
                  hidePrice
                    ? t("businessPage.paidVariants.nativeHint")
                    : inCart
                      ? t("businessPage.paidVariants.inCartTitle", { price: priceLabel ?? "" })
                      : t("businessPage.paidVariants.sectionLockedTitle", { price: priceLabel ?? "" })
                }
                className={cn(
                  "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-surface-hover px-2.5 py-1 text-[12px] font-medium text-foreground-2 outline-none xl:min-h-0",
                  "transition-[color,border-color,background-color,transform] duration-150 ease-out hover:border-border-strong hover:text-foreground-1 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-focus",
                )}
              >
                {!hidePrice && inCart ? (
                  <LockOpen className="h-3 w-3 shrink-0 text-primary" strokeWidth={2} aria-hidden />
                ) : (
                  <Lock className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
                )}
                {!hidePrice && priceLabel}
              </button>
            ) : (
              /* Required sections (nav/hero/footer) show the toggle on but locked — no off-brand text tag. */
              <Switch
                checked={entry.visible}
                disabled={required}
                onCheckedChange={onToggleVisible}
                className="relative before:absolute before:-inset-x-2.5 before:-inset-y-3 before:content-['']"
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
          "pointer-events-none absolute bottom-0 left-4 right-4 z-[1] h-[1.5px] origin-left rounded-full bg-primary sm:left-[72px]",
          "transition-transform duration-[340ms] ease-[var(--ease-out-strong)]",
          expanded ? "scale-x-100" : "scale-x-0",
        )}
      />
    </div>
  );
}

export default SectionCard;
