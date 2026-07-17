import { useTranslation } from "react-i18next";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, GripVertical, Lock, LockOpen, MoreHorizontal } from "lucide-react";
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
  /** Short operational summary, e.g. “3 of 4 locations shown” or “12 photos”. */
  summary?: string;
  /** Calm row-level state: Hidden, Fixed, Needs content, No data. */
  status?: SectionCardStatus;
  expanded?: boolean;
  /** Section currently intersecting the live preview; distinct from the open inspector state. */
  active?: boolean;
  /** A locked premium style is currently being previewed for this section. */
  previewOnlyPremium?: boolean;
  /** Fixed in the page order: not draggable; the grip gutter stays quiet. */
  locked?: boolean;
  /** Stored by a newer section registry: visible for continuity, but never editable here. */
  readOnly?: boolean;
  /** Known section in a capability-limited workspace. It remains inspectable (and paid
   *  content remains purchasable), while reorder/visibility mutations stay unavailable. */
  editingDisabled?: boolean;
  /** Always shown (nav / hero / footer): visibility can't be toggled — the switch becomes a static label. */
  required?: boolean;
  /** A pulsing status cue below the name — set when this section has a mandatory field still empty. */
  needsAttention?: boolean;
  /** Paid section not yet unlocked: the switch becomes a lock/price button and every tap routes to the purchase dialog. */
  paidLocked?: boolean;
  /** Whether the paid-section row may open the web purchase flow. Native surfaces keep
   * the lock visible but static to comply with store policy. */
  paidLockedInteractive?: boolean;
  /** Resolved unlock price label, shown on the lock button while paidLocked. */
  priceLabel?: string;
  /** Native (Capacitor) app: suppress the price text/aria (store policy — no purchase surfaces). */
  hidePrice?: boolean;
  /** The section unlock is queued in the pending-unlocks tray (swaps the lock icon). */
  inCart?: boolean;
  /** The section catalog is still loading — this row's real lock state isn't known yet, so the
   *  trailing control renders a neutral skeleton instead of a switch that might flip a moment later. */
  pending?: boolean;
  /** Section can't be enabled because required data is missing (Reviews below the minimum review count):
   *  the switch renders disabled + off, with `dataLockedReason` as its tooltip/aria. */
  dataLocked?: boolean;
  dataLockedReason?: string;
  /** Explicit touch fallback used by the legacy builder; Atelier hides it in favor of its grip. */
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onSelect: () => void;
  onToggleVisible: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

/**
 * One row of the page contents: drag handle, title/meta, plain state marker, and visibility control.
 * The title/context region is the explicit expand target,
 * leaving each trailing control independently reachable without an invisible button beneath it.
 */
