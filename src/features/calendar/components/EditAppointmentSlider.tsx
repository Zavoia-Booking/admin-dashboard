import React, { useState, useEffect, useMemo } from 'react';
import {
  Ban, CheckCircle2, UserX, Clock, User, Scissors, MapPin,
  Calendar, Bell, Mail, MessageSquare, Loader2, Users, Tag,
} from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Label } from '../../../shared/components/ui/label';
import { Textarea } from '../../../shared/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../../../shared/components/ui/avatar';
import { Badge } from '../../../shared/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../shared/components/ui/alert-dialog';
import { Switch } from '../../../shared/components/ui/switch';
import { cn } from '../../../shared/lib/utils';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import { useDispatch, useSelector } from 'react-redux';
import { updateAppointmentStatus, toggleEditFormAction } from '../actions';
import { getLocationStaff } from '../selectors';
import { getStatusBadge, formatTime, formatTimeRange, getStaffDisplayNames, getBookingSourceLabel } from './utils';
import { toast } from 'sonner';
import type { Appointment } from '../../../shared/types/calendar';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface EditAppointmentSliderProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

const EditAppointmentSlider: React.FC<EditAppointmentSliderProps> = ({ isOpen, onClose, appointment }) => {
  const dispatch = useDispatch();
  const locationStaff = useSelector(getLocationStaff);
  // bookingSettings available via getBookingSettings for Phase 2 permission checks
  // (allowStaffCancelWithoutConfirmation, allowStaffRescheduleWithoutConfirmation)

  // Cancel dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [notificationMethod, setNotificationMethod] = useState<'email' | 'sms' | 'both'>('both');

  // Confirmation dialog state (for complete / no-show)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'complete' | 'no-show' | null;
    title: string;
    description: string;
  }>({ open: false, type: null, title: '', description: '' });

  // Loading state for actions
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Reset state when slider closes
  useEffect(() => {
    if (!isOpen) {
      setCancelDialogOpen(false);
      setCancelReason('');
      setNotifyCustomer(true);
      setNotificationMethod('both');
      setConfirmDialog({ open: false, type: null, title: '', description: '' });
      setActionLoading(null);
    }
  }, [isOpen]);

  // ─────────────────────────────────────────────────────────────
  // Derived data from appointment
  // ─────────────────────────────────────────────────────────────

  const customerName = useMemo(() => {
    if (!appointment) return '';
    if (appointment.customer) {
      return `${appointment.customer.firstName ?? ''} ${appointment.customer.lastName ?? ''}`.trim();
    }
    return 'Walk-in';
  }, [appointment]);

  const staffNames = useMemo(() => {
    if (!appointment) return 'Unassigned';
    const ids = appointment.teamMembers?.map((tm: any) => tm.id ?? tm) ?? [];
    if (ids.length === 0) return 'Unassigned';
    return getStaffDisplayNames(ids, locationStaff);
  }, [appointment, locationStaff]);

  const isUnassigned = !appointment?.teamMembers || appointment.teamMembers.length === 0;

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
    toast.success(
      status === 'cancelled'
        ? 'Appointment cancelled'
        : status === 'completed'
        ? 'Appointment marked as completed'
        : status === 'no_show'
        ? 'Appointment marked as no-show'
        : `Status updated to ${status}`,
    );
    setActionLoading(null);
    onClose();
  };

  const handleCancelConfirm = () => {
    handleStatusChange('cancelled');
    setCancelDialogOpen(false);
    setCancelReason('');
  };

  const handleConfirmAction = () => {
    if (!confirmDialog.type) return;
    const status = confirmDialog.type === 'complete' ? 'completed' : 'no_show';
    handleStatusChange(status);
    setConfirmDialog({ open: false, type: null, title: '', description: '' });
  };

  const openCompleteDialog = () => {
    setConfirmDialog({
      open: true,
      type: 'complete',
      title: 'Mark as Complete',
      description: 'Mark this appointment as completed? This will update the appointment status.',
    });
  };

  const openNoShowDialog = () => {
    setConfirmDialog({
      open: true,
      type: 'no-show',
      title: 'Mark as No-Show',
      description: 'Mark this appointment as no-show? This will update the appointment status.',
    });
  };

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  if (!appointment) return null;

  const isCancelled = appointment.status === 'cancelled';
  const isCompleted = appointment.status === 'completed';
  const isNoShow = appointment.status === 'no_show';
  const isTerminal = isCancelled || isCompleted || isNoShow;

  return (
    <>
      <BaseSlider
        isOpen={isOpen}
        onClose={onClose}
        title="Appointment Details"
        contentClassName="bg-muted/50 scrollbar-hide"
      >
        {/* ── Quick Actions ── */}
        {!isTerminal && (
          <div className="py-3 bg-background/50">
            <div className="grid grid-cols-3 gap-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelDialogOpen(true)}
                className="flex items-center gap-1 text-xs border-destructive/20 text-destructive hover:bg-destructive/10"
                disabled={actionLoading !== null}
              >
                <Ban className="h-3 w-3" />
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openNoShowDialog}
                className="flex items-center gap-1 text-xs border-orange-500/20 text-orange-600 hover:bg-orange-50"
                disabled={actionLoading !== null}
              >
                <UserX className="h-3 w-3" />
                No-Show
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openCompleteDialog}
                className="flex items-center gap-1 text-xs border-green-500/20 text-green-600 hover:bg-green-50"
                disabled={actionLoading !== null}
              >
                <CheckCircle2 className="h-3 w-3" />
                Complete
              </Button>
            </div>
          </div>
        )}

        {/* Terminal status banner */}
        {isTerminal && (
          <div
            className={cn(
              'py-3 px-4 text-sm font-medium text-center rounded-lg mx-2 mb-3',
              isCancelled && 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
              isCompleted && 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
              isNoShow && 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
            )}
          >
            {isCancelled && 'This appointment has been cancelled'}
            {isCompleted && 'This appointment has been completed'}
            {isNoShow && 'This appointment was marked as no-show'}
          </div>
        )}

        {/* ── Appointment Details ── */}
        <div className="max-w-md mx-auto space-y-4">
          {/* Status */}
          <Card className="border-0 shadow-sm bg-card/70">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                {getStatusBadge(appointment.status)}
              </div>
            </CardContent>
          </Card>

          {/* Customer */}
          <Card className="border-0 shadow-sm bg-card/70">
            <CardContent className="py-4 space-y-3">
              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                <div className="p-2 rounded-xl bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Customer</h3>
              </div>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {customerName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{customerName || 'Walk-in'}</div>
                  {appointment.customer?.email && (
                    <div className="text-sm text-muted-foreground truncate">{appointment.customer.email}</div>
                  )}
                  {appointment.customer?.phone && (
                    <div className="text-sm text-muted-foreground truncate">{appointment.customer.phone}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service */}
          <Card className="border-0 shadow-sm bg-card/70">
            <CardContent className="py-4 space-y-3">
              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Scissors className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Service</h3>
              </div>
              <div className="space-y-1">
                <div className="font-medium">{appointment.service?.name ?? 'Unknown service'}</div>
                <div className="flex gap-2 text-sm text-muted-foreground">
                  {appointment.service?.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {appointment.service.duration} min
                    </span>
                  )}
                  {appointment.price !== undefined && appointment.price !== null && (
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />${(appointment.price / 100).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date & Time */}
          <Card className="border-0 shadow-sm bg-card/70">
            <CardContent className="py-4 space-y-3">
              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Date & Time</h3>
              </div>
              <div className="space-y-1">
                <div className="font-medium">
                  {new Date(appointment.scheduledAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimeRange(
                    new Date(appointment.scheduledAt).toISOString(),
                    new Date(appointment.endsAt).toISOString(),
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staff */}
          <Card className="border-0 shadow-sm bg-card/70">
            <CardContent className="py-4 space-y-3">
              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Staff</h3>
              </div>
              <div className="flex items-center gap-2">
                {isUnassigned ? (
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    Unassigned
                  </Badge>
                ) : (
                  <span className="font-medium">{staffNames}</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          {appointment.location && (
            <Card className="border-0 shadow-sm bg-card/70">
              <CardContent className="py-4 space-y-3">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Location</h3>
                </div>
                <div className="font-medium">{appointment.location.name}</div>
                {appointment.location.address && (
                  <div className="text-sm text-muted-foreground">{appointment.location.address}</div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {appointment.notes && (
            <Card className="border-0 shadow-sm bg-card/70">
              <CardContent className="py-4 space-y-3">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Bell className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Notes</h3>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{appointment.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Cancellation Reason */}
          {isCancelled && appointment.cancellationReason && (
            <Card className="border-0 shadow-sm bg-card/70">
              <CardContent className="py-4 space-y-3">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-destructive/10">
                    <Ban className="h-4 w-4 text-destructive" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Cancellation Reason</h3>
                </div>
                <p className="text-sm text-muted-foreground">{appointment.cancellationReason}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </BaseSlider>

      {/* ── Cancel Dialog ── */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cancelReason" className="text-base font-medium">
                    Reason for cancellation
                  </Label>
                  <Textarea
                    id="cancelReason"
                    placeholder="Enter reason for cancelling..."
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
                      <Label htmlFor="notify-customer" className="text-sm font-medium">
                        Notify customer
                      </Label>
                    </div>
                  </div>
                  {notifyCustomer && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Notification method</Label>
                      <div className="flex gap-2">
                        {(['email', 'sms', 'both'] as const).map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setNotificationMethod(method)}
                            className={cn(
                              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors',
                              notificationMethod === method
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background border-border hover:bg-muted',
                            )}
                          >
                            {method === 'email' && <Mail className="h-3 w-3" />}
                            {method === 'sms' && <MessageSquare className="h-3 w-3" />}
                            {method === 'both' && (
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
                setCancelReason('');
                setNotifyCustomer(true);
                setNotificationMethod('both');
              }}
            >
              Back
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Complete / No-Show Confirmation Dialog ── */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditAppointmentSlider;
