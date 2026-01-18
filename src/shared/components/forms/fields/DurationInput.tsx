import React, { useEffect, useMemo, useState } from "react";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Clock, AlertCircle } from "lucide-react";
import { cn } from "../../../lib/utils";

export interface DurationInputProps {
  value: number; // Always in minutes (storage format)
  onChange: (value: number) => void; // Always in minutes (storage format)
  label: string;
  helpText?: string;
  id: string;
  quickActions?: Array<number | "other">; // Minute values for quick-action chips + optional "Other" focus chip
  error?: string;
  getChipLabel?: (minutes: number) => string; // Custom formatter for the chips
  className?: string;
  placeholder?: string; // Placeholder text for the input
  required?: boolean; // Whether to show required indicator (*)
  unit?: "minutes" | "hours" | "days"; // Unit for display and input (default: minutes)
  compactLayout?: boolean; // If true, input and chips are on the same row
  disabled?: boolean; // Whether the input is disabled
}

export const DurationInput: React.FC<DurationInputProps> = ({
  value,
  onChange,
  label,
  helpText,
  id,
  quickActions = [15, 30, 45, 60, 120],
  error,
  getChipLabel,
  className = "",
  placeholder,
  required = false,
  unit = "minutes",
  compactLayout = false,
  disabled = false,
}) => {
  // Convert between storage (minutes) and display value
  const displayValue =
    unit === "days"
      ? Math.round(value / 1440)
      : unit === "hours"
      ? Math.round(value / 60)
      : value;

  const handleInputChange = (displayVal: number) => {
    // Convert display value to minutes for storage
    const minutesValue =
      unit === "days" ? displayVal * 1440 : unit === "hours" ? displayVal * 60 : displayVal;
    onChange(minutesValue);
  };

  // Simple default formatter for chips if none provided
  const defaultGetChipLabel = (minutes: number): string => {
    if (minutes === 0) return "None";
    if (unit === "days") {
      const days = Math.round(minutes / 1440);
      return `${days}d`;
    }
    if (unit === "hours") {
      const hours = Math.round(minutes / 60);
      return `${hours}h`;
    }
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    const days = Math.floor(minutes / 1440);
    return `${days}d`;
  };

  const chipFormatter = getChipLabel || defaultGetChipLabel;
  const unitLabel = unit === "days" ? "days" : unit === "hours" ? "hours" : "minutes";
  const numericQuickActions = useMemo(
    () => quickActions.filter((a): a is number => typeof a === "number"),
    [quickActions]
  );
  const numericQuickActionSet = useMemo(
    () => new Set(numericQuickActions),
    [numericQuickActions]
  );
  const hasOtherQuickAction = useMemo(
    () => quickActions.some((a) => a === "other"),
    [quickActions]
  );

  // When "Other" is clicked, we want it to appear selected immediately,
  // even before the user types a new value.
  const [forceOtherSelected, setForceOtherSelected] = useState(false);

  // Keep "Other" selection in sync with the value:
  // - If value matches a numeric quick action, prefer highlighting that chip.
  // - Otherwise, highlight "Other" (if present).
  useEffect(() => {
    if (!hasOtherQuickAction) {
      setForceOtherSelected(false);
      return;
    }
    setForceOtherSelected(!numericQuickActionSet.has(value));
  }, [value, hasOtherQuickAction, numericQuickActionSet]);

  const isOtherActive = hasOtherQuickAction && forceOtherSelected;

  const focusInput = () => {
    // Our `Input` component does not forward refs, so focus by id.
    // Use rAF to ensure focus works even if a click causes layout changes.
    requestAnimationFrame(() => {
      const el = document.getElementById(id) as HTMLInputElement | null;
      el?.focus();
      el?.select?.();
    });
  };

  return (
    <div
      className={cn(
        "space-y-2 transition-opacity duration-200",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      <div className={compactLayout ? "space-y-2" : "space-y-2 mb-1"}>
        <Label
          htmlFor={id}
          className={cn(
            "text-base font-medium",
            disabled && "text-foreground-3"
          )}
        >
          {label} {required && "*"}
        </Label>
        {helpText && (
          <p className="text-sm min-h-11 text-foreground-3 dark:text-foreground-2">
            {helpText}
          </p>
        )}
        <div className={cn("flex items-center", compactLayout ? "gap-8" : "gap-3")}>
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Clock className="h-4 w-4 text-foreground-3 dark:text-foreground-2" />
            </div>
            <Input
              id={id}
              type="text"
              inputMode="numeric"
              placeholder={placeholder}
              value={displayValue}
              disabled={disabled}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^\d+$/.test(val)) {
                  handleInputChange(val === "" ? 0 : parseInt(val, 10));
                }
              }}
              className={cn(
                "!pl-10 !pr-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all focus-visible:ring-1 focus-visible:ring-offset-0",
                error
                  ? "border-destructive bg-error-bg focus-visible:ring-error"
                  : "border-border dark:border-border-subtle hover:border-border-strong focus:border-focus focus-visible:ring-focus",
                disabled && "bg-muted/30 cursor-not-allowed"
              )}
              aria-invalid={!!error}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <span className="text-sm text-foreground-3 dark:text-foreground-2">
                {unitLabel}
              </span>
            </div>
          </div>

          {/* Quick actions - inline if compact layout */}
          {compactLayout && quickActions && quickActions.length > 0 && (
            <div className="flex flex-1 items-center gap-2 pl-0">
              {quickActions.map((action) => {
                const isOther = action === "other";
                const isActive = isOther ? isOtherActive : value === action && !forceOtherSelected;

                return (
                  <button
                    key={isOther ? "other" : action}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      if (isOther) {
                        setForceOtherSelected(true);
                        focusInput();
                        return;
                      }
                      setForceOtherSelected(false);
                      onChange(action);
                    }}
                    className={cn(
                      "cursor-pointer w-full px-2.5 py-1 text-xs font-medium rounded-md transition-colors duration-200 text-center focus:outline-none focus-visible:ring-3 focus-visible:ring-focus/50 focus-visible:ring-offset-0",
                      isActive
                        ? "bg-primary text-white"
                        : "bg-surface hover:bg-surface-hover text-foreground-3 dark:text-foreground-2 border border-border",
                      disabled && "cursor-not-allowed opacity-50"
                    )}
                  >
                    {isOther ? "Other" : chipFormatter(action)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="h-5">
          {error && (
            <p
              className="flex items-center gap-1.5 text-xs text-destructive"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{error}</span>
            </p>
          )}
        </div>
      </div>

      {/* Quick actions - below if not compact layout */}
      {!compactLayout && quickActions && quickActions.length > 0 && (
        <div className="flex items-center gap-2 pl-0">
          {quickActions.map((action) => {
            const isOther = action === "other";
            const isActive = isOther ? isOtherActive : value === action && !forceOtherSelected;

            return (
              <button
                key={isOther ? "other" : action}
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (isOther) {
                    setForceOtherSelected(true);
                    focusInput();
                    return;
                  }
                  setForceOtherSelected(false);
                  onChange(action);
                }}
                className={cn(
                  "flex-1 cursor-pointer px-2.5 py-1 text-xs font-medium rounded-md transition-colors duration-200 text-center focus:outline-none focus-visible:ring-3 focus-visible:ring-focus/50 focus-visible:ring-offset-0",
                  isActive
                    ? "bg-primary text-white"
                    : "bg-surface hover:bg-surface-hover text-foreground-3 dark:text-foreground-2 border border-border",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                {isOther ? "Other" : chipFormatter(action)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DurationInput;
