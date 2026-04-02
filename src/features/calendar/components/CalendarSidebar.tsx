import { type FC, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LocationSelector } from "./LocationSelector.tsx";
import { MiniMonthCalendar } from "./MiniMonthCalendar.tsx";
import { CustomerFilterPicker } from "./CustomerFilterPicker.tsx";
import { getDayFilters } from "../selectors.ts";
import { setDayFiltersAction } from "../actions.ts";
import type { Customer } from "../../../shared/types/customer.ts";
import { Label } from "../../../shared/components/ui/label.tsx";

/**
 * CalendarSidebar — location, customer, and mini month (staff + advanced filters live in the header).
 */
export const CalendarSidebar: FC = () => {
  const dispatch = useDispatch();
  const dayFilters = useSelector(getDayFilters);

  const selectedCustomer = useMemo<Pick<Customer, "id" | "firstName" | "lastName" | "email" | "phone"> | null>(() => {
    if (dayFilters.customerId == null) return null;
    const [firstName = "", ...rest] = (dayFilters.customerFullName ?? "").trim().split(" ").filter(Boolean);
    return {
      id: dayFilters.customerId,
      firstName,
      lastName: rest.join(" "),
      email: dayFilters.customerEmail ?? "",
      phone: dayFilters.customerPhone ?? "",
    };
  }, [dayFilters.customerId, dayFilters.customerFullName, dayFilters.customerEmail, dayFilters.customerPhone]);

  const handleSelectCustomer = useCallback((customer: Pick<Customer, "id" | "firstName" | "lastName" | "email" | "phone">) => {
    dispatch(
      setDayFiltersAction({
        ...dayFilters,
        clientName: undefined,
        customerId: customer.id,
        customerEmail: customer.email || undefined,
        customerPhone: customer.phone || undefined,
        customerFullName: `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim() || undefined,
      }),
    );
  }, [dispatch, dayFilters]);

  const handleClearCustomerFilter = useCallback(() => {
    dispatch(
      setDayFiltersAction({
        ...dayFilters,
        clientName: undefined,
        customerId: undefined,
        customerEmail: undefined,
        customerPhone: undefined,
        customerFullName: undefined,
      }),
    );
  }, [dispatch, dayFilters]);

  return (
    <aside className="w-78 flex-shrink-0 rounded-xl sticky top-4 border-r border-border bg-white dark:bg-surface flex flex-col hidden md:flex min-h-0">
      <div className="flex min-h-0 flex-1 flex-col divide-y divide-border overflow-y-auto scrollbar-hide">
        <div className="px-3 py-4">
          <Label className="mb-2 block text-xs font-medium text-muted-foreground">Location</Label>
          <LocationSelector />
        </div>
        <div className="px-3 py-4">
          <Label className="mb-2 block text-xs font-medium text-muted-foreground">Customer</Label>
          <CustomerFilterPicker
            selectedCustomer={selectedCustomer}
            onSelectCustomer={handleSelectCustomer}
            onClearCustomer={handleClearCustomerFilter}
          />
        </div>
        <div className="min-h-0 flex-1 px-2 py-3">
          <MiniMonthCalendar />
        </div>
      </div>
    </aside>
  );
};
