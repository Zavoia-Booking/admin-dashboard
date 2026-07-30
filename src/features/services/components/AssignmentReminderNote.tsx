import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Info } from "lucide-react";

interface AssignmentReminderNoteProps {
  /** Copy shown before the inline Assignments link. */
  text: string;
  /** Label of the inline Assignments link. */
  linkLabel: string;
  /** Runs before navigating so the host slider can close itself first. */
  onNavigate?: () => void;
  /** Assignments destination; pass `?locationId=` to land on the right location. */
  to?: string;
  /** `warning` for the blocking case (already created, still unbookable). */
  tone?: "info" | "warning";
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
}) => {
  const navigate = useNavigate();
  const isWarning = tone === "warning";

  return (
    <div
      className={
        isWarning
          ? "flex items-start gap-2.5 rounded-lg border border-amber-200/70 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-950/25"
          : "flex items-start gap-2.5 rounded-lg border border-info-border bg-info-bg p-4"
      }
    >
      <Info
        className={
          isWarning
            ? "h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400"
            : "h-4 w-4 mt-0.5 flex-shrink-0 text-info"
        }
        aria-hidden="true"
      />
      <p className="text-xs leading-relaxed text-foreground-2 dark:text-foreground-1">
        {text}{" "}
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            navigate(to);
          }}
          // The global touch-target rule (globals.css) forces 44px on every
          // button; an inline link inside a wrapping paragraph must opt out or it
          // blows the line height apart.
          className="inline-flex !min-h-0 !min-w-0 pl-0.5 items-center gap-0.5 cursor-pointer font-bold text-foreground-1 dark:text-foreground-1 hover:text-primary dark:hover:text-primary transition-colors duration-200 rounded-sm focus:outline-none focus-visible:ring-3 focus-visible:ring-focus/50"
        >
          {linkLabel}
          <ArrowUpRight className="h-3 w-3 text-primary" aria-hidden="true" />
        </button>
        .
      </p>
    </div>
  );
};
