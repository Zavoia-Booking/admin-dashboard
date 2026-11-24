import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight, Calendar, CalendarClock, CalendarPlus, Check, ChevronsUpDown, Clock, Footprints,
  Ellipsis, Loader2, Percent, Phone, Plus, PlusCircle, ShieldCheck, Tag, X,
} from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Label } from '../../../shared/components/ui/label';
import { Input } from '../../../shared/components/ui/input';
import { Command, CommandItem, CommandList } from '../../../shared/components/ui/command';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../shared/components/ui/dropdown-menu';
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
  setReassignmentHoursOverrideOffer,
  updateAppointment,
} from '../actions';
import {
  getSelectedLocationId,
  getLocationStaff,
  getLocationWorkingHours,
  getLocationOpen247,
  getBookingSettings,
  getAddFormPrefill,
  getAddFormSaveInFlight,
  getLocationServices,
  getLocationTeamMembers,
  getLocationBundles,
  getLocationContext,
  getLocationContextLoading,
  getCalendarTimezone,
  getReassignmentHoursOverrideOffer,
} from '../selectors';
import type { AppointmentBookingSource, AvailableSlotsRequest, AvailableSlotsResponse, BookedItemEdit } from '../../../shared/types/calendar';
import type { AddFormPrefill } from '../types';
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
  getPrefillAppointmentItems,
  getFixedBookingAllowedStaffIds,
  getEditMutationDispatchCount,
  getEditedBookingAllowedStaffIds,
  getEditedBookingDisplayItems,
  getEditedBookingTotals,
  hasBookedItemChanges,
  pickUpdateAppointmentRequestBody,
  hasItemStaffChanged,
  type EditFormSnapshot,
  type EditAppointmentPayload,
} from './addAppointmentSliderHelpers';
import type { FixedBooking } from '../bookedItems';
import { BookedItemsList } from './BookedItemsList';
import CustomerSearchPicker from './CustomerSearchPicker';
import { AssignmentReminderNote } from '../../services/components/AssignmentReminderNote';
import type { Service as ManageSheetService } from '../../../shared/components/common/ManageServicesSheet/types';
import type { Bundle as ManageSheetBundle } from '../../../shared/components/common/ManageBundlesSheet/types';
import { getCalendarLocale, localCalendarDateFromDateKey, minSelectableCalendarDateForTimezone } from '../timezone';
import { toLocalDateString } from '../utils';
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

const noSelectedIds: number[] = [];

type BookedDraftRow = { selection: BookedItemEdit; originalIndex?: number };

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const SLIDER_COMBO_TRIGGER_CLASS =
  '!px-5 h-10 text-sm border-border-strong text-foreground-1 group disabled:opacity-50 disabled:cursor-not-allowed';

// Side-by-side variant (services + bundles sharing one row): equal width and
// truncation-safe so longer-locale labels (e.g. Romanian) ellipsize instead of
// overflowing the row.
const SLIDER_COMBO_TRIGGER_PAIRED_CLASS =
  '!px-3 h-10 min-w-0 flex-1 text-sm border-border-strong text-foreground-1 group disabled:opacity-50 disabled:cursor-not-allowed';

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
  onStaffPickerActiveChange?: (active: boolean) => void;
  onRemoveItem: (index: number) => void;
  /** Assignments deep link used by the "nobody can perform this" notice, which
   *  is a dead end without it. */
  assignmentsPath: string;
  /** Closes the slider before the notice navigates away. */
  onNavigateAway: () => void;
  /** When true, the staff picker gets a soft "next step" pulse — only one row in
   *  the list should receive this at a time (the first one still unassigned). */
  isFirstUnassigned?: boolean;
  showAssignmentReminder?: boolean;
  /** Bundle or multi-item booking, or a started appointment: read-only contents and the people who may take it. */
  fixed?: { content: React.ReactNode; allowedStaffIds: number[] | null; staffLocked?: boolean };
}

