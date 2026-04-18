import { type FC, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogPortal,
  DialogTrigger,
} from "../../../../shared/components/ui/dialog.tsx";
import { Button } from "../../../../shared/components/ui/button.tsx";
import { cn } from "../../../../shared/lib/utils.ts";
import { Skeleton } from "../../../../shared/components/ui/skeleton.tsx";
import { DashedDivider } from "../../../../shared/components/common/DashedDivider.tsx";
import { blockSummaryDialogContentClassName } from "../BlockSummaryPopoverPanel.tsx";
import { toggleEditFormAction } from "../../actions.ts";
import { getEditFormSelector, getSelectedDate } from "../../selectors.ts";
import { dispatchSelectDateAndDayView } from "../../selectDateAndDayViewDispatch.ts";
import { AppointmentViewMode } from "../../types.ts";
import { formatTimeRange, getStaffDisplayNames, getBookingSourceLabel, getBookingSourcePillParts } from "../utils.tsx";
import { getGroupDotColor, getAppointmentBlockColors } from "../../colors.ts";
import { calendarPreferences } from "../../calendarPreferences.ts";
import { Avatar, AvatarFallback, AvatarImage } from "../../../../shared/components/ui/avatar.tsx";
import { getAvatarBgColor } from "../../../setupWizard/components/StepTeam";
import type {
  SlimAppointment,
  Appointment,
  CalendarStaffMember,
  CalendarBlockDto,
} from "../../../../shared/types/calendar.ts";
import { BlockDetailPopover } from "./BlockDetailPopover.tsx";
import { getCalendarBlockReasonIcon, getCalendarBlockReasonLabel } from "../blockReasonMeta.ts";

interface AppointmentGroupDialogProps {
  appointments: SlimAppointment[];
  timeRangeStr: string;
  locationStaff: CalendarStaffMember[];
  timezone?: string;
  day: Date;
  calendarViewMode: AppointmentViewMode;
  children?: React.ReactNode;
  /** When provided, the dialog is controlled externally (no trigger needed). */
  externalOpen?: boolean;
  onExternalClose?: () => void;
  /** Show skeleton loading state inside the dialog. */
  loading?: boolean;
  /** Optional blocks to show below appointments (used in month view). */
  blocks?: CalendarBlockDto[];
}

