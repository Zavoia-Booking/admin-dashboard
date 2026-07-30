import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight, Calendar, CalendarClock, CalendarPlus, Check, ChevronsUpDown, Clock, Footprints,
  Loader2, Percent, Phone, Plus, PlusCircle, ShieldCheck, Tag, TriangleAlert, X,
} from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Label } from '../../../shared/components/ui/label';
import { Input } from '../../../shared/components/ui/input';
import { Command, CommandItem, CommandList } from '../../../shared/components/ui/command';
import { ResponsivePopover } from '../../../shared/components/ui/responsive-popover';
import { useIsMobile } from '../../../shared/hooks/use-mobile';
import { Badge } from '../../../shared/components/ui/badge';
import { Pill } from '../../../shared/components/ui/pill';
import { PersonAvatar } from '../../../shared/components/common/PersonAvatar';
import { cn } from '../../../shared/lib/utils';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import { FormFooter } from '../../../shared/components/forms/FormFooter';
import { SliderSectionHeader } from '../../../shared/components/forms/SliderSectionHeader';
import { TextareaField } from '../../../shared/components/forms/fields/TextareaField';
import { SliderContentDivider } from '../../../shared/components/common/SliderContentDivider';
import { ManageServicesSheet } from '../../../shared/components/common/ManageServicesSheet/ManageServicesSheet';
import { ManageBundlesSheet } from '../../../shared/components/common/ManageBundlesSheet/ManageBundlesSheet';
import { useDispatch, useSelector } from 'react-redux';
import { PriceDisplay } from '../../../shared/components/common/PriceDisplay';
import { selectCurrentUser, selectIsTeamMember } from '../../auth/selectors';
import {
  adminCreateAppointmentGroup,
  beginAddFormCloseAfterMutations,
  updateAppointment,
} from '../actions';
import {
  getSelectedLocationId,
  getLocationStaff,
  getLocationWorkingHours,
  getLocationOpen247,
  getBookingSettings,
  getAddFormPrefill,
  getLocationServices,
  getLocationTeamMembers,
  getLocationBundles,
  getLocationContextLoading,
  getCalendarTimezone,
} from '../selectors';
import type { AppointmentBookingSource } from '../../../shared/types/calendar';
import { formatSlotTime, getEndTimeString, formatTimeKey } from './utils';
import DatePicker from '../../../shared/components/ui/date-picker';
import ConfirmDialog from '../../../shared/components/common/ConfirmDialog';
import { useTimeSlots } from '../hooks/useTimeSlots';
import { useWorkingHoursForDate } from '../hooks/useWorkingHoursForDate';
import { isTimeRangeOutsideWorkingHours, doesTimeRangeSpanMidnight } from '../workingHours';
import { Skeleton } from '../../../shared/components/ui/skeleton';
import { getAvailableSlotsRequest } from '../api';
import {
  type FormState,
  areNumberArraysEqual,
  type AppointmentItem,
  allItemsHaveStaff,
  buildScheduledDate,
  getConfirmDialogDescription,
  getConfirmDialogTitle,
  getConfirmButtonTitle,
  isValidAppointmentItem,
  getItemAllowedStaffIds,
  getEligibleTeamMembers,
  getGroupItemsForPayload,
  getGroupTotalDurationMinutes,
  getGroupTotalPriceMajor,
  buildEditSnapshotFromPrefill,
  buildMinimalEditAppointmentPayload,
  getEditMutationDispatchCount,
  pickUpdateAppointmentRequestBody,
  hasItemStaffChanged,
  type EditFormSnapshot,
  type EditAppointmentPayload,
} from './addAppointmentSliderHelpers';
import CustomerSearchPicker from './CustomerSearchPicker';
import { AssignmentReminderNote } from '../../services/components/AssignmentReminderNote';
import type { Service as ManageSheetService } from '../../../shared/components/common/ManageServicesSheet/types';
import type { Bundle as ManageSheetBundle } from '../../../shared/components/common/ManageBundlesSheet/types';
import { buildZonedDateFromDateKey, formatDateInTimezone, getCalendarLocale } from '../timezone';
import { validateDescription } from '../../../shared/utils/validation';
import "./addAppointmentSliderPopover.css";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface AddAppointmentSliderProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialForm: FormState = {
  customerId: null,
  customerDisplay: null,
  date: null,
  time: '',
  notes: '',
  bookingSource: 'admin' as AppointmentBookingSource,
};

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const SLIDER_COMBO_TRIGGER_CLASS =
  '!px-5 h-10 text-sm border-border-strong text-foreground-1 group disabled:opacity-50 disabled:cursor-not-allowed';

const BOOKING_SOURCES: { value: AppointmentBookingSource; labelKey: string; icon: React.ReactNode }[] = [
  { value: 'admin' as AppointmentBookingSource, labelKey: 'page.common.bookingSources.admin', icon: <ShieldCheck className="h-4 w-4" /> },
  { value: 'phone' as AppointmentBookingSource, labelKey: 'page.common.bookingSources.phone', icon: <Phone className="h-4 w-4" /> },
  { value: 'walk_in' as AppointmentBookingSource, labelKey: 'page.common.bookingSources.walkIn', icon: <Footprints className="h-4 w-4" /> },
];

interface AppointmentItemRowService {
  serviceId: number;
  serviceName: string;
  staffIds?: number[];
  customDuration?: number | null;
  defaultDuration?: number;
  customPrice?: number | null;
  defaultPrice?: number;
  category?: { id: number; name: string; color?: string } | null;
  staffOverrides?: Array<{ userId: number; customPrice: number | null; customDuration: number | null }>;
}
interface AppointmentItemRowBundle {
  bundleId: number;
  bundleName: string;
  serviceCount?: number;
  calculatedDisplayPrice?: number;
  durationMinutes?: number;
  staffIds?: number[];
  priceType?: 'sum' | 'fixed' | 'discount';
}
interface AppointmentItemRowTeamMember {
  userId: number;
  firstName: string;
  lastName: string;
  profileImage: string | null;
}

interface AppointmentItemRowProps {
  item: AppointmentItem;
  index: number;
  locationServices: AppointmentItemRowService[];
  locationBundles: AppointmentItemRowBundle[];
  locationTeamMembers: AppointmentItemRowTeamMember[];
  /** ISO 4217 code threaded so the row can format prices via the shared
   *  PriceDisplay with locale-aware grouping. */
  currency: string;
  onUpdateStaff: (index: number, staffUserId: number | null) => void;
  onRemoveItem: (index: number) => void;
  /** Assignments deep link used by the "nobody can perform this" notice, which
   *  is a dead end without it. */
  assignmentsPath: string;
  /** Closes the slider before the notice navigates away. */
  onNavigateAway: () => void;
  /** When true, the staff picker gets a soft "next step" pulse — only one row in
   *  the list should receive this at a time (the first one still unassigned). */
  isFirstUnassigned?: boolean;
}