function AppointmentItemRow({
  item,
  index,
  locationServices,
  locationBundles,
  locationTeamMembers,
  currency,
  onUpdateStaff,
  onStaffPickerActiveChange,
  onRemoveItem,
  assignmentsPath,
  onNavigateAway,
  isFirstUnassigned = false,
  showAssignmentReminder = true,
  fixed,
}: AppointmentItemRowProps) {
  const { t } = useTranslation('assignments');
  const { t: tCal } = useTranslation('calendar');
  const serviceForRow = locationServices.find((s) => s.serviceId === item.serviceId);
  const bundleForRow = locationBundles.find((b) => b.bundleId === item.bundleId);
  const staffForRow = locationTeamMembers.find((t) => t.userId === item.staffUserId);
  const allowedStaffIdsForRow = fixed ? fixed.allowedStaffIds : getItemAllowedStaffIds(item, locationServices, locationBundles);
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
  const handleStaffPickerCloseAutoFocus = useCallback(() => {
    onStaffPickerActiveChange?.(false);
  }, [onStaffPickerActiveChange]);

  const handleStaffPopoverOpenChange = useCallback((open: boolean) => {
    setStaffPopoverOpen(open);
    if (open) {
      onStaffPickerActiveChange?.(true);
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
  }, [onStaffPickerActiveChange]);

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

  // A booked-items list is several rows tall, so its person sits under it, right-aligned like a single row's picker.
  const staffControlClass = fixed
    ? "flex items-center justify-end gap-2 border-t border-border pt-3"
    : "flex items-center gap-2 sm:shrink-0 sm:self-stretch w-full sm:w-auto";

  return (
    <div className="group rounded-lg border border-border bg-white dark:bg-surface hover:border-border-strong">
      <div className={cn("flex gap-3 px-4 py-3", fixed ? "flex-col" : "flex-col sm:flex-row sm:items-stretch")}>
        {fixed ? (<div className="min-w-0">{fixed.content}</div>) : (
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
        )}
        {/* No assignable team member: a picker would open onto an empty list
            and the X would float next to nothing, so the whole control row
            yields to the banner below, which carries both resolutions. */}
        {fixed?.staffLocked ? (
        <div className={staffControlClass}>
          {staffForRow ? (
            <>
              <PersonAvatar
                key={staffForRow.userId}
                id={staffForRow.userId}
                firstName={staffForRow.firstName}
                lastName={staffForRow.lastName}
                profileImage={staffForRow.profileImage}
                className="size-5"
                initialsClassName="text-[9px] font-semibold"
              />
              <span className="text-sm text-foreground-2">{`${staffForRow.firstName} ${staffForRow.lastName}`}</span>
            </>
          ) : (
            <span className="text-sm text-foreground-3 dark:text-foreground-2">{tCal('page.common.unassigned')}</span>
          )}
        </div>
        ) : !hasNoEligibleStaff && (
        <div className={staffControlClass}>
          <ResponsivePopover
              open={staffPopoverOpen}
              onOpenChange={handleStaffPopoverOpenChange}
              onCloseAutoFocus={onStaffPickerActiveChange ? handleStaffPickerCloseAutoFocus : undefined}
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
          {!fixed && (
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
          )}
        </div>
        )}
      </div>
      {showAssignmentReminder && hasNoEligibleStaff && !fixed?.staffLocked && (
        <div className="px-3 pb-3">
          <AssignmentReminderNote
            text={tCal(isService
              ? 'page.appointments.add.noStaffForService'
              : 'page.appointments.add.noStaffForBundle')}
            linkLabel={tCal('page.appointments.add.assignmentsLink')}
            to={assignmentsPath}
            onNavigate={onNavigateAway}
            tone="warning"
            secondaryLabel={tCal('page.appointments.add.remove')}
            onSecondary={() => onRemoveItem(index)}
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
  const saveInFlight = useSelector(getAddFormSaveInFlight);
  const reassignmentHoursOverrideOffer = useSelector(getReassignmentHoursOverrideOffer);
  const locationServices = useSelector(getLocationServices);
  const locationTeamMembers = useSelector(getLocationTeamMembers);
  const locationBundles = useSelector(getLocationBundles);
  const locationContext = useSelector(getLocationContext);
  const servicesLoading = useSelector(getLocationContextLoading);
  const calendarTimezone = useSelector(getCalendarTimezone);
  const currentUser = useSelector(selectCurrentUser);
  const isTeamMember = useSelector(selectIsTeamMember);
  const businessCurrency = currentUser?.business?.businessCurrency ?? 'eur';

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
  const [initialSchedule, setInitialSchedule] = useState<{
    wallDate: Date | null;
    editSnapshot: EditFormSnapshot | null;
  } | null>(null);

  /** Use ref first so reschedule always updates the appointment that was opened, even if prefill is later overwritten (e.g. by clicking a slot). */
  const editingAppointmentId = rescheduleAppointmentIdRef.current ?? prefill?.appointmentId ?? null;
  const isEditMode = editingAppointmentId !== null;
  const appointmentCurrency = isEditMode ? prefill?.appointmentCurrency ?? businessCurrency : businessCurrency;

  /** When opening from a staff column click (not editing, no service pre-selected), filter services/bundles to only those the staff can perform. */
  const prefillStaffFilter = (!isEditMode && prefill?.staffUserId && !prefill?.serviceId && !prefill?.bundleId
    && (!isTeamMember || prefill.staffUserId === currentUser?.id))
    ? prefill.staffUserId
    : null;

  // Form state
  const [draft, setForm] = useState<FormState>(initialForm);
  // Only dates picked by the user are stored in the draft. Derive the initial
  // day from the prefill after location context loads, without resetting inputs.
  const initialWallDate = useMemo(() => initialSchedule
    ? initialSchedule.wallDate
      ? new Date(initialSchedule.wallDate.getFullYear(), initialSchedule.wallDate.getMonth(), initialSchedule.wallDate.getDate())
      : minSelectableCalendarDateForTimezone(new Date(), calendarTimezone)
    : null, [calendarTimezone, initialSchedule]);
  const form = useMemo(() => draft.date || !initialWallDate ? draft : { ...draft, date: initialWallDate }, [draft, initialWallDate]);
  const editSnapshot = useMemo(() => initialSchedule?.editSnapshot && initialWallDate
    ? { ...initialSchedule.editSnapshot, date: initialWallDate }
    : null, [initialSchedule, initialWallDate]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Confirmation when creating or rescheduling out of hours or on a block slot
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmReason, setConfirmReason] = useState<'out_of_hours' | 'on_block' | null>(null);
  const [overrideReasonText, setOverrideReasonText] = useState('');

  const [isManageServicesSheetOpen, setIsManageServicesSheetOpen] = useState(false);
  const [isManageBundlesSheetOpen, setIsManageBundlesSheetOpen] = useState(false);
  const [appointmentItems, setAppointmentItems] = useState<AppointmentItem[]>([]);
  const [fixedBooking, setFixedBooking] = useState<FixedBooking | null>(null);
  const [editableBooking, setEditableBooking] = useState<AddFormPrefill['editableBooking']>();
  const [bookedDraft, setBookedDraft] = useState<BookedDraftRow[]>([]);
  const bookedItemEdits = useMemo(() => bookedDraft.map((row) => row.selection), [bookedDraft]);
  const [replaceItemIndex, setReplaceItemIndex] = useState<number | null>(null);
  const [startedLock, setStartedLock] = useState(false);
  const [hasReassignedStaff, setHasReassignedStaff] = useState(false);
  const [staffPickerActive, setStaffPickerActive] = useState(false);
  const dateFieldRef = useRef<HTMLDivElement>(null);
  const timeFieldRef = useRef<HTMLDivElement>(null);
  const [visibleScheduleField, setVisibleScheduleField] = useState<'date' | 'time' | null>(null);

  const [slotResult, setSlotResult] = useState<{
    request: AvailableSlotsRequest;
    response: AvailableSlotsResponse | null;
  } | null>(null);
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
      setInitialSchedule({
        wallDate: prefill?.date ?? null,
        editSnapshot: buildEditSnapshotFromPrefill(prefill, selectedLocationId),
      });
      setForm({
        ...initialForm,
        customerId: prefill?.customerId ?? null,
        customerDisplay: prefill?.customerDisplay ?? null,
        time: prefill?.time ?? '',
        notes: prefill?.notes ?? '',
        bookingSource: (prefill?.bookingSource as AppointmentBookingSource) ?? ('admin' as AppointmentBookingSource),
      });
      setAppointmentItems(getPrefillAppointmentItems(prefill));
      setFixedBooking(prefill?.appointmentId != null ? (prefill.fixedBooking ?? null) : null);
      setEditableBooking(prefill?.editableBooking);
      setBookedDraft(prefill?.editableBooking?.items.map((_, bookedIndex) => ({
        originalIndex: bookedIndex,
        selection: { bookedIndex },
      })) ?? []);
      setReplaceItemIndex(null);
      setStartedLock(prefill?.appointmentId != null && prefill?.startedLock === true);
      // Wipe slot state here rather than on close — the slot-fetching effect will
      // refill it based on the new prefill's date/service immediately after.
      setHasReassignedStaff(false);
      setStaffPickerActive(false);
      setVisibleScheduleField(null);
      setSlotResult(null);
      setError(null);
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

  // Fetch available slots when the location, date, and assigned items are set.
  const bookedItemsChanged = !!editableBooking && hasBookedItemChanges(bookedItemEdits, editableBooking.items);
  const editStaffUserId = bookedItemsChanged && (editableBooking?.staffCount ?? 0) > 1 && !hasReassignedStaff
    ? null
    : (appointmentItems[0]?.staffUserId ?? null);
  const editedDisplayItems = useMemo(() => editableBooking
    ? getEditedBookingDisplayItems(bookedItemEdits, editableBooking.items, locationServices, locationBundles, editStaffUserId)
    : [], [editableBooking, bookedItemEdits, locationServices, locationBundles, editStaffUserId]);
  const editedTotals = useMemo(() => editableBooking
    ? getEditedBookingTotals(editedDisplayItems)
    : null, [editableBooking, editedDisplayItems]);
  const editedAllowedStaffIds = useMemo(() => editableBooking && bookedItemsChanged
    ? getEditedBookingAllowedStaffIds(bookedItemEdits, editableBooking.items, locationServices, locationBundles)
    : null, [editableBooking, bookedItemsChanged, bookedItemEdits, locationServices, locationBundles]);
  const editStaffIsEligible = editStaffUserId != null && (
    !bookedItemsChanged || editedAllowedStaffIds == null || editedAllowedStaffIds.includes(editStaffUserId)
  );
  const keepsUnassignedAppointment = editableBooking?.staffCount === 0 &&
    !bookedItemsChanged && editStaffUserId == null;
  const bookedItemEdit = editableBooking && bookedItemsChanged
    ? { items: bookedItemEdits, expectedUpdatedAt: editableBooking.expectedUpdatedAt, staffUserId: editStaffUserId }
    : undefined;
  const estimatedDurationMinutes = useMemo(
    () => editedTotals?.durationMinutes ?? fixedBooking?.durationMinutes ??
      getGroupTotalDurationMinutes(getGroupItemsForPayload(appointmentItems), locationServices, locationBundles),
    [appointmentItems, locationServices, locationBundles, editedTotals, fixedBooking],
  );

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

  const selectedDateKey = form.date ? toLocalDateString(form.date) : null;
  const slotRequest = useMemo<AvailableSlotsRequest | null>(() => {
    if (startedLock) return null;
    if (!selectedLocationId || locationContext?.location.id !== selectedLocationId || !selectedDateKey) return null;
    if (fixedBooking || editableBooking) {
      if ((!editStaffIsEligible && !keepsUnassignedAppointment) || estimatedDurationMinutes <= 0) return null;
      return {
        locationId: selectedLocationId,
        date: selectedDateKey,
        durationMinutes: estimatedDurationMinutes,
        ...(editStaffUserId != null ? { staffUserId: editStaffUserId } : {}),
        findNextAvailable: true,
        ...(editingAppointmentId != null ? { rescheduleAppointmentId: editingAppointmentId } : {}),
      };
    }
    if (!slotFetchItems) return null;
    return {
      locationId: selectedLocationId,
      date: selectedDateKey,
      items: slotFetchItems,
      findNextAvailable: true,
      ...(editingAppointmentId != null ? { rescheduleAppointmentId: editingAppointmentId } : {}),
    };
  }, [selectedLocationId, locationContext, selectedDateKey, slotFetchItems, editingAppointmentId, fixedBooking,
    editableBooking, editStaffIsEligible, editStaffUserId, keepsUnassignedAppointment, estimatedDurationMinutes, startedLock]);

  // Ignore a previous result immediately when the date or staff changes, not
  // just once the fetch effect has run and the next request is in flight.
  const currentSlotResult = slotResult?.request === slotRequest ? slotResult : null;
  const currentSlotResponse = currentSlotResult?.response ?? null;
  const slotDurationMinutes = currentSlotResponse?.durationMinutes ?? estimatedDurationMinutes;
  const durationExceedsOneDay = slotDurationMinutes > 24 * 60;
  const nextAvailableDate = currentSlotResponse?.nextAvailableDate ?? null;
  const nextAvailableSearchDays = currentSlotResponse?.nextAvailableSearchDays;
  const slotsPending = slotRequest != null && !currentSlotResult;
  const slotFetchError = currentSlotResult && !currentSlotResponse
    ? t('page.appointments.add.couldNotLoadAvailability')
    : null;

  useEffect(() => {
    if (!isOpen || !slotRequest) return;
    const controller = new AbortController();
    const slotRequestId = `${Date.now()}-${slotRequest.locationId}`;
    getAvailableSlotsRequest(slotRequest, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setSlotResult({ request: slotRequest, response: res });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error('[SLOT] fetch:error', {
          requestId: slotRequestId,
          message: err?.message ?? 'Unknown availability fetch error',
        });
        setSlotResult({ request: slotRequest, response: null });
      });
    return () => controller.abort();
  }, [isOpen, slotRequest]);

  // Services and team for the selected location come from Redux (fetched once when location is selected via assignments/full).

  const handleDateChange = useCallback((date: Date) => {
    setForm((prev) => ({ ...prev, date, time: '' }));
    setHourOpen(false);
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
    const item = appointmentItems[index];
    if (!item || (item.staffUserId === staffUserId && !(bookedItemsChanged && (editableBooking?.staffCount ?? 0) > 1))) return;
    setAppointmentItems((prev) => prev.map((item, itemIndex) => (
      itemIndex === index ? { ...item, staffUserId } : item
    )));
    if (isEditMode) {
      setHasReassignedStaff(true);
    } else {
      setForm((prev) => ({ ...prev, time: '' }));
    }
  }, [appointmentItems, isEditMode, bookedItemsChanged, editableBooking?.staffCount]);

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
  }, [locationBundles, prefillStaffFilter, getAutoStaffForBundle]);

  const editedPickerServices = useMemo(() => servicesForSheet.filter((service) =>
    !editedDisplayItems.some((item, index) => index !== replaceItemIndex && item.serviceId === service.id)),
  [servicesForSheet, editedDisplayItems, replaceItemIndex]);
  const editedPickerBundles = useMemo(() => bundlesForSheet.filter((bundle) =>
    !editedDisplayItems.some((item, index) => index !== replaceItemIndex && item.bundleId === bundle.bundleId)),
  [bundlesForSheet, editedDisplayItems, replaceItemIndex]);
  const replaceItem = replaceItemIndex == null ? null : editedDisplayItems[replaceItemIndex];
  const editServiceSelection = useMemo(() => replaceItem?.serviceId == null ? noSelectedIds : [replaceItem.serviceId], [replaceItem?.serviceId]);
  const editBundleSelection = useMemo(() => replaceItem?.bundleId == null ? noSelectedIds : [replaceItem.bundleId], [replaceItem?.bundleId]);
  const applyBookedChoices = (kind: 'service' | 'bundle', ids: number[]) => {
    if (!ids.length) return;
    const choices = ids.map((id): BookedItemEdit => kind === 'service' ? { serviceId: id } : { bundleId: id });
    if (replaceItemIndex == null) {
      setBookedDraft((rows) => [...rows, ...choices.map((selection) => ({ selection }))]);
    } else if (ids[0] !== (kind === 'service' ? replaceItem?.serviceId : replaceItem?.bundleId)) {
      setBookedDraft((rows) => rows.map((row, index) => {
        if (index !== replaceItemIndex) return row;
        const original = row.originalIndex == null ? null : editableBooking?.items[row.originalIndex];
        const originalId = kind === 'service' ? original?.serviceId : original?.bundleId;
        const selection = row.originalIndex != null && ids[0] === originalId
          ? { bookedIndex: row.originalIndex }
          : choices[0];
        return { ...row, selection };
      }));
    }
  };

  const openBookedPicker = (kind: 'service' | 'bundle', index: number | null) => {
    setReplaceItemIndex(index);
    if (kind === 'service') setIsManageServicesSheetOpen(true);
    else setIsManageBundlesSheetOpen(true);
  };

  // ─────────────────────────────────────────────────────────────
  // Derived data
  // ─────────────────────────────────────────────────────────────

  const timeSlots = useTimeSlots(bookingSettings?.slotIntervalMinutes);
  const slotStartsByTime = useMemo(() => {
    const starts = new Map<string, string>();
    for (const iso of currentSlotResponse?.availableSlots ?? []) {
      starts.set(formatTimeKey(iso, calendarTimezone), iso);
    }
    return starts;
  }, [currentSlotResponse, calendarTimezone]);
  const getSlotStart = useCallback((time: string) => {
    const iso = slotStartsByTime.get(time);
    // Use the exact instant evaluated by the API, including repeated DST times.
    return iso ? new Date(iso) : buildScheduledDate(form.date, time, calendarTimezone);
  }, [calendarTimezone, form.date, slotStartsByTime]);
  const now = Date.now();
  const minAdvanceMs = !isEditMode && bookingSettings?.enforceMinAdvanceForAdmin
    ? Math.max(0, bookingSettings.minAdvanceBookingMinutes ?? 0) * 60_000
    : 0;
  const earliestStart = now + minAdvanceMs;
  const displayTimeSlots = useMemo(() => {
    if (slotsPending || slotFetchError) return [];
    const list = currentSlotResponse ? [...slotStartsByTime.keys()].sort() : timeSlots;
    if (!form.date) return list;
    return list.filter((slot) => {
      const slotStart = getSlotStart(slot);
      return slotStart != null && slotStart.getTime() >= earliestStart &&
        !doesTimeRangeSpanMidnight(slotStart, slotDurationMinutes, calendarTimezone);
    });
  }, [
    currentSlotResponse,
    slotsPending,
    slotFetchError,
    slotStartsByTime,
    getSlotStart,
    timeSlots,
    calendarTimezone,
    form.date,
    slotDurationMinutes,
    earliestStart,
  ]);
  const outOfHoursTimeSet = useMemo(() => {
    return new Set(
      (currentSlotResponse?.outOfHoursSlots ?? []).map((iso) => formatTimeKey(iso, calendarTimezone)),
    );
  }, [calendarTimezone, currentSlotResponse]);

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
    if (currentSlotResponse) {
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
  }, [displayTimeSlots, isSlotOutsideHours, outOfHoursTimeSet, open247, currentSlotResponse]);

  const needsHoursOverride = useCallback((scheduledAt: Date) => {
    if (slotStartsByTime.get(form.time) === scheduledAt.toISOString()) return outOfHoursTimeSet.has(form.time);
    return isTimeRangeOutsideWorkingHours(scheduledAt, slotDurationMinutes, dayWorkingHours, open247, calendarTimezone);
  }, [calendarTimezone, dayWorkingHours, form.time, open247, outOfHoursTimeSet, slotDurationMinutes, slotStartsByTime]);

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
    () => editableBooking ? bookedItemEdits.length > 0 && (editStaffIsEligible || keepsUnassignedAppointment)
      : fixedBooking ? allItemsHaveStaff(appointmentItems)
        : appointmentItems.length > 0 && appointmentItems.every((item) => isValidAppointmentItem(item)),
    [appointmentItems, editableBooking, bookedItemEdits.length, editStaffIsEligible, fixedBooking, keepsUnassignedAppointment],
  );

  const isDirty = useMemo(() => {
    if (!isEditMode || editSnapshot == null) return true;
    if (form.date?.toDateString() !== editSnapshot.date?.toDateString()) return true;
    if (form.time !== editSnapshot.time) return true;
    if (form.notes.trim() !== editSnapshot.notes.trim()) return true;
    if (selectedLocationId !== editSnapshot.locationId) return true;
    if (bookedItemsChanged) return true;
    const editItem = appointmentItems.find((item) => item.serviceId != null);
    if ((editItem?.serviceId ?? null) !== editSnapshot.serviceId) return true;
    if (hasItemStaffChanged(appointmentItems, editSnapshot)) return true;
    return false;
  }, [isEditMode, editSnapshot, form.date, form.time, form.notes, selectedLocationId, appointmentItems, bookedItemsChanged]);

  /** True when staff/service/location/date/time differ from snapshot (excludes notes). Used to narrow edit-mode slot bypasses. */
  const hasSchedulingFieldChanged = useMemo(() => {
    if (!isEditMode || editSnapshot == null) return false;
    if (form.date?.toDateString() !== editSnapshot.date?.toDateString()) return true;
    if (form.time !== editSnapshot.time) return true;
    if (selectedLocationId !== editSnapshot.locationId) return true;
    if (bookedItemsChanged) return true;
    const editItem = appointmentItems.find((item) => item.serviceId != null);
    if ((editItem?.serviceId ?? null) !== editSnapshot.serviceId) return true;
    if (hasItemStaffChanged(appointmentItems, editSnapshot)) return true;
    return false;
  }, [isEditMode, editSnapshot, form.date, form.time, selectedLocationId, appointmentItems, bookedItemsChanged]);

  // A previous staff member's response must not enable Save or trigger the pulse.
  const reassignmentAvailabilityReady = currentSlotResponse != null && !slotsPending && !slotFetchError;
  const keepsBookedStart = !!editableBooking && editSnapshot?.date != null && form.time === editSnapshot.time &&
    selectedDateKey === toLocalDateString(editSnapshot.date);
  const isTimeInAvailableSlots = useMemo(() => {
    if (form.time === '') return false;
    if (isEditMode && editInitialTime !== '' && form.time === editInitialTime && !hasSchedulingFieldChanged) return true;
    // The original start may be off the slot grid or blocked; validate it through the normal save.
    if (bookedItemsChanged && keepsBookedStart) return reassignmentAvailabilityReady;
    if (hasReassignedStaff && !reassignmentAvailabilityReady) return false;
    if (!currentSlotResponse) return false;
    return displayTimeSlots.includes(form.time);
  }, [
    currentSlotResponse, displayTimeSlots, form.time, isEditMode, editInitialTime,
    hasSchedulingFieldChanged, hasReassignedStaff, reassignmentAvailabilityReady, bookedItemsChanged, keepsBookedStart,
  ]);
  const isScheduledInPast = useMemo(() => {
    const scheduled = getSlotStart(form.time);
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
  }, [form.date, form.time, getSlotStart, isEditMode, editSnapshot, editInitialTime]);
  const isSpanMidnight = useMemo(() => {
    if (!form.date || !form.time) return false;
    const scheduled = getSlotStart(form.time);
    return scheduled !== null && doesTimeRangeSpanMidnight(scheduled, slotDurationMinutes, calendarTimezone);
  }, [form.date, form.time, getSlotStart, calendarTimezone, slotDurationMinutes]);
  const totalPrice = useMemo(
    () => editedTotals?.priceMajor ?? (fixedBooking ? fixedBooking.priceMinor / 100
      : getGroupTotalPriceMajor(appointmentItems, locationServices, locationBundles)),
    [appointmentItems, locationServices, locationBundles, fixedBooking, editedTotals],
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
    // Reassignment keeps the existing choice so we can revalidate it for another staff member.
    if (hasReassignedStaff || (bookedItemsChanged && keepsBookedStart)) return;
    if (!slotsPending && currentSlotResponse?.availableSlots.length && form.time && !displayTimeSlots.includes(form.time)) {
      if (isEditMode && editInitialTime !== '' && form.time === editInitialTime && !hasSchedulingFieldChanged) return;
      setForm((prev) => ({ ...prev, time: '' }));
    }
  }, [slotsPending, currentSlotResponse, displayTimeSlots, form.time, isEditMode, editInitialTime,
    hasSchedulingFieldChanged, hasReassignedStaff, bookedItemsChanged, keepsBookedStart]);

  const canSubmit = startedLock ? (
    form.date !== null && selectedLocationId !== null && !notesError && isDirty
  ) : (
    form.date !== null &&
    form.time !== '' &&
    selectedLocationId !== null &&
    !isScheduledInPast &&
    !isSpanMidnight &&
    !durationExceedsOneDay &&
    isTimeInAvailableSlots &&
    (allowSubmitWhileSlotsLoading || !slotsPending) &&
    (allCreateItemsValid || (isEditMode && !hasSchedulingFieldChanged)) &&
    !notesError &&
    (!isEditMode || isDirty)
  );

  const reassignmentOverride = (() => {
    const offer = reassignmentHoursOverrideOffer;
    if (!isOpen || !offer || offer.appointmentId !== editingAppointmentId || !editSnapshot || bookedItemsChanged) return null;
    const scheduledDate = getSlotStart(form.time);
    if (!scheduledDate) return null;
    // Ignore a late response if the user has edited the form since pressing Save.
    const draft = buildMinimalEditAppointmentPayload({
      snapshot: editSnapshot, form, appointmentItems, selectedLocationId, scheduledDate,
      contentFixed: fixedBooking != null,
    });
    return draft.scheduledAt === undefined && draft.serviceId === undefined &&
      draft.locationId === undefined && draft.notes === offer.notes &&
      draft.staffUserIds && areNumberArraysEqual(draft.staffUserIds, offer.staffUserIds)
      ? offer
      : null;
  })();

  useEffect(() => {
    if (reassignmentHoursOverrideOffer && !reassignmentOverride) {
      dispatch(setReassignmentHoursOverrideOffer(null));
    }
  }, [dispatch, reassignmentHoursOverrideOffer, reassignmentOverride]);

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
          source: 'editor',
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
      dispatch(beginAddFormCloseAfterMutations(1));
      dispatch(adminCreateAppointmentGroup.request({
        ...pending,
        overrideReason: reason,
      }));
      pendingGroupSubmitRef.current = null;
      setConfirmOpen(false);
      setConfirmReason(null);
      setOverrideReasonText('');
    } catch {
      setError(t('page.appointments.add.failedToCreate'));
    } finally {
      setSubmitting(false);
    }
  }, [dispatch, overrideReasonText, t]);

  const handleConfirmOverrides = useCallback(() => {
    if (reassignmentOverride) {
      runEditAppointmentMutations(reassignmentOverride.appointmentId, {
        staffUserIds: reassignmentOverride.staffUserIds,
        notes: reassignmentOverride.notes,
        allowOutOfHours: true,
        overrideReason: overrideReasonText.trim() || undefined,
      });
    } else if (pendingGroupSubmitRef.current) doCreateGroupAppointment();
    else if (pendingUpdateRef.current) doUpdateAppointment();
  }, [reassignmentOverride, runEditAppointmentMutations, overrideReasonText, doCreateGroupAppointment, doUpdateAppointment]);

  const handleCancelOverrides = useCallback(() => {
    if (reassignmentOverride) dispatch(setReassignmentHoursOverrideOffer(null));
    pendingGroupSubmitRef.current = null;
    pendingUpdateRef.current = null;
    setConfirmReason(null);
    setOverrideReasonText('');
  }, [dispatch, reassignmentOverride]);

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
      const isOutOfHours =
        scheduledDate != null &&
        needsHoursOverride(scheduledDate);
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
      needsHoursOverride,
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
      const groupOutOfHours = needsHoursOverride(scheduledDate);
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
        dispatch(beginAddFormCloseAfterMutations(1));
        dispatch(adminCreateAppointmentGroup.request(groupPayload));
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
      needsHoursOverride,
      openConfirmDialog,
      dispatch,
    ],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // A save is still running, or the slider is already closing.
    if (saveInFlight || !isOpen) return;
    if (!canSubmit || !selectedLocationId || !form.date) return;

    setError(null);

    const scheduledDate = editableBooking && keepsBookedStart
      ? new Date(editableBooking.scheduledAt)
      : getSlotStart(form.time);
    if (!scheduledDate) return;
    const editScheduleUnchanged =
      isEditMode &&
      editSnapshot &&
      editInitialTime !== '' &&
      form.time === editInitialTime &&
      form.date != null &&
      editSnapshot.date != null &&
      form.date.toDateString() === editSnapshot.date.toDateString();
    const submittedAt = Date.now();
    if (!editScheduleUnchanged && scheduledDate.getTime() < submittedAt) {
      setError(
        isEditMode
          ? t('page.appointments.add.cannotReschedulePast')
          : t('page.appointments.add.cannotSchedulePast'),
      );
      return;
    }
    if (minAdvanceMs > 0 && scheduledDate.getTime() < submittedAt + minAdvanceMs) {
      setError(t('page.appointments.add.minimumNoticeRequired', { count: minAdvanceMs / 60_000 }));
      return;
    }
    if ((!isEditMode || hasSchedulingFieldChanged) && doesTimeRangeSpanMidnight(scheduledDate, slotDurationMinutes, calendarTimezone)) {
      setError(t('page.appointments.add.spansTwoDays'));
      return;
    }

    if (notesError) return;

    if (isEditMode && editingAppointmentId) {
      const editItem = appointmentItems.find((item) => item.serviceId != null);
      if (!editableBooking && !fixedBooking && !editItem?.serviceId) {
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
        contentFixed: fixedBooking != null,
        bookedItemEdit,
      });
      if (Object.keys(payload).length === 0) {
        return;
      }
      const scheduledForOoh =
        payload.scheduledAt != null || payload.items !== undefined ? scheduledDate : null;
      submitEdit(scheduledForOoh, payload);
      return;
    }

    submitGroupCreate(scheduledDate);
  };

  const hasSelectedAnyItem = editableBooking ? bookedItemEdits.length > 0 : appointmentItems.length > 0;
  const isStaffReadyForSlots = editableBooking
    ? hasSelectedAnyItem && (editStaffIsEligible || keepsUnassignedAppointment)
    : allItemsHaveStaff(appointmentItems);
  const canSelectDateTime = isStaffReadyForSlots && !durationExceedsOneDay;
  const locationToday = minSelectableCalendarDateForTimezone(new Date(now), calendarTimezone);
  const suggestedDate = nextAvailableDate ? localCalendarDateFromDateKey(nextAvailableDate) : null;
  const showNextAvailable = canSelectDateTime && !slotsPending && !slotFetchError && inHoursSlots.length === 0;
  const scheduleAttention = isOpen && hasReassignedStaff && canSelectDateTime &&
    reassignmentAvailabilityReady && !isTimeInAvailableSlots
    ? (displayTimeSlots.length > 0 ? 'time' : 'date')
    : null;

  useEffect(() => {
    if (!scheduleAttention) return;
    const field = scheduleAttention === 'date' ? dateFieldRef.current : timeFieldRef.current;
    if (!field) return;

    const observer = new IntersectionObserver(([entry]) => {
      setVisibleScheduleField(entry.isIntersecting ? scheduleAttention : null);
    });
    observer.observe(field);
    return () => observer.disconnect();
  }, [scheduleAttention]);

  useEffect(() => {
    if (!scheduleAttention || staffPickerActive) return;
    const field = scheduleAttention === 'date' ? dateFieldRef.current : timeFieldRef.current;
    if (!field) return;

    // Run after the picker releases focus. Only scroll the editor, not the page
    // or a nested overflow container that has nothing to scroll.
    const frame = requestAnimationFrame(() => {
      for (
        let scroller = field.parentElement;
        scroller && scroller.getAttribute('role') !== 'dialog';
        scroller = scroller.parentElement
      ) {
        const { overflowY } = getComputedStyle(scroller);
        const maxScroll = scroller.scrollHeight - scroller.clientHeight;
        if ((overflowY !== 'auto' && overflowY !== 'scroll') || maxScroll <= 0) continue;

        const fieldRect = field.getBoundingClientRect();
        const scrollerTop = scroller.getBoundingClientRect().top + scroller.clientTop;
        const centeredTop = scroller.scrollTop + fieldRect.top - scrollerTop - (scroller.clientHeight - fieldRect.height) / 2;
        const top = Math.max(0, Math.min(centeredTop, maxScroll));
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        scroller.scrollTo({ top, behavior: reduceMotion ? 'instant' : 'smooth' });
        break;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [scheduleAttention, staffPickerActive]);

  const hasNoEligibleStaffForEdit = editedAllowedStaffIds != null &&
    getEligibleTeamMembers(editedAllowedStaffIds, locationTeamMembers).length === 0;
  const hasItemWithoutEligibleStaff = useMemo(
    () => {
      if (editableBooking) {
        if (!hasNoEligibleStaffForEdit || isTeamMember) return false;
        return bookedItemEdits.some((edit) => {
          const allowed = getEditedBookingAllowedStaffIds([edit], editableBooking.items, locationServices, locationBundles);
          return allowed != null && getEligibleTeamMembers(allowed, locationTeamMembers).length === 0;
        });
      }
      return appointmentItems.some((item) => {
        const allowed = getItemAllowedStaffIds(item, locationServices, locationBundles);
        return allowed != null && getEligibleTeamMembers(allowed, locationTeamMembers).length === 0;
      });
    },
    [appointmentItems, editableBooking, hasNoEligibleStaffForEdit, isTeamMember, bookedItemEdits,
      locationServices, locationBundles, locationTeamMembers],
  );
  const staffRequiredMessageKey = hasItemWithoutEligibleStaff
    ? 'page.appointments.add.lockedNeedAssignments'
    : hasNoEligibleStaffForEdit
      ? (isTeamMember ? 'page.appointments.add.lockedNeedYourAssignments' : 'page.appointments.add.lockedNeedCommonStaff')
      : 'page.appointments.add.lockedNeedStaff';
  const bookedStaffUserId = editSnapshot?.itemStaffMap[0]?.staffUserId ?? null;
  const fixedAllowedStaffIds = useMemo(() => {
    if (!fixedBooking) return null;
    const ids = getFixedBookingAllowedStaffIds(fixedBooking.items, locationServices, locationBundles, bookedStaffUserId);
    // Nobody on the list can be picked here: show the whole team, the API checks on save.
    return ids != null && !locationTeamMembers.some((m) => ids.includes(m.userId)) ? null : ids;
  }, [fixedBooking, locationServices, locationBundles, locationTeamMembers, bookedStaffUserId]);

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
          isLoading={submitting || saveInFlight}
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
                  fixedBooking || editableBooking ? t('page.appointments.add.bookedTitle') : isEditMode
                    ? t('page.appointments.add.service')
                    : t('page.appointments.add.servicesAndBundles')
                }
                description={
                  startedLock ? t('page.appointments.add.startedDesc') : editableBooking ? undefined
                    : fixedBooking ? t('page.appointments.add.bookedDesc') : isEditMode
                    ? t('page.appointments.add.serviceDesc')
                    : t('page.appointments.add.servicesAndBundlesDesc')
                }
              />
              {editableBooking ? (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" rounded="full" disabled={servicesLoading || !locationServices.length}
                    onClick={() => openBookedPicker('service', null)}>
                    <Plus aria-hidden className="size-3.5" />
                    {t('page.appointments.add.addServices')}
                  </Button>
                  {locationBundles.length > 0 && (
                    <Button type="button" variant="outline" rounded="full" onClick={() => openBookedPicker('bundle', null)}>
                      <Plus aria-hidden className="size-3.5" />
                      {t('page.appointments.add.addBundles')}
                    </Button>
                  )}
                </div>
              ) : fixedBooking ? null : !isEditMode && locationBundles.length > 0 ? (
                <div className="w-full flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    rounded="full"
                    onClick={() => setIsManageServicesSheetOpen(true)}
                    className={`${SLIDER_COMBO_TRIGGER_PAIRED_CLASS} justify-center`}
                    disabled={servicesLoading}
                  >
                    {servicesLoading ? (
                      <span className="flex items-center gap-2 text-foreground-3 dark:text-foreground-2">
                        <Loader2 className="h-4 w-4 animate-spin shrink-0" /> Loading services...
                      </span>
                    ) : (
                      <>
                        <Plus className="h-3 w-3 shrink-0 text-primary transition-transform duration-400 ease-out group-hover:scale-140" />
                        <span className="truncate">{t('page.appointments.add.servicesChip')}</span>
                      </>
                    )}
                  </Button>
                  <div className="h-6 w-px shrink-0 bg-border justify-self-center" aria-hidden="true" />
                  <Button
                    type="button"
                    variant="outline"
                    rounded="full"
                    onClick={() => setIsManageBundlesSheetOpen(true)}
                    className={`${SLIDER_COMBO_TRIGGER_PAIRED_CLASS} justify-center`}
                  >
                    <Plus className="h-3 w-3 shrink-0 text-primary transition-transform duration-400 ease-out group-hover:scale-140" />
                    <span className="truncate">{t('page.appointments.add.bundlesChip')}</span>
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
                allServices={editableBooking ? editedPickerServices : servicesForSheet}
                initialSelectedIds={editableBooking ? editServiceSelection : selectedServiceIds}
                mode={editableBooking ? (replaceItemIndex == null ? 'multi' : 'single') : isEditMode ? 'single' : 'multi'}
                onSelect={editableBooking ? (serviceId) => {
                  applyBookedChoices('service', [serviceId]);
                  setIsManageServicesSheetOpen(false);
                } : handleSelectSingleService}
                onApply={(serviceIds) => {
                  if (editableBooking) applyBookedChoices('service', serviceIds);
                  else applySelectedServices(serviceIds);
                  setIsManageServicesSheetOpen(false);
                }}
                title={isEditMode && (!editableBooking || replaceItemIndex != null) ? t('page.appointments.add.selectService') : t('page.appointments.add.selectServices')}
                subtitle={isEditMode && (!editableBooking || replaceItemIndex != null) ? t('page.appointments.add.selectServiceDesc') : t('page.appointments.add.selectServicesDesc')}
                expandAllCategories={true}
              />
              {(!isEditMode || editableBooking) && locationBundles.length > 0 && (
                <ManageBundlesSheet
                  isOpen={isManageBundlesSheetOpen}
                  onClose={() => setIsManageBundlesSheetOpen(false)}
                  allBundles={editableBooking ? editedPickerBundles : bundlesForSheet}
                  initialSelectedIds={editableBooking ? editBundleSelection : selectedBundleIds}
                  mode={editableBooking && replaceItemIndex != null ? 'single' : 'multi'}
                  onApply={editableBooking ? (ids) => applyBookedChoices('bundle', ids) : handleApplyBundleIds}
                  title={editableBooking && replaceItemIndex != null ? t('page.appointments.add.selectBundle') : t('page.appointments.add.selectBundles')}
                  subtitle={editableBooking && replaceItemIndex != null ? undefined : t('page.appointments.add.selectBundlesDesc')}
                />
              )}

              {!hasSelectedAnyItem ? (
                <div className="p-3 rounded-lg bg-surface-hover text-foreground-3 dark:text-foreground-2 text-sm">
                  {/* Two whole sentences rather than one built by concatenation:
                      the clause order differs by language. */}
                  {(!isEditMode || editableBooking) && locationBundles.length > 0
                    ? t('page.appointments.add.emptyPromptServicesAndBundles')
                    : t('page.appointments.add.emptyPromptServices')}
                </div>
              ) : (
                <div className="space-y-3">
                  {!fixedBooking && !editableBooking && (
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
                  )}
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
                        item={editableBooking ? { ...item, staffUserId: editStaffUserId } : item}
                        index={idx}
                        locationServices={locationServices}
                        locationBundles={locationBundles}
                        locationTeamMembers={locationTeamMembers}
                        currency={appointmentCurrency}
                        onUpdateStaff={handleUpdateItemStaff}
                        onStaffPickerActiveChange={isEditMode ? setStaffPickerActive : undefined}
                        onRemoveItem={handleRemoveItem}
                        assignmentsPath={assignmentsPath}
                        onNavigateAway={onClose}
                        showAssignmentReminder={!editableBooking}
                        isFirstUnassigned={idx === firstUnassignedIdx}
                        fixed={editableBooking ? {
                          content: (
                            <BookedItemsList items={editedDisplayItems} currency={appointmentCurrency}
                              renderActions={(booked, index) => (
                                <DropdownMenu modal={false}>
                                  <DropdownMenuTrigger asChild>
                                    <Button type="button" variant="ghost" rounded="full" size="icon"
                                      aria-label={t('page.appointments.add.editBookedItem', { name: booked.name || t('page.appointments.add.unknownItem') })}>
                                      <Ellipsis aria-hidden className="size-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="pointer-events-auto z-90">
                                    {locationServices.length > 0 && (
                                      <DropdownMenuItem onSelect={() => openBookedPicker('service', index)}>
                                        {t('page.appointments.add.replaceWithService')}
                                      </DropdownMenuItem>
                                    )}
                                    {locationBundles.length > 0 && (
                                      <DropdownMenuItem onSelect={() => openBookedPicker('bundle', index)}>
                                        {t('page.appointments.add.replaceWithBundle')}
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onSelect={() => setBookedDraft((rows) => rows.filter((_, position) => position !== index))}>
                                      {t('page.appointments.add.removeBookedItem')}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            />
                          ),
                          allowedStaffIds: bookedItemsChanged ? editedAllowedStaffIds : fixedBooking ? fixedAllowedStaffIds
                            : getItemAllowedStaffIds(item, locationServices, locationBundles),
                          staffLocked: isTeamMember && !((editableBooking.staffCount > 1 || editableBooking.staffCount === 0) && bookedItemsChanged),
                        } : fixedBooking ? {
                          content: <BookedItemsList items={fixedBooking.items} currency={appointmentCurrency} />,
                          allowedStaffIds: fixedAllowedStaffIds,
                          staffLocked: startedLock,
                        } : undefined}
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
                        currency={appointmentCurrency}
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
                description={startedLock ? undefined : t('page.appointments.add.dateAndTimeDesc')}
              />
              {startedLock ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground-1">{form.date?.toLocaleDateString(getCalendarLocale(), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  {form.time && (
                    <p className="text-sm text-foreground-2">
                      {formatSlotTime(form.time)} – {formatSlotTime(getEndTimeString(form.time, durationMinutes))} · {durationMinutes} min
                    </p>
                  )}
                </div>
              ) : (<>
              {!hasSelectedAnyItem && (
                <div className="p-3 rounded-lg bg-surface-hover text-foreground-3 dark:text-foreground-2 text-sm">
                  {t('page.appointments.add.lockedNeedItems')}
                </div>
              )}
              {hasSelectedAnyItem && !isStaffReadyForSlots && (
                editableBooking && hasItemWithoutEligibleStaff ? (
                  <AssignmentReminderNote
                    text={t('page.appointments.add.lockedNeedEditedItemAssignments')}
                    linkLabel={t('page.appointments.add.assignmentsLink')}
                    to={assignmentsPath}
                    onNavigate={onClose}
                    tone="warning"
                  />
                ) : (
                  <div className="p-3 rounded-lg bg-surface-hover text-foreground-3 dark:text-foreground-2 text-sm">
                    {t(staffRequiredMessageKey)}
                  </div>
                )
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
                <div ref={dateFieldRef} className="space-y-2">
                  <Label htmlFor="appointment-date" className="text-sm font-medium text-foreground-1">{t('page.appointments.add.dateLabel')}</Label>
                  <DatePicker
                    value={form.date}
                    onChange={handleDateChange}
                    triggerId="appointment-date"
                    disabled={!canSelectDateTime}
                    invalid={scheduleAttention === 'date'}
                    minDate={locationToday}
                    today={locationToday}
                    connectedPopover
                    className={cn(
                      "border bg-surface hover:bg-surface-hover focus:bg-surface h-12 text-base w-full px-4",
                      canSelectDateTime ? "border-border-strong dark:border-border-strong" : "border-border dark:border-border-subtle",
                      scheduleAttention === 'date' && visibleScheduleField === 'date' && "staff-picker-pulse"
                    )}
                    placeholder={t('page.appointments.add.selectDate')}
                    mobileTitle={t('page.appointments.add.dateLabel')}
                  />
                </div>
                <div ref={timeFieldRef} className="space-y-2">
                  <Label htmlFor="appointment-time" className="text-sm font-medium text-foreground-1">{t('page.appointments.add.timeLabel')}</Label>
                  {displayTimeSlots.length > 0 ? (
                    <ResponsivePopover
                      open={hourOpen}
                      onOpenChange={handleHourOpenChange}
                      title={t('page.appointments.add.timeLabel')}
                      trigger={
                        <Button
                          id="appointment-time"
                          type="button"
                          variant="outline"
                          aria-invalid={scheduleAttention === 'time' || undefined}
                          className={cn(
                            "w-full h-12 text-base justify-between font-normal border bg-surface hover:bg-surface-hover rounded-full px-4",
                            !isMobile && (hourOpen || hourClosingAnimation)
                              ? "!rounded-b-none !rounded-t-[16px] border-x border-t border-b-0 border-border-strong dark:border-border-strong shadow-none"
                              : (slotsPending || !canSelectDateTime || !form.date)
                                ? "border-border dark:border-border-subtle"
                                : "border-border-strong dark:border-border-strong",
                            scheduleAttention === 'time' && visibleScheduleField === 'time' &&
                              !hourOpen && !hourClosingAnimation && "staff-picker-pulse"
                          )}
                          disabled={slotsPending || !canSelectDateTime || !form.date}
                        >
                          {slotsPending ? (
                            <span className="flex items-center gap-2 text-foreground-3 dark:text-foreground-2">
                              <Loader2 className="h-4 w-4 animate-spin" /> Loading times...
                            </span>
                          ) : form.time && scheduleAttention !== 'time' ? (
                            <span className="text-foreground-1">{formatSlotTime(form.time)}</span>
                          ) : (
                            <span className="text-foreground-3 dark:text-foreground-2">{t('page.appointments.add.selectTime')}</span>
                          )}
                          {!slotsPending && <Clock className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
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
                      {slotsPending ? (
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

              {slotsPending && canSelectDateTime && slotRequest ? (
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
              ) : showNextAvailable && suggestedDate ? (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm text-foreground-1 leading-relaxed">
                    <CalendarClock className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-medium text-foreground-1">{t('page.appointments.add.noInHoursSlots')}</p>
                      <p className="text-xs text-foreground-3 dark:text-foreground-2">
                        {t('page.appointments.add.nextAvailableDay', {
                          date: suggestedDate.toLocaleDateString(getCalendarLocale(), { day: 'numeric', month: 'short', year: 'numeric' }),
                        })}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    rounded="full"
                    className="!px-6 w-fit border-border-strong text-foreground-1 group disabled:opacity-50"
                    onClick={() => handleDateChange(suggestedDate)}
                  >
                    <span>{t('page.appointmentCard.nextAvailableDate')}</span>
                    <ArrowRight className="h-4 w-4 ml-2 text-primary transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
                  </Button>
                </div>
              ) : showNextAvailable && nextAvailableSearchDays != null ? (
                <p className="text-xs text-foreground-3 dark:text-foreground-2">
                  {t('page.appointments.add.noNextAvailableDay', { count: nextAvailableSearchDays })}
                </p>
              ) : null}
              {slotFetchError && (
                <div className="text-xs text-destructive">
                  {slotFetchError}
                </div>
              )}

              {form.time && !scheduleAttention && durationMinutes > 0 && (
                <div className="text-xs text-foreground-3 dark:text-foreground-2">
                  Appointment: {formatSlotTime(form.time)} &ndash;{' '}
                  {formatSlotTime(getEndTimeString(form.time, durationMinutes))}{' '}
                  ({durationMinutes} min)
                </div>
              )}
              {isSpanMidnight && !durationExceedsOneDay && (
                <p className="text-sm text-destructive" role="status">
                  {t('page.appointments.add.spansTwoDays')}
                </p>
              )}
              </>)}
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
        open={confirmOpen || reassignmentOverride !== null}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) handleCancelOverrides();
        }}
        onConfirm={handleConfirmOverrides}
        onCancel={handleCancelOverrides}
        title={reassignmentOverride
          ? t('page.appointments.confirmDialog.reassignAnyway')
          : getConfirmDialogTitle(pendingUpdateRef.current != null, t)}
        description={
          <div className="space-y-3">
            <p className="text-sm text-foreground-3 dark:text-foreground-2">
              {reassignmentOverride
                ? t('page.appointments.confirmDialog.outOfHoursReassign')
                : getConfirmDialogDescription(confirmReason ?? 'out_of_hours', pendingUpdateRef.current != null, t)}
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
        confirmTitle={reassignmentOverride
          ? t('page.appointments.confirmDialog.yesReassign')
          : getConfirmButtonTitle(pendingUpdateRef.current != null, t)}
      />
    </BaseSlider>
  );
};

export default AddAppointmentSlider;
