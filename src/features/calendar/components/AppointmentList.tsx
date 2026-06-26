import { type FC, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "../../../shared/components/ui/card.tsx";
import type { SlimAppointment, Appointment } from "../../../shared/types/calendar.ts";
import { getSelectedLocationId } from "../selectors.ts";
import { toggleEditFormAction, toggleAddForm } from "../actions.ts";


import { AppointmentListSkeleton } from "./AppointmentListSkeleton.tsx";

import { SlimAppointmentCard } from "./SlimAppointmentCard.tsx";
import { BlockCard } from "./BlockCard.tsx";
import { CalendarListCountPills } from "./CalendarListCountPills.tsx";
import { useDayAppointmentList } from "../hooks/useDayAppointmentList.ts";
import { SlidersHorizontal, Plus } from "lucide-react";
import { EmptyState } from "../../../shared/components/common/EmptyState.tsx";

// ─────────────────────────────────────────────────────────────
// AppointmentList
// ─────────────────────────────────────────────────────────────

export const AppointmentList: FC = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation("calendar");
  const selectedLocationId = useSelector(getSelectedLocationId);
  const {
    sortedItems,
    appointmentColorMap,
    locationStaff,
    timezone,
    isDayLoading,
    hasActiveFilters,
    apptCount,
    blockCount,
  } = useDayAppointmentList();

  const handleAppointmentClick = useCallback((appt: SlimAppointment) => {
    const placeholder: Appointment = {
      id: appt.id, customer: null, teamMembers: [],
      location: { id: 0, name: '', address: '', description: '', phone: '', email: '' },
      scheduledAt: new Date(appt.scheduledAt), endsAt: new Date(appt.endsAt),
      status: appt.status, notes: '', price: 0, cancellationReason: '',
      createdAt: new Date(), updatedAt: new Date(),
      bookedItemName: appt.bookedItemName, bookingSource: appt.bookingSource,
      overrideReason: appt.overrideReason,
    };
    dispatch(toggleEditFormAction({ open: true, item: placeholder }));
  }, [dispatch]);

  if (!selectedLocationId) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">{t("page.appointments.selectLocationAppointments")}</p>
        </CardContent>
      </Card>
    );
  }

  if (isDayLoading) {
    return <AppointmentListSkeleton />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2 px-1">
        {apptCount > 0 || blockCount > 0 ? (
          <CalendarListCountPills apptCount={apptCount} blockCount={blockCount} />
        ) : (
          <></>
        )}
      </div>

      {/* Empty state — no appointments AND no blocks */}
      {sortedItems.length === 0 && hasActiveFilters && (
        <EmptyState
          icon={SlidersHorizontal}
          title={t("page.appointments.noMatchFilters")}
          description={t("page.appointments.noMatchFiltersDayDesc")}
          className="h-[calc(100dvh-143px)] !py-0 !justify-center cursor-default"
        />
      )}
      {sortedItems.length === 0 && !hasActiveFilters && (
        <EmptyState
          title={t("page.appointments.nothingScheduled")}
          description={t("page.appointments.nothingScheduledDayDesc")}
          className="h-[calc(100dvh-145px)] !py-0 !justify-center cursor-default"
          actionButton={{
            label: t("page.appointments.addEvent"),
            icon: Plus,
            onClick: () => dispatch(toggleAddForm({ open: true })),
            gated: true,
          }}
        />
      )}

      {/* Chronological list */}
      {sortedItems.map((item) =>
        item.type === 'appointment' ? (
          <SlimAppointmentCard
            key={`appt-${item.data.id}`}
            appointment={item.data}
            locationStaff={locationStaff}
            colorMap={appointmentColorMap}
            onClick={() => handleAppointmentClick(item.data)}
          />
        ) : (
          <BlockCard
            key={`block-${item.data.id}`}
            block={item.data}
            locationStaff={locationStaff}
            timezone={timezone ?? undefined}
          />
        )
      )}

      {/* Filtered-out notice after list: blocks shown but no appointments match */}
      {sortedItems.length > 0 && apptCount === 0 && hasActiveFilters && (
        <p className="text-sm text-muted-foreground pt-3 cursor-default">
          {t("page.appointments.noMatchFiltersInline")}
        </p>
      )}
    </div>
  );
};
