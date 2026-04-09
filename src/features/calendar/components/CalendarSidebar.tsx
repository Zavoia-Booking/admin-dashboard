import { type FC, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { RotateCcw } from "lucide-react";
import { LocationSelector } from "./LocationSelector.tsx";
import { MiniMonthCalendar } from "./MiniMonthCalendar.tsx";
import { CustomerFilterPicker } from "./CustomerFilterPicker.tsx";
import { getDayFilters, getActiveCalendarFiltersCount, getLocationStaff, getSidebarOpen } from "../selectors.ts";
import { setDayFiltersAction, setStaffFilter } from "../actions.ts";
import type { Customer } from "../../../shared/types/customer.ts";
import { Label } from "../../../shared/components/ui/label.tsx";

/**
 * CalendarSidebar — location, customer, and mini month (staff + advanced filters live in the header).
 */
export const CalendarSidebar: FC = () => {
  const { t } = useTranslation("calendar");
  const dispatch = useDispatch();
  const sidebarOpen = useSelector(getSidebarOpen);
  const dayFilters = useSelector(getDayFilters);
  const activeFilterCount = useSelector(getActiveCalendarFiltersCount);
  const locationStaff = useSelector(getLocationStaff);

  const handleClearAllFilters = useCallback(() => {
    dispatch(setDayFiltersAction({}));
    if (locationStaff.length === 1) {
      dispatch(setStaffFilter([locationStaff[0].id]));
    } else {
      dispatch(setStaffFilter([]));
    }
  }, [dispatch, locationStaff]);

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
    <div
      className="flex-shrink-0 sticky top-4 hidden md:flex flex-col min-h-0 transition-[width] duration-200 ease-linear overflow-hidden"
      style={{ width: sidebarOpen ? '19.5rem' : '0px' }}
    >
    <aside className="rounded-xl border-r border-border bg-white dark:bg-surface flex flex-col min-h-0">
      <div className="flex min-h-0 flex-1 flex-col divide-y divide-border overflow-y-auto scrollbar-hide">
        <div className="px-3 py-4">
          <Label className="mb-2 block text-xs font-medium text-muted-foreground">{t("page.common.location")}</Label>
          <LocationSelector />
        </div>
        <div className="px-3 py-4">
          <Label className="mb-2 block text-xs font-medium text-muted-foreground">{t("page.common.customer")}</Label>
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
    {activeFilterCount > 0 && (
      <div className="flex justify-end px-2 pt-1.5">
        <button
          type="button"
          onClick={handleClearAllFilters}
          className="group inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
        >
          <RotateCcw className="h-3 w-3 shrink-0 transition-colors group-hover:text-primary" />
          {t("page.common.clearFilters")}
          <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[8px] font-bold leading-none text-primary-foreground">
            {activeFilterCount}
          </span>
        </button>
      </div>
    )}
    </div>
  );
};
