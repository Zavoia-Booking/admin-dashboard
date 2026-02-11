import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Calendar, Clock, User, Scissors, Check, ChevronsUpDown,
  Loader2, Phone, Footprints, ShieldCheck, StickyNote, UserPlus,
} from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Label } from '../../../shared/components/ui/label';
import { Input } from '../../../shared/components/ui/input';
import { Textarea } from '../../../shared/components/ui/textarea';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../../shared/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../../../shared/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '../../../shared/components/ui/avatar';
import { Badge } from '../../../shared/components/ui/badge';
import { cn } from '../../../shared/lib/utils';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import { useDispatch, useSelector } from 'react-redux';
import { adminCreateAppointment, toggleAddForm } from '../actions';
import {
  getSelectedLocationId,
  getLocationStaff,
  getLocationWorkingHours,
  getLocationOpen247,
  getBookingSettings,
  getSelectedDate,
} from '../selectors';
import { listCustomersApi, addCustomerApi } from '../../customers/api';
import { fetchLocationFullAssignmentRequest } from '../../assignments/api';
import { toast } from 'sonner';
import type { Customer } from '../../../shared/types/customer';
import type { LocationService, LocationTeamMember } from '../../assignments/types';
import type { CalendarStaffMember, AppointmentBookingSource } from '../../../shared/types/calendar';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface AddAppointmentSliderProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormState {
  customerId: number | null;
  customerDisplay: { firstName: string; lastName: string; email: string; phone: string } | null;
  serviceId: number | null;
  date: Date | null;
  time: string; // "HH:mm"
  staffUserId: number | null; // null = unassigned
  notes: string;
  bookingSource: AppointmentBookingSource;
}