export const AppointmentGroupDialog: FC<AppointmentGroupDialogProps> = ({
  appointments,
  timeRangeStr,
  locationStaff,
  timezone,
  day,
  calendarViewMode,
  children,
  externalOpen,
  onExternalClose,
  loading = false,
  blocks,
}) => {
  const { t } = useTranslation("calendar");
  const dispatch = useDispatch();
  const editForm = useSelector(getEditFormSelector);
  const selectedDate = useSelector(getSelectedDate);
  const [internalOpen, setInternalOpen] = useState(false);
  const [closingControlled, setClosingControlled] = useState(false);
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? (externalOpen && !closingControlled) : internalOpen;
  const setOpen = isControlled
    ? (v: boolean) => {
        if (!v) {
          setClosingControlled(true);
          setTimeout(() => {
            setClosingControlled(false);
            onExternalClose?.();
          }, 180);
        }
      }
    : setInternalOpen;
  const count = appointments.length;
  const editFormOpen = editForm.open;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleOpenChange = useCallback((next: boolean) => {
    if (!next && editFormOpen) return;
    setOpen(next);
  }, [editFormOpen]);

  const handleAppointmentClick = useCallback(
    (appt: SlimAppointment) => {
      const placeholder: Appointment = {
        id: appt.id, customer: null, teamMembers: [],
        location: { id: 0, name: '', address: '', description: '', phone: '', email: '' },
        scheduledAt: new Date(appt.scheduledAt), endsAt: new Date(appt.endsAt),
        status: appt.status, notes: '', price: 0, cancellationReason: '',
        createdAt: new Date(), updatedAt: new Date(),
        bookedItemName: appt.bookedItemName, bookingGroupId: appt.bookingGroupId,
        bookingGroupOrder: appt.bookingGroupOrder, bookingSource: appt.bookingSource,
        overrideReason: appt.overrideReason,
      };
      dispatch(toggleEditFormAction({ open: true, item: placeholder }));
    },
    [dispatch],
  );

  return (
    <Dialog open={open} modal={false} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogPortal>
        <div
          className="fixed inset-0 z-[70] bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          data-state={open ? "open" : "closed"}
          onClick={() => { if (!editFormOpen) setOpen(false); }}
        />
        <DialogPrimitive.Content
          className={blockSummaryDialogContentClassName}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => { if (editFormOpen) e.preventDefault(); }}
          onInteractOutside={(e) => { if (editFormOpen) e.preventDefault(); }}
          onEscapeKeyDown={(e) => { if (editFormOpen) e.preventDefault(); }}
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">
            {t("page.groupDialog.appointmentCount", { count })}
          </DialogPrimitive.Title>
          {/* Header */}
          <div className="relative shrink-0 px-5 pb-0 pt-5 md:px-6">
            <div className="flex items-center gap-4 pr-12">
              <div className="min-w-0 flex-1 space-y-1">
                <h2 className="min-w-0 truncate text-lg font-semibold leading-snug text-foreground-1">
                  {count > 0 ? t("page.groupDialog.appointmentCount", { count }) : ""}
                  {count > 0 && blocks && blocks.length > 0 ? " · " : ""}
                  {blocks && blocks.length > 0 ? t("page.groupDialog.blockCount", { count: blocks.length }) : ""}
                  {count === 0 && (!blocks || blocks.length === 0) && loading ? t("page.groupDialog.loading") : ""}
                </h2>
                <p className="text-xs text-foreground-3 tabular-nums">
                  {timeRangeStr}
                </p>
              </div>
            </div>
            <div className="absolute right-4 top-5">
              <button
                type="button"
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground opacity-70 transition-[opacity,color]",
                  "hover:opacity-100 hover:text-destructive focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                )}
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <DashedDivider
              marginTop="mt-0"
              paddingTop="pt-3"
              className="mb-0"
              dashPattern="1 1"
            />
          </div>

          {/* Appointment list */}
          <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 px-4 py-3 scrollbar-hide dark:bg-background/50 md:px-6 md:py-4">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl bg-neutral-100 dark:bg-neutral-800/40 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Skeleton className="h-4 w-28 rounded" />
                      <Skeleton className="h-4 w-16 rounded-full ml-auto" />
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Skeleton className="h-3 w-24 rounded" />
                      <Skeleton className="h-3 w-10 rounded ml-auto" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Skeleton className="size-5 rounded-full" />
                      <Skeleton className="h-3 w-20 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
            <div className="space-y-2">
              {appointments.map((appt) => {
                const isGroup = !!appt.bookingGroupId && (appt.groupSize ?? 1) > 1;
                const colorCoding = calendarPreferences.getColorCoding();
                const { backgroundColor, color: textColor } = getAppointmentBlockColors(appt, colorCoding);
                const durationMin = appt.duration ?? Math.round((new Date(appt.endsAt).getTime() - new Date(appt.scheduledAt).getTime()) / 60000);
                const durationStr = durationMin >= 60
                  ? `${Math.floor(durationMin / 60)}h${durationMin % 60 ? ` ${durationMin % 60}m` : ''}`
                  : `${durationMin}m`;
                return (
                  <div
                    key={appt.id}
                    className="rounded-xl p-3 cursor-pointer hover:shadow-md transition-shadow border-none"
                    style={{ backgroundColor, color: textColor }}
                    onClick={() => handleAppointmentClick(appt)}
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold truncate min-w-0 flex-1">
                        {appt.bookedItemName}
                      </p>
                      {isGroup && (
                        <span
                          className="inline-flex items-center gap-1 shrink-0 rounded-full bg-white/30 px-1.5 py-0.5 text-[10px] font-medium tabular-nums"
                        >
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: getGroupDotColor(appt.bookingGroupId!) }}
                          />
                          {appt.bookingGroupOrder ?? 1}/{appt.groupSize}
                        </span>
                      )}
                      {appt.bookingSource && (() => {
                        const { badgeClass, dotClass } = getBookingSourcePillParts(appt.bookingSource);
                        return (
                          <span className={cn(badgeClass, "!min-w-0 !px-1.5 !py-0.5 !text-[9px] !gap-1 shrink-0")}>
                            <span className={cn(dotClass, "!h-1.5 !w-1.5")} />
                            {getBookingSourceLabel(appt.bookingSource)}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="flex items-center mt-1">
                      <p className="text-xs tabular-nums truncate opacity-80">
                        {formatTimeRange(appt.scheduledAt, appt.endsAt, timezone)}
                      </p>
                      <span className="text-xs tabular-nums opacity-65 ml-auto shrink-0">
                        {durationStr}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 opacity-85">
                      <div className="flex -space-x-1.5 shrink-0">
                        {(appt.staffUserIds ?? []).map((staffId) => {
                          const s = locationStaff.find((m) => m.id === staffId);
                          if (!s) return null;
                          const initials = ((s.firstName?.trim()?.[0] ?? "") + (s.lastName?.trim()?.[0] ?? "")).toUpperCase() || "?";
                          const colorKey = `${s.id}-${s.firstName ?? ""}-${s.lastName ?? ""}`;
                          return (
                            <Avatar key={s.id} className="size-5 shrink-0 border border-white dark:border-surface ring-0">
                              {s.profileImage ? <AvatarImage src={s.profileImage} alt="" /> : null}
                              <AvatarFallback
                                className="text-[8px] font-semibold leading-none text-foreground-1"
                                style={{ backgroundColor: getAvatarBgColor(colorKey) }}
                              >
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                          );
                        })}
                      </div>
                      <span className="text-xs truncate">
                        {getStaffDisplayNames(appt.staffUserIds ?? [], locationStaff)}
                      </span>
                      {appt.customerName && (
                        <>
                          <span className="text-xs opacity-60">·</span>
                          <span className="text-xs truncate">{appt.customerName}</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            )}

            {/* Blocks section */}
            {!loading && blocks && blocks.length > 0 && (
              <div className="mt-3">
                {appointments.length > 0 && (
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Blocks</p>
                )}
                <div className="space-y-2">
                  {blocks.map((block) => {
                    const staffName = block.blockScope === 'staff' && block.userId
                      ? getStaffDisplayNames([block.userId], locationStaff) : null;
                    const ReasonIcon = getCalendarBlockReasonIcon(block.reason);
                    const durationMin = block.isAllDay ? null : Math.round(
                      (new Date(block.endsAt).getTime() - new Date(block.startsAt).getTime()) / 60000,
                    );
                    const durationStr = block.isAllDay
                      ? t('page.blocks.allDay')
                      : durationMin != null && durationMin >= 60
                        ? `${Math.floor(durationMin / 60)}h${durationMin % 60 ? ` ${durationMin % 60}m` : ''}`
                        : `${durationMin}m`;
                    return (
                      <BlockDetailPopover
                        key={block.id}
                        block={block}
                        staffName={staffName}
                        locationStaff={locationStaff}
                        timezone={timezone}
                      >
                        <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900/60 p-3 cursor-pointer hover:shadow-md transition-shadow border border-border">
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white dark:bg-neutral-800 border border-border/80">
                              <ReasonIcon className="h-3.5 w-3.5 text-foreground-1" />
                            </div>
                            <p className="text-sm font-bold text-foreground-1 truncate min-w-0 flex-1">
                              {block.title || getCalendarBlockReasonLabel(block.reason, t)}
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-1 pl-[38px]">
                            <span className="text-xs text-foreground-3 tabular-nums truncate">
                              {block.isAllDay ? t('page.blocks.allDay') : formatTimeRange(block.startsAt, block.endsAt, timezone)}
                            </span>
                            <span className="text-xs text-foreground-3 tabular-nums shrink-0">{durationStr}</span>
                          </div>
                          {staffName && (
                            <p className="text-xs text-foreground-3 truncate mt-0.5 pl-[38px]">{staffName}</p>
                          )}
                        </div>
                      </BlockDetailPopover>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 px-4 py-3 border-t border-border md:px-6">
            <Button
              type="button"
              variant="outline"
              size="sm"
              rounded="full"
              className="group w-full inline-flex items-center justify-center gap-1.5 text-xs font-medium"
              onClick={() => {
                setOpen(false);
                dispatchSelectDateAndDayView(dispatch, day, calendarViewMode, selectedDate);
              }}
            >
              View day
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-primary" />
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};
