import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Ban,
  CheckCircle2,
  UserX,
  Mail,
  MessageSquare,
  Pencil,
  ShieldAlert,
  X,
  User,
  Copy,
  ExternalLink,
  ArrowUpRight,
  CalendarCheck,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../shared/components/ui/button";
import { Label } from "../../../shared/components/ui/label";
import { Textarea } from "../../../shared/components/ui/textarea";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../shared/components/ui/avatar";
import { Badge } from "../../../shared/components/ui/badge";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
} from "../../../shared/components/ui/alert-dialog";
import { Switch } from "../../../shared/components/ui/switch";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import { cn } from "../../../shared/lib/utils";
import {
  Dialog,
  DialogPortal,
  DialogTitle,
  DialogDescription,
} from "../../../shared/components/ui/dialog";
import { Drawer, DrawerContent } from "../../../shared/components/ui/drawer";
import { useIsMobile } from "../../../shared/hooks/use-mobile";
import { DashedDivider } from "../../../shared/components/common/DashedDivider";
import { CollapsibleFormSection } from "../../../shared/components/forms/CollapsibleFormSection";
import { useDispatch, useSelector } from "react-redux";
import {
  updateAppointmentStatus,
  cancelAppointment,
  toggleAddForm,
} from "../actions";
import {
  getLocationStaff,
  getBookingSettings,
  getCalendarTimezone,
  getAddFormSelector,
} from "../selectors";
import {
  getAppointmentGroupRequest,
  getAppointmentDetailRequest,
} from "../api";
import { getGroupDotColor } from "../colors";
import {
  formatTimeKey,
  formatTimeRange,
  getStaffDisplayNames,
  getStatusBadge,
  getBookingSourceLabel,
  getBookedViaLabel,
  getBookingSourcePillParts,
  assignmentStylePillLayout,
  formatDurationHuman,
  getNoCustomerDisplayLabel,
} from "./utils";
import type { Appointment } from "../../../shared/types/calendar";
import { selectIsTeamMember, selectCurrentUser } from "../../auth/selectors";
import { getCurrencyDisplay } from "../../../shared/utils/currency";
import {
  buildZonedDateFromDateKey,
  formatDateInTimezone,
  formatActivityTimelineDateTime,
  formatDetailOverviewDate,
  isAppointmentEndInPast,
} from "../timezone";
import { getAvatarBgColor } from "../../setupWizard/components/StepTeam";

/** Default arrow on copy; pointer on controls; I-beam in fields */
const APPOINTMENT_DIALOG_CURSOR =
  "cursor-default [&_button:not(:disabled)]:cursor-pointer [&_button:disabled]:cursor-not-allowed [&_a]:cursor-pointer [&_textarea]:cursor-text [&_input]:cursor-text [&_[role=switch]]:cursor-pointer";

/**
 * Outer shell for the appointment summary.
 * Desktop → centered Radix Dialog. Mobile → bottom Vaul Drawer (swipe-to-close).
 * Keeps the inner body identical (DialogTitle/DialogDescription/DialogPrimitive.Close
 * still work inside vaul since it wraps Radix Dialog internally).
 */
interface SummaryShellProps {
  isMobile: boolean;
  open: boolean;
  shouldBlockClose: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const SummaryShell: React.FC<SummaryShellProps> = ({
  isMobile,
  open,
  shouldBlockClose,
  onClose,
  children,
}) => {
  const guard = (e: { preventDefault: () => void }) => {
    if (shouldBlockClose) e.preventDefault();
  };

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={(o) => {
          if (!o && !shouldBlockClose) onClose();
        }}
      >
        <DrawerContent
          onPointerDownOutside={guard}
          onInteractOutside={guard}
          onEscapeKeyDown={guard}
          className={cn(
            "z-[70] max-h-[92vh] bg-white dark:bg-surface border-border rounded-t-2xl overflow-hidden p-0 flex flex-col",
            APPOINTMENT_DIALOG_CURSOR,
          )}
          overlayClassName="z-[70]"
        >
          {children}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog
      open={open}
      modal={false}
      onOpenChange={(o) => {
        if (!o && !shouldBlockClose) onClose();
      }}
    >
      <DialogPortal>
        <div
          className="fixed inset-0 z-[70] bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          data-state={open ? "open" : "closed"}
          onClick={() => {
            if (!shouldBlockClose) onClose();
          }}
        />
        <DialogPrimitive.Content
          onPointerDownOutside={guard}
          onInteractOutside={guard}
          onEscapeKeyDown={guard}
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[state=open]:zoom-in-[0.97] data-[state=closed]:zoom-out-[0.97]",
            "data-[state=open]:slide-in-from-bottom-3 data-[state=closed]:slide-out-to-bottom-2",
            "data-[state=open]:duration-250 data-[state=closed]:duration-150",
            "fixed left-[50%] top-[50%] z-[70] flex w-[calc(100%-2rem)] max-w-3xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%]",
            "flex-col overflow-hidden rounded-2xl border border-border bg-white p-0 shadow-lg dark:bg-surface",
            "focus:outline-none focus-visible:outline-none",
            APPOINTMENT_DIALOG_CURSOR,
          )}
        >
          {children}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

/**
 * Collapsible section shell — matches Calendar → Settings → Advanced (outer bordered panel).
 */
const ADVANCED_SETTINGS_COLLAPSIBLE_OUTER_CLASS =
  "border border-border p-3 md:p-4 rounded-2xl bg-surface md:bg-transparent";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface EditAppointmentSliderProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  /** When provided (e.g. from grid group fetch), use instead of fetching group in useEffect. */
  groupAppointments?: Appointment[] | null;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

