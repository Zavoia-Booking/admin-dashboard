import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronRight, CircleCheck } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../../shared/components/ui/collapsible";
import { cn } from "../../../shared/lib/utils";
import type { LocationFullAssignment } from "../types";

/** Which section a summary row sends the reader to. */
export type AssignmentsSummaryTarget = "services" | "bundles" | "teamMembers";

interface AssignmentsSummaryProps {
  location: LocationFullAssignment;
  /** Scrolls to the owning section and pulses it. */
  onResolve: (target: AssignmentsSummaryTarget) => void;
}

interface SummaryItem {
  key: string;
  ok: boolean;
  label: string;
  target: AssignmentsSummaryTarget;
}

interface SummaryHint {
  key: string;
  label: string;
  target: AssignmentsSummaryTarget;
}

/**
 * "What's left before this location can take bookings", as the first thing on
 * the page — the same contract as the marketplace publish strip: state the gap
 * in one line, then hand the reader a button that lands them on the fix.
 *
 * Every check reads the location payload that is already loaded, so the card
 * costs no extra request: `staffCount` per location service and
 * `servicesEnabled` per team member are exactly the two gaps that make a
 * service unbookable without anything else on the page looking wrong.
 */
export function AssignmentsSummary({
  location,
  onResolve,
}: AssignmentsSummaryProps) {
  const { t } = useTranslation("assignments");

  const items = useMemo<SummaryItem[]>(() => {
    const services = location.services ?? [];
    const bundles = location.bundles ?? [];
    const teamMembers = location.teamMembers ?? [];

    const servicesWithoutStaff = services.filter((s) => s.staffCount === 0);
    const staffWithoutServices = teamMembers.filter(
      (m) => m.servicesEnabled === 0,
    );
    // A bundle is only bookable here if every service it contains is offered
    // here — an easy gap to create by removing one service from the location.
    const enabledServiceIds = new Set(services.map((s) => s.serviceId));
    const unbookableBundles = bundles.filter((b) =>
      (b.serviceIds ?? []).some((id) => !enabledServiceIds.has(id)),
    );

    const list: SummaryItem[] = [
      {
        key: "servicesEnabled",
        ok: services.length > 0,
        target: "services",
        label: t(
          services.length > 0
            ? "page.summary.items.servicesEnabled.done"
            : "page.summary.items.servicesEnabled.pending",
        ),
      },
      {
        key: "teamAssigned",
        ok: teamMembers.length > 0,
        target: "teamMembers",
        label: t(
          teamMembers.length > 0
            ? "page.summary.items.teamAssigned.done"
            : "page.summary.items.teamAssigned.pending",
        ),
      },
    ];

    // The coverage checks only mean anything once there is something to cover;
    // a green "every service has staff" over an empty location is noise.
    if (services.length > 0) {
      list.push({
        key: "servicesWithoutStaff",
        ok: servicesWithoutStaff.length === 0,
        target: "services",
        label: t(
          servicesWithoutStaff.length === 0
            ? "page.summary.items.servicesWithoutStaff.done"
            : "page.summary.items.servicesWithoutStaff.pending",
          { count: servicesWithoutStaff.length },
        ),
      });
    }

    if (teamMembers.length > 0) {
      list.push({
        key: "staffWithoutServices",
        ok: staffWithoutServices.length === 0,
        target: "teamMembers",
        label: t(
          staffWithoutServices.length === 0
            ? "page.summary.items.staffWithoutServices.done"
            : "page.summary.items.staffWithoutServices.pending",
          { count: staffWithoutServices.length },
        ),
      });
    }

    if (bundles.length > 0) {
      list.push({
        key: "bundlesUnbookable",
        ok: unbookableBundles.length === 0,
        target: "bundles",
        label: t(
          unbookableBundles.length === 0
            ? "page.summary.items.bundlesUnbookable.done"
            : "page.summary.items.bundlesUnbookable.pending",
          { count: unbookableBundles.length },
        ),
      });
    }

    return list;
  }, [location, t]);

  /* Not blockers — "you have more to work with than this location uses". A
   * business that deliberately splits staff across locations is not broken, so
   * these never turn the card amber or count toward the progress. They are
   * rendered outside the disclosure precisely because the card collapses once
   * the blockers are cleared, and this is the state where the reader most needs
   * to be told what is still sitting on the bench. */
  const hints = useMemo<SummaryHint[]>(() => {
    const assignedMemberIds = new Set(
      (location.teamMembers ?? []).map((m) => m.userId),
    );
    const membersElsewhere = (location.allTeamMembers ?? []).filter(
      (m) => !assignedMemberIds.has(m.userId),
    ).length;

    const enabledServiceIds = new Set(
      (location.services ?? []).map((s) => s.serviceId),
    );
    const servicesElsewhere = (location.allServices ?? []).filter(
      (s) => !enabledServiceIds.has(s.serviceId),
    ).length;

    const enabledBundleIds = new Set(
      (location.bundles ?? []).map((b) => b.bundleId),
    );
    const bundlesElsewhere = (location.allBundles ?? []).filter(
      (b) => !enabledBundleIds.has(b.bundleId),
    ).length;

    const list: SummaryHint[] = [];
    if (membersElsewhere > 0) {
      list.push({
        key: "membersNotHere",
        target: "teamMembers",
        label: t("page.summary.hints.membersNotHere", {
          count: membersElsewhere,
        }),
      });
    }
    if (servicesElsewhere > 0) {
      list.push({
        key: "servicesNotHere",
        target: "services",
        label: t("page.summary.hints.servicesNotHere", {
          count: servicesElsewhere,
        }),
      });
    }
    if (bundlesElsewhere > 0) {
      list.push({
        key: "bundlesNotHere",
        target: "bundles",
        label: t("page.summary.hints.bundlesNotHere", {
          count: bundlesElsewhere,
        }),
      });
    }
    return list;
  }, [location, t]);

  const doneCount = items.filter((item) => item.ok).length;
  const allDone = doneCount === items.length;
  // Opens itself exactly when there is something to act on. Uncontrolled after
  // that: reopening on every payload refresh would fight the reader.
  const [open, setOpen] = useState(!allDone);

  return (
    <div className="rounded-[1.125rem] border border-border bg-surface px-4 py-4 shadow-xs">
      <Collapsible open={open} onOpenChange={setOpen}>
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
            {t(
              allDone ? "page.summary.readyLabel" : "page.summary.attentionLabel",
            )}
          </span>
          <ChevronDown
            className="size-4 shrink-0 text-foreground-3 transition-transform duration-200 ease-out group-data-[state=open]:rotate-180 motion-reduce:transition-none"
            aria-hidden
          />
        </CollapsibleTrigger>

        <div className="mt-2 flex items-center gap-3">
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted/60">
            <div
              className="h-full rounded-full bg-green-500 transition-[width] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
              style={{ width: `${(doneCount / items.length) * 100}%` }}
            />
          </div>
          <span className="shrink-0 text-xs font-medium tabular-nums text-foreground-3 dark:text-foreground-2">
            {t("page.summary.progressDone", {
              done: doneCount,
              total: items.length,
            })}
          </span>
        </div>

        <CollapsibleContent>
          {/* Padding inside the animated box so the height morph covers it. */}
          <div className="pt-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-3">
              {t("page.summary.groupLabel")}
            </span>
            <div className="mt-1">
              {items.map((item) => (
                <div
                  key={item.key}
                  className="flex min-h-11 items-center justify-between gap-3"
                >
                  <span
                    className={cn(
                      "flex min-w-0 items-center gap-2.5 text-[13px] font-medium leading-5",
                      item.ok
                        ? "text-green-700 dark:text-green-400"
                        : "text-foreground-1",
                    )}
                  >
                    {item.ok ? (
                      <CircleCheck className="size-4 shrink-0" strokeWidth={2} />
                    ) : (
                      <span className="grid size-4 shrink-0 place-items-center">
                        <StatusDot tone="attention" />
                      </span>
                    )}
                    <span className="min-w-0">{item.label}</span>
                  </span>
                  {!item.ok && (
                    <button
                      type="button"
                      onClick={() => onResolve(item.target)}
                      className="group inline-flex h-11 shrink-0 cursor-pointer items-center gap-0.5 px-1 text-[13px] font-semibold text-primary focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40"
                    >
                      {t("page.summary.resolve")}
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
          <div className="mt-3 border-t border-border-subtle pt-1">
            {hints.map((hint) => (
              <div
                key={hint.key}
                className="flex min-h-10 items-center justify-between gap-3"
              >
                <span className="flex min-w-0 items-center gap-2.5 text-[13px] leading-5 text-foreground-3 dark:text-foreground-2">
                  <span
                    className="size-1.5 shrink-0 rounded-full bg-foreground-3/50"
                    aria-hidden
                  />
                  <span className="min-w-0">{hint.label}</span>
                </span>
                <button
                  type="button"
                  onClick={() => onResolve(hint.target)}
                  className="group inline-flex h-10 shrink-0 cursor-pointer items-center gap-0.5 px-1 text-[13px] font-medium text-foreground-2 hover:text-primary focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40"
                >
                  {t("page.summary.view")}
                  <ChevronRight
                    className="size-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none"
                    aria-hidden
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </Collapsible>
    </div>
  );
}

/** Pulsing dot: amber while something is pending, a slow green heartbeat once
 *  everything is covered. The ping is what draws the eye to the row. */
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

export default AssignmentsSummary;
