import {
  AlertCircle,
  Check,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../../../shared/lib/utils";
import type { LocationWithAssignments } from "../../types";

interface MarketplaceLocationListProps {
  locations: LocationWithAssignments[];
  selectedLocationId: number | null;
  onSelect: (locationId: number) => void;
  disabled?: boolean;
  className?: string;
}

export function MarketplaceLocationList({
  locations,
  selectedLocationId,
  onSelect,
  disabled = false,
  className,
}: MarketplaceLocationListProps) {
  const { t } = useTranslation("marketplace");

  return (
    <nav
      className={cn("space-y-2", className)}
      aria-label={t("locations.listLabel")}
    >
      {locations.map((location) => {
        const isSelected = location.id === selectedLocationId;
        const photoCount = location.portfolioImages?.length ?? 0;

        return (
          <button
            key={location.id}
            type="button"
            data-location-id={location.id}
            onClick={() => onSelect(location.id)}
            disabled={disabled}
            aria-current={isSelected ? "true" : undefined}
            className={cn(
              "group relative flex w-full cursor-pointer items-start gap-3 overflow-hidden rounded-lg border px-2 py-3 pr-3 text-left",
              "transition-[background-color,border-color,box-shadow,transform] duration-200 ease-[var(--ease-out-strong)] motion-reduce:transition-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/60 focus-visible:ring-offset-0",
              "disabled:cursor-wait disabled:opacity-65 disabled:hover:border-border disabled:hover:bg-white disabled:active:scale-100 dark:disabled:hover:bg-surface",
              isSelected
                ? "border-border-strong bg-white shadow-xs dark:bg-surface"
                : "border-border bg-white hover:border-border-strong hover:bg-surface-hover active:scale-[0.99] dark:bg-surface",
            )}
          >
            <span
              className={cn(
                "mt-0.5 hidden size-4.5 shrink-0 items-center justify-center rounded-full border-2 xl:flex",
                "transition-[background-color,border-color] duration-200 ease-[var(--ease-out-strong)] motion-reduce:transition-none",
                isSelected
                  ? "border-primary bg-primary"
                  : "border-border-strong group-hover:border-primary",
              )}
              aria-hidden="true"
            >
              {/* Always mounted so deselection animates out instead of vanishing. */}
              <Check
                className={cn(
                  "size-3.5 text-white transition-[opacity,transform] duration-200 ease-[var(--ease-out-strong)] motion-reduce:transition-none",
                  isSelected
                    ? "scale-100 opacity-100"
                    : "scale-50 opacity-0 motion-reduce:scale-100",
                )}
                strokeWidth={3}
              />
            </span>

            <span className="min-w-0 flex-1">
              <span
                className="block truncate text-sm font-semibold text-foreground-1"
                title={location.name}
              >
                {location.name}
              </span>
              <span
                className="mt-0.5 block truncate text-xs leading-5 text-foreground-3 dark:text-foreground-2"
                title={location.address}
              >
                {location.address}
              </span>

              {photoCount === 0 && (
                <span className="mt-2 flex min-w-0 items-center text-[11px] font-medium">
                  <span className="inline-flex items-center gap-1 text-warning">
                    <AlertCircle className="size-3" aria-hidden="true" />
                    {t("locations.needsPhoto")}
                  </span>
                </span>
              )}
            </span>

            <ChevronRight
              className={cn(
                "mt-3 size-4 shrink-0 text-foreground-3 transition-transform duration-200 motion-reduce:transition-none xl:hidden",
                "group-hover:translate-x-0.5 group-hover:text-primary",
                isSelected && "text-primary",
              )}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </nav>
  );
}

export default MarketplaceLocationList;
