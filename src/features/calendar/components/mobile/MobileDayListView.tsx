import { type FC, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { Plus, SlidersHorizontal } from "lucide-react";
import type { SlimAppointment, Appointment } from "../../../../shared/types/calendar";
import {
  toggleEditFormAction,
  toggleAddForm,
} from "../../actions";
import {
  useDayAppointmentList,
  type UseDayAppointmentListResult,
} from "../../hooks/useDayAppointmentList";
import { Skeleton } from "../../../../shared/components/ui/skeleton";
import { EmptyState } from "../../../../shared/components/common/EmptyState";
import { MobileDayEventCard } from "./MobileDayEventCard";
import { MobileDayBlockCard } from "./MobileDayBlockCard";

/**
 * Mobile day list — consumes the shared `useDayAppointmentList` hook so
 * desktop and mobile share the exact same data layer (selectors, filter,
 * color map, merge+sort). Only the rendered cards differ.
 */

/* ── Mobile skeleton ── */
const MobileCardSkeleton: FC = () => (
  <div className="flex rounded-xl border border-border bg-white dark:bg-surface overflow-hidden">
    <Skeleton className="w-1 shrink-0" />
    <div className="flex-1 px-3 py-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-2 w-2 rounded-full" />
      </div>
      <Skeleton className="h-4 w-36" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
    </div>
  </div>
);

const MobileListSkeleton: FC = () => (
  <div className="space-y-2.5 px-2 pt-2 pb-4">
    {Array.from({ length: 5 }, (_, i) => (
      <MobileCardSkeleton key={i} />
    ))}
  </div>
);

interface MobileDayListViewProps {
  /** When provided, uses this data instead of the default day-mode hook. Used by MobileMonthView. */
  data?: UseDayAppointmentListResult;
}

export const MobileDayListView: FC<MobileDayListViewProps> = ({ data }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation("calendar");
  const dayData = useDayAppointmentList();
  const {
    sortedItems,
    appointmentColorMap,
    locationStaff,
    timezone,
    isDayLoading,
    hasActiveFilters,
  } = data ?? dayData;

  const handleAppointmentClick = useCallback(
    (appt: SlimAppointment) => {
      const placeholder: Appointment = {
        id: appt.id,
        customer: null,
        teamMembers: [],
        location: { id: 0, name: "", address: "", description: "", phone: "", email: "" },
        scheduledAt: new Date(appt.scheduledAt),
        endsAt: new Date(appt.endsAt),
        status: appt.status,
        notes: "",
        price: 0,
        cancellationReason: "",
        createdAt: new Date(),
        updatedAt: new Date(),
        bookedItemName: appt.bookedItemName,
        bookingGroupId: appt.bookingGroupId,
        bookingGroupOrder: appt.bookingGroupOrder,
        bookingSource: appt.bookingSource,
        overrideReason: appt.overrideReason,
      };
      dispatch(toggleEditFormAction({ open: true, item: placeholder }));
    },
    [dispatch],
  );

  if (isDayLoading) return <MobileListSkeleton />;

  if (sortedItems.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        {hasActiveFilters ? (
          <EmptyState
            icon={SlidersHorizontal}
            title={t("page.appointments.noMatchFilters")}
            description={t("page.appointments.noMatchFiltersDayDesc")}
            className="!py-0 !gap-6"
          />
        ) : (
          <EmptyState
            title={t("page.appointments.nothingScheduled")}
            description={t("page.appointments.nothingScheduledDayDesc")}
            className="!py-0 !gap-6"
            actionButton={{
              label: t("page.appointments.addEvent"),
              icon: Plus,
              onClick: () => dispatch(toggleAddForm({ open: true })),
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 px-2 pt-2 pb-4">
      {sortedItems.map((item) =>
        item.type === "appointment" ? (
          <MobileDayEventCard
            key={`appt-${item.data.id}`}
            appointment={item.data}
            locationStaff={locationStaff}
            groupSize={item.groupSize}
            colorMap={appointmentColorMap}
            timezone={timezone ?? undefined}
            onClick={() => handleAppointmentClick(item.data)}
          />
        ) : (
          <MobileDayBlockCard
            key={`block-${item.data.id}`}
            block={item.data}
            locationStaff={locationStaff}
            timezone={timezone ?? undefined}
          />
        ),
      )}
    </div>
  );
};
