import React, { useState } from 'react';
import { Calendar, Clock, Bell, Shield, ChevronsUpDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { BaseSlider } from '@/components/common/BaseSlider';

interface AppointmentSettingsSliderProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AppointmentFormData {
  defaultDuration: string;
  bufferTime: string;
  onlineBooking: boolean;
  bookingWindow: string;
  cancellationWindow: string;
  noShowEnabled: boolean;
  noShowMinutes: string;
  reminder24h: boolean;
  reminder1h: boolean;
  reminderSms: boolean;
  reminderEmail: boolean;
  doubleBookingPrevention: boolean;
  clientCancellation: boolean;
  clientReschedule: boolean;
}

const initialFormData: AppointmentFormData = {
  defaultDuration: '60',
  bufferTime: '15',
  onlineBooking: true,
  bookingWindow: '30',
  cancellationWindow: '24',
  noShowEnabled: true,
  noShowMinutes: '15',
  reminder24h: true,
  reminder1h: true,
  reminderSms: false,
  reminderEmail: true,
  doubleBookingPrevention: true,
  clientCancellation: true,
  clientReschedule: true,
};

const AppointmentSettingsSlider: React.FC<AppointmentSettingsSliderProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<AppointmentFormData>(initialFormData);
  const [durationOpen, setDurationOpen] = useState(false);
  const [bufferOpen, setBufferOpen] = useState(false);
  const [bookingWindowOpen, setBookingWindowOpen] = useState(false);
  const [cancellationWindowOpen, setCancellationWindowOpen] = useState(false);
  const [noShowOpen, setNoShowOpen] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    toast.success('✅ Appointment settings saved successfully');
    onClose();
  };

  const durations = [
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '1 hour' },
    { value: '90', label: '1.5 hours' },
    { value: '120', label: '2 hours' },
  ];

  const bufferTimes = [
    { value: '0', label: 'No buffer' },
    { value: '5', label: '5 minutes' },
    { value: '10', label: '10 minutes' },
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
  ];

  const bookingWindows = [
    { value: '1', label: '1 day in advance' },
    { value: '7', label: '1 week in advance' },
    { value: '14', label: '2 weeks in advance' },
    { value: '30', label: '1 month in advance' },
    { value: '60', label: '2 months in advance' },
    { value: '90', label: '3 months in advance' },
  ];

  const cancellationWindows = [
    { value: '1', label: '1 hour before' },
    { value: '2', label: '2 hours before' },
    { value: '4', label: '4 hours before' },
    { value: '12', label: '12 hours before' },
    { value: '24', label: '24 hours before' },
    { value: '48', label: '48 hours before' },
  ];

  const noShowTimes = [
    { value: '5', label: '5 minutes' },
    { value: '10', label: '10 minutes' },
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
  ];

  return (
    <BaseSlider
      isOpen={isOpen}
      onClose={onClose}
      title="Appointment Settings"
      contentClassName="bg-muted/50 scrollbar-hide"
      footer={
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => { onClose(); setFormData(initialFormData); }}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="appointment-settings-form"
            className="flex-1"
          >
            Save Changes
          </Button>
        </div>
      }
    >
      <form id="appointment-settings-form" onSubmit={handleSubmit} className="max-w-md mx-auto">
        {/* Single Card with All Appointment Settings */}
        <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm">
          <CardContent className="space-y-8">
            {/* Basic Booking Settings Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Basic Booking Settings</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Default Appointment Duration</Label>
                  <p className="text-xs text-muted-foreground">How long new appointments last by default.</p>
                  <Popover open={durationOpen} onOpenChange={setDurationOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={durationOpen}
                        className="border-0 bg-muted/50 hover:bg-muted/70 h-12 text-base justify-between w-full"
                      >
                        {formData.defaultDuration ? durations.find(d => d.value === formData.defaultDuration)?.label : "Select duration"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[350px] p-0 z-[80]">
                      <Command>
                        <CommandInput placeholder="Search durations..." />
                        <CommandList>
                          <CommandEmpty>No durations found.</CommandEmpty>
                          <CommandGroup>
                            {durations.map((duration) => (
                              <CommandItem
                                key={duration.value}
                                value={duration.value}
                                onSelect={() => {
                                  setFormData(prev => ({ ...prev, defaultDuration: duration.value }));
                                  setDurationOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.defaultDuration === duration.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {duration.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Buffer Time Between Appointments</Label>
                  <p className="text-xs text-muted-foreground">Time blocked before/after each appointment for preparation.</p>
                  <Popover open={bufferOpen} onOpenChange={setBufferOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={bufferOpen}
                        className="border-0 bg-muted/50 hover:bg-muted/70 h-12 text-base justify-between w-full"
                      >
                        {formData.bufferTime ? bufferTimes.find(b => b.value === formData.bufferTime)?.label : "Select buffer time"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[350px] p-0 z-[80]">
                      <Command>
                        <CommandInput placeholder="Search buffer times..." />
                        <CommandList>
                          <CommandEmpty>No buffer times found.</CommandEmpty>
                          <CommandGroup>
                            {bufferTimes.map((buffer) => (
                              <CommandItem
                                key={buffer.value}
                                value={buffer.value}
                                onSelect={() => {
                                  setFormData(prev => ({ ...prev, bufferTime: buffer.value }));
                                  setBufferOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.bufferTime === buffer.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {buffer.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-foreground">Enable Online Booking</Label>
                      <p className="text-xs text-muted-foreground">Allow clients to book appointments online.</p>
                    </div>
                    <Switch
                      checked={formData.onlineBooking}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, onlineBooking: checked }))}
                      className="!h-5 !w-9 !min-h-0 !min-w-0"
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* Booking Windows Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Booking Windows</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">How Far in Advance Can Clients Book?</Label>
                  <p className="text-xs text-muted-foreground">Maximum advance booking window.</p>
                  <Popover open={bookingWindowOpen} onOpenChange={setBookingWindowOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={bookingWindowOpen}
                        className="border-0 bg-muted/50 hover:bg-muted/70 h-12 text-base justify-between w-full"
                      >
                        {formData.bookingWindow ? bookingWindows.find(w => w.value === formData.bookingWindow)?.label : "Select booking window"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[350px] p-0 z-[80]">
                      <Command>
                        <CommandInput placeholder="Search booking windows..." />
                        <CommandList>
                          <CommandEmpty>No booking windows found.</CommandEmpty>
                          <CommandGroup>
                            {bookingWindows.map((window) => (
                              <CommandItem
                                key={window.value}
                                value={window.value}
                                onSelect={() => {
                                  setFormData(prev => ({ ...prev, bookingWindow: window.value }));
                                  setBookingWindowOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.bookingWindow === window.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {window.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Cancellation Policy</Label>
                  <p className="text-xs text-muted-foreground">How long before appointments can clients cancel?</p>
                  <Popover open={cancellationWindowOpen} onOpenChange={setCancellationWindowOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={cancellationWindowOpen}
                        className="border-0 bg-muted/50 hover:bg-muted/70 h-12 text-base justify-between w-full"
                      >
                        {formData.cancellationWindow ? cancellationWindows.find(w => w.value === formData.cancellationWindow)?.label : "Select cancellation window"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[350px] p-0 z-[80]">
                      <Command>
                        <CommandInput placeholder="Search cancellation windows..." />
                        <CommandList>
                          <CommandEmpty>No cancellation windows found.</CommandEmpty>
                          <CommandGroup>
                            {cancellationWindows.map((window) => (
                              <CommandItem
                                key={window.value}
                                value={window.value}
                                onSelect={() => {
                                  setFormData(prev => ({ ...prev, cancellationWindow: window.value }));
                                  setCancellationWindowOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.cancellationWindow === window.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {window.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            {/* No-Show Policy Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">No-Show Policy</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-foreground">Enable No-Show Detection</Label>
                      <p className="text-xs text-muted-foreground">Automatically mark clients as no-show after a delay.</p>
                    </div>
                    <Switch
                      checked={formData.noShowEnabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, noShowEnabled: checked }))}
                      className="!h-5 !w-9 !min-h-0 !min-w-0"
                    />
                  </div>
                </div>
                {formData.noShowEnabled && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Mark as No-Show After</Label>
                    <p className="text-xs text-muted-foreground">How long to wait before marking as no-show.</p>
                    <Popover open={noShowOpen} onOpenChange={setNoShowOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={noShowOpen}
                          className="border-0 bg-muted/50 hover:bg-muted/70 h-12 text-base justify-between w-full"
                        >
                          {formData.noShowMinutes ? noShowTimes.find(t => t.value === formData.noShowMinutes)?.label : "Select time"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[350px] p-0 z-[80]">
                        <Command>
                          <CommandInput placeholder="Search times..." />
                          <CommandList>
                            <CommandEmpty>No times found.</CommandEmpty>
                            <CommandGroup>
                              {noShowTimes.map((time) => (
                                <CommandItem
                                  key={time.value}
                                  value={time.value}
                                  onSelect={() => {
                                    setFormData(prev => ({ ...prev, noShowMinutes: time.value }));
                                    setNoShowOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.noShowMinutes === time.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {time.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
            </div>
            {/* Reminder Settings Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Automatic Reminders</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-foreground">24-Hour Reminder</Label>
                      <p className="text-xs text-muted-foreground">Send reminder 24 hours before appointment.</p>
                    </div>
                    <Switch
                      checked={formData.reminder24h}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, reminder24h: checked }))}
                      className="!h-5 !w-9 !min-h-0 !min-w-0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-foreground">1-Hour Reminder</Label>
                      <p className="text-xs text-muted-foreground">Send reminder 1 hour before appointment.</p>
                    </div>
                    <Switch
                      checked={formData.reminder1h}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, reminder1h: checked }))}
                      className="!h-5 !w-9 !min-h-0 !min-w-0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-foreground">Email Reminders</Label>
                      <p className="text-xs text-muted-foreground">Send reminders via email.</p>
                    </div>
                    <Switch
                      checked={formData.reminderEmail}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, reminderEmail: checked }))}
                      className="!h-5 !w-9 !min-h-0 !min-w-0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-foreground">SMS Reminders</Label>
                      <p className="text-xs text-muted-foreground">Send reminders via text message.</p>
                    </div>
                    <Switch
                      checked={formData.reminderSms}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, reminderSms: checked }))}
                      className="!h-5 !w-9 !min-h-0 !min-w-0"
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* Client Permissions Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Client Permissions</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-foreground">Prevent Double Booking</Label>
                      <p className="text-xs text-muted-foreground">Block overlapping appointments automatically.</p>
                    </div>
                    <Switch
                      checked={formData.doubleBookingPrevention}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, doubleBookingPrevention: checked }))}
                      className="!h-5 !w-9 !min-h-0 !min-w-0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-foreground">Allow Client Cancellation</Label>
                      <p className="text-xs text-muted-foreground">Let clients cancel their own appointments.</p>
                    </div>
                    <Switch
                      checked={formData.clientCancellation}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, clientCancellation: checked }))}
                      className="!h-5 !w-9 !min-h-0 !min-w-0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-foreground">Allow Client Rescheduling</Label>
                      <p className="text-xs text-muted-foreground">Let clients reschedule their own appointments.</p>
                    </div>
                    <Switch
                      checked={formData.clientReschedule}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, clientReschedule: checked }))}
                      className="!h-5 !w-9 !min-h-0 !min-w-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </BaseSlider>
  );
};

export default AppointmentSettingsSlider; 