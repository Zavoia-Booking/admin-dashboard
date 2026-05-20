import { Check, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../../lib/utils";
import { highlightMatches } from "../../../utils/highlight";
import { PriceDisplay } from "../PriceDisplay";
import type { Service, CurrencyDisplay } from "./types";

interface ServiceItemProps {
  service: Service;
  isSelected: boolean;
  searchTerm: string;
  currencyDisplay: CurrencyDisplay;
  durationUnit: string;
  onToggle: (id: number) => void;
}

export function ServiceItem({
  service,
  isSelected,
  searchTerm,
  currencyDisplay,
  durationUnit,
  onToggle,
}: ServiceItemProps) {
  const { t } = useTranslation("common");

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent duration-150 cursor-pointer",
        "md:hover:bg-info-100 dark:md:hover:bg-surface-hover",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/60 focus-visible:ring-offset-0"
      )}
      onClick={() => onToggle(Number(service.id))}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle(Number(service.id));
        }
      }}
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
      aria-label={t(isSelected ? "selection.deselect" : "selection.select", { name: service.name })}
    >
      {/* Circle checkbox */}
      <div
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full border flex-shrink-0",
          isSelected
            ? "bg-primary border-primary text-primary-foreground"
            : "border-border-strong bg-surface"
        )}
      >
        {isSelected && <Check className="h-3 w-3" />}
      </div>

      {/* Name + duration + price on one row */}
      <div className="flex items-center flex-1 min-w-0 gap-3">
        {/* Service name (truncated) */}
        <div
          className={cn(
            "text-sm truncate",
            isSelected
              ? "font-semibold text-foreground-1"
              : "font-medium text-foreground-1"
          )}
        >
          {highlightMatches(service.name, searchTerm)}
        </div>

        {/* Duration + price, aligned to the right in fixed-width columns */}
        <div className="flex items-center gap-4 ml-auto whitespace-nowrap">
          {/* Duration column */}
          <div className="flex justify-start w-16">
            <div className="flex items-center gap-1 text-xs text-foreground-3 dark:text-foreground-2">
              {service.duration !== undefined && (
                <>
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {service.duration} {durationUnit}
                  </span>
                </>
              )}
            </div>
          </div>
          {/* Price column */}
          <div className="flex justify-start w-14">
            {service.price !== undefined && (
              <PriceDisplay
                amountDecimal={service.price}
                currency={currencyDisplay.currency}
                className="gap-1"
                iconClassName="h-3.5 w-3.5"
                numberClassName="text-xs font-medium text-foreground-1"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

