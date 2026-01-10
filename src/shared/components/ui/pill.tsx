import React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export interface PillProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  icon?: LucideIcon;
  logo?: React.ReactNode;
  showCheckmark?: boolean;
  children: React.ReactNode;
}

export const Pill = React.forwardRef<HTMLButtonElement, PillProps>(
  (
    {
      selected = false,
      icon: Icon,
      logo,
      showCheckmark = false,
      children,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "group relative flex items-center min-h-14 px-3 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer overflow-visible",
          "focus:outline-none focus-visible:ring-3 focus-visible:ring-focus/50 focus-visible:ring-offset-0",
          selected
            ? "border-neutral-500 bg-info-100 text-neutral-900 dark:text-neutral-900 shadow-xs"
            : "border-border bg-surface hover:border-border-strong hover:bg-surface-hover active:bg-surface-active active:scale-[0.98]",
          showCheckmark && "pr-[15px]",
          className
        )}
        {...props}
      >
        <span className="flex items-center leading-tight select-none w-full h-full">
          {logo && <span className="mr-1.5 shrink-0">{logo}</span>}
          {/* {!logo && Icon && <Icon className="h-3.5 w-3.5 mr-1.5 shrink-0 text-primary" />} */}
          {children}
        </span>
        {showCheckmark && (
          <div
            className={cn(
              "absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-400 dark:bg-success shadow-sm flex items-center justify-center transition-opacity duration-0",
              selected ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            <svg
              className="h-3 w-3 text-foreground-inverse"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}
      </button>
    );
  }
);

Pill.displayName = "Pill";
