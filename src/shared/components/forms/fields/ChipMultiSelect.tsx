import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "../../ui/input";
import { cn } from "../../../lib/utils";

export interface ChipOption {
  id: number;
  label: string;
  /** Optional metadata — kept on the option for callers that need to partition
   *  groups by their canonical slug. ChipMultiSelect itself doesn't read it. */
  slug?: string;
}

export interface ChipMultiSelectProps {
  options: ChipOption[];
  selected: number[];
  onChange: (ids: number[]) => void;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  /**
   * Threshold above which an inline typeahead search is shown. Defaults to 12 —
   * groups with <=12 options render as a plain chip strip; groups with more
   * (e.g. Languages, 27 chips) get a search input above the strip.
   */
  searchThreshold?: number;
  searchPlaceholder?: string;
  /**
   * When set and `options.length > initialVisibleCount`, only the first N
   * options (plus any selected items beyond that window) render initially.
   * A "Show all N" trigger reveals the remainder. Typing in the search box
   * also expands the full list. Designed for the Languages group (27 items).
   */
  initialVisibleCount?: number;
  /** Localized label for the "Show all N" trigger. Falls back to English. */
  showAllLabel?: (totalCount: number) => string;
}

const normalize = (s: string) => s.toLocaleLowerCase().trim();

export const ChipMultiSelect: React.FC<ChipMultiSelectProps> = ({
  options,
  selected,
  onChange,
  helperText,
  error,
  disabled,
  className,
  searchThreshold = 12,
  searchPlaceholder = "Search…",
  initialVisibleCount,
  showAllLabel,
}) => {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const showSearch = options.length > searchThreshold;

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const filtered = useMemo(() => {
    if (!showSearch || !query) return options;
    const q = normalize(query);
    return options.filter((opt) => normalize(opt.label).includes(q));
  }, [options, query, showSearch]);

  // Progressive disclosure: when initialVisibleCount is active and no search
  // query, show the first N chips plus any selected items that fall outside
  // the window. Keeps owners' choices always visible without scrolling.
  const visible = useMemo(() => {
    if (!initialVisibleCount || showAll || query) return filtered;
    const head = filtered.slice(0, initialVisibleCount);
    const headIds = new Set(head.map((o) => o.id));
    const tailSelected = filtered
      .slice(initialVisibleCount)
      .filter((o) => selectedSet.has(o.id) && !headIds.has(o.id));
    return [...head, ...tailSelected];
  }, [filtered, initialVisibleCount, showAll, query, selectedSet]);

  const hiddenCount =
    !initialVisibleCount || showAll || query
      ? 0
      : Math.max(0, options.length - visible.length);

  const toggle = (id: number) => {
    if (disabled) return;
    if (selectedSet.has(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {helperText && (
        <p className="text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">
          {helperText}
        </p>
      )}

      {showSearch && (
        <div className="relative">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-3 pointer-events-none z-10"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            disabled={disabled}
            className="pl-11"
            aria-label={searchPlaceholder}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {visible.length === 0 && (
          <p className="text-xs text-foreground-3 italic">No matches</p>
        )}
        {visible.map((opt) => {
          const isSelected = selectedSet.has(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              disabled={disabled}
              aria-pressed={isSelected}
              className={cn(
                "relative inline-flex items-center !min-h-0 h-8 px-3.5 rounded-full border text-[13px] cursor-pointer",
                "transition-[background-color,border-color,color,box-shadow,transform] duration-200",
                "ease-[cubic-bezier(0.16,1,0.3,1)]",
                "active:scale-[0.97]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/50",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isSelected
                  ? "border-foreground-1/15 bg-foreground-1/[0.04] text-foreground-1 font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:border-foreground-1/25 dark:bg-foreground-1/[0.08] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  : "border-border bg-surface text-foreground-2 font-medium hover:border-border-strong hover:bg-surface-hover hover:text-foreground-1",
              )}
            >
              {opt.label}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 dark:bg-success shadow-sm flex items-center justify-center",
                  "transition-[opacity,transform] duration-200",
                  "ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                  isSelected
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-50 pointer-events-none",
                )}
              >
                <svg
                  className="h-2.5 w-2.5 text-white"
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
              </span>
            </button>
          );
        })}
      </div>

      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          disabled={disabled}
          className={cn(
            "text-xs font-medium text-foreground-3 hover:text-foreground-1 cursor-pointer",
            "transition-colors duration-150",
            "focus:outline-none focus-visible:underline",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {showAllLabel
            ? showAllLabel(options.length)
            : `Show all ${options.length} →`}
        </button>
      )}

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default ChipMultiSelect;