const EditAppointmentSlider: React.FC<EditAppointmentSliderProps> = ({
  isOpen,
  onClose,
  appointment: appointmentProp,
  groupAppointments: groupAppointmentsProp,
}) => {
  const { t } = useTranslation("calendar");

  // Keep last valid appointment so dialog can render during exit animation
  const lastAppointmentRef = useRef<Appointment | null>(null);
  if (appointmentProp) lastAppointmentRef.current = appointmentProp;
  const appointment = appointmentProp ?? lastAppointmentRef.current;

  // Local open state so Radix controls the close animation lifecycle
  const [dialogOpen, setDialogOpen] = useState(isOpen);
  useEffect(() => {
    if (isOpen) setDialogOpen(true);
  }, [isOpen]);
  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    // Delay the Redux dispatch so Radix can run exit animation
    setTimeout(onClose, 180);
  }, [onClose]);

  const servicesSectionRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const dispatch = useDispatch();
  const locationStaff = useSelector(getLocationStaff);
  const bookingSettings = useSelector(getBookingSettings);
  const calendarTimezone = useSelector(getCalendarTimezone);
  const isTeamMember = useSelector(selectIsTeamMember);
  const currentUser = useSelector(selectCurrentUser);
  const addFormOpen = useSelector(getAddFormSelector);
  const businessCurrency = currentUser?.business?.businessCurrency ?? "eur";
  const currencyDisplay = useMemo(
    () => getCurrencyDisplay(businessCurrency),
    [businessCurrency],
  );
  const auditTimezone =
    (calendarTimezone && String(calendarTimezone).trim()) || "UTC";

  const activityTimelineItems = useMemo(() => {
    if (!appointment)
      return [] as Array<{ id: string; title: string; meta: string }>;
    const rows: Array<{ id: string; title: string; meta: string }> = [
      {
        id: "created",
        title: t("page.appointments.edit.appointmentCreated"),
        meta: `${getBookingSourceLabel(appointment.bookingSource, t)} · ${formatActivityTimelineDateTime(appointment.createdAt, auditTimezone)}`,
      },
    ];
    if (appointment.overrideReason && appointment.overrideUsedAt) {
      rows.push({
        id: "override",
        title: t("page.appointments.edit.adminOverrideApplied"),
        meta: `${t("page.appointments.edit.system")} · ${formatActivityTimelineDateTime(appointment.overrideUsedAt, auditTimezone)}`,
      });
    }
    rows.push({
      id: "updated",
      title: t("page.appointments.edit.lastUpdated"),
      meta: `${t("page.appointments.edit.system")} · ${formatActivityTimelineDateTime(appointment.updatedAt, auditTimezone)}`,
    });
    return rows;
  }, [appointment, auditTimezone, t]);

  // Cancel dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [notificationMethod, setNotificationMethod] = useState<
    "email" | "sms" | "both"
  >("both");

  // Inline confirmation for complete / no-show (no modal)
  const [pendingConfirm, setPendingConfirm] = useState<
    "complete" | "no_show" | null
  >(null);
  const [exitingConfirm, setExitingConfirm] = useState(false);

  // Loading state for actions
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Group appointments (when this appointment is part of a booking group)
  const [groupAppointments, setGroupAppointments] = useState<
    Appointment[] | null
  >(null);
  const [groupLoading, setGroupLoading] = useState(false);

  const [accServicesOpen, setAccServicesOpen] = useState(true);
  const [accHistoryOpen, setAccHistoryOpen] = useState(false);
  const [accLocationOpen, setAccLocationOpen] = useState(false);
  const [accCancellationOpen, setAccCancellationOpen] = useState(false);

  // Body scroll lock — replaces Radix modal's built-in lock (we use modal={false} so
  // the slider can receive pointer events when layered on top of this dialog).
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Fetch full appointment details when dialog opens with slim/placeholder data
  const [fullAppointment, setFullAppointment] = useState<Appointment | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const isPlaceholder =
    appointment != null &&
    appointment.teamMembers?.length === 0 &&
    appointment.location?.id === 0;

  useEffect(() => {
    if (!isOpen || !appointment) {
      setFullAppointment(null);
      return;
    }
    if (!isPlaceholder) {
      setFullAppointment(null);
      return;
    }
    setDetailLoading(true);
    const bookingGroupId = appointment.bookingGroupId;
    if (bookingGroupId) {
      getAppointmentGroupRequest(bookingGroupId)
        .then((list) => {
          const arr = Array.isArray(list) ? list : [];
          const item =
            arr.find((a: { id: number }) => a.id === appointment.id) ?? arr[0];
          if (item) setFullAppointment(item);
          setGroupAppointments(arr);
        })
        .catch(() => {})
        .finally(() => {
          setDetailLoading(false);
          setGroupLoading(false);
        });
    } else {
      getAppointmentDetailRequest(appointment.id)
        .then((full) => setFullAppointment(full))
        .catch(() => {})
        .finally(() => setDetailLoading(false));
    }
  }, [isOpen, appointment?.id, isPlaceholder]);

  // Use full data when available, fall back to placeholder
  const displayAppointment = fullAppointment ?? appointment;

  // Reset state when slider closes
  useEffect(() => {
    if (!isOpen) {
      setCancelDialogOpen(false);
      setCancelReason("");
      setNotifyCustomer(true);
      setNotificationMethod("both");
      setPendingConfirm(null);
      setExitingConfirm(false);
      setActionLoading(null);
      setGroupAppointments(null);
      setFullAppointment(null);
      setDetailLoading(false);
      setAccServicesOpen(true);
      setAccHistoryOpen(false);
      setAccLocationOpen(false);
      setAccCancellationOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !appointment) return;
    // Start collapsed when opening with placeholder, expand when full data arrives
    setAccServicesOpen(!isPlaceholder);
    setAccHistoryOpen(false);
    setAccLocationOpen(false);
    setAccCancellationOpen(
      appointment.status === "cancelled" && !!appointment.cancellationReason,
    );
  }, [isOpen, appointment?.id, isPlaceholder]);

  // Expand services accordion when full data loads
  useEffect(() => {
    if (fullAppointment && !detailLoading) {
      setAccServicesOpen(true);
    }
  }, [fullAppointment, detailLoading]);

  // When parent passes preloaded group (e.g. from grid), use it and skip fetch
  useEffect(() => {
    if (
      isOpen &&
      groupAppointmentsProp != null &&
      Array.isArray(groupAppointmentsProp) &&
      groupAppointmentsProp.length > 0
    ) {
      setGroupAppointments(groupAppointmentsProp);
      setGroupLoading(false);
      return;
    }
  }, [isOpen, groupAppointmentsProp]);

  // Fetch full group when opening with full data (e.g. from URL deep link) that already has appointment but needs group
  useEffect(() => {
    if (!isOpen || !appointment || isPlaceholder) return;
    const bookingGroupId = (appointment as { bookingGroupId?: string | null })
      ?.bookingGroupId;
    if (!bookingGroupId) return;
    if (
      groupAppointmentsProp != null &&
      Array.isArray(groupAppointmentsProp) &&
      groupAppointmentsProp.length > 0
    )
      return;
    if (groupAppointments != null) return;
    setGroupLoading(true);
    getAppointmentGroupRequest(bookingGroupId)
      .then((list) => setGroupAppointments(Array.isArray(list) ? list : []))
      .catch(() => setGroupAppointments([]))
      .finally(() => setGroupLoading(false));
  }, [isOpen, appointment?.id, isPlaceholder, groupAppointmentsProp]);

  // ─────────────────────────────────────────────────────────────
  // Derived data from appointment
  // ─────────────────────────────────────────────────────────────

  /** Merged linked customer + booking-time snapshot (name, contact, photo). */
  const clientDisplay = useMemo(() => {
    if (!displayAppointment) {
      return {
        displayName: "",
        email: "",
        phone: "",
        profileImage: null as string | null,
        linkedCustomerId: undefined as number | undefined,
        snapshotOnly: false,
      };
    }
    const cust = displayAppointment.customer;
    const snap = displayAppointment.customerSnapshot;
    const first = (cust?.firstName ?? snap?.firstName ?? "").trim();
    const last = (cust?.lastName ?? snap?.lastName ?? "").trim();
    const name = [first, last].filter(Boolean).join(" ");
    const email = String(cust?.email ?? snap?.email ?? "").trim();
    const phone = String(cust?.phone ?? snap?.phone ?? "").trim();
    const img = (cust?.profileImage ?? snap?.profileImage ?? "").trim();
    const profileImage = img || null;
    const hasContact = !!(name || email || phone);
    const displayName = name || getNoCustomerDisplayLabel(t);
    const snapshotOnly = !cust && !!(snap && hasContact);
    return {
      displayName,
      email,
      phone,
      profileImage,
      linkedCustomerId: cust?.id,
      snapshotOnly,
    };
  }, [displayAppointment, t]);

  const staffNames = useMemo(() => {
    if (!displayAppointment) return t("page.common.unassigned");
    const ids =
      displayAppointment.teamMembers?.map((tm: any) => tm.id ?? tm) ?? [];
    if (ids.length === 0) return t("page.common.unassigned");
    return getStaffDisplayNames(ids, locationStaff, t);
  }, [displayAppointment, locationStaff, t]);

  /** Staff rows from location context (profile images for Visit card). */
  const assignedStaffMembers = useMemo(() => {
    if (!displayAppointment?.teamMembers?.length) return [];
    const ids = displayAppointment.teamMembers
      .map((tm: { id?: number }) =>
        typeof tm === "object" && tm != null ? tm.id : (tm as number),
      )
      .filter((id): id is number => id != null);
    return ids
      .map((id) => locationStaff.find((s) => s.id === id))
      .filter((s): s is (typeof locationStaff)[0] => s != null);
  }, [displayAppointment?.teamMembers, locationStaff]);

  const isUnassigned =
    !displayAppointment?.teamMembers ||
    displayAppointment.teamMembers.length === 0;
  const headerMetaDateTime = useMemo(() => {
    if (!displayAppointment) return "";
    const dateStr = formatDetailOverviewDate(
      displayAppointment.scheduledAt,
      auditTimezone,
      {
        weekday: "short",
      },
    );
    const timeStr = formatTimeRange(
      new Date(displayAppointment.scheduledAt).toISOString(),
      new Date(displayAppointment.endsAt).toISOString(),
      auditTimezone,
    );
    return `${dateStr} · ${timeStr}`;
  }, [displayAppointment, auditTimezone]);

  const headerMetaStaff = useMemo(() => {
    if (!displayAppointment) return "";
    return isUnassigned ? t("page.common.unassigned") : t("page.common.assignedTo", { names: staffNames });
  }, [displayAppointment, isUnassigned, staffNames, t]);

  /** Relative date for header line 2: "Today", "Tomorrow", "Yesterday", "In N days", or "N days ago". */
  const headerRelativeDate = useMemo(() => {
    if (!displayAppointment) return "";
    const tz = auditTimezone;
    const todayStr = formatDateInTimezone(new Date(), tz);
    const appStr = formatDateInTimezone(
      new Date(displayAppointment.scheduledAt),
      tz,
    );
    if (todayStr === appStr) return t("page.common.today");
    const parse = (s: string) => new Date(s + "T12:00:00Z").getTime();
    const diffDays = Math.round((parse(appStr) - parse(todayStr)) / 86400000);
    if (diffDays === 1) return t("page.common.tomorrow");
    if (diffDays === -1) return t("page.common.yesterday");
    if (diffDays > 1 && diffDays <= 365) return t("page.common.inDays", { count: diffDays });
    if (diffDays < -1 && diffDays >= -365) return t("page.common.daysAgo", { count: -diffDays });
    return "";
  }, [displayAppointment, auditTimezone, t]);

  const bookingLastEndMs = useMemo(() => {
    const list =
      groupAppointments && groupAppointments.length > 0
        ? groupAppointments
        : displayAppointment
          ? [displayAppointment]
          : [];
    if (list.length === 0) return null;
    return Math.max(...list.map((a) => new Date(a.endsAt).getTime()));
  }, [displayAppointment, groupAppointments]);

  const isBookingInPast =
    bookingLastEndMs != null &&
    isAppointmentEndInPast(new Date(bookingLastEndMs), new Date());

  const canCancel =
    (!isTeamMember || !!bookingSettings?.allowStaffCancelWithoutConfirmation) &&
    !isBookingInPast;
  const canReschedule =
    !isTeamMember || !!bookingSettings?.allowStaffRescheduleWithoutConfirmation;

  /** Items to show in Services section: all segments (group or single) with name, duration, price, type. */
  const serviceDetailItems = useMemo(() => {
    const list =
      groupAppointments && groupAppointments.length > 1
        ? groupAppointments
        : displayAppointment
          ? [displayAppointment]
          : [];
    return list.map((a) => {
      const start = new Date(a.scheduledAt).getTime();
      const end = new Date(a.endsAt).getTime();
      const durationMinutes = Math.round((end - start) / (60 * 1000));
      const name =
        a.bookedItemName ?? a.service?.name ?? a.bundle?.name ?? t("page.appointments.add.unknownItem");
      const isBundle = a.bundle != null && !a.service;
      const priceMajor = (a.price ?? 0) / 100;
      return { name, durationMinutes, priceMajor, isBundle };
    });
  }, [displayAppointment, groupAppointments, t]);

  const serviceDetailTotalPrice = useMemo(
    () => serviceDetailItems.reduce((sum, i) => sum + i.priceMajor, 0),
    [serviceDetailItems],
  );
  const serviceDetailTotalDuration = useMemo(
    () => serviceDetailItems.reduce((sum, i) => sum + i.durationMinutes, 0),
    [serviceDetailItems],
  );

  const appointmentSlotMinutes = useMemo(() => {
    if (!appointment) return 0;
    const ms =
      new Date(appointment.endsAt).getTime() -
      new Date(appointment.scheduledAt).getTime();
    return Math.max(0, Math.round(ms / 60000));
  }, [appointment]);

  const isGroupBooking = serviceDetailItems.length > 1;

  /** Wall-clock span from earliest segment start to latest segment end (group bookings only). */
  const groupBookingWallTimeRange = useMemo(() => {
    if (!groupAppointments || groupAppointments.length < 2) return null;
    const starts = groupAppointments.map((a) =>
      new Date(a.scheduledAt).getTime(),
    );
    const ends = groupAppointments.map((a) => new Date(a.endsAt).getTime());
    const minStart = Math.min(...starts);
    const maxEnd = Math.max(...ends);
    return formatTimeRange(
      new Date(minStart).toISOString(),
      new Date(maxEnd).toISOString(),
      auditTimezone,
    );
  }, [groupAppointments, auditTimezone]);

  /**
   * Inline link: AddServiceSlider-style hover + arrow; explicit regular weight (not bold) for this modal.
   */
  const sliderInlineLinkClass =
    "inline-flex min-w-0 max-w-full items-center gap-0.5 !font-normal text-foreground-2 transition-colors duration-200 hover:text-primary dark:text-foreground-2 dark:hover:text-primary";

  const scrollToServicesSection = useCallback(() => {
    setAccServicesOpen(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        servicesSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Status Actions
  // ─────────────────────────────────────────────────────────────

  const handleStatusChange = (status: string) => {
    if (!appointment) return;
    setActionLoading(status);
    dispatch(
      updateAppointmentStatus.request({
        appointmentId: appointment.id,
        status,
      }),
    );
    setActionLoading(null);
    handleDialogClose();
  };

  const handleCancelConfirm = () => {
    if (!appointment) return;
    setActionLoading("cancelled");

    // Convert 'both' to array format expected by backend DTO
    const methods: string[] =
      notificationMethod === "both" ? ["email", "sms"] : [notificationMethod];

    dispatch(
      cancelAppointment.request({
        appointmentId: appointment.id,
        reason: cancelReason || t("page.appointments.edit.noReasonProvided"),
        notifyCustomer,
        notificationMethods: notifyCustomer ? methods : [],
      }),
    );

    setCancelDialogOpen(false);
    setCancelReason("");
    setNotifyCustomer(true);
    setNotificationMethod("both");
    setActionLoading(null);
    handleDialogClose();
  };

  const handleInlineConfirm = () => {
    if (!pendingConfirm) return;
    const status = pendingConfirm === "complete" ? "completed" : "no_show";
    handleStatusChange(status);
    setPendingConfirm(null);
  };

  const openCompleteDialog = () => setPendingConfirm("complete");
  const openNoShowDialog = () => setPendingConfirm("no_show");

  const handleNotificationMethodSelect = useCallback(
    (method: "email" | "sms" | "both") => {
      setNotificationMethod(method);
    },
    [],
  );

  // ─────────────────────────────────────────────────────────────
  // Reschedule
  // ─────────────────────────────────────────────────────────────

  const handleReschedule = useCallback(() => {
    if (!displayAppointment) return;
    // Keep the detail dialog open behind the edit slider so the user can return to it.
    const cust = displayAppointment.customer;
    const snap = displayAppointment.customerSnapshot;
    const customer = cust
      ? {
          firstName: cust.firstName ?? "",
          lastName: cust.lastName ?? "",
          email: cust.email ?? "",
          phone: cust.phone ?? "",
        }
      : snap && (snap.firstName || snap.lastName || snap.email || snap.phone)
        ? {
            firstName: snap.firstName ?? "",
            lastName: snap.lastName ?? "",
            email: snap.email ?? "",
            phone: snap.phone ?? "",
          }
        : null;
    const bookingGroupId = displayAppointment.bookingGroupId ?? undefined;

    // Build groupItems for multi-segment groups (same order as API / bookingGroupOrder)
    let groupItems:
      | Array<{
          appointmentId?: number;
          serviceId?: number;
          bundleId?: number;
          staffUserId?: number;
          itemName?: string;
        }>
      | undefined;
    if (groupAppointments && groupAppointments.length > 1) {
      groupItems = groupAppointments.map((row) => {
        const staffUserId = (() => {
          const first = row.teamMembers?.[0];
          if (first == null) return undefined;
          return typeof first === "object"
            ? (first as { id?: number }).id
            : first;
        })();
        const itemName =
          row.bookedItemName ??
          row.bundle?.name ??
          row.service?.name ??
          t("page.appointments.edit.service");
        if (row.bundle?.id != null) {
          return {
            appointmentId: row.id,
            bundleId: row.bundle.id,
            staffUserId,
            itemName,
          };
        }
        return {
          appointmentId: row.id,
          serviceId: row.service?.id,
          staffUserId,
          itemName,
        };
      });
    }

    dispatch(
      toggleAddForm({
        open: true,
        prefill: {
          appointmentId: displayAppointment.id,
          bookingGroupId,
          date: buildZonedDateFromDateKey(
            formatDateInTimezone(
              new Date(displayAppointment.scheduledAt),
              calendarTimezone,
            ),
            "00:00",
            calendarTimezone,
          ),
          time: formatTimeKey(
            new Date(displayAppointment.scheduledAt).toISOString(),
            calendarTimezone,
          ),
          staffUserId: (() => {
            const first = displayAppointment.teamMembers?.[0];
            if (first == null) return undefined;
            return typeof first === "object"
              ? (first as { id?: number }).id
              : first;
          })(),
          serviceId: displayAppointment.service?.id,
          bundleId: displayAppointment.bundle?.id,
          customerId: displayAppointment.customer?.id,
          customerDisplay: customer,
          notes: displayAppointment.notes ?? "",
          ...(groupItems != null ? { groupItems } : {}),
        },
      }),
    );

    // On mobile the summary drawer and the add-appointment slider are both full-screen.
    // Keeping the drawer open underneath causes vaul's scroll lock + drag gesture to
    // intercept touches, freezing the slider on top. Close the drawer; desktop keeps it
    // open because it's a centered non-modal dialog visible alongside the slider.
    if (isMobile) {
      handleDialogClose();
    }
  }, [displayAppointment, calendarTimezone, dispatch, groupAppointments, isMobile, handleDialogClose]);

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  if (!appointment || !displayAppointment) return null;

  const isCancelled = displayAppointment.status === "cancelled";
  const isCompleted = displayAppointment.status === "completed";
  const isNoShow = displayAppointment.status === "no_show";
  const isTerminal = isCancelled || isCompleted || isNoShow;

  return (
    <>
      <SummaryShell
        isMobile={isMobile}
        open={dialogOpen}
        shouldBlockClose={addFormOpen || cancelDialogOpen}
        onClose={handleDialogClose}
      >
            <div className="relative shrink-0 px-5 pt-5 pb-0 md:px-6">
              <div className="flex items-center gap-4 pr-[4.5rem] sm:pr-52">
                {!isMobile && (
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border/80 bg-muted/50 dark:bg-muted/30"
                    aria-hidden
                  >
                    <CalendarCheck
                      className="h-6 w-6 text-foreground-1"
                      strokeWidth={2.25}
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex min-w-0 items-center gap-3">
                    <DialogTitle
                      className={cn(
                        isMobile
                          ? "sr-only"
                          : "min-w-0 truncate text-lg font-semibold leading-snug text-foreground-1",
                      )}
                    >
                      {t("page.appointments.appointmentDetails")}
                    </DialogTitle>
                    <div className="flex shrink-0 items-center gap-2">
                      {getStatusBadge(appointment.status, t)}
                    </div>
                  </div>
                  <DialogDescription asChild>
                    <div className="min-w-0 space-y-0.5 text-xs leading-relaxed text-foreground-3 dark:text-foreground-2">
                      <p
                        className="truncate"
                        title={`${headerMetaDateTime} · ${headerMetaStaff}`}
                      >
                        {isMobile
                          ? headerMetaDateTime
                          : `${headerMetaDateTime} · ${headerMetaStaff}`}
                      </p>
                      {isMobile ? (
                        <p className="truncate text-foreground-3/90">
                          {headerRelativeDate
                            ? `${headerRelativeDate} · ${headerMetaStaff}`
                            : headerMetaStaff}
                        </p>
                      ) : headerRelativeDate ? (
                        <p className="truncate text-foreground-3/90">
                          {headerRelativeDate}
                        </p>
                      ) : null}
                    </div>
                  </DialogDescription>
                </div>
              </div>
              <div className="absolute right-3 top-4 flex items-center gap-2 sm:right-4 sm:top-5">
                {!isTerminal && canReschedule && !isBookingInPast && (
                  <Button
                    variant="ghost"
                    size="sm"
                    rounded="full"
                    onClick={handleReschedule}
                    disabled={
                      actionLoading !== null ||
                      (!!appointment?.bookingGroupId &&
                        (groupLoading || groupAppointments === null))
                    }
                    className="group h-8 px-3 text-foreground-3 hover:text-foreground-1"
                  >
                    <Pencil
                      className="mr-1.5 h-3.5 w-3.5 shrink-0 transition-colors duration-200 group-hover:text-primary"
                      aria-hidden
                    />
                    {t("page.header.edit")}
                  </Button>
                )}
                <DialogPrimitive.Close
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground opacity-70 transition-[opacity,color]",
                    "hover:opacity-100 hover:text-destructive focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "disabled:pointer-events-none",
                  )}
                  aria-label={t("page.common.close")}
                >
                  <X className="h-5 w-5" />
                </DialogPrimitive.Close>
              </div>
              <DashedDivider
                marginTop="mt-0"
                paddingTop="pt-3"
                className="mb-4"
                dashPattern="1 1"
              />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 scrollbar-hide px-4 py-3 dark:bg-background/50 md:px-6 md:py-4">
              {detailLoading ? (
                <div className="space-y-4">
                  {/* Skeleton: Update status card — matches rounded-2xl p-3 md:p-5 real card */}
                  <div className="rounded-2xl border border-border bg-white p-3 shadow-sm dark:bg-card md:p-5">
                    <Skeleton className="h-4 w-28 mb-3" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-32 rounded-full" />
                      <Skeleton className="h-8 w-24 rounded-full" />
                    </div>
                  </div>

                  {/* Skeleton: Customer + details card — mirrors the real card's
                      customer block (avatar + name + contacts) AND the key-value
                      rows (date / time / notes / staff) inside a single card with
                      divide-y rhythm, so total height matches the loaded state. */}
                  <div className="rounded-2xl border border-border bg-white shadow-sm dark:bg-card">
                    <div className="p-3 md:p-5">
                      {/* Customer block: avatar + name + contact rows (~120px) */}
                      <div className="border-b border-border-subtle pb-4">
                        <div className="flex gap-4">
                          <Skeleton className="h-11 w-11 shrink-0 rounded-full ring-1 ring-border-subtle" />
                          <div className="min-w-0 flex-1 space-y-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-48" />
                            <div className="flex items-center gap-2 pt-1">
                              <Skeleton className="h-3 w-36" />
                              <span className="h-3.5 w-px bg-border" aria-hidden />
                              <Skeleton className="h-3 w-28" />
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Key-value rows — matches the real <dl> divide-y text-sm.
                          Uses py-3.5 per row to match loaded rhythm so nothing
                          shifts when data arrives. */}
                      <div className="divide-y divide-border-subtle text-sm">
                        {[
                          { label: "w-14", value: "w-48" },
                          { label: "w-20", value: "w-40" },
                          { label: "w-16", value: "w-56" },
                        ].map((row, i) => (
                          <div
                            key={i}
                            className="grid grid-cols-1 gap-1 py-3.5 sm:grid-cols-[minmax(7.5rem,9.5rem)_minmax(0,1fr)] sm:items-start sm:gap-x-6"
                          >
                            <Skeleton className={`h-3.5 ${row.label} sm:mt-0.5`} />
                            <Skeleton className={`h-4 ${row.value}`} />
                          </div>
                        ))}
                        <div className="grid grid-cols-1 gap-2 py-3.5 sm:grid-cols-[minmax(7.5rem,9.5rem)_minmax(0,1fr)] sm:items-start sm:gap-x-6">
                          <Skeleton className="h-3.5 w-24 sm:mt-1" />
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-9 w-9 rounded-full" />
                            <Skeleton className="h-4 w-28" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Skeleton: Services accordion — matches real card padding/radius */}
                  <div className="rounded-2xl border border-border bg-white p-3 shadow-sm dark:bg-card md:p-5">
                    <Skeleton className="h-4 w-24 mb-3" />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Skeleton className="h-2 w-2 rounded-full" />
                          <Skeleton className="h-4 w-40" />
                        </div>
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-3 w-56" />
                      <div className="flex items-center justify-between border-t border-border pt-3">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    {!isTerminal && (isBookingInPast || canCancel) && (
                      <div className="rounded-xl border border-border bg-white p-3 shadow-sm dark:bg-card md:p-4">
                        <Label className="text-sm font-semibold text-foreground-1">
                          {t("page.appointments.updateStatus")}
                        </Label>
                        {pendingConfirm ? (
                          <div
                            className={cn(
                              "mt-3 flex flex-wrap items-center justify-between gap-4",
                              exitingConfirm
                                ? "pointer-events-none animate-out fade-out-0 slide-out-to-bottom-2 duration-200 fill-mode-forwards"
                                : "animate-in fade-in-0 slide-in-from-bottom-2 duration-200",
                              "motion-reduce:animate-none motion-reduce:translate-y-0 motion-reduce:opacity-100",
                            )}
                          >
                            <p className="min-w-0 text-sm text-foreground-2">
                              {pendingConfirm === "complete"
                                ? t("page.appointments.markCompleteConfirm")
                                : t("page.appointments.markNoShowConfirm")}
                            </p>
                            <div className="flex shrink-0 items-center gap-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                rounded="full"
                                onClick={() => {
                                  setExitingConfirm(true);
                                  setTimeout(() => {
                                    setPendingConfirm(null);
                                    setExitingConfirm(false);
                                  }, 200);
                                }}
                                className="!h-8 !min-h-8 px-3.5 text-xs font-medium text-foreground-3 hover:text-foreground-1"
                              >
                                {t("page.appointments.back")}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                rounded="full"
                                onClick={handleInlineConfirm}
                                disabled={actionLoading !== null}
                                className={cn(
                                  "inline-flex !h-8 !min-h-8 px-3.5 text-xs font-medium",
                                  pendingConfirm === "complete"
                                    ? "border-green-200 bg-green-50 text-green-800 hover:bg-green-100 hover:border-green-300 focus-visible:ring-focus/60"
                                    : "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/40 focus-visible:ring-focus/60",
                                )}
                              >
                                {t("page.appointments.confirm")}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className={cn(
                              "mt-3 flex flex-wrap items-center gap-2",
                              isBookingInPast
                                ? "justify-between"
                                : "justify-start",
                            )}
                          >
                            {isBookingInPast && (
                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  rounded="full"
                                  onClick={openCompleteDialog}
                                  className="inline-flex !h-8 !min-h-8 items-center gap-1.5 border-green-200 bg-green-50 px-3.5 text-xs font-medium text-green-800 hover:bg-green-100 hover:border-green-300 focus-visible:ring-focus/60"
                                  disabled={actionLoading !== null}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                  {t("page.appointments.edit.markAsComplete")}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  rounded="full"
                                  onClick={openNoShowDialog}
                                  className="inline-flex !h-8 !min-h-8 items-center gap-1.5 border-primary/20 bg-primary/5 px-3.5 text-xs font-medium text-primary hover:bg-primary/10 hover:border-primary/40 focus-visible:ring-focus/60"
                                  disabled={actionLoading !== null}
                                >
                                  <UserX className="h-3.5 w-3.5 shrink-0" />
                                  {t("page.appointments.edit.noShow")}
                                </Button>
                                {canCancel && (
                                  <span
                                    className="h-5.5 w-px shrink-0 bg-border"
                                    aria-hidden
                                  />
                                )}
                              </div>
                            )}
                            {canCancel && (
                              <Button
                                variant="ghost"
                                size="sm"
                                rounded="full"
                                onClick={() => setCancelDialogOpen(true)}
                                className="inline-flex !h-8 !min-h-8 items-center gap-1.5 px-3.5 text-xs font-medium text-destructive hover:bg-destructive/10 focus-visible:ring-focus/60"
                                disabled={actionLoading !== null}
                              >
                                <Ban className="h-3.5 w-3.5 shrink-0" />
                                {t("page.appointments.edit.cancelAppointment")}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {isTerminal && (
                      <div
                        className={cn(
                          "rounded-2xl border px-3 py-2 max-w-128 mx-auto text-center text-xs font-medium",
                          isCancelled &&
                            "border-destructive/25 bg-destructive/5 text-destructive dark:border-destructive/40 dark:bg-destructive/10 dark:text-destructive",
                          isCompleted &&
                            "border-green-200 bg-green-50 text-green-800",
                          isNoShow &&
                            "border-primary/20 bg-primary/5 text-primary",
                        )}
                      >
                        {isCancelled && t("page.appointments.edit.appointmentCancelled")}
                        {isCompleted && t("page.appointments.edit.appointmentCompleted")}
                        {isNoShow && t("page.appointments.edit.markedAsNoShow")}
                      </div>
                    )}
                  </div>

                  <div
                    className={cn(
                      "relative rounded-2xl border border-border bg-white shadow-sm",
                      "transition-all duration-300 hover:border-border-strong",
                      "dark:bg-neutral-900/30 dark:bg-card",
                    )}
                  >
                    <div className="relative p-3 md:p-5">
                      {/* Customer block: avatar, name (capitalize), status, contact rows; booking pill top-right on desktop, own row below on mobile */}
                      <div className="relative border-b border-border-subtle pb-4">
                        {appointment.bookingSource && !isMobile ? (
                          <div className="absolute right-0 top-0 z-[1] pl-2">
                            {(() => {
                              const pill = getBookingSourcePillParts(
                                appointment.bookingSource,
                              );
                              const viaLabel = getBookedViaLabel(
                                appointment.bookingSource,
                                t,
                              );
                              return (
                                <Badge
                                  className={cn(
                                    pill.badgeClass,
                                    "whitespace-nowrap",
                                  )}
                                  title={viaLabel}
                                  aria-label={viaLabel}
                                >
                                  <span className={pill.dotClass} aria-hidden />
                                  {viaLabel}
                                </Badge>
                              );
                            })()}
                          </div>
                        ) : null}
                        <div className="flex gap-4">
                          <Avatar className="h-11 w-11 shrink-0 ring-1 ring-border-subtle">
                            {clientDisplay.profileImage ? (
                              <AvatarImage
                                src={clientDisplay.profileImage}
                                alt=""
                                className="object-cover"
                              />
                            ) : null}
                            <AvatarFallback className="bg-neutral-200 text-sm font-semibold text-neutral-700">
                              {clientDisplay.displayName
                                .split(/\s+/)
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className={cn("min-w-0 flex-1 space-y-1")}>
                            <p className="truncate text-base font-semibold capitalize leading-tight text-foreground-1">
                              {clientDisplay.displayName}
                            </p>
                            {clientDisplay.snapshotOnly ? (
                              <p className="truncate text-xs text-foreground-3">
                                {clientDisplay.email || clientDisplay.phone
                                  ? t("page.appointments.edit.noProfileLinkedContact")
                                  : t("page.appointments.edit.noProfileNoContact")}
                              </p>
                            ) : clientDisplay.linkedCustomerId != null ? (
                              <p className="truncate text-xs text-foreground-3">
                                {t("page.appointments.edit.linkedProfileId")}{" "}
                                {clientDisplay.linkedCustomerId}
                              </p>
                            ) : !clientDisplay.email && !clientDisplay.phone ? (
                              <p className="truncate text-xs text-foreground-3">
                                {t("page.appointments.edit.noPhoneOrEmail")}
                              </p>
                            ) : null}
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-foreground-3 dark:text-foreground-2">
                              {clientDisplay.email ? (
                                <a
                                  href={`mailto:${clientDisplay.email}`}
                                  className={cn(
                                    sliderInlineLinkClass,
                                    "py-0.5",
                                  )}
                                >
                                  <span className="min-w-0 truncate">
                                    {clientDisplay.email}
                                  </span>
                                  <ArrowUpRight
                                    className="h-3 w-3 shrink-0 text-primary"
                                    aria-hidden
                                  />
                                </a>
                              ) : null}
                              {clientDisplay.email && clientDisplay.phone ? (
                                <span
                                  className="h-3.5 w-px shrink-0 bg-border"
                                  aria-hidden
                                />
                              ) : null}
                              {clientDisplay.phone ? (
                                <a
                                  href={`tel:${clientDisplay.phone.replace(/\s/g, "")}`}
                                  className={cn(
                                    sliderInlineLinkClass,
                                    "py-0.5",
                                  )}
                                >
                                  <span className="min-w-0 truncate">
                                    {clientDisplay.phone}
                                  </span>
                                  <ArrowUpRight
                                    className="h-3 w-3 shrink-0 text-primary"
                                    aria-hidden
                                  />
                                </a>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        {/*
                          Post-MVP: "Link profile" was removed for MVP. Revisit attaching snapshot-only
                          bookings to CRM (BusinessCustomer) and/or User — picker + API, aligned with
                          duplicate/merge flows in business-customers; avoid overlapping merge semantics.
                        */}
                        {isMobile && appointment.bookingSource ? (
                          <div className="mt-3 flex">
                            {(() => {
                              const pill = getBookingSourcePillParts(
                                appointment.bookingSource,
                              );
                              const viaLabel = getBookedViaLabel(
                                appointment.bookingSource,
                                t,
                              );
                              return (
                                <Badge
                                  className={cn(
                                    pill.badgeClass,
                                    "whitespace-nowrap",
                                  )}
                                  title={viaLabel}
                                  aria-label={viaLabel}
                                >
                                  <span className={pill.dotClass} aria-hidden />
                                  {viaLabel}
                                </Badge>
                              );
                            })()}
                          </div>
                        ) : null}
                      </div>

                      {/* Group booking indicator — pill matches assignments "Customized for N team members" */}
                      {isGroupBooking && (
                        <div className="group mt-0 border-b border-border-subtle py-3">
                          <Button
                            type="button"
                            variant="ghost"
                            rounded="full"
                            size="sm"
                            onClick={scrollToServicesSection}
                            className={cn(
                              "h-auto bg-info-100 text-xs !min-h-0 h-6 py-3.5 text-primary hover:text-primary md:text-foreground-1 md:text-foreground-3 md:dark:text-foreground-2 md:hover:bg-info-100 dark:border dark:bg-surface dark:hover:bg-surface group-hover:bg-info-100 dark:group-hover:border-border-strong dark:group-hover:bg-surface dark:group-hover:text-primary group-hover:text-primary max-w-full justify-start text-left",
                            )}
                            aria-label="Scroll to services for this booking group"
                          >
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{
                                backgroundColor: appointment.bookingGroupId
                                  ? getGroupDotColor(appointment.bookingGroupId)
                                  : "var(--muted-foreground)",
                              }}
                              aria-hidden
                            />
                            <span className="min-w-0 text-xs text-foreground-1 group-hover:text-foreground-1 md:text-foreground-3 md:dark:text-foreground-2 dark:group-hover:text-foreground-1">
                              {appointment.bookingGroupOrder != null
                                ? t("page.appointments.edit.appointmentOf", { order: appointment.bookingGroupOrder, total: serviceDetailItems.length })
                                : t("page.appointments.edit.multiServiceBooking", { count: serviceDetailItems.length })
                              }
                            </span>
                            <ChevronRight
                              className="h-3 w-3 shrink-0 pt-0.5"
                              aria-hidden
                            />
                          </Button>
                        </div>
                      )}

                      {/* Key–value rows: label column + bold value column (screenshot-style rhythm) */}
                      <dl className="divide-y divide-border-subtle text-sm">
                        <div className="grid grid-cols-1 gap-1 py-3.5 sm:grid-cols-[minmax(7.5rem,9.5rem)_minmax(0,1fr)] sm:items-start sm:gap-x-6">
                          <dt className="font-medium text-foreground-3 sm:pt-0.5">
                            {t("page.appointments.edit.date")}
                          </dt>
                          <dd className="min-w-0 font-semibold text-foreground-1">
                            {formatDetailOverviewDate(
                              appointment.scheduledAt,
                              auditTimezone,
                            )}
                          </dd>
                        </div>
                        <div className="grid grid-cols-1 gap-1 py-3.5 sm:grid-cols-[minmax(7.5rem,9.5rem)_minmax(0,1fr)] sm:items-start sm:gap-x-6">
                          <dt className="font-medium text-foreground-3 sm:pt-0.5">
                            {t("page.appointments.edit.slotTime")}
                          </dt>
                          <dd className="min-w-0 font-semibold text-foreground-1 tabular-nums">
                            {formatTimeRange(
                              new Date(appointment.scheduledAt).toISOString(),
                              new Date(appointment.endsAt).toISOString(),
                              auditTimezone,
                            )}
                            {appointmentSlotMinutes > 0
                              ? ` (${formatDurationHuman(appointmentSlotMinutes)})`
                              : ""}
                          </dd>
                        </div>
                        <div className="grid grid-cols-1 gap-1 py-3.5 sm:grid-cols-[minmax(7.5rem,9.5rem)_minmax(0,1fr)] sm:items-start sm:gap-x-6">
                          <dt className="font-medium text-foreground-3 sm:pt-0.5">
                            {t("page.appointments.edit.notes")}
                          </dt>
                          <dd className="min-w-0">
                            {displayAppointment.notes?.trim() ? (
                              <p className="m-0 text-sm leading-relaxed text-foreground-2 whitespace-pre-wrap">
                                {displayAppointment.notes}
                              </p>
                            ) : (
                              <p className="m-0 text-sm text-muted-foreground">
                                {t("page.appointments.edit.noNotes")}
                              </p>
                            )}
                          </dd>
                        </div>
                        <div className="grid grid-cols-1 gap-2 py-3.5 sm:grid-cols-[minmax(7.5rem,9.5rem)_minmax(0,1fr)] sm:items-start sm:gap-x-6 sm:gap-y-0">
                          <dt className="font-medium text-foreground-3 sm:pt-1">
                            {t("page.appointments.edit.assignedStaff")}
                          </dt>
                          <dd className="min-w-0">
                            {isUnassigned ? (
                              <Badge
                                className={cn(
                                  assignmentStylePillLayout,
                                  "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10",
                                )}
                              >
                                <span
                                  className="h-2 w-2 shrink-0 rounded-full bg-primary"
                                  aria-hidden
                                />
                                {t("page.common.unassigned")}
                              </Badge>
                            ) : assignedStaffMembers.length > 0 ? (
                              <div className="flex flex-wrap items-center gap-2.5">
                                {assignedStaffMembers.length === 1 ? (
                                  <>
                                    <Avatar
                                      className="h-9 w-9 shrink-0 ring-1 ring-border-subtle"
                                      title={`${assignedStaffMembers[0].firstName} ${assignedStaffMembers[0].lastName}`}
                                    >
                                      {assignedStaffMembers[0].profileImage ? (
                                        <AvatarImage
                                          src={
                                            assignedStaffMembers[0].profileImage
                                          }
                                          alt=""
                                          className="object-cover"
                                        />
                                      ) : null}
                                      <AvatarFallback
                                        className="text-[10px] font-semibold text-foreground-1"
                                        style={{
                                          backgroundColor: getAvatarBgColor(
                                            `${assignedStaffMembers[0].id}-${assignedStaffMembers[0].firstName ?? ""}-${assignedStaffMembers[0].lastName ?? ""}`,
                                          ),
                                        }}
                                      >
                                        {`${assignedStaffMembers[0].firstName?.[0] ?? ""}${assignedStaffMembers[0].lastName?.[0] ?? ""}`.toUpperCase() ||
                                          "?"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-semibold text-foreground-1">
                                      {staffNames}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex shrink-0 -space-x-2">
                                      {assignedStaffMembers
                                        .slice(0, 4)
                                        .map((m) => (
                                          <Avatar
                                            key={m.id}
                                            className="h-9 w-9 border-2 border-white dark:border-card"
                                            title={`${m.firstName} ${m.lastName}`}
                                          >
                                            {m.profileImage ? (
                                              <AvatarImage
                                                src={m.profileImage}
                                                alt=""
                                                className="object-cover"
                                              />
                                            ) : null}
                                            <AvatarFallback
                                              className="text-[10px] font-semibold text-foreground-1"
                                              style={{
                                                backgroundColor:
                                                  getAvatarBgColor(
                                                    `${m.id}-${m.firstName ?? ""}-${m.lastName ?? ""}`,
                                                  ),
                                              }}
                                            >
                                              {`${m.firstName?.[0] ?? ""}${m.lastName?.[0] ?? ""}`.toUpperCase() ||
                                                "?"}
                                            </AvatarFallback>
                                          </Avatar>
                                        ))}
                                      {assignedStaffMembers.length > 4 ? (
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-muted text-[10px] font-medium dark:border-card">
                                          +{assignedStaffMembers.length - 4}
                                        </div>
                                      ) : null}
                                    </div>
                                    <span className="font-semibold text-foreground-1">
                                      {staffNames}
                                    </span>
                                  </>
                                )}
                              </div>
                            ) : (
                              <span className="flex items-center gap-2 font-semibold text-foreground-1">
                                <User className="h-4 w-4 shrink-0 text-foreground-3" />
                                {staffNames}
                              </span>
                            )}
                          </dd>
                        </div>
                      </dl>

                      {appointment.overrideReason ? (
                        <div
                          className={cn(
                            "mt-3 flex items-center gap-2 border-t border-amber-200/70 px-3 py-3 md:px-5 md:py-3.5",
                            "bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/25",
                            "-mx-3 -mb-3 rounded-b-2xl md:-mx-5 md:-mb-5",
                          )}
                        >
                          <ShieldAlert
                            className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
                            aria-hidden
                          />
                          <p className="min-w-0 flex-1 text-xs leading-relaxed text-foreground-2">
                            <span className="font-medium text-foreground-2">
                              {t("page.appointments.edit.overrideReason")}:
                            </span>{" "}
                            {appointment.overrideReason}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div
                    ref={servicesSectionRef}
                    id="appointment-detail-services"
                    className="scroll-mt-4"
                  >
                    <CollapsibleFormSection
                      title={t("page.appointments.edit.services", { count: serviceDetailItems.length })}
                      compact
                      description={
                        isGroupBooking ? (
                          isMobile ? (
                            <>
                              {groupBookingWallTimeRange ? (
                                <span className="flex w-full min-w-0 items-center gap-1.5">
                                  <span
                                    className="h-2 w-2 shrink-0 rounded-full"
                                    style={{
                                      backgroundColor: appointment.bookingGroupId
                                        ? getGroupDotColor(appointment.bookingGroupId)
                                        : "var(--muted-foreground)",
                                    }}
                                    aria-hidden
                                  />
                                  <span className="min-w-0 truncate">
                                    {groupBookingWallTimeRange}
                                  </span>
                                </span>
                              ) : null}
                              <span className="w-full min-w-0 truncate">
                                {formatDurationHuman(serviceDetailTotalDuration)} - {t("page.appointments.edit.acrossGroup")}
                              </span>
                            </>
                          ) : (
                            <>
                              <span
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{
                                  backgroundColor: appointment.bookingGroupId
                                    ? getGroupDotColor(appointment.bookingGroupId)
                                    : "var(--muted-foreground)",
                                }}
                                aria-hidden
                              />
                              <span className="min-w-0">
                                {groupBookingWallTimeRange
                                  ? `${groupBookingWallTimeRange} | ${formatDurationHuman(serviceDetailTotalDuration)} - ${t("page.appointments.edit.acrossGroup")}`
                                  : `${formatDurationHuman(serviceDetailTotalDuration)} - ${t("page.appointments.edit.acrossGroup")}`}
                              </span>
                            </>
                          )
                        ) : (
                          t("page.appointments.edit.bookedServiceDescription")
                        )
                      }
                      open={accServicesOpen}
                      onOpenChange={setAccServicesOpen}
                      className={ADVANCED_SETTINGS_COLLAPSIBLE_OUTER_CLASS}
                    >
                      <div className="space-y-0">
                        {serviceDetailItems.length === 0 ? (
                          <p className="py-6 text-center text-sm text-foreground-3">
                            {t("page.appointments.edit.noBookedItems")}
                          </p>
                        ) : (
                          <>
                            <div className="divide-y divide-border">
                              {serviceDetailItems.map((item, idx) => (
                                <div
                                  key={`${item.name}-${idx}`}
                                  className="flex flex-nowrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-semibold text-foreground-1">
                                      {item.name}
                                    </div>
                                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-foreground-3 dark:text-foreground-2">
                                      <span className="tabular-nums">
                                        {item.durationMinutes > 0
                                          ? formatDurationHuman(
                                              item.durationMinutes,
                                            )
                                          : "—"}
                                      </span>
                                      {item.isBundle ? (
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
                                  </div>
                                  <div className="flex shrink-0 items-center justify-end text-right text-sm font-semibold tabular-nums text-foreground-1">
                                    {item.priceMajor <= 0 ? (
                                      <span className="text-foreground-2">
                                        {t("page.appointments.edit.free")}
                                      </span>
                                    ) : currencyDisplay.icon ? (
                                      <span className="inline-flex items-center gap-0.5">
                                        <currencyDisplay.icon className="h-3.5 w-3.5" />
                                        {item.priceMajor.toFixed(2)}
                                      </span>
                                    ) : (
                                      <>
                                        <span>{currencyDisplay.symbol}</span>
                                        {item.priceMajor.toFixed(2)}
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div
                              className={cn(
                                "mt-3 flex flex-col gap-2 border-t border-border px-3 py-3 md:px-4 md:py-3.5",
                                /* Inset panel: same tokens as Add Appointment summary / EditBundleSlider panels */
                                "dark:border-border dark:bg-neutral-900/30",
                                "-mx-3 -mb-3 rounded-b-2xl md:-mx-4 md:-mb-4",
                              )}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-semibold text-foreground-1">
                                  {t("page.appointments.edit.total")}
                                </span>
                                <div className="shrink-0 text-sm font-semibold tabular-nums text-foreground-1">
                                  {serviceDetailTotalPrice <= 0 ? (
                                    <span className="text-foreground-2">
                                      {t("page.appointments.edit.free")}
                                    </span>
                                  ) : currencyDisplay.icon ? (
                                    <span className="inline-flex items-center gap-0.5">
                                      <currencyDisplay.icon className="h-4 w-4" />
                                      {serviceDetailTotalPrice.toFixed(2)}
                                    </span>
                                  ) : (
                                    <>
                                      {currencyDisplay.symbol}
                                      {serviceDetailTotalPrice.toFixed(2)}
                                    </>
                                  )}
                                </div>
                              </div>
                              {isGroupBooking &&
                              serviceDetailTotalDuration > 0 ? (
                                <p className="text-xs leading-relaxed text-foreground-3 dark:text-foreground-2">
                                  {t("page.appointments.edit.includesAllServices")}
                                </p>
                              ) : null}
                            </div>
                          </>
                        )}
                      </div>
                    </CollapsibleFormSection>
                  </div>

                  <CollapsibleFormSection
                    title={t("page.appointments.edit.activity")}
                    compact
                    description={t("page.appointments.edit.activityDescription")}
                    open={accHistoryOpen}
                    onOpenChange={setAccHistoryOpen}
                    className={ADVANCED_SETTINGS_COLLAPSIBLE_OUTER_CLASS}
                  >
                    <ul className="m-0 list-none p-0" role="list">
                      {activityTimelineItems.map((item, index) => {
                        const isLast =
                          index === activityTimelineItems.length - 1;
                        return (
                          <li key={item.id} className="list-none">
                            {/*
                            Line sits in the gutter column only, directly under the dot (items-start
                            so row height doesn't push the connector below the subtitle).
                          */}
                            <div
                              className={cn(
                                "flex items-start gap-3",
                                !isLast && "pb-3",
                              )}
                            >
                              <div className="flex w-[15px] shrink-0 flex-col items-center pt-0.5">
                                <div
                                  className={cn(
                                    "h-3 w-3 shrink-0 rounded-full border-2 bg-background",
                                    isLast
                                      ? "border-border dark:border-neutral-400/80"
                                      : "border-primary/40",
                                  )}
                                  aria-hidden
                                />
                                {!isLast ? (
                                  <div
                                    className="mt-1 h-6 w-px shrink-0 bg-border dark:bg-border-strong/80"
                                    aria-hidden
                                  />
                                ) : null}
                              </div>
                              <div className="min-w-0 flex-1 pt-0.5">
                                <div className="text-sm font-medium leading-snug text-foreground-1">
                                  {item.title}
                                </div>
                                <div className="mt-1 text-xs leading-snug text-foreground-3 dark:text-foreground-2">
                                  {item.meta}
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </CollapsibleFormSection>

                  {displayAppointment.location ? (
                    <CollapsibleFormSection
                      title={t("page.appointments.edit.locationDetails")}
                      compact
                      description={t("page.appointments.edit.locationDetailsDescription")}
                      open={accLocationOpen}
                      onOpenChange={setAccLocationOpen}
                      className={ADVANCED_SETTINGS_COLLAPSIBLE_OUTER_CLASS}
                    >
                      {(() => {
                        const loc = displayAppointment.location;
                        const address = loc.address?.trim() ?? "";
                        const description = loc.description?.trim() ?? "";
                        const mapsQuery = [loc.name, address]
                          .filter(Boolean)
                          .join(" ")
                          .trim();
                        const copyLines = [
                          loc.name,
                          description,
                          address,
                        ].filter(Boolean);
                        const copyText = copyLines.join("\n");
                        const hasAddress = address.length > 0;
                        const hasContact = !!(loc.phone || loc.email);

                        return (
                          <div className="space-y-0">
                            {loc.name ? (
                              <div>
                                <h3 className="text-base font-semibold leading-snug text-foreground-1">
                                  {loc.name}
                                </h3>
                                {description ? (
                                  <p className="mt-1.5 text-sm leading-relaxed text-foreground-3 dark:text-foreground-2">
                                    {description}
                                  </p>
                                ) : null}
                              </div>
                            ) : description ? (
                              <p className="text-sm leading-relaxed text-foreground-3 dark:text-foreground-2">
                                {description}
                              </p>
                            ) : null}

                            {hasAddress ? (
                              <p
                                className={cn(
                                  "whitespace-pre-wrap text-sm leading-relaxed text-foreground-2",
                                  loc.name || description ? "mt-3" : undefined,
                                )}
                              >
                                {address}
                              </p>
                            ) : null}

                            <div className="mt-3 flex flex-wrap gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                rounded="full"
                                className="inline-flex !h-8 !min-h-8 items-center gap-1.5 px-3.5 text-xs font-medium"
                                onClick={() => {
                                  const q = encodeURIComponent(
                                    mapsQuery || loc.name,
                                  );
                                  window.open(
                                    `https://www.google.com/maps/search/?api=1&query=${q}`,
                                    "_blank",
                                    "noopener,noreferrer",
                                  );
                                }}
                              >
                                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                {t("page.appointments.edit.openInMaps")}
                              </Button>
                              {copyText ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  rounded="full"
                                  className="inline-flex !h-8 !min-h-8 items-center gap-1.5 px-3.5 text-xs font-medium"
                                  onClick={() => {
                                    void navigator.clipboard.writeText(
                                      copyText,
                                    );
                                    toast.success(
                                      hasAddress
                                        ? t("page.appointments.edit.addressCopied")
                                        : t("page.appointments.edit.locationDetailsCopied"),
                                    );
                                  }}
                                >
                                  <Copy className="h-3.5 w-3.5 shrink-0" />
                                  {hasAddress ? t("page.appointments.edit.copyAddress") : t("page.appointments.edit.copyDetails")}
                                </Button>
                              ) : null}
                            </div>

                            {hasContact ? (
                              <div
                                className={cn(
                                  "mt-3 flex flex-col gap-2 border-t border-border px-3 py-3 md:px-4 md:py-3.5",
                                  "bg-muted/40 dark:border-border dark:bg-neutral-900/30",
                                  "-mx-3 -mb-3 rounded-b-2xl md:-mx-4 md:-mb-4",
                                )}
                              >
                                <span className="text-xs font-medium text-foreground-2">
                                  {t("page.appointments.edit.locationContact")}
                                </span>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-3 dark:text-foreground-2">
                                  {loc.email ? (
                                    <a
                                      href={`mailto:${loc.email}`}
                                      className={cn(
                                        sliderInlineLinkClass,
                                        "min-w-0 py-0.5",
                                      )}
                                    >
                                      <span className="min-w-0 break-all">
                                        {loc.email}
                                      </span>
                                      <ArrowUpRight
                                        className="h-3 w-3 shrink-0 text-primary"
                                        aria-hidden
                                      />
                                    </a>
                                  ) : null}
                                  {loc.email && loc.phone ? (
                                    <span
                                      className="h-3.5 w-px shrink-0 bg-border"
                                      aria-hidden
                                    />
                                  ) : null}
                                  {loc.phone ? (
                                    <a
                                      href={`tel:${String(loc.phone).replace(/\s/g, "")}`}
                                      className={cn(
                                        sliderInlineLinkClass,
                                        "py-0.5",
                                      )}
                                    >
                                      <span className="min-w-0">
                                        {loc.phone}
                                      </span>
                                      <ArrowUpRight
                                        className="h-3 w-3 shrink-0 text-primary"
                                        aria-hidden
                                      />
                                    </a>
                                  ) : null}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })()}
                    </CollapsibleFormSection>
                  ) : null}

                  {isCancelled && appointment.cancellationReason ? (
                    <CollapsibleFormSection
                      title={t("page.appointments.edit.cancellation")}
                      compact
                      description={t("page.appointments.edit.cancellationDescription")}
                      open={accCancellationOpen}
                      onOpenChange={setAccCancellationOpen}
                      className={ADVANCED_SETTINGS_COLLAPSIBLE_OUTER_CLASS}
                    >
                      <p className="text-sm leading-relaxed text-foreground-2">
                        {appointment.cancellationReason}
                      </p>
                    </CollapsibleFormSection>
                  ) : null}
                </div>
              )}
            </div>
      </SummaryShell>

      {/* ── Cancel Dialog ── */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogPortal>
          <AlertDialogOverlay onClick={() => setCancelDialogOpen(false)} />
          <AlertDialogPrimitive.Content
            className={cn(
              "fixed left-4 right-4 top-[50%] z-[100] grid translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:left-[50%] sm:right-auto sm:w-full sm:max-w-lg sm:translate-x-[-50%] rounded-xl",
              "max-w-md",
              APPOINTMENT_DIALOG_CURSOR,
            )}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>{t("page.appointments.edit.cancelAppointmentTitle")}</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4">
                  {appointment.bookingGroupId && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                      {t("page.appointments.edit.cancelEntireGroup")}
                    </p>
                  )}
                  <div>
                    <Label
                      htmlFor="cancelReason"
                      className="text-base font-medium"
                    >
                      {t("page.appointments.edit.reasonForCancellation")}
                    </Label>
                    <Textarea
                      id="cancelReason"
                      placeholder={t("page.appointments.edit.enterCancelReason")}
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="min-h-[80px] resize-none mt-2"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="notify-customer"
                          checked={notifyCustomer}
                          onCheckedChange={setNotifyCustomer}
                          className="!h-5 !w-9 !min-h-0 !min-w-0"
                        />
                        <Label
                          htmlFor="notify-customer"
                          className="text-sm font-medium"
                        >
                          {t("page.appointments.edit.notifyCustomer")}
                        </Label>
                      </div>
                    </div>
                    {notifyCustomer && (
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">
                          {t("page.appointments.edit.notificationMethod")}
                        </Label>
                        <div className="flex gap-2">
                          {(["email", "sms", "both"] as const).map((method) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() =>
                                handleNotificationMethodSelect(method)
                              }
                              className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors",
                                notificationMethod === method
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background border-border hover:bg-muted",
                              )}
                            >
                              {method === "email" && (
                                <Mail className="h-3 w-3" />
                              )}
                              {method === "sms" && (
                                <MessageSquare className="h-3 w-3" />
                              )}
                              {method === "both" && (
                                <div className="flex gap-0.5">
                                  <Mail className="h-2.5 w-2.5" />
                                  <MessageSquare className="h-2.5 w-2.5" />
                                </div>
                              )}
                              {method.charAt(0).toUpperCase() + method.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setCancelReason("");
                  setNotifyCustomer(true);
                  setNotificationMethod("both");
                }}
              >
                {t("page.appointments.back")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t("page.appointments.edit.cancelAppointmentTitle")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogPrimitive.Content>
        </AlertDialogPortal>
      </AlertDialog>
    </>
  );
};

export default EditAppointmentSlider;
