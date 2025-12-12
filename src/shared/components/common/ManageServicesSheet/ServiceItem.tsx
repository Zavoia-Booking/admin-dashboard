import { Check, Clock } from "lucide-react";
import { cn } from "../../../lib/utils";
import { highlightMatches } from "../../../utils/highlight";
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
  const CurrencyIcon = currencyDisplay.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent duration-150 cursor-pointer",
        "md:hover:bg-info-100 dark:md:hover:bg-surface-hover"
      )}
      onClick={() => onToggle(Number(service.id))}
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
            <div className="flex items-center gap-0 text-xs font-medium text-foreground-1">
              {service.price !== undefined && (
                <>
                  {CurrencyIcon ? (
                    <>
                      <CurrencyIcon className="h-3.5 w-3.5" />
                      <span>{service.price.toFixed(2)}</span>
                    </>
                  ) : (
                    <div className="flex items-center gap-0.5">
                      <span>{currencyDisplay.symbol || ""}</span>
                      <span>{service.price.toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

