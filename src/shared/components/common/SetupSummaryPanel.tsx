import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, CircleCheck } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { cn } from "../../lib/utils";

export interface SetupSummaryItem {
  key: string;
  ok: boolean;
  label: ReactNode;
  onResolve?: () => void;
  actionLabel?: string;
  stackActionOnMobile?: boolean;
}

export interface SetupSummaryHint {
  key: string;
  label: ReactNode;
  onResolve?: () => void;
  actionLabel?: string;
  stackActionOnMobile?: boolean;
}

interface SetupSummaryPanelProps {
  items: SetupSummaryItem[];
  hints?: SetupSummaryHint[];
  hintsLabel?: string;
  hintsTone?: "normal" | "muted";
  readyLabel: string;
  attentionLabel: string;
  groupLabel: string;
  resolveLabel: string;
  viewLabel?: string;
  progressLabel: (done: number, total: number) => string;
  className?: string;
  headerAction?: ReactNode;
  footerAction?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** Shared setup summary presentation; callers own the checks and their actions. */
export function SetupSummaryPanel({
  items,
  hints = [],
  hintsLabel,
  hintsTone = "muted",
  readyLabel,
  attentionLabel,
  groupLabel,
  resolveLabel,
  viewLabel,
  progressLabel,
  className,
  headerAction,
  footerAction,
  open: controlledOpen,
  onOpenChange,
}: SetupSummaryPanelProps) {
  const doneCount = items.filter((item) => item.ok).length;
  const allDone = doneCount === items.length;
  // Start expanded on mount; later payload updates preserve the reader's choice.
  const [internalOpen, setInternalOpen] = useState(true);
  const open = controlledOpen ?? internalOpen;
  const handleOpenChange = (nextOpen: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const trigger = (
    <CollapsibleTrigger className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40">
      <span className="inline-flex items-center gap-2 text-[14px] font-semibold text-foreground-1">
        <span
          className={cn(
            "grid size-5 place-items-center rounded-full ring-1",
            allDone
              ? "bg-green-50 ring-green-100 dark:bg-green-950/30 dark:ring-green-900/40"
              : "bg-amber-50 ring-amber-100 dark:bg-amber-950/30 dark:ring-amber-900/40",
          )}
        >
          <StatusDot tone={allDone ? "ready" : "attention"} />
        </span>
        {allDone ? readyLabel : attentionLabel}
      </span>
      <ChevronDown
        className="size-4 shrink-0 text-foreground-3 transition-transform duration-200 ease-out group-data-[state=open]:rotate-180 motion-reduce:transition-none"
        aria-hidden
      />
    </CollapsibleTrigger>
  );

  return (
    <div
      className={cn(
        "rounded-[1.125rem] border border-border bg-surface px-4 py-4 shadow-xs",
        className,
      )}
    >
      <Collapsible open={open} onOpenChange={handleOpenChange}>
        {headerAction ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">{trigger}</div>
            <div className="shrink-0">{headerAction}</div>
          </div>
        ) : (
          trigger
        )}

        <div className="mt-2 flex items-center gap-3">
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted/60">
            <div
              className="h-full rounded-full bg-green-500 transition-[width] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
              style={{
                width: `${items.length > 0 ? (doneCount / items.length) * 100 : 100}%`,
              }}
            />
          </div>
          <span className="shrink-0 text-xs font-medium tabular-nums text-foreground-3 dark:text-foreground-2">
            {progressLabel(doneCount, items.length)}
          </span>
        </div>

        <CollapsibleContent>
          {/* Padding inside the animated box so the height morph covers it. */}
          <div className="pt-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-3">
              {groupLabel}
            </span>
            <div className="mt-1">
              {items.map((item) => (
                <div
                  key={item.key}
                  className={cn(
                    "flex min-h-11 items-center justify-between gap-3",
                    item.stackActionOnMobile &&
                      !item.ok &&
                      item.onResolve &&
                      "max-md:flex-col max-md:items-stretch max-md:gap-0 max-md:py-2",
                  )}
                >
                  <span
                    className={cn(
                      "flex min-w-0 items-start gap-2.5 text-[13px] font-medium leading-5",
                      item.ok
                        ? "text-green-700 dark:text-green-400"
                        : "text-foreground-1",
                    )}
                  >
                    {item.ok ? (
                      <CircleCheck className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
                    ) : (
                      <span className="grid h-5 w-4 shrink-0 place-items-center">
                        <StatusDot tone="attention" />
                      </span>
                    )}
                    <span className="min-w-0">{item.label}</span>
                  </span>
                  {!item.ok && item.onResolve && (
                    <button
                      type="button"
                      onClick={item.onResolve}
                      className={cn(
                        "group inline-flex h-11 shrink-0 cursor-pointer items-center gap-0.5 px-1 text-[13px] font-semibold text-primary focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40",
                        item.stackActionOnMobile &&
                          "max-md:ml-6.5 max-md:self-start max-md:pl-0",
                      )}
                    >
                      {item.actionLabel ?? resolveLabel}
                      <ChevronRight
                        className="size-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none"
                        aria-hidden
                      />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>

        {hints.length > 0 && (
          <div
            className={cn(
              "mt-3 border-t border-border-subtle",
              hintsLabel ? "pt-3" : "pt-1",
            )}
          >
            {hintsLabel && (
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-3">
                {hintsLabel}
              </span>
            )}
            {hints.map((hint) => (
              <div
                key={hint.key}
                className={cn(
                  "flex min-h-10 items-center justify-between gap-3",
                  hint.stackActionOnMobile &&
                    hint.onResolve &&
                    "min-h-11 max-md:flex-col max-md:items-stretch max-md:gap-0 max-md:py-2",
                )}
              >
                <span
                  className={cn(
                    "flex min-w-0 gap-2.5 text-[13px] leading-5",
                    hintsTone === "normal"
                      ? "text-foreground-1"
                      : "text-foreground-3 dark:text-foreground-2",
                    hint.stackActionOnMobile ? "items-start" : "items-center",
                  )}
                >
                  {hint.stackActionOnMobile ? (
                    <span className="grid h-5 w-4 shrink-0 place-items-center" aria-hidden>
                      <span className="size-1.5 rounded-full bg-foreground-3/50" />
                    </span>
                  ) : (
                    <span
                      className="size-1.5 shrink-0 rounded-full bg-foreground-3/50"
                      aria-hidden
                    />
                  )}
                  <span className="min-w-0">{hint.label}</span>
                </span>
                {hint.onResolve && (
                  <button
                    type="button"
                    onClick={hint.onResolve}
                    className={cn(
                      "group inline-flex h-10 shrink-0 cursor-pointer items-center gap-0.5 px-1 text-[13px] focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40",
                      hintsTone === "normal"
                        ? "font-semibold text-primary"
                        : "font-medium text-foreground-2 hover:text-primary",
                      hint.stackActionOnMobile &&
                        "h-11 max-md:ml-6.5 max-md:self-start max-md:pl-0",
                    )}
                  >
                    {hint.actionLabel ?? viewLabel ?? resolveLabel}
                    <ChevronRight
                      className="size-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none"
                      aria-hidden
                    />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {footerAction}
      </Collapsible>
    </div>
  );
}

/** Pulsing dot: amber while pending, a slow green heartbeat when covered. */
function StatusDot({ tone }: { tone: "ready" | "attention" }) {
  const color = tone === "ready" ? "bg-green-500" : "bg-amber-500";
  return (
    <span className="relative flex size-2" aria-hidden>
      <span
        className={cn(
          "absolute inline-flex size-full animate-ping rounded-full opacity-50 motion-reduce:hidden",
          color,
        )}
        style={{ animationDuration: tone === "ready" ? "2s" : "1.6s" }}
      />
      <span className={cn("relative inline-flex size-full rounded-full", color)} />
    </span>
  );
}