export function SectionCard({
  entry,
  meta,
  summary,
  status,
  expanded,
  active,
  previewOnlyPremium,
  locked,
  readOnly,
  editingDisabled,
  required,
  needsAttention,
  paidLocked,
  paidLockedInteractive = true,
  priceLabel,
  hidePrice,
  inCart,
  pending,
  dataLocked,
  dataLockedReason,
  canMoveUp,
  canMoveDown,
  onSelect,
  onToggleVisible,
  onMoveUp,
  onMoveDown,
}: SectionCardProps) {
  const { t } = useTranslation("website");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.type,
    disabled: locked || readOnly || editingDisabled || paidLocked || pending,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  };

  const label = meta ? t(meta.labelKey) : entry.type;
  const live = entry.visible;
  const statusTone = status?.tone ?? "neutral";
  const selectAriaLabel = [
    label,
    needsAttention ? t("businessPage.builder.summary.needsContent") : null,
    previewOnlyPremium ? t("page.publishReview.premiumStyle") : null,
    required ? t("businessPage.builder.card.alwaysOn") : status?.label,
    summary,
  ]
    .filter((part): part is string => !!part)
    .join(". ");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "atelier-section-card group/row relative",
        !live && "atelier-section-card--hidden",
        active && "atelier-section-card--active",
        expanded && "atelier-section-card--expanded",
        paidLocked && "atelier-section-card--paid-locked",
        pending && "atelier-section-card--pending",
        isDragging && "z-20 rounded-md bg-surface shadow-elevated-card",
      )}
    >
      <div
        className={cn(
          "atelier-section-card-row relative z-[1] grid min-h-[50px] grid-cols-[34px_minmax(0,1fr)_auto] items-center",
          "origin-center transition-[background-color,transform] duration-150 ease-out hover:bg-surface-hover/50 focus-within:bg-surface-hover/50",
        )}
      >
        {/* Reorder handle. Locked rows keep the same quiet gutter so titles remain aligned. */}
        {locked || readOnly || editingDisabled || paidLocked || pending ? (
          <span
            className="atelier-section-card-grip-placeholder col-start-1 h-11 w-[30px] justify-self-center"
            aria-hidden
          />
        ) : (
          <button
            type="button"
            aria-label={t("businessPage.builder.card.drag")}
            className={cn(
              "atelier-section-card-grip pointer-events-auto relative col-start-1 grid h-11 w-[30px] cursor-grab touch-none place-items-center justify-self-center rounded-md text-foreground-3 outline-none",
              // Widens the touch target to the ≥44px minimum without changing the visible grip's size —
              // the pseudo-element still dispatches to this button, so drag listeners are unaffected.
              "before:absolute before:-inset-x-2 before:inset-y-0 before:content-['']",
              "opacity-70 transition-[opacity,color] duration-200",
              "hover:text-foreground-1 hover:opacity-100 active:cursor-grabbing",
              "focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60",
            )}
            {...attributes}
            {...listeners}
          >
            <GripVertical strokeWidth={2.2} aria-hidden />
          </button>
        )}

        {/* Explicit expand target: only the title/context region toggles the editor. */}
        <button
          type="button"
          onClick={onSelect}
          disabled={readOnly || (!!paidLocked && !paidLockedInteractive)}
          aria-expanded={!!expanded}
          aria-current={active ? "location" : undefined}
          aria-label={selectAriaLabel}
          className="atelier-section-card-select col-start-2 flex min-w-0 self-stretch items-center text-left outline-none transition-transform duration-150 ease-out active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60 disabled:cursor-default"
        >
          <span className="atelier-section-card-copy flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-2 pl-0">
            <span className="atelier-section-card-title-line flex min-w-0 items-center">
              <span
                className={cn(
                  "atelier-section-card-title min-w-0 truncate text-[15px] font-medium transition-colors duration-200",
                  live ? "text-foreground-1" : "text-foreground-disabled",
                )}
              >
                {label}
              </span>
              {previewOnlyPremium ? (
                <span className="atelier-section-card-premium ml-2 shrink-0">
                  {t("businessPage.paidVariants.lockedBadge")}
                </span>
              ) : status && !required && !needsAttention ? (
                <span
                  className={cn(
                    "atelier-section-card-inline-status ml-2 shrink-0",
                    statusTone === "danger" && "text-error",
                    statusTone === "warning" && "text-warning",
                    statusTone === "muted" && "text-foreground-3",
                    statusTone === "neutral" && "text-foreground-3",
                  )}
                >
                  {status.label}
                </span>
              ) : null}
            </span>
            {needsAttention ? (
              <span className="atelier-section-card-attention flex min-w-0 items-center">
                <span className="relative flex size-3 shrink-0 items-center justify-center" aria-hidden>
                  <span
                    className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-20 motion-reduce:animate-none"
                    style={{ animationDuration: "3s" }}
                  />
                  <span className="relative inline-flex size-2 rounded-full bg-primary" />
                </span>
                {summary ? (
                  <span
                    className={cn(
                      "atelier-section-card-summary min-w-0 truncate transition-colors duration-200",
                      live ? "text-foreground-3" : "text-foreground-disabled",
                    )}
                  >
                    {summary}
                  </span>
                ) : null}
              </span>
            ) : summary ? (
              <span
                className={cn(
                  "min-w-0 truncate text-[12px] leading-none transition-colors duration-200",
                  "atelier-section-card-summary",
                  live ? "text-foreground-3" : "text-foreground-disabled",
                )}
              >
                {summary}
              </span>
            ) : null}
          </span>

        </button>

        {/* trailing cluster: state, legacy touch reorder fallback, and visibility */}
        <div className="atelier-section-card-trailing col-start-3 flex items-center gap-2 pr-4">
          {!locked && !readOnly && !editingDisabled && !paidLocked && !pending && (canMoveUp || canMoveDown) ? (
            <span className="atelier-section-card-reorder-menu">
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
            </span>
          ) : null}
          <span className="atelier-section-card-control ml-1.5">
            {pending ? (
              <span className="inline-block h-5 w-9 animate-pulse rounded-full bg-surface-hover" aria-hidden />
            ) : paidLocked && paidLockedInteractive ? (
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
                  "atelier-section-card-paid-lock inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-surface-hover px-2.5 py-1 text-[12px] font-medium text-foreground-2 outline-none xl:min-h-0",
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
            ) : paidLocked ? (
              <span
                className="atelier-section-card-paid-lock inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-surface-hover px-2.5 py-1 text-foreground-3 xl:min-h-0"
                title={t("businessPage.paidVariants.nativeHint")}
                aria-label={t("businessPage.paidVariants.sectionLockedAriaNative", { name: label })}
              >
                <Lock className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
              </span>
            ) : readOnly || editingDisabled ? (
              <span
                className="inline-flex size-11 items-center justify-center text-foreground-3"
                title={status?.label ?? t("page.publishReason.readOnly")}
                aria-label={status?.label ?? t("page.publishReason.readOnly")}
              >
                <Lock className="size-4" strokeWidth={1.8} aria-hidden />
              </span>
            ) : required ? (
              <span
                className="atelier-section-card-fixed"
                title={t("businessPage.builder.card.alwaysOn")}
              >
                {t("businessPage.builder.summary.fixed")}
              </span>
            ) : dataLocked ? (
              /* Enable is gated on missing data (e.g. Reviews under the minimum count): a disabled, off
                 switch with the reason as its tooltip/aria — it can be reordered/inspected but never turned on. */
              <span className="atelier-section-card-datalock inline-flex" title={dataLockedReason}>
                <Switch
                  checked={false}
                  disabled
                  className="atelier-section-card-switch"
                  aria-label={dataLockedReason ?? t("businessPage.builder.card.show")}
                />
              </span>
            ) : (
              <Switch
                checked={entry.visible}
                onCheckedChange={onToggleVisible}
                className="atelier-section-card-switch relative before:absolute before:-inset-x-2.5 before:-inset-y-3 before:content-['']"
                aria-label={
                  live
                    ? t("businessPage.builder.card.hide")
                    : t("businessPage.builder.card.show")
                }
              />
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export default SectionCard;
