import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Info, TriangleAlert } from "lucide-react";

interface AssignmentReminderNoteProps {
  /** Self-contained explanation shown above the action row. */
  text: string;
  /** Label of the Assignments action row (e.g. "Go to Assignments"). */
  linkLabel: string;
  /** Runs before navigating so the host slider can close itself first. */
  onNavigate?: () => void;
  /** Assignments destination; pass `?locationId=` to land on the right location. */
  to?: string;
  /** `warning` for the blocking case (already created, still unbookable). */
  tone?: "info" | "warning";
  /** Optional second resolution (e.g. remove the blocked service row). */
  secondaryLabel?: string;
  onSecondary?: () => void;
}

/**
 * Creation-time reminder that a service/bundle only becomes bookable once it is
 * assigned to a team member. Shown at the top of the Add Service and Add Bundle
 * sliders; the same destination is reachable from the toast fired after creation.
 * The `warning` tone reuses it where the missing assignment is already blocking
 * something (e.g. picking that service for a new appointment).
 */
export const AssignmentReminderNote: React.FC<AssignmentReminderNoteProps> = ({
  text,
  linkLabel,
  onNavigate,
  to = "/assignments",
  tone = "info",
  secondaryLabel,
  onSecondary,
}) => {
  const navigate = useNavigate();
  const isWarning = tone === "warning";
  const ToneIcon = isWarning ? TriangleAlert : Info;

  return (
    <div
      className={
        isWarning
          ? "rounded-lg border border-amber-200/70 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-950/25"
          : "rounded-lg border border-info-border bg-info-bg p-4"
      }
    >
      <div className="flex items-start gap-3">
        <ToneIcon
          className={
            isWarning
              ? "h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
              : "h-4 w-4 mt-0.5 shrink-0 text-info"
          }
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm leading-relaxed text-foreground-1">{text}</p>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => {
                onNavigate?.();
                navigate(to);
              }}
              // Opt out of the global 44px button floor; py keeps a comfortable
              // tap height without inflating the banner.
              className="group inline-flex !min-h-0 !min-w-0 items-center gap-1 rounded-sm py-1 text-sm font-semibold text-foreground-1 transition-colors duration-200 hover:text-primary focus:outline-none focus-visible:ring-3 focus-visible:ring-focus/50"
            >
              {linkLabel}
              <ArrowUpRight
                className="h-4 w-4 text-primary transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </button>
            {secondaryLabel && onSecondary && (
              <button
                type="button"
                onClick={onSecondary}
                className="inline-flex !min-h-0 !min-w-0 items-center rounded-sm py-1 text-sm font-medium text-foreground-2 transition-colors duration-200 hover:text-destructive focus:outline-none focus-visible:ring-3 focus-visible:ring-focus/50"
              >
                {secondaryLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
