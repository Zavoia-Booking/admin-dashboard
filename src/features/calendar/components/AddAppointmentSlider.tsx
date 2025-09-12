import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar, Clock, User, MapPin, Scissors, Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Label } from '../../../shared/components/ui/label';
import { Textarea } from '../../../shared/components/ui/textarea';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../../shared/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../../../shared/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '../../../shared/components/ui/avatar';
import { cn } from '../../../shared/lib/utils';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import { mockLocations } from '../../../mocks/locations.mock';
import { mockTeamMembers } from '../../../mocks/team-members.mock';
import { useDispatch } from "react-redux";
import { createCalendarAppointmentAction } from "../actions.ts";
import { mockClients } from "../../../mocks/clients.ts";
import type { LocationType } from "../../../shared/types/location.ts";
import type { TeamMember } from "../../../shared/types/team-member.ts";

interface AddAppointmentSliderProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AppointmentFormData {
  clientId: string;
  service: string;
  date: string;
  time: string;
  location: string;
  teamMembers: string[];
  notes: string;
  isRecurring?: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  recurrenceInterval?: number; // Only for custom
  recurrenceIntervalUnit?: 'days' | 'weeks' | 'months' | 'years'; // Only for custom
  recurrenceDaysOfWeek?: string[]; // For weekly
  recurrenceEndType?: 'after' | 'onDate';
  recurrenceEndValue?: number | string;
}

const initialFormData: AppointmentFormData = {
  clientId: '',
  service: '',
  date: '',
  time: '',
  location: '',
  teamMembers: [],
  notes: '',
  isRecurring: false,
  recurrencePattern: 'weekly',
  recurrenceInterval: 1,
  recurrenceIntervalUnit: 'days',
  recurrenceDaysOfWeek: ['MO'],
  recurrenceEndType: 'after',
  recurrenceEndValue: 5,
};

