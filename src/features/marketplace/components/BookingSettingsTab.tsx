import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Switch } from '../../../shared/components/ui/switch';
import { Input } from '../../../shared/components/ui/input';
import { Textarea } from '../../../shared/components/ui/textarea';
import { Label } from '../../../shared/components/ui/label';
import { Spinner } from '../../../shared/components/ui/spinner';
import { 
  Clock, 
  Calendar, 
  Users, 
  Shield, 
  Eye, 
  MessageSquare,
  Save,
  RefreshCw,
  Ban,
  CalendarCheck,
  UserCheck,
  Phone,
  Hash,
  Timer,
  AlertCircle,
} from 'lucide-react';
import { fetchBookingSettingsAction, updateBookingSettingsAction } from '../actions';
import { 
  selectBookingSettings, 
  selectBookingSettingsLoading, 
  selectBookingSettingsSaving 
} from '../selectors';
import type { UpdateBookingSettingsPayload } from '../types';

export function BookingSettingsTab() {
  const dispatch = useDispatch();
  const bookingSettings = useSelector(selectBookingSettings);
  const isLoading = useSelector(selectBookingSettingsLoading);
  const isSaving = useSelector(selectBookingSettingsSaving);

  // Local form state
  const [formData, setFormData] = useState<UpdateBookingSettingsPayload>({
    minAdvanceBookingMinutes: 60,
    maxAdvanceBookingMinutes: 43200,
    slotIntervalMinutes: 15,
    bufferTimeMinutes: 0,
    cancellationWindowMinutes: 1440,
    allowCustomerCancellation: true,
    allowCustomerReschedule: true,
    autoConfirmBookings: false,
    requireCustomerAccount: false,
    requirePhoneNumber: false,
    allowStaffSelection: true,
    showAnyStaffOption: true,
    maxActiveBookingsPerCustomer: null,
    maxBookingsPerDay: null,
    showPrices: true,
    showDurations: true,
    showStaffImages: false,
    cancellationPolicyMessage: null,
    bookingConfirmationMessage: null,
  });

  // Fetch booking settings on mount
  useEffect(() => {
    dispatch(fetchBookingSettingsAction.request());
  }, [dispatch]);

  // Sync form data when settings are loaded
  useEffect(() => {
    if (bookingSettings) {
      setFormData({
        minAdvanceBookingMinutes: bookingSettings.minAdvanceBookingMinutes,
        maxAdvanceBookingMinutes: bookingSettings.maxAdvanceBookingMinutes,
        slotIntervalMinutes: bookingSettings.slotIntervalMinutes,
        bufferTimeMinutes: bookingSettings.bufferTimeMinutes,
        cancellationWindowMinutes: bookingSettings.cancellationWindowMinutes,
        allowCustomerCancellation: bookingSettings.allowCustomerCancellation,
        allowCustomerReschedule: bookingSettings.allowCustomerReschedule,
        autoConfirmBookings: bookingSettings.autoConfirmBookings,
        requireCustomerAccount: bookingSettings.requireCustomerAccount,
        requirePhoneNumber: bookingSettings.requirePhoneNumber,
        allowStaffSelection: bookingSettings.allowStaffSelection,
        showAnyStaffOption: bookingSettings.showAnyStaffOption,
        maxActiveBookingsPerCustomer: bookingSettings.maxActiveBookingsPerCustomer,
        maxBookingsPerDay: bookingSettings.maxBookingsPerDay,
        showPrices: bookingSettings.showPrices,
        showDurations: bookingSettings.showDurations,
        showStaffImages: bookingSettings.showStaffImages,
        cancellationPolicyMessage: bookingSettings.cancellationPolicyMessage,
        bookingConfirmationMessage: bookingSettings.bookingConfirmationMessage,
      });
    }
  }, [bookingSettings]);

  const handleSave = () => {
    dispatch(updateBookingSettingsAction.request(formData));
  };

  const updateField = <K extends keyof UpdateBookingSettingsPayload>(
    field: K,
    value: UpdateBookingSettingsPayload[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Helper to convert minutes to human-readable format
  const formatMinutes = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    const days = Math.floor(minutes / 1440);
    const remainingHours = Math.floor((minutes % 1440) / 60);
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timing Settings
          </CardTitle>
          <CardDescription>
            Configure booking time windows and intervals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Min Advance Booking */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="minAdvanceBooking">Minimum Advance Booking</Label>
              <p className="text-xs text-muted-foreground">
                How far in advance customers must book (in minutes)
              </p>
              <div className="flex items-center gap-2">
                <Input
                  id="minAdvanceBooking"
                  type="number"
                  min={0}
                  value={formData.minAdvanceBookingMinutes}
                  onChange={(e) => updateField('minAdvanceBookingMinutes', parseInt(e.target.value) || 0)}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">
                  ({formatMinutes(formData.minAdvanceBookingMinutes)})
                </span>
              </div>
            </div>

            {/* Max Advance Booking */}
            <div className="space-y-2">
              <Label htmlFor="maxAdvanceBooking">Maximum Advance Booking</Label>
              <p className="text-xs text-muted-foreground">
                How far ahead customers can book (in minutes)
              </p>
              <div className="flex items-center gap-2">
                <Input
                  id="maxAdvanceBooking"
                  type="number"
                  min={0}
                  value={formData.maxAdvanceBookingMinutes}
                  onChange={(e) => updateField('maxAdvanceBookingMinutes', parseInt(e.target.value) || 0)}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">
                  ({formatMinutes(formData.maxAdvanceBookingMinutes)})
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Slot Interval */}
            <div className="space-y-2">
              <Label htmlFor="slotInterval">Slot Interval</Label>
              <p className="text-xs text-muted-foreground">
                Time between available booking slots (in minutes)
              </p>
              <div className="flex items-center gap-2">
                <Input
                  id="slotInterval"
                  type="number"
                  min={5}
                  step={5}
                  value={formData.slotIntervalMinutes}
                  onChange={(e) => updateField('slotIntervalMinutes', parseInt(e.target.value) || 15)}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
            </div>

            {/* Buffer Time */}
            <div className="space-y-2">
              <Label htmlFor="bufferTime">Buffer Time</Label>
              <p className="text-xs text-muted-foreground">
                Break time between appointments (in minutes)
              </p>
              <div className="flex items-center gap-2">
                <Input
                  id="bufferTime"
                  type="number"
                  min={0}
                  step={5}
                  value={formData.bufferTimeMinutes}
                  onChange={(e) => updateField('bufferTimeMinutes', parseInt(e.target.value) || 0)}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cancellation & Rescheduling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Cancellation & Rescheduling
          </CardTitle>
          <CardDescription>
            Configure how customers can modify their bookings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="cancellationWindow">Cancellation Window</Label>
            <p className="text-xs text-muted-foreground">
              How many minutes before appointment customers can cancel (in minutes)
            </p>
            <div className="flex items-center gap-2">
              <Input
                id="cancellationWindow"
                type="number"
                min={0}
                value={formData.cancellationWindowMinutes}
                onChange={(e) => updateField('cancellationWindowMinutes', parseInt(e.target.value) || 0)}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">
                ({formatMinutes(formData.cancellationWindowMinutes)})
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Ban className="h-4 w-4 text-muted-foreground" />
                  <Label>Allow Customer Cancellation</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Customers can cancel their own bookings
                </p>
              </div>
              <Switch
                checked={formData.allowCustomerCancellation}
                onCheckedChange={(checked) => updateField('allowCustomerCancellation', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                  <Label>Allow Customer Rescheduling</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Customers can reschedule their bookings
                </p>
              </div>
              <Switch
                checked={formData.allowCustomerReschedule}
                onCheckedChange={(checked) => updateField('allowCustomerReschedule', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Confirmations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Booking Confirmation
          </CardTitle>
          <CardDescription>
            Configure how bookings are confirmed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                <Label>Auto-Confirm Bookings</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Automatically confirm new bookings without manual review
              </p>
            </div>
            <Switch
              checked={formData.autoConfirmBookings}
              onCheckedChange={(checked) => updateField('autoConfirmBookings', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Customer Requirements
          </CardTitle>
          <CardDescription>
            Set requirements for customers making bookings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <Label>Require Customer Account</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Customers must create an account to book
              </p>
            </div>
            <Switch
              checked={formData.requireCustomerAccount}
              onCheckedChange={(checked) => updateField('requireCustomerAccount', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <Label>Require Phone Number</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Customers must provide a phone number
              </p>
            </div>
            <Switch
              checked={formData.requirePhoneNumber}
              onCheckedChange={(checked) => updateField('requirePhoneNumber', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Booking Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Booking Limits
          </CardTitle>
          <CardDescription>
            Set limits on how many bookings can be made
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="maxActiveBookings">Max Active Bookings Per Customer</Label>
              <p className="text-xs text-muted-foreground">
                Leave empty for unlimited
              </p>
              <Input
                id="maxActiveBookings"
                type="number"
                min={1}
                value={formData.maxActiveBookingsPerCustomer ?? ''}
                onChange={(e) => updateField('maxActiveBookingsPerCustomer', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Unlimited"
                className="w-40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxBookingsPerDay">Max Bookings Per Day</Label>
              <p className="text-xs text-muted-foreground">
                Leave empty for unlimited
              </p>
              <Input
                id="maxBookingsPerDay"
                type="number"
                min={1}
                value={formData.maxBookingsPerDay ?? ''}
                onChange={(e) => updateField('maxBookingsPerDay', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Unlimited"
                className="w-40"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff Settings
          </CardTitle>
          <CardDescription>
            Configure how staff members are displayed and selected
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Staff Selection</Label>
              <p className="text-sm text-muted-foreground">
                Customers can choose a specific staff member
              </p>
            </div>
            <Switch
              checked={formData.allowStaffSelection}
              onCheckedChange={(checked) => updateField('allowStaffSelection', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show "Any Staff" Option</Label>
              <p className="text-sm text-muted-foreground">
                Allow customers to book with any available staff
              </p>
            </div>
            <Switch
              checked={formData.showAnyStaffOption}
              onCheckedChange={(checked) => updateField('showAnyStaffOption', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Staff Images</Label>
              <p className="text-sm text-muted-foreground">
                Display staff profile images to customers
              </p>
            </div>
            <Switch
              checked={formData.showStaffImages}
              onCheckedChange={(checked) => updateField('showStaffImages', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Display Settings
          </CardTitle>
          <CardDescription>
            Configure what information is shown to customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Prices</Label>
              <p className="text-sm text-muted-foreground">
                Display service prices to customers
              </p>
            </div>
            <Switch
              checked={formData.showPrices}
              onCheckedChange={(checked) => updateField('showPrices', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <Label>Show Durations</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Display service durations to customers
              </p>
            </div>
            <Switch
              checked={formData.showDurations}
              onCheckedChange={(checked) => updateField('showDurations', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Custom Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Custom Messages
          </CardTitle>
          <CardDescription>
            Customize messages shown to customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="cancellationPolicy">Cancellation Policy Message</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              This message will be shown to customers when booking
            </p>
            <Textarea
              id="cancellationPolicy"
              value={formData.cancellationPolicyMessage ?? ''}
              onChange={(e) => updateField('cancellationPolicyMessage', e.target.value || null)}
              placeholder="Enter your cancellation policy..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmationMessage">Booking Confirmation Message</Label>
            <p className="text-xs text-muted-foreground">
              This message will be shown after a booking is confirmed
            </p>
            <Textarea
              id="confirmationMessage"
              value={formData.bookingConfirmationMessage ?? ''}
              onChange={(e) => updateField('bookingConfirmationMessage', e.target.value || null)}
              placeholder="Enter your confirmation message..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button 
          onClick={handleSave} 
          size="lg" 
          className="gap-2"
          disabled={isSaving}
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}