const initialForm: FormState = {
  customerId: null,
  customerDisplay: null,
  serviceId: null,
  date: null,
  time: '',
  staffUserId: null,
  notes: '',
  bookingSource: 'admin' as AppointmentBookingSource,
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

const AddAppointmentSlider: React.FC<AddAppointmentSliderProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();

  // Redux state
  const selectedLocationId = useSelector(getSelectedLocationId);
  const locationStaff = useSelector(getLocationStaff);
  const workingHours = useSelector(getLocationWorkingHours);
  const open247 = useSelector(getLocationOpen247);
  const bookingSettings = useSelector(getBookingSettings);
  const selectedDate = useSelector(getSelectedDate);

  // Form state
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Customer search state
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreate, setQuickCreate] = useState({ firstName: '', lastName: '', phone: '', email: '' });
  const [quickCreateSubmitting, setQuickCreateSubmitting] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Services state (loaded from assignments API)
  const [locationServices, setLocationServices] = useState<LocationService[]>([]);
  const [locationTeamMembers, setLocationTeamMembers] = useState<LocationTeamMember[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);

  // Staff dropdown state
  const [staffOpen, setStaffOpen] = useState(false);

  // Time picker state
  const [hourOpen, setHourOpen] = useState(false);

  // ─────────────────────────────────────────────────────────────
  // Reset form when slider opens/closes
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      setForm({
        ...initialForm,
        date: selectedDate || new Date(),
      });
      setError(null);
      setCustomerSearch('');
      setCustomerResults([]);
      setShowQuickCreate(false);
      setQuickCreate({ firstName: '', lastName: '', phone: '', email: '' });
    }
  }, [isOpen, selectedDate]);

  // ─────────────────────────────────────────────────────────────
  // Load services at location when form opens
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen && selectedLocationId) {
      setServicesLoading(true);
      fetchLocationFullAssignmentRequest(selectedLocationId)
        .then((data) => {
          setLocationServices(data.services);
          setLocationTeamMembers(data.teamMembers);
        })
        .catch(() => {
          setLocationServices([]);
          setLocationTeamMembers([]);
        })
        .finally(() => setServicesLoading(false));
    }
  }, [isOpen, selectedLocationId]);

  // ─────────────────────────────────────────────────────────────
  // Customer search (debounced)
  // ─────────────────────────────────────────────────────────────

  const searchCustomers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setCustomerResults([]);
      return;
    }
    setCustomerLoading(true);
    try {
      const response = await listCustomersApi({
        search: query, // Use global search instead of filters
        filters: [],
        pagination: { offset: 0, limit: 10 },
      });
      setCustomerResults(response.data);
    } catch {
      setCustomerResults([]);
    } finally {
      setCustomerLoading(false);
    }
  }, []);

  const handleCustomerSearchChange = useCallback(
    (value: string) => {
      setCustomerSearch(value);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => searchCustomers(value), 300);
    },
    [searchCustomers],
  );

  const handleSelectCustomer = useCallback((customer: Customer) => {
    setForm((prev) => ({
      ...prev,
      customerId: customer.id,
      customerDisplay: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
      },
    }));
    setCustomerOpen(false);
    setCustomerSearch('');
  }, []);

  const handleClearCustomer = useCallback(() => {
    setForm((prev) => ({ ...prev, customerId: null, customerDisplay: null }));
  }, []);

  // Quick create customer
  const handleQuickCreateCustomer = useCallback(async () => {
    if (!quickCreate.firstName.trim()) return;
    setQuickCreateSubmitting(true);
    try {
      const newCustomer = await addCustomerApi({
        firstName: quickCreate.firstName.trim(),
        lastName: quickCreate.lastName.trim() || undefined,
        phone: quickCreate.phone.trim() || undefined,
        email: quickCreate.email.trim() || undefined,
      });
      handleSelectCustomer(newCustomer);
      setShowQuickCreate(false);
      setQuickCreate({ firstName: '', lastName: '', phone: '', email: '' });
      toast.success('Customer created');
    } catch {
      toast.error('Failed to create customer');
    } finally {
      setQuickCreateSubmitting(false);
    }
  }, [quickCreate, handleSelectCustomer]);

  // ─────────────────────────────────────────────────────────────
  // Derived data
  // ─────────────────────────────────────────────────────────────

  const selectedService = useMemo(
    () => locationServices.find((s) => s.serviceId === form.serviceId) ?? null,
    [locationServices, form.serviceId],
  );

  // Get the effective duration/price for the selected service
  const serviceDuration = selectedService
    ? selectedService.customDuration ?? selectedService.defaultDuration
    : 0;
  const servicePrice = selectedService
    ? (selectedService.customPrice ?? selectedService.defaultPrice) / 100
    : 0;

  // Eligible staff: staff at this location who can perform the selected service
  const eligibleStaff = useMemo<CalendarStaffMember[]>(() => {
    if (!form.serviceId || locationTeamMembers.length === 0) return locationStaff;
    // Find which team members have services enabled for the selected service
    const eligibleUserIds = new Set(
      locationTeamMembers
        .filter((tm) => tm.servicesEnabled > 0) // has at least some services
        .map((tm) => tm.userId),
    );
    // For now, show all location staff since we don't have per-service-per-staff data
    // in the LocationTeamMember summary. The backend validates eligibility on create.
    return locationStaff.filter((s) => eligibleUserIds.has(s.id) || eligibleUserIds.size === 0);
  }, [form.serviceId, locationStaff, locationTeamMembers]);

  // Working hours for the selected date
  const dayWorkingHours = useMemo(() => {
    if (!form.date || !workingHours || open247) return null;
    const dayName = form.date
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase() as keyof typeof workingHours;
    return workingHours[dayName] ?? null;
  }, [form.date, workingHours, open247]);

  const isClosedDay = dayWorkingHours ? !dayWorkingHours.isOpen : false;

  // Generate time slots based on slotIntervalMinutes and working hours
  const timeSlots = useMemo(() => {
    const interval = bookingSettings?.slotIntervalMinutes ?? 15;
    const slots: string[] = [];

    let startMinute = 0;
    let endMinute = 24 * 60;

    if (dayWorkingHours && dayWorkingHours.isOpen) {
      const [openH, openM] = dayWorkingHours.open.split(':').map(Number);
      const [closeH, closeM] = dayWorkingHours.close.split(':').map(Number);
      startMinute = openH * 60 + openM;
      endMinute = closeH * 60 + closeM;
    } else if (open247) {
      startMinute = 0;
      endMinute = 24 * 60;
    }

    for (let m = startMinute; m < endMinute; m += interval) {
      const hh = String(Math.floor(m / 60)).padStart(2, '0');
      const mm = String(m % 60).padStart(2, '0');
      slots.push(`${hh}:${mm}`);
    }

    return slots;
  }, [dayWorkingHours, open247, bookingSettings]);

  // Format time for display
  const formatSlotTime = (slot: string) => {
    const [h, m] = slot.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // ─────────────────────────────────────────────────────────────
  // Submit
  // ─────────────────────────────────────────────────────────────

  const canSubmit =
    form.serviceId !== null &&
    form.date !== null &&
    form.time !== '' &&
    selectedLocationId !== null &&
    !isClosedDay;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !selectedLocationId || !form.date) return;

    setSubmitting(true);
    setError(null);

    // Build scheduledAt as timestamp (ms)
    const [hours, minutes] = form.time.split(':').map(Number);
    const scheduledDate = new Date(form.date);
    scheduledDate.setHours(hours, minutes, 0, 0);

    const payload = {
      serviceId: form.serviceId!,
      locationId: selectedLocationId,
      customerId: form.customerId ?? undefined,
      staffUserIds: form.staffUserId !== null ? [form.staffUserId] : undefined,
      scheduledAt: scheduledDate.getTime(),
      notes: form.notes.trim() || undefined,
      bookingSource: form.bookingSource,
    };

    try {
      dispatch(adminCreateAppointment.request(payload));
      toast.success('Appointment created');
      onClose();
    } catch {
      setError('Failed to create appointment');
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Booking sources
  // ─────────────────────────────────────────────────────────────

  const bookingSources: { value: AppointmentBookingSource; label: string; icon: React.ReactNode }[] = [
    { value: 'admin' as AppointmentBookingSource, label: 'Admin', icon: <ShieldCheck className="h-4 w-4" /> },
    { value: 'phone' as AppointmentBookingSource, label: 'Phone', icon: <Phone className="h-4 w-4" /> },
    { value: 'walk_in' as AppointmentBookingSource, label: 'Walk-in', icon: <Footprints className="h-4 w-4" /> },
  ];

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <BaseSlider
      isOpen={isOpen}
      onClose={onClose}
      title="New Appointment"
      contentClassName="bg-muted/50 scrollbar-hide"
      footer={
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-appointment-form"
            className="flex-1"
            disabled={!canSubmit || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Appointment'
            )}
          </Button>
        </div>
      }
    >
      <form id="add-appointment-form" onSubmit={handleSubmit} className="max-w-md mx-auto">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm transition-all duration-300">
          <CardContent className="space-y-8">
            {/* ── Client Section ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                <div className="p-2 rounded-xl bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Client</h3>
                <span className="text-xs text-muted-foreground">(optional)</span>
              </div>

              {form.customerDisplay ? (
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback>
                      {form.customerDisplay.firstName?.[0] ?? '?'}
                      {form.customerDisplay.lastName?.[0] ?? ''}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-base truncate">
                      {form.customerDisplay.firstName} {form.customerDisplay.lastName}
                    </div>
                    {form.customerDisplay.email && (
                      <div className="text-sm text-muted-foreground truncate">{form.customerDisplay.email}</div>
                    )}
                    {form.customerDisplay.phone && (
                      <div className="text-sm text-muted-foreground truncate">{form.customerDisplay.phone}</div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleClearCustomer}>
                    Change
                  </Button>
                </div>
              ) : showQuickCreate ? (
                <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <UserPlus className="h-4 w-4" />
                    Quick Create Customer
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="First name *"
                      value={quickCreate.firstName}
                      onChange={(e) => setQuickCreate((p) => ({ ...p, firstName: e.target.value }))}
                      className="h-10"
                    />
                    <Input
                      placeholder="Last name"
                      value={quickCreate.lastName}
                      onChange={(e) => setQuickCreate((p) => ({ ...p, lastName: e.target.value }))}
                      className="h-10"
                    />
                  </div>
                  <Input
                    placeholder="Phone"
                    value={quickCreate.phone}
                    onChange={(e) => setQuickCreate((p) => ({ ...p, phone: e.target.value }))}
                    className="h-10"
                  />
                  <Input
                    placeholder="Email"
                    value={quickCreate.email}
                    onChange={(e) => setQuickCreate((p) => ({ ...p, email: e.target.value }))}
                    className="h-10"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowQuickCreate(false)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleQuickCreateCustomer}
                      disabled={!quickCreate.firstName.trim() || quickCreateSubmitting}
                      className="flex-1"
                    >
                      {quickCreateSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="border-0 bg-muted/50 hover:bg-muted/70 h-12 text-base justify-between w-full"
                      >
                        Search by name...
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[350px] p-0 z-[80]">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search clients..."
                          value={customerSearch}
                          onValueChange={handleCustomerSearchChange}
                        />
                        <CommandList>
                          {customerLoading && (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                          )}
                          {!customerLoading && customerSearch.length >= 2 && customerResults.length === 0 && (
                            <CommandEmpty>No customers found.</CommandEmpty>
                          )}
                          {customerResults.length > 0 && (
                            <CommandGroup>
                              {customerResults.map((customer) => (
                                <CommandItem
                                  key={customer.id}
                                  value={`${customer.id}`}
                                  onSelect={() => handleSelectCustomer(customer)}
                                  className="flex items-center gap-3 p-3"
                                >
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                      {customer.firstName[0]}
                                      {customer.lastName?.[0] ?? ''}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                                    {customer.email && <div className="text-sm text-muted-foreground">{customer.email}</div>}
                                    {customer.phone && <div className="text-sm text-muted-foreground">{customer.phone}</div>}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                          <CommandGroup>
                            <CommandItem
                              onSelect={() => {
                                setCustomerOpen(false);
                                setShowQuickCreate(true);
                              }}
                              className="flex items-center gap-2 p-3 text-primary"
                            >
                              <UserPlus className="h-4 w-4" />
                              Add new customer
                            </CommandItem>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            {/* ── Service Section ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Scissors className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Service</h3>
              </div>
              <div className="space-y-2">
                <Popover open={serviceOpen} onOpenChange={setServiceOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="border-0 bg-muted/50 hover:bg-muted/70 h-12 text-base justify-between w-full"
                    >
                      {servicesLoading ? (
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading services...
                        </span>
                      ) : selectedService ? (
                        <span>{selectedService.serviceName}</span>
                      ) : (
                        <span className="text-muted-foreground">Select a service</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[350px] p-0 z-[80]">
                    <Command>
                      <CommandInput placeholder="Search services..." />
                      <CommandList>
                        <CommandEmpty>No services at this location.</CommandEmpty>
                        <CommandGroup>
                          {locationServices.map((service) => {
                            const price = (service.customPrice ?? service.defaultPrice) / 100;
                            const duration = service.customDuration ?? service.defaultDuration;
                            return (
                              <CommandItem
                                key={service.serviceId}
                                value={service.serviceName}
                                onSelect={() => {
                                  setForm((prev) => ({
                                    ...prev,
                                    serviceId: service.serviceId,
                                    // Reset staff if service changes
                                    staffUserId: null,
                                  }));
                                  setServiceOpen(false);
                                }}
                                className="flex items-center gap-3 p-3"
                              >
                                <Check
                                  className={cn(
                                    'h-4 w-4',
                                    form.serviceId === service.serviceId ? 'opacity-100' : 'opacity-0',
                                  )}
                                />
                                <div className="flex-1">
                                  <div className="font-medium">{service.serviceName}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {duration} min &middot; ${price.toFixed(2)}
                                    {service.category && (
                                      <span className="ml-2 text-xs">{service.category.name}</span>
                                    )}
                                  </div>
                                </div>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {selectedService && (
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-xs">{serviceDuration} min</Badge>
                    <Badge variant="secondary" className="text-xs">${servicePrice.toFixed(2)}</Badge>
                  </div>
                )}
              </div>
            </div>

            {/* ── Date & Time Section ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Date & Time</h3>
              </div>

              {isClosedDay && (
                <div className="p-3 rounded-lg bg-orange-100 text-orange-800 text-sm dark:bg-orange-900/20 dark:text-orange-400">
                  Business is closed on this day. Please select another date.
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date</Label>
                  <DatePicker
                    selected={form.date}
                    onChange={(date) => {
                      setForm((prev) => ({ ...prev, date, time: '' }));
                    }}
                    dateFormat="yyyy-MM-dd"
                    className="border-0 bg-muted/50 focus:bg-background h-12 text-base w-full rounded-md px-3"
                    placeholderText="Select date"
                    popperClassName="z-[90]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Time</Label>
                  {timeSlots.length > 0 ? (
                    <Popover open={hourOpen} onOpenChange={setHourOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-12 text-base justify-between font-normal bg-muted/50 border-0"
                        >
                          {form.time ? formatSlotTime(form.time) : 'Select time'}
                          <Clock className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-44 max-h-60 overflow-y-auto z-[90]">
                        {timeSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            className={cn(
                              'w-full text-left px-4 py-2 text-sm hover:bg-muted/50',
                              form.time === slot ? 'bg-primary/10 font-medium' : '',
                            )}
                            onClick={() => {
                              setForm((prev) => ({ ...prev, time: slot }));
                              setHourOpen(false);
                            }}
                          >
                            {formatSlotTime(slot)}
                          </button>
                        ))}
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <div className="h-12 flex items-center text-sm text-muted-foreground bg-muted/50 rounded-md px-3">
                      {isClosedDay ? 'Closed' : 'Select a date first'}
                    </div>
                  )}
                </div>
              </div>

              {form.time && selectedService && (
                <div className="text-xs text-muted-foreground">
                  Appointment: {formatSlotTime(form.time)} &ndash;{' '}
                  {(() => {
                    const [h, m] = form.time.split(':').map(Number);
                    const end = new Date();
                    end.setHours(h, m + serviceDuration, 0, 0);
                    return end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                  })()}{' '}
                  ({serviceDuration} min)
                </div>
              )}
            </div>

            {/* ── Staff Section ── */}
            {locationStaff.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Staff Member</h3>
                  <span className="text-xs text-muted-foreground">(optional)</span>
                </div>
                <Popover open={staffOpen} onOpenChange={setStaffOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="border-0 bg-muted/50 hover:bg-muted/70 h-12 text-base justify-between w-full"
                    >
                      {form.staffUserId !== null
                        ? (() => {
                            const staff = locationStaff.find((s) => s.id === form.staffUserId);
                            return staff ? `${staff.firstName} ${staff.lastName}` : 'Unknown';
                          })()
                        : 'Unassigned'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[350px] p-0 z-[80]">
                    <Command>
                      <CommandInput placeholder="Search staff..." />
                      <CommandList>
                        <CommandGroup>
                          {/* Unassigned option */}
                          <CommandItem
                            value="unassigned"
                            onSelect={() => {
                              setForm((prev) => ({ ...prev, staffUserId: null }));
                              setStaffOpen(false);
                            }}
                            className="flex items-center gap-3 p-3"
                          >
                            <Check
                              className={cn('h-4 w-4', form.staffUserId === null ? 'opacity-100' : 'opacity-0')}
                            />
                            <Badge variant="outline" className="text-orange-600 border-orange-300">
                              Unassigned
                            </Badge>
                          </CommandItem>

                          {eligibleStaff.map((staff) => (
                            <CommandItem
                              key={staff.id}
                              value={`${staff.firstName} ${staff.lastName}`}
                              onSelect={() => {
                                setForm((prev) => ({ ...prev, staffUserId: staff.id }));
                                setStaffOpen(false);
                              }}
                              className="flex items-center gap-3 p-3"
                            >
                              <Check
                                className={cn('h-4 w-4', form.staffUserId === staff.id ? 'opacity-100' : 'opacity-0')}
                              />
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={staff.profileImage ?? undefined} />
                                <AvatarFallback>
                                  {staff.firstName[0]}
                                  {staff.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="font-medium">
                                {staff.firstName} {staff.lastName}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* ── Booking Source Section ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                <div className="p-2 rounded-xl bg-primary/10">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Booking Source</h3>
              </div>
              <div className="flex gap-2">
                {bookingSources.map((source) => (
                  <button
                    key={source.value}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, bookingSource: source.value }))}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
                      form.bookingSource === source.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border hover:bg-muted',
                    )}
                  >
                    {source.icon}
                    {source.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Notes Section ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                <div className="p-2 rounded-xl bg-primary/10">
                  <StickyNote className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Notes</h3>
              </div>
              <Textarea
                placeholder="Add any special notes or requirements..."
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="border-0 bg-muted/50 focus:bg-background text-base resize-none"
              />
            </div>
          </CardContent>
        </Card>
      </form>
    </BaseSlider>
  );
};

export default AddAppointmentSlider;