const AddAppointmentSlider: React.FC<AddAppointmentSliderProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<AppointmentFormData>(initialFormData);
  const [clientOpen, setClientOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [hourOpen, setHourOpen] = useState(false);
  const [minuteOpen, setMinuteOpen] = useState(false);
  const dispatch = useDispatch();

  const clients: Array<any> = mockClients;
  const locations: Array<LocationType> = mockLocations;
  const teamMembers: Array<TeamMember> = mockTeamMembers;

  React.useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData);
    }
  }, [isOpen]);

  const services = [
    'Haircut & Style',
    'Hair Wash & Blow Dry',
    'Hair Color',
    'Hair Highlights',
    'Deep Conditioning',
    'Beard Trim & Style',
    'Hair & Beard Cut',
    'Wedding Hair Style',
    'Scissor Cut'
  ];

  const selectedClient = clients.find((client: any) => client.id === formData.clientId);
  const selectedLocation = locations.find(location => `${location.id}` === formData.location);
  const selectedTeamMembers = teamMembers.filter(member => formData.teamMembers.includes(`${member.id}`));

  // Extract hour and minute from formData.time
  const hour = formData.time ? formData.time.split(':')[0] : '00';
  const minute = formData.time ? formData.time.split(':')[1] : '00';

  const handleSubmit = (event: any) => {
    event.preventDefault();
    // Handle form submission here
    console.log('New appointment:', formData);

    const payload = {
      name:'test_name',
      email: 'test@test.com',
      phone: '+1 (555) 123-4567',
      staffUserIds: [2],
      scheduledAt:'2025-09-17',
      serviceId: 1,
      locationId: 1,
    }

    dispatch(createCalendarAppointmentAction.request(payload))

    // onClose();
    // setFormData(initialFormData);
  };

  return (
    <>
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
              onClick={() => { onClose(); setFormData(initialFormData); }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-appointment-form"
              className="flex-1"
            >
              Create Appointment
            </Button>
          </div>
        }
      >
        <form id="add-appointment-form" onSubmit={handleSubmit} className="max-w-md mx-auto">
          {/* Single Card with All Appointment Data */}
          <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm transition-all duration-300">
            <CardContent className="space-y-8">
              {/* Client Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Client Information</h3>
                </div>
                {!selectedClient ? (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Search Client</Label>
                    <Popover open={clientOpen} onOpenChange={setClientOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={clientOpen}
                          className="border-0 bg-muted/50 hover:bg-muted/70 h-12 text-base justify-between w-full"
                        >
                          Search by name, email or phone...
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[350px] p-0 z-[80]">
                        <Command>
                          <CommandInput placeholder="Search clients..." />
                          <CommandList>
                            <CommandEmpty>No clients found.</CommandEmpty>
                            <CommandGroup>
                              {clients.map((client) => (
                                <CommandItem
                                  key={client.id}
                                  value={`${client.firstName} ${client.lastName} ${client.email} ${client.phone}`}
                                  onSelect={() => {
                                    setFormData(prev => ({ ...prev, clientId: client.id }));
                                    setClientOpen(false);
                                  }}
                                  className="flex items-center gap-3 p-3"
                                >
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={client.avatar} />
                                    <AvatarFallback>{client.firstName[0]}{client.lastName[0]}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="font-medium">{client.firstName} {client.lastName}</div>
                                    <div className="text-sm text-muted-foreground">{client.email}</div>
                                    <div className="text-sm text-muted-foreground">{client.phone}</div>
                                  </div>
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      formData.clientId === client.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={selectedClient.avatar} />
                      <AvatarFallback>{selectedClient.firstName[0]}{selectedClient.lastName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-base truncate">{selectedClient.firstName} {selectedClient.lastName}</div>
                      <div className="text-sm text-muted-foreground truncate">{selectedClient.email}</div>
                      <div className="text-sm text-muted-foreground truncate">{selectedClient.phone}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, clientId: '' }))}
                      className="text-muted-foreground hover:text-foreground flex-shrink-0"
                    >
                      Change
                    </Button>
                  </div>
                )}
              </div>

              {/* Service Details Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Scissors className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Service Details</h3>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Service</Label>
                  <Popover open={serviceOpen} onOpenChange={setServiceOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={serviceOpen}
                        className="border-0 bg-muted/50 hover:bg-muted/70 h-12 text-base justify-between w-full"
                      >
                        {formData.service || "Select a service"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[350px] p-0 z-[80]">
                      <Command>
                        <CommandInput placeholder="Search services..." />
                        <CommandList>
                          <CommandEmpty>No services found.</CommandEmpty>
                          <CommandGroup>
                            {services.map((service) => (
                              <CommandItem
                                key={service}
                                value={service}
                                onSelect={() => {
                                  setFormData(prev => ({ ...prev, service }));
                                  setServiceOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.service === service ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {service}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Date & Time Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Date & Time</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-sm font-medium text-foreground">Date</Label>
                    <DatePicker
                      id="date"
                      selected={formData.date ? new Date(formData.date) : null}
                      onChange={date => setFormData(prev => ({ ...prev, date: date ? date.toISOString().slice(0, 10) : '' }))}
                      dateFormat="yyyy-MM-dd"
                      className="border-0 bg-muted/50 focus:bg-background h-12 text-base w-full rounded-md px-3"
                      placeholderText="Select date"
                      popperClassName="z-[90]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-sm font-medium text-foreground">Time</Label>
                    <div className="flex gap-2 items-center">
                      {/* Hour Dropdown */}
                      <Popover open={hourOpen} onOpenChange={setHourOpen}>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" className="w-14 h-12 px-0 text-base justify-center font-normal bg-muted/50 border-0" onClick={() => setHourOpen(true)}>
                            {hour}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-20 max-h-48 overflow-y-auto rounded-md shadow-lg bg-white z-[90] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                          {Array.from({ length: 24 }, (_, i) => {
                            const val = String(i).padStart(2, '0');
                            return (
                              <button
                                key={val}
                                className={`w-full text-left px-4 py-2 text-base hover:bg-muted/50 focus:bg-muted/50 font-normal ${hour === val ? 'bg-primary/10' : ''}`}
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, time: `${val}:${minute}` }));
                                  setHourOpen(false);
                                }}
                              >
                                {val}
                              </button>
                            );
                          })}
                        </PopoverContent>
                      </Popover>
                      <span>:</span>
                      {/* Minute Dropdown */}
                      <Popover open={minuteOpen} onOpenChange={setMinuteOpen}>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" className="w-14 h-12 px-0 text-base justify-center font-normal bg-muted/50 border-0" onClick={() => setMinuteOpen(true)}>
                            {minute}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-20 max-h-48 overflow-y-auto rounded-md shadow-lg bg-white z-[90] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                          {Array.from({ length: 60 }, (_, i) => {
                            const val = String(i).padStart(2, '0');
                            return (
                              <button
                                key={val}
                                className={`w-full text-left px-4 py-2 text-base hover:bg-muted/50 focus:bg-muted/50 font-normal ${minute === val ? 'bg-primary/10' : ''}`}
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, time: `${hour}:${val}` }));
                                  setMinuteOpen(false);
                                }}
                              >
                                {val}
                              </button>
                            );
                          })}
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recurrence Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Recurrence</h3>
                </div>
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-medium text-foreground">Repeat?</Label>
                  <input
                    type="checkbox"
                    checked={!!formData.isRecurring}
                    onChange={e => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                    className="h-5 w-5 accent-primary"
                  />
                </div>
                {formData.isRecurring && (
                  <>
                    {formData.recurrencePattern === 'custom' ? (
                      <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-4">
                        <div>
                          <Label className="text-sm">Pattern</Label>
                          <select
                            value={formData.recurrencePattern}
                            onChange={e => {
                              const pattern = e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
                              const update: Partial<AppointmentFormData> = { recurrencePattern: pattern };
                              if (pattern === 'weekly') {
                                // Default to the day of the week of the selected date
                                const date = formData.date ? new Date(formData.date) : new Date();
                                const dayIdx = date.getDay(); // 0=Sun, 1=Mon, ...
                                const dayCodes = ['SU','MO','TU','WE','TH','FR','SA'];
                                update.recurrenceDaysOfWeek = [dayCodes[dayIdx]];
                              }
                              if (pattern === 'custom') {
                                update.recurrenceInterval = 1;
                                update.recurrenceIntervalUnit = 'days';
                              }
                              setFormData(prev => ({
                                ...prev,
                                ...update
                              }));
                            }}
                            className="border rounded px-2 py-1 bg-muted/50"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-sm">Repeat every</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              value={formData.recurrenceInterval}
                              onChange={e => setFormData(prev => ({ ...prev, recurrenceInterval: parseInt(e.target.value) || 1 }))}
                              className="w-16 border rounded px-2 py-1 bg-muted/50"
                            />
                            <select
                              value={formData.recurrenceIntervalUnit}
                              onChange={e => setFormData(prev => ({ ...prev, recurrenceIntervalUnit: e.target.value as 'days' | 'weeks' | 'months' | 'years' }))}
                              className="border rounded px-2 py-1 bg-muted/50"
                            >
                              <option value="days">days</option>
                              <option value="weeks">weeks</option>
                              <option value="months">months</option>
                              <option value="years">years</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Label className="text-sm">Pattern</Label>
                        <select
                          value={formData.recurrencePattern}
                          onChange={e => {
                            const pattern = e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
                            const update: Partial<AppointmentFormData> = { recurrencePattern: pattern };
                            if (pattern === 'weekly') {
                              // Default to the day of the week of the selected date
                              const date = formData.date ? new Date(formData.date) : new Date();
                              const dayIdx = date.getDay(); // 0=Sun, 1=Mon, ...
                              const dayCodes = ['SU','MO','TU','WE','TH','FR','SA'];
                              update.recurrenceDaysOfWeek = [dayCodes[dayIdx]];
                            }
                            if (pattern === 'custom') {
                              update.recurrenceInterval = 1;
                              update.recurrenceIntervalUnit = 'days';
                            }
                            setFormData(prev => ({
                              ...prev,
                              ...update
                            }));
                          }}
                          className="border rounded px-2 py-1 bg-muted/50"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                    )}
                    {/* Weekly: day selection */}
                    {formData.recurrencePattern === 'weekly' && (
                      <div className="col-span-2 flex flex-wrap gap-2 items-center">
                        <Label className="text-sm mr-2">On</Label>
                        {['MO','TU','WE','TH','FR','SA','SU'].map((day, idx) => (
                          <label key={day} className="flex items-center gap-1 text-xs">
                            <input
                              type="checkbox"
                              checked={formData.recurrenceDaysOfWeek?.includes(day)}
                              onChange={e => {
                                setFormData(prev => {
                                  const days = prev.recurrenceDaysOfWeek || [];
                                  return {
                                    ...prev,
                                    recurrenceDaysOfWeek: e.target.checked
                                      ? [...days, day]
                                      : days.filter(d => d !== day)
                                  };
                                });
                              }}
                              className="accent-primary"
                            />
                            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][idx]}
                          </label>
                        ))}
                      </div>
                    )}
                    {/* Monthly/yearly: info only */}
                    {formData.recurrencePattern === 'monthly' && (
                      <div className="col-span-2 text-xs text-muted-foreground">Repeats monthly on the same date.</div>
                    )}
                    {formData.recurrencePattern === 'yearly' && (
                      <div className="col-span-2 text-xs text-muted-foreground">Repeats yearly on the same date.</div>
                    )}
                    {/* Ends and summary always below */}
                    <div className="flex flex-col gap-2 mt-2">
                      <Label className="text-sm">Ends</Label>
                      <div className="flex items-center gap-2">
                        <select
                          value={formData.recurrenceEndType}
                          onChange={e => setFormData(prev => ({ ...prev, recurrenceEndType: e.target.value as 'after' | 'onDate' }))}
                          className="border rounded px-2 py-1 bg-muted/50"
                        >
                          <option value="after">After</option>
                          <option value="onDate">On date</option>
                        </select>
                        {formData.recurrenceEndType === 'after' ? (
                          <>
                            <input
                              type="number"
                              min={1}
                              value={typeof formData.recurrenceEndValue === 'number' ? formData.recurrenceEndValue : 5}
                              onChange={e => setFormData(prev => ({ ...prev, recurrenceEndValue: parseInt(e.target.value) || 1 }))}
                              className="w-16 border rounded px-2 py-1 bg-muted/50"
                            />
                            <span className="text-sm">occurrences</span>
                          </>
                        ) : (
                          <input
                            type="date"
                            value={typeof formData.recurrenceEndValue === 'string' ? formData.recurrenceEndValue : ''}
                            onChange={e => setFormData(prev => ({ ...prev, recurrenceEndValue: e.target.value }))}
                            className="border rounded px-2 py-1 bg-muted/50"
                          />
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 text-xs text-muted-foreground mt-2">
                      {(() => {
                        if (!formData.isRecurring) return '';
                        let summary = 'This appointment will repeat ';
                        switch (formData.recurrencePattern) {
                          case 'daily':
                            summary += 'daily';
                            break;
                          case 'weekly':
                            summary += 'weekly';
                            if (formData.recurrenceDaysOfWeek && formData.recurrenceDaysOfWeek.length > 0) {
                              const dayNames = formData.recurrenceDaysOfWeek.map(d =>
                                ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][['MO','TU','WE','TH','FR','SA','SU'].indexOf(d)]
                              );
                              summary += ` on ${dayNames.join(', ')}`;
                            }
                            break;
                          case 'monthly':
                            summary += 'monthly on the same date';
                            break;
                          case 'yearly':
                            summary += 'yearly on the same date';
                            break;
                          case 'custom':
                            summary += `every ${formData.recurrenceInterval} ${formData.recurrenceIntervalUnit}`;
                            break;
                        }
                        if (formData.recurrenceEndType === 'after') {
                          summary += `, ${formData.recurrenceEndValue} times.`;
                        } else if (formData.recurrenceEndType === 'onDate') {
                          summary += `, until ${formData.recurrenceEndValue}.`;
                        }
                        return summary;
                      })()}
                    </div>
                  </>
                )}
                </div>

                {/* Location & Team Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Location & Team</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Location</Label>
                      <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={locationOpen}
                            className="border-0 bg-muted/50 hover:bg-muted/70 h-12 text-base justify-between w-full"
                          >
                            {selectedLocation?.name || "Select location"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[350px] p-0 z-[80]">
                          <Command>
                            <CommandInput placeholder="Search locations..." />
                            <CommandList>
                              <CommandEmpty>No locations found.</CommandEmpty>
                              <CommandGroup>
                                {locations.map((location) => (
                                  <CommandItem
                                    key={location.id}
                                    value={location.name}
                                    onSelect={() => {
                                      setFormData((prev: any) => ({ ...prev, location: location.id }));
                                      setLocationOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        formData.location === `${location.id}` ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {location.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Team Members</Label>
                      {/* Selected Team Members */}
                      {selectedTeamMembers.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-lg">
                          {selectedTeamMembers.map((member) => (
                            <div key={member.id} className="flex items-center gap-1 bg-muted rounded-lg px-2 h-8 min-w-[0] shadow-none">
                              <Avatar className="h-6 w-6 min-w-6">
                                <AvatarFallback>{member.firstName[0]}{member.lastName[0]}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium leading-none truncate max-w-[5.5rem]">{member.firstName} {member.lastName}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    teamMembers: prev.teamMembers.filter(id => +id !== member.id)
                                  }));
                                }}
                                className="h-6 w-6 p-0 ml-1 hover:bg-destructive/20 hover:text-destructive rounded-full flex items-center justify-center"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      <Popover open={teamOpen} onOpenChange={setTeamOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={teamOpen}
                            className="border-0 bg-muted/50 hover:bg-muted/70 h-12 text-base justify-between w-full"
                          >
                            {selectedTeamMembers.length > 0 
                              ? `${selectedTeamMembers.length} member${selectedTeamMembers.length > 1 ? 's' : ''} selected`
                              : "Select team members"
                            }
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[350px] p-0 z-[80]">
                          <Command>
                            <CommandInput placeholder="Search team members..." />
                            <CommandList>
                              <CommandEmpty>No team members found.</CommandEmpty>
                              <CommandGroup>
                                {teamMembers.map((member) => (
                                  <CommandItem
                                    key={member.id}
                                    value={member.firstName + ' ' + member.lastName}
                                    onSelect={() => {
                                      const isSelected = formData.teamMembers.includes(`${member.id}`);
                                      if (isSelected) {
                                        setFormData(prev => ({ 
                                          ...prev, 
                                          teamMembers: prev.teamMembers.filter(id => +id !== member.id)
                                        }));
                                      } else {
                                        setFormData((prev) => ({
                                          ...prev, 
                                          teamMembers: [...prev.teamMembers, `${member.id}`]
                                        }));
                                      }
                                    }}
                                    className="flex items-center gap-3 p-3"
                                  >
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback>{member.firstName[0]}{member.lastName[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="font-medium">{member.firstName} {member.lastName}</div>
                                    </div>
                                    <Check
                                      className={cn(
                                        "ml-auto h-4 w-4",
                                        formData.teamMembers.includes(`${member.id}`) ? "opacity-100" : "opacity-0"
                                      )}
                                    />
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

                {/* Notes Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Additional Notes</h3>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Notes</Label>
                    <Textarea
                      placeholder="Add any special notes or requirements..."
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={4}
                      className="border-0 bg-muted/50 focus:bg-background text-base resize-none"
                    />
                  </div>
                </div>
            </CardContent>
          </Card>
        </form>
      </BaseSlider>
    </>
  );
};

export default AddAppointmentSlider;