function AppointmentItemRow({
  item,
  index,
  locationServices,
  locationBundles,
  locationTeamMembers,
  currency,
  onUpdateStaff,
  onRemoveItem,
  assignmentsPath,
  onNavigateAway,
  isFirstUnassigned = false,
}: AppointmentItemRowProps) {
  const { t } = useTranslation('assignments');
  const { t: tCal } = useTranslation('calendar');
  const serviceForRow = locationServices.find((s) => s.serviceId === item.serviceId);
  const bundleForRow = locationBundles.find((b) => b.bundleId === item.bundleId);
  const staffForRow = locationTeamMembers.find((t) => t.userId === item.staffUserId);
  const allowedStaffIdsForRow = getItemAllowedStaffIds(item, locationServices, locationBundles);
  const eligibleTeamMembersForRow = getEligibleTeamMembers(allowedStaffIdsForRow, locationTeamMembers);
  /** Nobody is assigned to this service/bundle here — it cannot be booked until
   *  someone is assigned on the Assignments page. */
  const hasNoEligibleStaff = allowedStaffIdsForRow != null && eligibleTeamMembersForRow.length === 0;
  const rowLabel = serviceForRow ? serviceForRow.serviceName : bundleForRow ? bundleForRow.bundleName : (item as { itemName?: string }).itemName ?? tCal('page.appointments.add.unknownItem');
  const staffOverride = serviceForRow?.staffOverrides?.length && item.staffUserId != null
    ? serviceForRow.staffOverrides.find((o) => o.userId === item.staffUserId)
    : null;
  const hasLocationCustom = serviceForRow
    ? (serviceForRow.customPrice != null || serviceForRow.customDuration != null)
    : false;
  const hasStaffCustom = staffOverride
    ? (staffOverride.customPrice != null || staffOverride.customDuration != null)
    : false;
  const durationMinutes = serviceForRow
    ? (item.staffUserId != null && serviceForRow.staffOverrides?.length
        ? (serviceForRow.staffOverrides.find((o) => o.userId === item.staffUserId)?.customDuration ?? serviceForRow.customDuration ?? serviceForRow.defaultDuration ?? 0)
        : (serviceForRow.customDuration ?? serviceForRow.defaultDuration ?? 0))
    : (bundleForRow?.durationMinutes ?? 0);
  const price = serviceForRow
    ? ((item.staffUserId != null && serviceForRow.staffOverrides?.length
        ? (serviceForRow.staffOverrides.find((o) => o.userId === item.staffUserId)?.customPrice ?? serviceForRow.customPrice ?? serviceForRow.defaultPrice ?? 0)
        : (serviceForRow.customPrice ?? serviceForRow.defaultPrice ?? 0)) / 100)
    : (bundleForRow?.calculatedDisplayPrice ?? 0);
  const itemTypeLabel = serviceForRow ? tCal('page.appointments.edit.service') : tCal('page.appointments.edit.bundle');
  const isService = !!serviceForRow;
  const hasCustomRates = isService && (hasLocationCustom || hasStaffCustom);
  const isMobile = useIsMobile();
  const [staffPopoverOpen, setStaffPopoverOpen] = useState(false);
  const [closingAnimation, setClosingAnimation] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleStaffPopoverOpenChange = useCallback((open: boolean) => {
    setStaffPopoverOpen(open);
    if (open) {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      setClosingAnimation(false);
    } else {
      setClosingAnimation(true);
      closeTimeoutRef.current = setTimeout(() => {
        setClosingAnimation(false);
        closeTimeoutRef.current = null;
      }, 250);
    }
  }, []);

  useEffect(() => () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
  }, []);

  // No panel is attached below the trigger on mobile — the list is a bottom sheet.
  const showOpenBorder = !isMobile && (staffPopoverOpen || closingAnimation);
  // Pulse only when: this row is the focus target, a staff hasn't been picked,
  // and the popover is fully closed (no pulse fighting the open-state border).
  const pulseStaffPicker =
    isFirstUnassigned &&
    !item.staffUserId &&
    !hasNoEligibleStaff &&
    !staffPopoverOpen &&
    !closingAnimation;

  return (
    <div className="group rounded-lg border border-border bg-white dark:bg-surface hover:border-border-strong">
      <div className="flex flex-col sm:flex-row sm:items-stretch gap-3 px-4 py-3">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="truncate text-sm font-medium text-foreground-1">{rowLabel}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className={cn(
                'text-[11px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1.5 shrink-0',
                isService
                  ? 'bg-green-50 border-green-200 hover:bg-green-100'
                  : 'bg-purple-50 border-purple-200 hover:bg-purple-100',
              )}
            >
              <div className={cn('h-2 w-2 rounded-full', isService ? 'bg-green-500' : 'bg-purple-500')} />
              <span className="text-neutral-900">{itemTypeLabel}</span>
            </Badge>
            {isService && serviceForRow?.category?.name && (
              <Badge
                variant="secondary"
                className={cn(
                  "text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 border-border text-neutral-900 dark:text-neutral-900",
                  !serviceForRow.category?.color && "bg-muted/80 text-foreground-2"
                )}
                style={
                  serviceForRow.category?.color
                    ? { backgroundColor: serviceForRow.category.color }
                    : undefined
                }
              >
                {serviceForRow.category.name}
              </Badge>
            )}
            {!isService && bundleForRow?.priceType && (() => {
              const priceTypeConfig: Record<string, { label: string; color: string; Icon: typeof PlusCircle }> = {
                sum: { label: tCal('page.appointments.add.sum'), color: 'var(--color-info-100)', Icon: PlusCircle },
                fixed: { label: tCal('page.appointments.add.fixed'), color: 'var(--color-success-100)', Icon: Tag },
                discount: { label: tCal('page.appointments.add.discount'), color: 'var(--color-primary-100)', Icon: Percent },
              };
              const config = priceTypeConfig[bundleForRow.priceType];
              if (!config) return null;
              const { label, color: bgColor, Icon } = config;
              return (
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 border-border text-neutral-900 dark:text-neutral-900 inline-flex items-center justify-center gap-1 leading-none",
                    !bgColor && "bg-muted/80 text-foreground-2"
                  )}
                  style={bgColor ? { backgroundColor: bgColor } : undefined}
                >
                  <Icon className="h-3 w-3 shrink-0" />
                  <span className="leading-none">{label}</span>
                </Badge>
              );
            })()}
          </div>
          <div className="flex items-center mt-6 gap-3 flex-wrap text-sm text-foreground-2">
            {durationMinutes > 0 && (
              <span>{durationMinutes} min</span>
            )}
            <PriceDisplay
              amountDecimal={price}
              currency={currency}
              className="ml-auto gap-1 font-medium text-foreground-1"
              iconClassName="h-3.5 w-3.5 text-foreground-1"
            />
          </div>
          {hasCustomRates && (
            <div className="mt-2">
              <Badge
                variant="secondary"
                className="text-[11px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1.5 bg-purple-50 border-purple-200 shrink-0"
              >
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <span className="text-neutral-900">
                  {t('page.locationService.badge.custom')}
                </span>
              </Badge>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 sm:shrink-0 sm:self-stretch w-full sm:w-auto">
          {hasNoEligibleStaff ? (
            // No assignable team member: a picker here would open onto an empty
            // list, so state the reason inline instead.
            <div className="flex h-8 w-full sm:w-[280px] items-center gap-2 rounded-full border border-amber-300/70 bg-amber-50 px-3 text-xs font-medium text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-300">
              <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{tCal('page.appointments.add.noStaffAssigned')}</span>
            </div>
          ) : (
            <ResponsivePopover
              open={staffPopoverOpen}
              onOpenChange={handleStaffPopoverOpenChange}
              title={tCal('page.appointments.add.assignStaff')}
              trigger={
                    <Button
                      variant="ghost"
                      rounded="full"
                      size="sm"
                      className={cn(
                        "h-8 w-full sm:w-[280px] justify-between !px-3 border border-border hover:border-border-strong text-foreground-3 dark:text-foreground-2 hover:text-primary dark:hover:text-primary dark:group-hover:text-primary group-hover:text-primary group-hover:bg-info-100/20 dark:hover:bg-muted-foreground/10",
                        showOpenBorder && "!rounded-b-none !rounded-t-[16px] border-x border-t border-b-0 border-border-strong dark:border-border-strong shadow-none",
                        pulseStaffPicker && "staff-picker-pulse"
                      )}
                    >
                      <span className="flex items-center gap-2 min-w-0 flex-1">
                        {staffForRow && (
                          <PersonAvatar
                            key={staffForRow.userId}
                            id={staffForRow.userId}
                            firstName={staffForRow.firstName}
                            lastName={staffForRow.lastName}
                            profileImage={staffForRow.profileImage}
                            className="size-5"
                            initialsClassName="text-[9px] font-semibold"
                          />
                        )}
                        <span className="truncate">
                          {staffForRow ? `${staffForRow.firstName} ${staffForRow.lastName}` : tCal('page.appointments.add.assignStaff')}
                        </span>
                      </span>
                      <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    </Button>
              }
              contentClassName={cn(
                "w-[var(--radix-popover-trigger-width)] md:w-[var(--radix-popover-trigger-width)] box-border -mt-px border border-t-0 bg-surface dark:bg-neutral-900 shadow-none p-0 z-[80] rounded-t-none rounded-b-[16px]",
                "add-appointment-popover-expand",
                showOpenBorder ? "border-border-strong dark:border-border-strong" : "border-input dark:border-border",
              )}
              side="bottom"
              align="end"
              sideOffset={0}
              avoidCollisions={false}
            >
                    <Command shouldFilter={false} className="bg-transparent">
                      <CommandList>
                        {eligibleTeamMembersForRow.map((t, teamIndex) => {
                          return (
                            <CommandItem
                              key={t.userId}
                              value={`${t.firstName} ${t.lastName}`}
                              onSelect={() => {
                                onUpdateStaff(index, t.userId);
                                handleStaffPopoverOpenChange(false);
                              }}
                              className={cn(
                                "h-9 cursor-pointer transition-colors duration-200 gap-2",
                                teamIndex === eligibleTeamMembersForRow.length - 1 && "rounded-b-[12px]",
                              )}
                            >
                              <Check className={cn('h-4 w-4 shrink-0', item.staffUserId === t.userId ? 'opacity-100' : 'opacity-0')} />
                              <PersonAvatar
                                id={t.userId}
                                firstName={t.firstName}
                                lastName={t.lastName}
                                profileImage={t.profileImage}
                                className="size-6"
                                initialsClassName="text-[10px] font-semibold"
                              />
                              <span className="truncate">{t.firstName} {t.lastName}</span>
                            </CommandItem>
                          );
                        })}
                      </CommandList>
                    </Command>
            </ResponsivePopover>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            rounded="full"
            className="shrink-0 h-8 w-8 text-foreground-3 dark:text-foreground-2 hover:text-destructive hover:bg-destructive/10"
            onClick={() => onRemoveItem(index)}
            aria-label={tCal('page.appointments.add.removeRow')}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {hasNoEligibleStaff && (
        <div className="px-3 pb-3">
          <AssignmentReminderNote
            text={tCal(isService
              ? 'page.appointments.add.noStaffForService'
              : 'page.appointments.add.noStaffForBundle')}
            linkLabel={tCal('page.appointments.add.assignmentsLink')}
            to={assignmentsPath}
            onNavigate={onNavigateAway}
            tone="warning"
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

const AddAppointmentSlider: React.FC<AddAppointmentSliderProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation('calendar');
  const dispatch = useDispatch();
  const isMobile = useIsMobile();

  // Redux state
  const selectedLocationId = useSelector(getSelectedLocationId);
  const locationStaff = useSelector(getLocationStaff);
  const workingHours = useSelector(getLocationWorkingHours);
  const open247 = useSelector(getLocationOpen247);
  const bookingSettings = useSelector(getBookingSettings);
  const prefill = useSelector(getAddFormPrefill);
  const locationServices = useSelector(getLocationServices);
  const allLocationTeamMembers = useSelector(getLocationTeamMembers);
  const locationBundles = useSelector(getLocationBundles);
  const servicesLoading = useSelector(getLocationContextLoading);
  const calendarTimezone = useSelector(getCalendarTimezone);
  const currentUser = useSelector(selectCurrentUser);
  const isTeamMember = useSelector(selectIsTeamMember);
  const businessCurrency = currentUser?.business?.businessCurrency ?? 'eur';

  // Team members can only create/assign appointments for THEMSELVES, so the
  // assignable-staff pool is just the current user (backend enforces the same).
  const locationTeamMembers = useMemo(
    () =>
      isTeamMember && currentUser?.id != null
        ? allLocationTeamMembers.filter((t) => t.userId === currentUser.id)
        : allLocationTeamMembers,
    [allLocationTeamMembers, isTeamMember, currentUser?.id],
  );

  const pendingGroupSubmitRef = useRef<Parameters<typeof adminCreateAppointmentGroup.request>[0] | null>(null);
  const pendingUpdateRef = useRef<{
    appointmentId: number;
    data: Record<string, unknown>;
  } | null>(null);
  const rescheduleAppointmentIdRef = useRef<number | null>(null);
  const userChangedTimeRef = useRef(false);
  /** Prefilled time when opening edit; kept valid even if availability omits past slots. */
  const [editInitialTime, setEditInitialTime] = useState('');
  /** Initial field values when opening edit (for dirty check + minimal PUT payload). */
  const [editSnapshot, setEditSnapshot] = useState<EditFormSnapshot | null>(null);

  /** Use ref first so reschedule always updates the appointment that was opened, even if prefill is later overwritten (e.g. by clicking a slot). */
  const editingAppointmentId = rescheduleAppointmentIdRef.current ?? prefill?.appointmentId ?? null;
  const isEditMode = editingAppointmentId !== null;

  /** When opening from a staff column click (not editing, no service pre-selected), filter services/bundles to only those the staff can perform. */
  const prefillStaffFilter = (!isEditMode && prefill?.staffUserId && !prefill?.serviceId && !prefill?.bundleId)
    ? prefill.staffUserId
    : null;

  // Form state
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Confirmation when creating or rescheduling out of hours or on a block slot
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmReason, setConfirmReason] = useState<'out_of_hours' | 'on_block' | null>(null);
  const [overrideReasonText, setOverrideReasonText] = useState('');

  const [isManageServicesSheetOpen, setIsManageServicesSheetOpen] = useState(false);
  const [isManageBundlesSheetOpen, setIsManageBundlesSheetOpen] = useState(false);
  const [appointmentItems, setAppointmentItems] = useState<AppointmentItem[]>([]);

  /** Available slot starts from API (ISO strings); when set, time picker shows only these. */
  const [availableSlots, setAvailableSlots] = useState<string[] | null>(null);
  const [outOfHoursSlots, setOutOfHoursSlots] = useState<string[]>([]);
  const [nextAvailableDate, setNextAvailableDate] = useState<string | null>(null);
  const [availableSlotsLoading, setAvailableSlotsLoading] = useState(false);
  const [slotFetchError, setSlotFetchError] = useState<string | null>(null);
  // Time picker state
  const [hourOpen, setHourOpen] = useState(false);
  const [hourClosingAnimation, setHourClosingAnimation] = useState(false);
  const hourCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─────────────────────────────────────────────────────────────
  // Reset form when slider opens/closes
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      // Reset everything a fresh session needs — this runs at the start of a new
      // open, so any stale values from the previous session get overwritten before
      // anything is painted.
      userChangedTimeRef.current = false;
      if (prefill?.appointmentId != null) {
        rescheduleAppointmentIdRef.current = prefill.appointmentId;
        setEditInitialTime(prefill?.time ?? '');
      } else {
        rescheduleAppointmentIdRef.current = null;
        setEditInitialTime('');
      }
      setForm({
        ...initialForm,
        customerId: prefill?.customerId ?? null,
        customerDisplay: prefill?.customerDisplay ?? null,
        date: prefill?.date ?? new Date(),
        time: prefill?.time ?? '',
        notes: prefill?.notes ?? '',
        bookingSource: (prefill?.bookingSource as AppointmentBookingSource) ?? ('admin' as AppointmentBookingSource),
      });
      const prefillServiceId = prefill?.serviceId ?? null;
      const prefillStaffId = prefill?.staffUserId ?? null;
      const prefillBundleId = prefill?.bundleId ?? null;
      if (prefillServiceId != null || prefillBundleId != null) {
        setAppointmentItems([
          {
            serviceId: prefillServiceId ?? null,
            bundleId: prefillBundleId,
            staffUserId: prefillStaffId ?? null,
          },
        ]);
      } else {
        setAppointmentItems([]);
      }
      if (prefill?.appointmentId != null) {
        setEditSnapshot(buildEditSnapshotFromPrefill(prefill, selectedLocationId));
      } else {
        setEditSnapshot(null);
      }
      // Wipe slot state here rather than on close — the slot-fetching effect will
      // refill it based on the new prefill's date/service immediately after.
      setAvailableSlots(null);
      setOutOfHoursSlots([]);
      setNextAvailableDate(null);
      setAvailableSlotsLoading(false);
      setError(null);
      setSlotFetchError(null);
    } else {
      // Close branch intentionally minimal: anything visible in the panel body must
      // stay painted during Vaul's close animation, otherwise the user sees the form
      // wipe itself mid-slide. Only reset state that (a) isn't visible in the panel
      // (refs, nested modal-sheet flags) or (b) would leak into the next session if
      // left hanging (error banners, sheets).
      setIsManageServicesSheetOpen(false);
      setIsManageBundlesSheetOpen(false);
    }
  }, [isOpen, prefill, selectedLocationId]);

  // Drop staff picks the location context says cannot perform the item — a
  // prefill from a staff column, or assignments edited while the form is open.
  // Edit mode is left alone: an existing booking keeps the staff it was made with.
  useEffect(() => {
    if (isEditMode) return;
    setAppointmentItems((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        if (item.staffUserId == null) return item;
        const allowed = getItemAllowedStaffIds(item, locationServices, locationBundles);
        if (allowed == null || allowed.includes(item.staffUserId)) return item;
        changed = true;
        return { ...item, staffUserId: null };
      });
      return changed ? next : prev;
    });
  }, [isEditMode, locationServices, locationBundles]);

  // Fetch available slots when location, date, and service chain are set (create mode only)
  const slotDurationMinutes = useMemo(
    () => getGroupTotalDurationMinutes(getGroupItemsForPayload(appointmentItems), locationServices, locationBundles),
    [appointmentItems, locationServices, locationBundles],
  );
  const MINUTES_PER_DAY = 24 * 60;
  const durationExceedsOneDay = slotDurationMinutes > MINUTES_PER_DAY;

  const slotFetchItems = useMemo(() => {
    const validItems = appointmentItems.filter((item) => item.serviceId != null || item.bundleId != null);
    if (validItems.length === 0) {
      return null;
    }
    if (validItems.some((item) => item.staffUserId == null)) {
      return null;
    }
    const resolvedItems = validItems.map((item) => ({
      ...(item.serviceId != null ? { serviceId: item.serviceId } : {}),
      ...(item.bundleId != null ? { bundleId: item.bundleId } : {}),
      ...(item.staffUserId != null ? { staffUserId: item.staffUserId } : {}),
    }));
    return resolvedItems;
  }, [appointmentItems]);

  useEffect(() => {
    if (!selectedLocationId || !form.date || !slotFetchItems) {
      setAvailableSlots(null);
      setOutOfHoursSlots([]);
      setNextAvailableDate(null);
      setAvailableSlotsLoading(false);
      setSlotFetchError(null);
      return;
    }
    const controller = new AbortController();
    const dateStr = formatDateInTimezone(form.date, calendarTimezone);
    setAvailableSlotsLoading(true);
    setSlotFetchError(null);
    setAvailableSlots(null);
    setOutOfHoursSlots([]);
    setNextAvailableDate(null);
    const slotRequestId = `${Date.now()}-${selectedLocationId}`;
    getAvailableSlotsRequest({
      locationId: selectedLocationId,
      date: dateStr,
      items: slotFetchItems,
      findNextAvailable: true,
    }, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setAvailableSlots(res.availableSlots ?? []);
        setOutOfHoursSlots(res.outOfHoursSlots ?? []);
        setNextAvailableDate(res.nextAvailableDate ?? null);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error('[SLOT] fetch:error', {
          requestId: slotRequestId,
          message: err?.message ?? 'Unknown availability fetch error',
        });
        setAvailableSlots([]);
        setOutOfHoursSlots([]);
        setNextAvailableDate(null);
        setSlotFetchError(t('page.appointments.add.couldNotLoadAvailability'));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setAvailableSlotsLoading(false);
        }
      });
    return () => controller.abort();
  }, [selectedLocationId, form.date, slotFetchItems, calendarTimezone]);

  // Services and team for the selected location come from Redux (fetched once when location is selected via assignments/full).

  const handleDateChange = useCallback((date: Date) => {
    setForm((prev) => ({ ...prev, date, time: '' }));
  }, []);

  const handleTimeSelect = useCallback((slot: string) => {
    userChangedTimeRef.current = true;
    setForm((prev) => ({ ...prev, time: slot }));
    setHourOpen(false);
  }, []);

  const handleHourOpenChange = useCallback((open: boolean) => {
    setHourOpen(open);
    if (open) {
      if (hourCloseTimeoutRef.current) {
        clearTimeout(hourCloseTimeoutRef.current);
        hourCloseTimeoutRef.current = null;
      }
      setHourClosingAnimation(false);
    } else {
      setHourClosingAnimation(true);
      hourCloseTimeoutRef.current = setTimeout(() => {
        setHourClosingAnimation(false);
        hourCloseTimeoutRef.current = null;
      }, 250);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (hourCloseTimeoutRef.current) clearTimeout(hourCloseTimeoutRef.current);
    };
  }, []);

  const handleBookingSourceSelect = useCallback((source: AppointmentBookingSource) => {
    setForm((prev) => ({ ...prev, bookingSource: source }));
  }, []);

  const servicesForSheet = useMemo<ManageSheetService[]>(() => {
    const filtered = prefillStaffFilter
      ? locationServices.filter((s) => !s.staffIds?.length || s.staffIds.includes(prefillStaffFilter))
      : locationServices;
    return filtered.map((service) => ({
      id: service.serviceId,
      name: service.serviceName,
      price: (service.customPrice ?? service.defaultPrice) / 100,
      duration: service.customDuration ?? service.defaultDuration,
      category: service.category ?? null,
    }));
  }, [locationServices, prefillStaffFilter]);

  const bundlesForSheet = useMemo<ManageSheetBundle[]>(() => {
    const filtered = prefillStaffFilter
      ? locationBundles.filter((b) => !b.staffIds?.length || b.staffIds.includes(prefillStaffFilter))
      : locationBundles;
    return filtered.map((bundle) => ({
      bundleId: bundle.bundleId,
      bundleName: bundle.bundleName,
      priceType: bundle.priceType,
      fixedPriceAmountMinor: bundle.fixedPriceAmountMinor ?? null,
      discountPercentage: bundle.discountPercentage ?? null,
      calculatedPriceAmountMinor: bundle.calculatedPriceAmountMinor,
      displayPrice: bundle.calculatedDisplayPrice,
      serviceCount: bundle.serviceCount ?? bundle.serviceIds.length,
    }));
  }, [locationBundles, prefillStaffFilter]);

  /** Auto-pick only from staff actually assigned to the item — a lone team member
   *  is not implicitly eligible for a service nobody was assigned to. */
  const pickAutoStaff = useCallback((allowedStaffIds: number[] | null): number | null => {
    if (allowedStaffIds == null) {
      return locationStaff.length === 1 ? locationStaff[0].id : null;
    }
    if (allowedStaffIds.length === 0) return null;
    if (allowedStaffIds.length === 1) return allowedStaffIds[0];
    if (locationStaff.length === 1 && allowedStaffIds.includes(locationStaff[0].id)) {
      return locationStaff[0].id;
    }
    return null;
  }, [locationStaff]);

  const getAutoStaffForService = useCallback((serviceId: number): number | null => (
    pickAutoStaff(getItemAllowedStaffIds({ serviceId, bundleId: null }, locationServices, locationBundles))
  ), [locationServices, locationBundles, pickAutoStaff]);

  const getAutoStaffForBundle = useCallback((bundleId: number): number | null => (
    pickAutoStaff(getItemAllowedStaffIds({ serviceId: null, bundleId }, locationServices, locationBundles))
  ), [locationServices, locationBundles, pickAutoStaff]);

  const selectedServiceIds = useMemo(
    () => appointmentItems
      .map((item) => item.serviceId)
      .filter((serviceId): serviceId is number => serviceId != null),
    [appointmentItems],
  );

  const selectedBundleIds = useMemo(
    () => appointmentItems
      .map((item) => item.bundleId)
      .filter((bundleId): bundleId is number => bundleId != null),
    [appointmentItems],
  );

  const applySelectedServices = useCallback((serviceIds: number[]) => {
    const validServiceIds = Array.from(
      new Set(
        serviceIds.filter((serviceId) =>
          locationServices.some((service) => service.serviceId === serviceId),
        ),
      ),
    );
    setAppointmentItems((prev) => {
      const existingServices = prev.filter((item) => item.serviceId != null && item.bundleId == null);
      const bundleItems = prev.filter((item) => item.bundleId != null && item.serviceId == null);
      const prevIds = existingServices.map((item) => item.serviceId as number);
      if (areNumberArraysEqual(prevIds, validServiceIds)) return prev;
      const nextServiceItems: AppointmentItem[] = validServiceIds.map((serviceId) => {
        const existing = existingServices.find((item) => item.serviceId === serviceId);
        // null = unknown eligibility (service missing from the context); an empty
        // array means nobody is assigned, so no staff may be carried over.
        const allowedStaffIds = getItemAllowedStaffIds({ serviceId, bundleId: null }, locationServices, locationBundles);
        const existingStaff = existing?.staffUserId ?? null;
        const isExistingStaffValid = existingStaff != null && (allowedStaffIds == null || allowedStaffIds.includes(existingStaff));
        const isPrefillStaffValid = prefillStaffFilter != null && (allowedStaffIds == null || allowedStaffIds.includes(prefillStaffFilter));
        return {
          serviceId,
          bundleId: null,
          staffUserId: isExistingStaffValid
            ? existingStaff
            : isPrefillStaffValid
              ? prefillStaffFilter
              : getAutoStaffForService(serviceId),
        };
      });
      const nextItems = [...nextServiceItems, ...bundleItems];
      return nextItems;
    });
  }, [getAutoStaffForService, locationServices, locationBundles, prefillStaffFilter]);

  const handleSelectSingleService = useCallback((serviceId: number) => {
    applySelectedServices([serviceId]);
    setIsManageServicesSheetOpen(false);
  }, [applySelectedServices]);

  const handleUpdateItemStaff = useCallback((index: number, staffUserId: number | null) => {
    let changed = false;
    setAppointmentItems((prev) => {
      if (prev[index]?.staffUserId === staffUserId) return prev;
      changed = true;
      return prev.map((item, itemIndex) => (
        itemIndex === index ? { ...item, staffUserId } : item
      ));
    });
    if (changed) setForm((prev) => ({ ...prev, time: '' }));
  }, []);

  const handleRemoveItem = useCallback((index: number) => {
    setAppointmentItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }, []);

  const handleApplyBundleIds = useCallback((bundleIds: number[]) => {
    setAppointmentItems((prev) => {
      const serviceItems = prev.filter((item) => item.serviceId != null && item.bundleId == null);
      const existingBundleItems = prev.filter((item) => item.bundleId != null && item.serviceId == null);
      const nextBundleItems: AppointmentItem[] = bundleIds.map((bundleId) => {
        const existing = existingBundleItems.find((item) => item.bundleId === bundleId);
        const allowedStaffIds = getItemAllowedStaffIds({ serviceId: null, bundleId }, locationServices, locationBundles);
        const isPrefillStaffValid = prefillStaffFilter != null && (allowedStaffIds == null || allowedStaffIds.includes(prefillStaffFilter));
        return {
          serviceId: null,
          bundleId,
          staffUserId: existing?.staffUserId ?? (isPrefillStaffValid ? prefillStaffFilter : getAutoStaffForBundle(bundleId)),
        };
      });
      const nextItems = [...serviceItems, ...nextBundleItems];
      return nextItems;
    });
    setIsManageBundlesSheetOpen(false);
  }, [getAutoStaffForBundle, locationServices, locationBundles, prefillStaffFilter]);

  // ─────────────────────────────────────────────────────────────
  // Derived data
  // ─────────────────────────────────────────────────────────────

  // Working hours for the selected date
  const timeSlots = useTimeSlots(bookingSettings?.slotIntervalMinutes);
  const displayTimeSlots = useMemo(() => {
    if (availableSlotsLoading) {
      return [];
    }
    let list: string[];
    if (availableSlots == null) {
      list = timeSlots;
    } else if (availableSlots.length === 0) {
      return [];
    } else {
      const times = availableSlots.map((iso) => formatTimeKey(iso, calendarTimezone));
      list = [...new Set(times)].sort();
    }
    // Filter out past slots when the selected date is today (in calendar timezone)
    if (!form.date) return list;
    const now = Date.now();
    const isSelectedDateToday =
      formatDateInTimezone(form.date, calendarTimezone) === formatDateInTimezone(new Date(), calendarTimezone);
    const minAdvanceMs =
      isSelectedDateToday &&
      bookingSettings?.enforceMinAdvanceForAdmin &&
      (bookingSettings?.minAdvanceBookingMinutes ?? 0) > 0
        ? (bookingSettings.minAdvanceBookingMinutes ?? 0) * 60 * 1000
        : 0;
    const earliestStart = now + minAdvanceMs;
    return list.filter((slot) => {
      const slotStart = buildScheduledDate(form.date, slot, calendarTimezone);
      if (!slotStart || slotStart.getTime() < now) return false;
      if (minAdvanceMs > 0 && slotStart.getTime() < earliestStart) return false;
      if (doesTimeRangeSpanMidnight(slotStart, slotDurationMinutes, calendarTimezone)) return false;
      return true;
    });
  }, [
    availableSlots,
    availableSlotsLoading,
    timeSlots,
    calendarTimezone,
    form.date,
    slotDurationMinutes,
    bookingSettings?.enforceMinAdvanceForAdmin,
    bookingSettings?.minAdvanceBookingMinutes,
  ]);
  const outOfHoursTimeSet = useMemo(() => {
    return new Set(
      outOfHoursSlots.map((iso) => formatTimeKey(iso, calendarTimezone)),
    );
  }, [calendarTimezone, outOfHoursSlots]);

  const { dayWorkingHours, isSlotOutsideHours } = useWorkingHoursForDate(
    form.date,
    workingHours,
    open247
  );
  const isClosedDay = dayWorkingHours ? !dayWorkingHours.isOpen : false;

  // Backend returns availableSlots + outOfHoursSlots (which of those are outside working hours).
  // Use that when we have it; only use frontend working-hours when showing full-day list (e.g. edit mode, no API data).
  const { inHoursSlots, slotsOutsideHours } = useMemo(() => {
    if (open247) {
      return { inHoursSlots: [...displayTimeSlots], slotsOutsideHours: [] };
    }
    const hasBackendClassification = availableSlots != null;
    if (hasBackendClassification) {
      const inHours = displayTimeSlots.filter((slot) => !outOfHoursTimeSet.has(slot));
      const outside = displayTimeSlots.filter((slot) => outOfHoursTimeSet.has(slot));
      return { inHoursSlots: inHours, slotsOutsideHours: outside };
    }
    const inHours: string[] = [];
    const outside: string[] = [];
    for (const slot of displayTimeSlots) {
      if (isSlotOutsideHours(slot)) outside.push(slot);
      else inHours.push(slot);
    }
    return { inHoursSlots: inHours, slotsOutsideHours: outside };
  }, [displayTimeSlots, isSlotOutsideHours, outOfHoursTimeSet, open247, availableSlots]);

  const workingHoursLabel = useMemo(() => {
    if (open247) return t('page.appointments.add.open247');
    if (!dayWorkingHours?.isOpen) return t('page.appointments.closed');
    return `${dayWorkingHours.open} – ${dayWorkingHours.close}`;
  }, [open247, dayWorkingHours, t]);

  // Bounds for "within working hours" (used only to style slots; all slots remain selectable)

  // ─────────────────────────────────────────────────────────────
  // Submit
  // ─────────────────────────────────────────────────────────────

  const allCreateItemsValid = useMemo(
    () => appointmentItems.length > 0 && appointmentItems.every((item) => isValidAppointmentItem(item)),
    [appointmentItems],
  );

  const isDirty = useMemo(() => {
    if (!isEditMode || editSnapshot == null) return true;
    if (form.date?.toDateString() !== editSnapshot.date?.toDateString()) return true;
    if (form.time !== editSnapshot.time) return true;
    if (form.notes.trim() !== editSnapshot.notes.trim()) return true;
    if (selectedLocationId !== editSnapshot.locationId) return true;
    const editItem = appointmentItems.find((item) => item.serviceId != null);
    if ((editItem?.serviceId ?? null) !== editSnapshot.serviceId) return true;
    if (hasItemStaffChanged(appointmentItems, editSnapshot)) return true;
    return false;
  }, [isEditMode, editSnapshot, form.date, form.time, form.notes, selectedLocationId, appointmentItems]);

  /** True when staff/service/location/date/time differ from snapshot (excludes notes). Used to narrow edit-mode slot bypasses. */
  const hasSchedulingFieldChanged = useMemo(() => {
    if (!isEditMode || editSnapshot == null) return false;
    if (form.date?.toDateString() !== editSnapshot.date?.toDateString()) return true;
    if (form.time !== editSnapshot.time) return true;
    if (selectedLocationId !== editSnapshot.locationId) return true;
    const editItem = appointmentItems.find((item) => item.serviceId != null);
    if ((editItem?.serviceId ?? null) !== editSnapshot.serviceId) return true;
    if (hasItemStaffChanged(appointmentItems, editSnapshot)) return true;
    return false;
  }, [isEditMode, editSnapshot, form.date, form.time, selectedLocationId, appointmentItems]);

  const isTimeInAvailableSlots = useMemo(() => {
    if (form.time === '') return false;
    if (availableSlots == null) return isEditMode;
    if (isEditMode && editInitialTime !== '' && form.time === editInitialTime && !hasSchedulingFieldChanged) return true;
    return displayTimeSlots.includes(form.time);
  }, [availableSlots, displayTimeSlots, form.time, isEditMode, editInitialTime, hasSchedulingFieldChanged]);
  const isScheduledInPast = useMemo(() => {
    const scheduled = buildScheduledDate(form.date, form.time, calendarTimezone);
    if (scheduled === null) return false;
    if (
      isEditMode &&
      editSnapshot &&
      editInitialTime !== '' &&
      form.time === editInitialTime &&
      form.date != null &&
      editSnapshot.date != null &&
      form.date.toDateString() === editSnapshot.date.toDateString()
    ) {
      return false;
    }
    return scheduled.getTime() < Date.now();
  }, [form.date, form.time, calendarTimezone, isEditMode, editSnapshot, editInitialTime]);
  const isSpanMidnight = useMemo(() => {
    if (!form.date || !form.time) return false;
    const scheduled = buildScheduledDate(form.date, form.time, calendarTimezone);
    return scheduled !== null && doesTimeRangeSpanMidnight(scheduled, slotDurationMinutes, calendarTimezone);
  }, [form.date, form.time, calendarTimezone, slotDurationMinutes]);
  const totalPrice = useMemo(
    () => getGroupTotalPriceMajor(appointmentItems, locationServices, locationBundles),
    [appointmentItems, locationServices, locationBundles],
  );
  const selectedServicesCount = useMemo(
    () => appointmentItems.filter((item) => item.serviceId != null).length,
    [appointmentItems],
  );
  const selectedBundlesCount = useMemo(
    () => appointmentItems.filter((item) => item.bundleId != null).length,
    [appointmentItems],
  );

  const notesError = useMemo(
    () => validateDescription(form.notes, t, 500),
    [form.notes, t],
  );

  const allowSubmitWhileSlotsLoading =
    isEditMode &&
    editInitialTime !== '' &&
    form.time === editInitialTime &&
    !hasSchedulingFieldChanged;

  // When we switch to showing only available slots, clear time if current selection is not in the list
  useEffect(() => {
    if (availableSlots != null && availableSlots.length > 0 && form.time && !displayTimeSlots.includes(form.time)) {
      if (isEditMode && editInitialTime !== '' && form.time === editInitialTime && !hasSchedulingFieldChanged) return;
      setForm((prev) => ({ ...prev, time: '' }));
    }
  }, [availableSlots, displayTimeSlots, form.time, isEditMode, editInitialTime, hasSchedulingFieldChanged]);

  const canSubmit =
    form.date !== null &&
    form.time !== '' &&
    selectedLocationId !== null &&
    !isScheduledInPast &&
    !isSpanMidnight &&
    !durationExceedsOneDay &&
    isTimeInAvailableSlots &&
    (allowSubmitWhileSlotsLoading || !availableSlotsLoading) &&
    allCreateItemsValid &&
    !notesError &&
    (!isEditMode || isDirty);

  const runEditAppointmentMutations = useCallback(
    (
      appointmentId: number,
      rawPayload: EditAppointmentPayload & Record<string, unknown>,
    ) => {
      const count = getEditMutationDispatchCount(rawPayload);
      if (count <= 0) return false;
      dispatch(beginAddFormCloseAfterMutations(count));

      const updateData = pickUpdateAppointmentRequestBody(rawPayload);
      dispatch(
        updateAppointment.request({
          appointmentId,
          data: updateData,
        }),
      );
      return true;
    },
    [dispatch],
  );

  const doUpdateAppointment = useCallback(() => {
    const pending = pendingUpdateRef.current;
    if (!pending) return;
    setSubmitting(true);
    setError(null);
    const reason = overrideReasonText.trim() || undefined;
    const dataWithOverride = { ...pending.data, overrideReason: reason } as EditAppointmentPayload & Record<string, unknown>;
    try {
      const ran = runEditAppointmentMutations(
        pending.appointmentId,
        dataWithOverride,
      );
      if (!ran) {
        setError(t('page.appointments.add.nothingToUpdate'));
        pendingUpdateRef.current = null;
        setConfirmOpen(false);
        setConfirmReason(null);
        setOverrideReasonText('');
        return;
      }
      pendingUpdateRef.current = null;
      setConfirmOpen(false);
      setConfirmReason(null);
      setOverrideReasonText('');
    } catch {
      setError(t('page.appointments.add.failedToUpdate'));
    } finally {
      setSubmitting(false);
    }
  }, [overrideReasonText, runEditAppointmentMutations, t]);

  const doCreateGroupAppointment = useCallback(() => {
    const pending = pendingGroupSubmitRef.current;
    if (!pending) return;
    setSubmitting(true);
    setError(null);
    const reason = overrideReasonText.trim() || undefined;
    try {
      dispatch(adminCreateAppointmentGroup.request({
        ...pending,
        overrideReason: reason,
      }));
      pendingGroupSubmitRef.current = null;
      setConfirmOpen(false);
      setConfirmReason(null);
      setOverrideReasonText('');
      onClose();
    } catch {
      setError(t('page.appointments.add.failedToCreate'));
    } finally {
      setSubmitting(false);
    }
  }, [dispatch, onClose, overrideReasonText, t]);

  const handleConfirmOverrides = useCallback(() => {
    if (pendingGroupSubmitRef.current) doCreateGroupAppointment();
    else if (pendingUpdateRef.current) doUpdateAppointment();
  }, [doCreateGroupAppointment, doUpdateAppointment]);

  const handleCancelOverrides = useCallback(() => {
    pendingGroupSubmitRef.current = null;
    pendingUpdateRef.current = null;
    setConfirmReason(null);
    setOverrideReasonText('');
  }, []);

  const openConfirmDialog = useCallback((reason: 'out_of_hours' | 'on_block') => {
    setConfirmReason(reason);
    setConfirmOpen(true);
  }, []);

  const durationMinutes = slotDurationMinutes;

  const submitEdit = useCallback(
    (
      scheduledDate: Date | null,
      payload: EditAppointmentPayload,
    ) => {
      const hasScheduledAt = payload.scheduledAt != null;
      const isOutOfHours =
        hasScheduledAt &&
        scheduledDate != null &&
        isTimeRangeOutsideWorkingHours(scheduledDate, durationMinutes, dayWorkingHours, open247, calendarTimezone);
      if (isOutOfHours) {
        pendingUpdateRef.current = {
          appointmentId: editingAppointmentId!,
          data: {
            ...payload,
            allowOutOfHours: true,
          },
        };
        openConfirmDialog('out_of_hours');
        return;
      }
      setSubmitting(true);
      try {
        const ran = runEditAppointmentMutations(editingAppointmentId!, payload);
        if (!ran) {
          setError(t('page.appointments.add.nothingToUpdate'));
        }
      } catch {
        setError(t('page.appointments.add.failedToUpdate'));
      } finally {
        setSubmitting(false);
      }
    },
    [
      durationMinutes,
      dayWorkingHours,
      open247,
      calendarTimezone,
      editingAppointmentId,
      openConfirmDialog,
      runEditAppointmentMutations,
    ],
  );

  const submitGroupCreate = useCallback(
    (scheduledDate: Date) => {
      const items = getGroupItemsForPayload(appointmentItems);
      const groupPayload = {
        locationId: selectedLocationId!,
        customerId: form.customerId ?? undefined,
        items,
        scheduledAt: scheduledDate.toISOString(),
        notes: form.notes.trim() || undefined,
        bookingSource: form.bookingSource,
      };
      const totalDurationMinutes = getGroupTotalDurationMinutes(items, locationServices, locationBundles);
      const groupOutOfHours = isTimeRangeOutsideWorkingHours(scheduledDate, totalDurationMinutes, dayWorkingHours, open247, calendarTimezone);
      if (groupOutOfHours) {
        pendingGroupSubmitRef.current = {
          ...groupPayload,
          allowOutOfHours: groupOutOfHours,
        };
        openConfirmDialog('out_of_hours');
        return;
      }
      setSubmitting(true);
      try {
        dispatch(adminCreateAppointmentGroup.request(groupPayload));
        onClose();
      } catch {
        setError(t('page.appointments.add.failedToCreate'));
      } finally {
        setSubmitting(false);
      }
    },
    [
      form,
      appointmentItems,
      selectedLocationId,
      locationServices,
      locationBundles,
      dayWorkingHours,
      open247,
      calendarTimezone,
      openConfirmDialog,
      dispatch,
      onClose,
    ],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !selectedLocationId || !form.date) return;

    setError(null);

    const scheduledDate = buildScheduledDate(form.date, form.time, calendarTimezone);
    if (!scheduledDate) return;
    const editScheduleUnchanged =
      isEditMode &&
      editSnapshot &&
      editInitialTime !== '' &&
      form.time === editInitialTime &&
      form.date != null &&
      editSnapshot.date != null &&
      form.date.toDateString() === editSnapshot.date.toDateString();
    if (!editScheduleUnchanged && scheduledDate.getTime() < Date.now()) {
      setError(
        isEditMode
          ? t('page.appointments.add.cannotReschedulePast')
          : t('page.appointments.add.cannotSchedulePast'),
      );
      return;
    }
    if (doesTimeRangeSpanMidnight(scheduledDate, slotDurationMinutes, calendarTimezone)) {
      setError(t('page.appointments.add.spansTwoDays'));
      return;
    }

    if (notesError) return;

    if (isEditMode && editingAppointmentId) {
      const editItem = appointmentItems.find((item) => item.serviceId != null);
      if (!editItem?.serviceId) {
        setError(t('page.appointments.add.selectServiceFirst'));
        return;
      }
      if (!editSnapshot) {
        setError(t('page.appointments.add.couldNotLoadData'));
        return;
      }
      const payload = buildMinimalEditAppointmentPayload({
        snapshot: editSnapshot,
        form,
        appointmentItems,
        selectedLocationId,
        scheduledDate,
      });
      if (Object.keys(payload).length === 0) {
        return;
      }
      const scheduledForOoh =
        payload.scheduledAt != null ? scheduledDate : null;
      submitEdit(scheduledForOoh, payload);
      return;
    }

    submitGroupCreate(scheduledDate);
  };

  const hasSelectedAnyItem = appointmentItems.length > 0;
  const isStaffReadyForSlots = allItemsHaveStaff(appointmentItems);
  const canSelectDateTime = isStaffReadyForSlots && !durationExceedsOneDay;

  /** At least one selected item has nobody assigned to it at this location, so
   *  it can never get a staff member here — the fix lives on Assignments. */
  const hasItemWithoutEligibleStaff = useMemo(
    () => appointmentItems.some((item) => {
      const allowed = getItemAllowedStaffIds(item, locationServices, locationBundles);
      return allowed != null && getEligibleTeamMembers(allowed, locationTeamMembers).length === 0;
    }),
    [appointmentItems, locationServices, locationBundles, locationTeamMembers],
  );

  const assignmentsPath = selectedLocationId != null
    ? `/assignments?locationId=${selectedLocationId}`
    : '/assignments';

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <BaseSlider
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? t('page.appointments.add.editAppointment') : t('page.appointments.add.newAppointment')}
      subtitle={isEditMode ? t('page.appointments.add.editSubtitle') : t('page.appointments.add.newSubtitle')}
      icon={isEditMode ? Calendar : CalendarPlus}
      iconColor="text-foreground-1"
      contentClassName="bg-surface scrollbar-hide"
      footer={
        <FormFooter
          onCancel={onClose}
          formId="add-appointment-form"
          cancelLabel={t('page.appointments.add.cancel')}
          submitLabel={isEditMode ? t('page.appointments.add.saveChanges') : t('page.appointments.add.createAppointment')}
          disabled={!canSubmit}
          isLoading={submitting}
        />
      }
    >
      <form
        id="add-appointment-form"
        onSubmit={handleSubmit}
        className="h-full flex flex-col cursor-default"
      >
        <div className="flex-1 overflow-y-auto p-1 py-6 pt-0 md:p-6 md:pt-0 bg-surface">
          <div className="max-w-2xl mx-auto space-y-8 cursor-default">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <CustomerSearchPicker
              isOpen={isOpen}
              isEditMode={isEditMode}
              selectedCustomer={form.customerDisplay}
              onSelectCustomer={(customer) => {
                setForm((prev) => ({
                  ...prev,
                  customerId: customer.id,
                  customerDisplay: {
                    id: customer.id,
                    firstName: customer.firstName,
                    lastName: customer.lastName,
                    email: customer.email,
                    phone: customer.phone,
                  },
                }));
              }}
              onClearCustomer={() => {
                setForm((prev) => ({ ...prev, customerId: null, customerDisplay: null }));
              }}
            />

            <SliderContentDivider />

            {/* ── Services & Bundles Section ── */}
            <div className="space-y-5">
              <SliderSectionHeader
                title={
                  isEditMode
                    ? t('page.appointments.add.service')
                    : t('page.appointments.add.servicesAndBundles')
                }
                description={
                  isEditMode
                    ? t('page.appointments.add.serviceDesc')
                    : t('page.appointments.add.servicesAndBundlesDesc')
                }
              />
              {!isEditMode && locationBundles.length > 0 ? (
                <div className="w-full flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    rounded="full"
                    onClick={() => setIsManageServicesSheetOpen(true)}
                    className={`${SLIDER_COMBO_TRIGGER_CLASS} justify-center`}
                    disabled={servicesLoading}
                  >
                    {servicesLoading ? (
                      <span className="flex items-center gap-2 text-foreground-3 dark:text-foreground-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading services...
                      </span>
                    ) : (
                      <>
                        <Plus className="h-3 w-3 text-primary transition-transform duration-400 ease-out group-hover:scale-140" />
                        <span>{t('page.appointments.add.selectServices')}</span>
                      </>
                    )}
                  </Button>
                  <div className="h-6 w-px bg-border justify-self-center" aria-hidden="true" />
                  <Button
                    type="button"
                    variant="outline"
                    rounded="full"
                    onClick={() => setIsManageBundlesSheetOpen(true)}
                    className={`${SLIDER_COMBO_TRIGGER_CLASS} justify-center`}
                  >
                    <Plus className="h-3 w-3 text-primary transition-transform duration-400 ease-out group-hover:scale-140" />
                    <span>{t('page.appointments.add.selectBundles')}</span>
                  </Button>
                </div>
              ) : (
                <div className="flex w-full">
                  <Button
                    type="button"
                    variant="outline"
                    rounded="full"
                    onClick={() => setIsManageServicesSheetOpen(true)}
                    className={`${SLIDER_COMBO_TRIGGER_CLASS} w-full sm:w-auto`}
                    disabled={servicesLoading}
                  >
                    {servicesLoading ? (
                      <span className="flex items-center gap-2 text-foreground-3 dark:text-foreground-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading services...
                      </span>
                    ) : (
                      <>
                        <Plus className="h-3 w-3 text-primary transition-transform duration-400 ease-out group-hover:scale-140" />
                        <span>{t('page.appointments.add.selectServices')}</span>
                      </>
                    )}
                  </Button>
                </div>
              )}

              <ManageServicesSheet
                isOpen={isManageServicesSheetOpen}
                onClose={() => setIsManageServicesSheetOpen(false)}
                allServices={servicesForSheet}
                initialSelectedIds={selectedServiceIds}
                mode={isEditMode ? 'single' : 'multi'}
                onSelect={handleSelectSingleService}
                onApply={(serviceIds) => {
                  applySelectedServices(serviceIds);
                  setIsManageServicesSheetOpen(false);
                }}
                title={isEditMode ? t('page.appointments.add.selectService') : t('page.appointments.add.selectServices')}
                subtitle={isEditMode ? t('page.appointments.add.selectServiceDesc') : t('page.appointments.add.selectServicesDesc')}
                expandAllCategories={true}
              />
              {!isEditMode && locationBundles.length > 0 && (
                <ManageBundlesSheet
                  isOpen={isManageBundlesSheetOpen}
                  onClose={() => setIsManageBundlesSheetOpen(false)}
                  allBundles={bundlesForSheet}
                  initialSelectedIds={selectedBundleIds}
                  onApply={handleApplyBundleIds}
                  title={t('page.appointments.add.selectBundles')}
                  subtitle={t('page.appointments.add.selectBundlesDesc')}
                />
              )}

              {appointmentItems.length === 0 ? (
                <div className="p-3 rounded-lg bg-surface-hover text-foreground-3 dark:text-foreground-2 text-sm">
                  {/* Two whole sentences rather than one built by concatenation:
                      the clause order differs by language. */}
                  {!isEditMode && locationBundles.length > 0
                    ? t('page.appointments.add.emptyPromptServicesAndBundles')
                    : t('page.appointments.add.emptyPromptServices')}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedServicesCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 bg-green-50 border-green-200 hover:bg-green-100"
                      >
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="font-semibold text-neutral-900">{selectedServicesCount}</span>
                        <span className="text-neutral-900">
                          {t('page.appointments.add.serviceCount', { count: selectedServicesCount })}
                        </span>
                      </Badge>
                    )}
                    {selectedBundlesCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 bg-purple-50 border-purple-200 hover:bg-purple-100"
                      >
                        <div className="h-2 w-2 rounded-full bg-purple-500" />
                        <span className="font-semibold text-neutral-900">{selectedBundlesCount}</span>
                        <span className="text-neutral-900">
                          {t('page.appointments.add.bundleCount', { count: selectedBundlesCount })}
                        </span>
                      </Badge>
                    )}
                  </div>
                  {(() => {
                    // Track which row is the "next step" to draw attention to —
                    // the first item without an assigned staff. Only one row
                    // pulses at a time so the UI doesn't turn into a light show.
                    // Rows nobody can perform are skipped: there is nothing to pick.
                    const firstUnassignedIdx = appointmentItems.findIndex((it) => {
                      if (it.staffUserId != null) return false;
                      const allowed = getItemAllowedStaffIds(it, locationServices, locationBundles);
                      return allowed == null || getEligibleTeamMembers(allowed, locationTeamMembers).length > 0;
                    });
                    return appointmentItems.map((item, idx) => (
                      <AppointmentItemRow
                        key={`${item.serviceId ?? 'b'}-${item.bundleId ?? 's'}-${idx}`}
                        item={item}
                        index={idx}
                        locationServices={locationServices}
                        locationBundles={locationBundles}
                        locationTeamMembers={locationTeamMembers}
                        currency={businessCurrency}
                        onUpdateStaff={handleUpdateItemStaff}
                        onRemoveItem={handleRemoveItem}
                        assignmentsPath={assignmentsPath}
                        onNavigateAway={onClose}
                        isFirstUnassigned={idx === firstUnassignedIdx}
                      />
                    ));
                  })()}
                  <div className="rounded-lg border border-border bg-surface-hover/50 dark:bg-surface px-4 py-3 flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-foreground-1">
                      {t('page.appointments.add.totalLabel')}
                    </span>
                    <div className="flex items-center gap-3 text-sm text-foreground-2">
                      <PriceDisplay
                        amountDecimal={totalPrice}
                        currency={businessCurrency}
                        className="gap-1 font-semibold text-foreground-1"
                        iconClassName="h-3.5 w-3.5 text-foreground-1"
                      />
                      {durationMinutes > 0 && (
                        <>
                          <span className="h-4 w-px shrink-0 bg-border" aria-hidden />
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-foreground-2 shrink-0" />
                            <span>{durationMinutes} min</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <SliderContentDivider />

            {/* ── Date & Time Section ── */}
            <div className="space-y-5">
              <SliderSectionHeader
                title={t('page.appointments.add.dateAndTime')}
                description={t('page.appointments.add.dateAndTimeDesc')}
              />
              {!hasSelectedAnyItem && (
                <div className="p-3 rounded-lg bg-surface-hover text-foreground-3 dark:text-foreground-2 text-sm">
                  {t('page.appointments.add.lockedNeedItems')}
                </div>
              )}
              {hasSelectedAnyItem && !isStaffReadyForSlots && (
                <div className="p-3 rounded-lg bg-surface-hover text-foreground-3 dark:text-foreground-2 text-sm">
                  {/* Asking for a staff pick is useless when an item has none to
                      pick from — point at Assignments instead. */}
                  {hasItemWithoutEligibleStaff
                    ? t('page.appointments.add.lockedNeedAssignments')
                    : t('page.appointments.add.lockedNeedStaff')}
                </div>
              )}

              {hasSelectedAnyItem && isStaffReadyForSlots && durationExceedsOneDay && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {t('page.appointments.add.durationExceedsDay')}
                </div>
              )}

              {isClosedDay && (
                <div className="p-3 rounded-lg bg-surface-hover text-foreground-3 dark:text-foreground-2 text-sm">
                  {t('page.appointments.add.businessClosedNotice')}
                </div>
              )}

              <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-4', !canSelectDateTime && 'opacity-60 pointer-events-none')}>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground-1">{t('page.appointments.add.dateLabel')}</Label>
                  <DatePicker
                    value={form.date}
                    onChange={handleDateChange}
                    minDate={(() => {
                      const d = new Date();
                      d.setHours(0, 0, 0, 0);
                      return d;
                    })()}
                    connectedPopover
                    className={cn(
                      "border bg-surface hover:bg-surface-hover focus:bg-surface h-12 text-base w-full px-4",
                      canSelectDateTime ? "border-border-strong dark:border-border-strong" : "border-border dark:border-border-subtle"
                    )}
                    placeholder={t('page.appointments.add.selectDate')}
                    mobileTitle={t('page.appointments.add.dateLabel')}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground-1">{t('page.appointments.add.timeLabel')}</Label>
                  {displayTimeSlots.length > 0 ? (
                    <ResponsivePopover
                      open={hourOpen}
                      onOpenChange={handleHourOpenChange}
                      title={t('page.appointments.add.timeLabel')}
                      trigger={
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full h-12 text-base justify-between font-normal border bg-surface hover:bg-surface-hover rounded-full px-4",
                            !isMobile && (hourOpen || hourClosingAnimation)
                              ? "!rounded-b-none !rounded-t-[16px] border-x border-t border-b-0 border-border-strong dark:border-border-strong shadow-none"
                              : (availableSlotsLoading || !canSelectDateTime || !form.date)
                                ? "border-border dark:border-border-subtle"
                                : "border-border-strong dark:border-border-strong"
                          )}
                          disabled={availableSlotsLoading || !canSelectDateTime || !form.date}
                        >
                          {availableSlotsLoading ? (
                            <span className="flex items-center gap-2 text-foreground-3 dark:text-foreground-2">
                              <Loader2 className="h-4 w-4 animate-spin" /> Loading times...
                            </span>
                          ) : form.time ? (
                            <span className="text-foreground-1">{formatSlotTime(form.time)}</span>
                          ) : (
                            <span className="text-foreground-3 dark:text-foreground-2">{t('page.appointments.add.selectTime')}</span>
                          )}
                          {!availableSlotsLoading && <Clock className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                        </Button>
                      }
                      contentClassName={cn(
                        "add-appointment-popover-expand !w-[var(--radix-popover-trigger-width)] max-w-[var(--radix-popover-trigger-width)] max-h-[calc(100vh-6rem)] box-border -mt-px border border-t-0 rounded-t-none rounded-b-[16px] shadow-none p-0 z-[90] overflow-hidden flex flex-col",
                        (hourOpen || hourClosingAnimation) ? "border-border-strong dark:border-border-strong" : "border-input dark:border-border"
                      )}
                      side="bottom"
                      align="start"
                      sideOffset={0}
                      avoidCollisions={false}
                    >
                        {/* The sheet supplies its own scroll box, so cap the list only in the popover. */}
                        <div className={cn("min-h-0 flex-1 overflow-y-auto py-1", !isMobile && "max-h-60")}>
                          <div className="px-3 pt-2 pb-1.5">
                            <p className="text-xs font-medium text-foreground-3 dark:text-foreground-2">
                              {workingHoursLabel}
                            </p>
                          </div>
                          {inHoursSlots.length > 0 && (
                            <>
                              <div className="px-3 pb-1">
                                <p className="text-[11px] font-medium uppercase tracking-wide text-foreground-3 dark:text-foreground-2">
                                  {t('page.appointments.add.workingHours')}
                                </p>
                              </div>
                              {inHoursSlots.map((slot) => {
                                const isSelected = form.time === slot;
                                return (
                                <button
                                  key={slot}
                                  type="button"
                                  className={cn(
                                    'w-full text-left px-3 py-2.5 rounded-lg text-sm cursor-pointer',
                                    isSelected
                                      ? 'bg-primary/10 font-medium text-foreground-1 hover:bg-primary/15 dark:hover:bg-primary/20'
                                      : 'text-foreground-1 hover:bg-info-100 dark:hover:bg-surface-hover',
                                  )}
                                  onClick={() => handleTimeSelect(slot)}
                                >
                                  {formatSlotTime(slot)}
                                </button>
                                );
                              })}
                            </>
                          )}
                          {inHoursSlots.length === 0 && slotsOutsideHours.length > 0 && (
                            <div className="px-4 py-2 text-xs text-foreground-3 dark:text-foreground-2">
                              {t('page.appointments.add.noTimesWithinHours')}
                            </div>
                          )}
                          {slotsOutsideHours.length > 0 && (
                            <>
                              <div className="border-t border-border my-1" role="separator" />
                              <div className="px-3 pt-1 pb-1">
                                <p className="text-[11px] font-medium uppercase tracking-wide text-foreground-3 dark:text-foreground-2">
                                  {t('page.appointments.add.outsideWorkingHours')}
                                </p>
                              </div>
                              {slotsOutsideHours.map((slot) => {
                                const isSelected = form.time === slot;
                                return (
                                <button
                                  key={slot}
                                  type="button"
                                  className={cn(
                                    'w-full text-left px-3 py-2.5 rounded-lg text-sm cursor-pointer',
                                    isSelected
                                      ? 'bg-primary/10 font-medium text-foreground-1 opacity-100 hover:bg-primary/15 dark:hover:bg-primary/20'
                                      : 'opacity-80 text-foreground-3 dark:text-foreground-2 hover:bg-info-100 dark:hover:bg-surface-hover hover:opacity-100',
                                  )}
                                  onClick={() => handleTimeSelect(slot)}
                                >
                                  {formatSlotTime(slot)}
                                </button>
                                );
                              })}
                            </>
                          )}
                        </div>
                    </ResponsivePopover>
                  ) : (
                    <div
                      className={cn(
                        "h-12 flex items-center text-sm text-foreground-3 dark:text-foreground-2 border bg-surface rounded-full px-4",
                        canSelectDateTime ? "border-border-strong dark:border-border-strong" : "border-border dark:border-border-subtle"
                      )}
                    >
                      {availableSlotsLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading times...
                        </span>
                      ) : isClosedDay ? (
                        t('page.appointments.closed')
                      ) : (
                        t('page.appointments.add.noAvailability')
                      )}
                    </div>
                  )}
                </div>
              </div>

              {availableSlotsLoading && form.date && slotFetchItems ? (
                <div className="space-y-2" aria-busy="true" aria-label={t('page.aria.loadingNextAvailable')}>
                  <div className="flex items-start gap-2">
                    <Skeleton className="h-4 w-4 mt-0.5 flex-shrink-0 rounded-md" />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <Skeleton className="h-4 w-full max-w-[15rem] rounded-md" />
                      <Skeleton className="h-3.5 w-full max-w-[18rem] rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-full max-w-[11rem] rounded-full" />
                </div>
              ) : nextAvailableDate ? (() => {
                const nextDateFormatted = (() => {
                  const d = new Date(nextAvailableDate + 'T12:00:00');
                  return d.toLocaleDateString(getCalendarLocale(), { day: 'numeric', month: 'short', year: 'numeric' });
                })();
                return (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm text-foreground-1 leading-relaxed">
                      <CalendarClock className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-medium text-foreground-1">{t('page.appointments.add.noInHoursSlots')}</p>
                        <p className="text-xs text-foreground-3 dark:text-foreground-2">
                          {t('page.appointments.add.nextAvailableDay', { date: nextDateFormatted })}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      rounded="full"
                      className="!px-6 w-fit border-border-strong text-foreground-1 group disabled:opacity-50"
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          date: buildZonedDateFromDateKey(nextAvailableDate, '00:00', calendarTimezone),
                          time: '',
                        }));
                      }}
                    >
                      <span>{t('page.appointmentCard.nextAvailableDate')}</span>
                      <ArrowRight className="h-4 w-4 ml-2 text-primary transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
                    </Button>
                  </div>
                );
              })() : null}
              {slotFetchError && (
                <div className="text-xs text-destructive">
                  {slotFetchError}
                </div>
              )}

              {form.time && durationMinutes > 0 && (
                <div className="text-xs text-foreground-3 dark:text-foreground-2">
                  Appointment: {formatSlotTime(form.time)} &ndash;{' '}
                  {formatSlotTime(getEndTimeString(form.time, durationMinutes))}{' '}
                  ({durationMinutes} min)
                </div>
              )}
            </div>

            {/* ── Booking Source Section (create only) ── */}
            {!isEditMode && (
              <>
                <SliderContentDivider />
                <div className="space-y-5">
                  <SliderSectionHeader
                    title={t('page.appointments.add.bookingSource')}
                    description={t('page.appointments.add.bookingSourceDesc')}
                  />
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {BOOKING_SOURCES.map((source) => (
                      <Pill
                        key={source.value}
                        selected={form.bookingSource === source.value}
                        showCheckmark
                        className="!min-h-12 w-auto justify-start items-center transition-none active:scale-100"
                        onClick={() => handleBookingSourceSelect(source.value)}
                      >
                        <span className="flex items-center gap-1.5">
                          {source.icon}
                          {t(source.labelKey)}
                        </span>
                      </Pill>
                    ))}
                  </div>
                </div>
              </>
            )}

            <SliderContentDivider />

            {/* ── Notes Section ── */}
            <div className="space-y-5">
              <TextareaField
                value={form.notes}
                onChange={(value) => setForm((prev) => ({ ...prev, notes: value }))}
                label={t('page.appointments.add.notes')}
                placeholder={t('page.appointments.add.notesPlaceholder')}
                helperText={t('page.appointments.add.notesHelper')}
                rows={3}
                id="appointment-notes"
                maxLength={500}
                showCharacterCount
                error={notesError ?? undefined}
                textareaClassName="!h-41"
              />
            </div>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) handleCancelOverrides();
        }}
        onConfirm={handleConfirmOverrides}
        onCancel={handleCancelOverrides}
        title={getConfirmDialogTitle(pendingUpdateRef.current != null, t)}
        description={
          <div className="space-y-3">
            <p className="text-sm text-foreground-3 dark:text-foreground-2">
              {getConfirmDialogDescription(confirmReason ?? 'out_of_hours', pendingUpdateRef.current != null, t)}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="override-reason" className="text-xs font-medium text-foreground-3 dark:text-foreground-2">
                {t('page.appointments.confirmDialog.reasonLabel')}
              </Label>
              <Input
                id="override-reason"
                placeholder={t('page.appointments.confirmDialog.reasonPlaceholder')}
                value={overrideReasonText}
                onChange={(e) => setOverrideReasonText(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        }
        cancelTitle={t('page.appointments.confirmDialog.cancel')}
        confirmTitle={getConfirmButtonTitle(pendingUpdateRef.current != null, t)}
      />
    </BaseSlider>
  );
};

export default AddAppointmentSlider;
