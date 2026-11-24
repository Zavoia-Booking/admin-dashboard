import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "../../../shared/components/ui/badge";
import { cn } from "../../../shared/lib/utils";
import { PriceDisplay } from "../../../shared/components/common/PriceDisplay";
import { formatDurationHuman } from "./utils";
import type { BookedItem } from "../bookedItems";

export function BookedItemsList({ items, currency, renderActions }: {
  items: BookedItem[];
  currency: string;
  renderActions?: (item: BookedItem, index: number) => ReactNode;
}) {
  const { t } = useTranslation("calendar");
  return (
    <div className="divide-y divide-border">
      {items.map((item, idx) => (
        <div
          key={`${item.name}-${idx}`}
          className="flex flex-nowrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
        >
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-foreground-1">
              {item.name || t("page.appointments.add.unknownItem")}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-foreground-3 dark:text-foreground-2">
              <span className="tabular-nums">
                {item.durationMinutes > 0
                  ? formatDurationHuman(
                      item.durationMinutes,
                      t,
                    )
                  : "—"}
              </span>
              {item.type === "bundle" ? (
                <Badge
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-[11px] font-medium shadow-none",
                    "border-purple-200 bg-purple-50 text-purple-900 hover:bg-purple-100",
                  )}
                >
                  {t("page.appointments.edit.bundle")}
                </Badge>
              ) : null}
            </div>
            {item.includedServices.length > 0 ? (
              <div className="mt-0.5 text-xs text-foreground-3 dark:text-foreground-2">{item.includedServices.join(", ")}</div>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center justify-end text-right text-sm font-semibold tabular-nums text-foreground-1">
            {item.priceMinor / 100 <= 0 ? (
              <span className="text-foreground-2">
                {t("page.appointments.edit.free")}
              </span>
            ) : (
              <PriceDisplay
                amountDecimal={item.priceMinor / 100}
                currency={currency}
                iconClassName="h-3.5 w-3.5"
              />
            )}
          </div>
          {renderActions?.(item, idx)}
        </div>
      ))}
    </div>
  );
}
