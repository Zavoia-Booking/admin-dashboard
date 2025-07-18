import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, User, MapPin, Scissors, Ban, CalendarCheck, CheckCircle2, UserX, Bell, Mail, MessageSquare, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { toast } from 'sonner';

interface Appointment {
  id: number;
  client: { name: string; initials: string; avatar: string };
  service: string;
  time: string;
  date: Date;
  status: string;
  location: string;
  teamMembers: string[];
}

interface EditAppointmentSliderProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

const EditAppointmentSlider: React.FC<EditAppointmentSliderProps> = ({ isOpen, onClose, appointment }) => {
  const [formData, setFormData] = useState({
    clientId: '',
    service: '',
    date: '',
    time: '',
    location: '',
    teamMembers: [] as string[],
    notes: ''
  });

  // UI state
  const [clientOpen, setClientOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [hourOpen, setHourOpen] = useState(false);
  const [minuteOpen, setMinuteOpen] = useState(false);
  
  // Quick action states
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [notificationMethod, setNotificationMethod] = useState<'email' | 'sms' | 'both'>('both');
  const [reminderMessage, setReminderMessage] = useState('');
  const [confirmationDialog, setConfirmationDialog] = useState<{
    open: boolean;
    type: 'cancel' | 'complete' | 'no-show' | 'reminder' | null;
    title: string;
    description: string;
  }>({ open: false, type: null, title: '', description: '' });

  // Swipe gesture handling
  const touchStartX = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const isMouseDown = useRef<boolean>(false);

  // Populate form with appointment data when opened
  useEffect(() => {
    if (appointment && isOpen) {
      // Find matching client
      const matchingClient = mockClients.find(client => 
        `${client.firstName} ${client.lastName}` === appointment.client.name
      );
      
      setFormData({
        clientId: matchingClient?.id || '',
        service: appointment.service,
        date: appointment.date.toISOString().split('T')[0],
        time: convertTo24Hour(appointment.time),
        location: appointment.location,
        teamMembers: appointment.teamMembers,
        notes: ''
      });
    }
  }, [appointment, isOpen]);

  // Handle animation timing
  useEffect(() => {
    if (isOpen) {
      // Ensure component is in closed state first, then animate
      setShouldAnimate(false);
      const timer = setTimeout(() => setShouldAnimate(true), 10);
      return () => clearTimeout(timer);
    } else {
      setShouldAnimate(false);
    }
  }, [isOpen]);

  const handleStart = (clientX: number) => {
    touchStartX.current = clientX;
    touchCurrentX.current = clientX;
    setIsDragging(true);
    isMouseDown.current = true;
  };

  const handleMove = (clientX: number) => {
    if (!isDragging && !isMouseDown.current) return;
    
    touchCurrentX.current = clientX;
    const diff = touchCurrentX.current - touchStartX.current;
    
    // Only allow rightward swipes (positive diff)
    if (diff > 0) {
      setDragOffset(Math.min(diff, 300)); // Cap at 300px
    }
  };

  const handleEnd = () => {
    if (!isDragging && !isMouseDown.current) return;
    
    const diff = touchCurrentX.current - touchStartX.current;
    
    // If swiped more than 100px to the right, close the slider
    if (diff > 100) {
      onClose();
    }
    
    // Reset drag state
    setIsDragging(false);
    setDragOffset(0);
    isMouseDown.current = false;
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.tagName === 'TEXTAREA' || target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('[role="button"]')) {
      return;
    }
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleEnd();
  };

  // Mouse events for desktop testing
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.tagName === 'TEXTAREA' || target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('[role="button"]')) {
      return;
    }
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleEnd();
  };

  // Mock data
  const mockClients = [
    { 
      id: '1', 
      firstName: 'Amelia', 
      lastName: 'White', 
      email: 'amelia.white@email.com', 
      phone: '+1 (555) 123-4567',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b388?w=150'
    },
    { 
      id: '2', 
      firstName: 'Michael', 
      lastName: 'Johnson', 
      email: 'michael.johnson@email.com', 
      phone: '+1 (555) 987-6543',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    },
    { 
      id: '3', 
      firstName: 'Oliver', 
      lastName: 'Thompson', 
      email: 'oliver.thompson@email.com', 
      phone: '+1 (555) 456-7890',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
    },
    { 
      id: '4', 
      firstName: 'Emma', 
      lastName: 'Davis', 
      email: 'emma.davis@email.com', 
      phone: '+1 (555) 234-5678',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'
    }
  ];

  const mockLocations = [
    { id: 'downtown', name: 'Downtown Studio' },
    { id: 'uptown', name: 'Uptown Salon' },
    { id: 'westside', name: 'Westside Branch' }
  ];

  const mockTeamMembers = [
    { 
      id: 'sarah', 
      name: 'Sarah Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b388?w=150'
    },
    { 
      id: 'mike', 
      name: 'Mike Davis',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    },
    { 
      id: 'jessica', 
      name: 'Jessica Chen',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'
    },
    { 
      id: 'alex', 
      name: 'Alex Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
    }
  ];

  const services = [
    'Haircut & Style',
    'Hair Wash & Blow Dry',
    'Hair Color',
    'Hair Highlights',
    'Deep Conditioning',
    'Beard Trim & Style',
    'Hair & Beard Cut',
    'Wedding Hair Style',
    'Scissor Cut',
    'Hair Color Treatment',
    'Keratin Treatment',
    'Classic Haircut',
    'Balayage Highlights',
    'Beard Grooming',
    'Hair Extensions',
    'Mustache Trim'
  ];

  // Helper functions
  const selectedClient = mockClients.find(client => client.id === formData.clientId);
  const selectedLocation = mockLocations.find(location => location.id === formData.location);
  const selectedTeamMembers = mockTeamMembers.filter(member => formData.teamMembers.includes(member.id));

  // Quick action handlers
  const handleQuickAction = (type: 'cancel' | 'complete' | 'no-show' | 'reminder') => {
    if (type === 'cancel') {
      setShowCancelForm(!showCancelForm);
      return;
    }

    const confirmationData = {
      complete: {
        title: 'Mark as Complete',
        description: 'Mark this appointment as completed? This will update the appointment status.'
      },
      'no-show': {
        title: 'Mark as No-Show',
        description: 'Mark this appointment as no-show? The will update the appointment status.'
      },
      reminder: {
        title: 'Send Reminder',
        description: 'Send a reminder to the client about their upcoming appointment?'
      }
    };

    setConfirmationDialog({
      open: true,
      type,
      title: confirmationData[type].title,
      description: confirmationData[type].description
    });
  };

  const handleReschedule = () => {
    // Focus on the date input to open date picker
    const dateInput = document.getElementById('date') as HTMLInputElement;
    if (dateInput) {
      dateInput.focus();
      dateInput.showPicker?.();
    }
  };

  const executeAction = () => {
    if (!confirmationDialog.type) return;

    switch (confirmationDialog.type) {
      case 'cancel':
        console.log('Cancelling appointment with reason:', cancelReason, 'Notify customer:', notifyCustomer, 'Method:', notificationMethod);
        setShowCancelForm(false);
        setCancelReason('');
        setNotifyCustomer(true);
        setNotificationMethod('both');
        onClose();
        break;
      case 'complete':
        console.log('Marking appointment as completed');
        onClose();
        break;
      case 'no-show':
        console.log('Marking appointment as no-show');
        onClose();
        break;
      case 'reminder':
        console.log('Sending reminder to client');
        break;
    }
    
    setConfirmationDialog({ open: false, type: null, title: '', description: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Updated appointment:', formData);
    onClose();
  };

  if (!appointment) return null;

  const hour = formData.time ? formData.time.split(':')[0] : '00';
  const minute = formData.time ? formData.time.split(':')[1] : '00';

  // Helper function to convert 12-hour time to 24-hour format
  function convertTo24Hour(time12h: string): string {
    if (!time12h) return '00:00';
    const match = time12h.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return time12h;
    let [_, h, m, period] = match;
    let hour = parseInt(h, 10);
    if (period) {
      period = period.toUpperCase();
      if (period === 'AM' && hour === 12) hour = 0;
      if (period === 'PM' && hour !== 12) hour += 12;
    }
    return `${String(hour).padStart(2, '0')}:${m}`;
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-60 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Sliding Panel */}
      <div 
        className={`fixed top-0 left-0 h-full w-full bg-background shadow-2xl z-70 ${
          !isDragging ? 'transition-transform duration-300 ease-out' : ''
        } ${isOpen && shouldAnimate ? 'translate-x-0' : 'translate-x-full'}`}
        style={{
          transform: isDragging 
            ? `translateX(${dragOffset}px)` 
            : undefined
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center p-2 border-b bg-card/50 relative">
            <div className="bg-muted rounded-full p-1.5 shadow-sm">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onClose}
                className="rounded-full hover:bg-muted-foreground/10"
                style={{ height: '2rem', width: '2rem', minHeight: '2rem', minWidth: '2rem' }}
              >
                <ArrowLeft className="h-3 w-3" />
              </Button>
            </div>
            <h2 className="text-lg font-semibold text-foreground absolute left-1/2 transform -translate-x-1/2">Edit Appointment</h2>
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-3 border-b bg-background/50">
            <div className="grid grid-cols-3 gap-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('cancel')}
                className="flex items-center gap-1 text-xs border-destructive/20 text-destructive hover:bg-destructive/10"
              >
                <Ban className="h-3 w-3" />
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('complete')}
                className="flex items-center gap-1 text-xs border-green-500/20 text-green-600 hover:bg-green-50"
              >
                <CheckCircle2 className="h-3 w-3" />
                Complete
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('no-show')}
                className="flex items-center gap-1 text-xs border-orange-500/20 text-orange-600 hover:bg-orange-50"
              >
                <UserX className="h-3 w-3" />
                No-Show
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('reminder')}
                className="flex items-center gap-1 text-xs"
              >
                <Bell className="h-3 w-3" />
                Reminder
              </Button>
            </div>

            {/* Cancel Form */}
            {showCancelForm && (
              <Card className="bg-card/80 border-destructive/20">
                  <CardContent className="px-4 space-y-4">
                    <div>
                      <Label htmlFor="cancelReason" className="text-base font-medium">Reason for cancellation</Label>
                      <Textarea
                        id="cancelReason"
                        placeholder="Enter reason for cancelling this appointment..."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="min-h-[80px] resize-none"
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="notify-customer"
                            checked={notifyCustomer}
                            onCheckedChange={setNotifyCustomer}
                            className={`!h-5 !w-9 !min-h-0 !min-w-0`}
                          />
                          <Label htmlFor="notify-customer" className="text-sm font-medium">Notify customer</Label>
                        </div>
                      </div>
                      
                      {notifyCustomer && (
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Notification method</Label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setNotificationMethod('email')}
                              className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors",
                                notificationMethod === 'email'
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background border-border hover:bg-muted"
                              )}
                            >
                              <Mail className="h-3 w-3" />
                              Email
                            </button>
                            <button
                              type="button"
                              onClick={() => setNotificationMethod('sms')}
                              className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors",
                                notificationMethod === 'sms'
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background border-border hover:bg-muted"
                              )}
                            >
                              <MessageSquare className="h-3 w-3" />
                              SMS
                            </button>
                            <button
                              type="button"
                              onClick={() => setNotificationMethod('both')}
                              className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors",
                                notificationMethod === 'both'
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background border-border hover:bg-muted"
                              )}
                            >
                              <div className="flex gap-0.5">
                                <Mail className="h-2.5 w-2.5" />
                                <MessageSquare className="h-2.5 w-2.5" />
                              </div>
                              Both
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 justify-center mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowCancelForm(false);
                          setCancelReason('');
                          setNotifyCustomer(true);
                          setNotificationMethod('both');
                        }}
                      >
                        Close
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setConfirmationDialog({
                            open: true,
                            type: 'cancel',
                            title: 'Cancel Appointment',
                            description: `Are you sure you want to cancel this appointment?${cancelReason ? `\n\nReason: ${cancelReason}` : ''}${notifyCustomer ? `\n\nNotification: ${notificationMethod}` : '\n\nNo notification will be sent'}`
                          });
                        }}
                        className="bg-destructive text-white hover:bg-destructive/90"
                      >
                        Cancel Appointment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
            )}
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-muted/50 scrollbar-hide">
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
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
                                  {mockClients.map((client) => (
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
                      <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={selectedClient.avatar} />
                          <AvatarFallback>{selectedClient.firstName[0]}{selectedClient.lastName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-semibold text-base">{selectedClient.firstName} {selectedClient.lastName}</div>
                          <div className="text-sm text-muted-foreground">{selectedClient.email}</div>
                          <div className="text-sm text-muted-foreground">{selectedClient.phone}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, clientId: '' }))}
                          className="text-muted-foreground hover:text-foreground"
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
                          <span className="text-muted-foreground font-medium">:</span>
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

                  {/* Location Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">Location</h3>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Select Location</Label>
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
                                  {mockLocations.map((location) => (
                                    <CommandItem
                                      key={location.id}
                                      value={location.name}
                                      onSelect={() => {
                                        setFormData(prev => ({ ...prev, location: location.id }));
                                        setLocationOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          formData.location === location.id ? "opacity-100" : "opacity-0"
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
                  </div>

                  {/* Team Members Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">Team Members</h3>
                    </div>
                    
                    {selectedTeamMembers.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-lg">
                        {selectedTeamMembers.map((member) => (
                          <div key={member.id} className="flex items-center gap-1 bg-muted rounded-lg px-2 h-8 min-w-[0] shadow-none">
                            <Avatar className="h-6 w-6 min-w-6">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback className="text-xs">{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium leading-none truncate max-w-[5.5rem]">{member.name.split(' ')[0]}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  teamMembers: prev.teamMembers.filter(id => id !== member.id)
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
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Team Members</Label>
                      <Popover open={teamOpen} onOpenChange={setTeamOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={teamOpen}
                            className="border-0 bg-muted/50 hover:bg-muted/70 h-12 text-base justify-between w-full"
                          >
                            {selectedTeamMembers.length === 0 
                              ? "Select team members" 
                              : `${selectedTeamMembers.length} member${selectedTeamMembers.length > 1 ? 's' : ''} selected`
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
                                {mockTeamMembers.map((member) => (
                                  <CommandItem
                                    key={member.id}
                                    value={member.name}
                                    onSelect={() => {
                                      const isSelected = formData.teamMembers.includes(member.id);
                                      setFormData(prev => ({
                                        ...prev,
                                        teamMembers: isSelected
                                          ? prev.teamMembers.filter(id => id !== member.id)
                                          : [...prev.teamMembers, member.id]
                                      }));
                                    }}
                                    className="flex items-center gap-3 p-3"
                                  >
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={member.avatar} />
                                      <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="font-medium">{member.name}</div>
                                    </div>
                                    <Check
                                      className={cn(
                                        "ml-auto h-4 w-4",
                                        formData.teamMembers.includes(member.id) ? "opacity-100" : "opacity-0"
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

                  {/* Notes Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">Additional Notes</h3>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-sm font-medium text-foreground">Notes (optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Add any special instructions or notes..."
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        className="border-0 bg-muted/50 focus:bg-background min-h-[100px] text-base resize-none"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t bg-card/50">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                className="flex-1"
              >
                Update Appointment
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmationDialog.open} onOpenChange={(open) => 
        setConfirmationDialog(prev => ({ ...prev, open }))
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmationDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmationDialog.type === 'reminder' ? (
                <div className="space-y-4">
                  <p>{confirmationDialog.description}</p>
                  <div className="flex flex-col gap-3 p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm font-medium">Send reminder via:</p>
                    <div className="flex gap-2">
                      <Button
                        variant={notificationMethod === 'email' ? 'default' : 'outline'}
                        size="sm"
                        className={notificationMethod === 'email' ? 'bg-primary text-primary-foreground' : ''}
                        onClick={() => setNotificationMethod('email')}
                      >
                        <Mail className="h-4 w-4 mr-1" /> Email
                      </Button>
                      <Button
                        variant={notificationMethod === 'sms' ? 'default' : 'outline'}
                        size="sm"
                        className={notificationMethod === 'sms' ? 'bg-primary text-primary-foreground' : ''}
                        onClick={() => setNotificationMethod('sms')}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" /> SMS
                      </Button>
                      <Button
                        variant={notificationMethod === 'both' ? 'default' : 'outline'}
                        size="sm"
                        className={notificationMethod === 'both' ? 'bg-primary text-primary-foreground' : ''}
                        onClick={() => setNotificationMethod('both')}
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        <MessageSquare className="h-4 w-4 mr-1" /> Both
                      </Button>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="reminderMessage" className="text-sm font-medium">Optional message</Label>
                      <Textarea
                        id="reminderMessage"
                        placeholder="Add a custom message to include with the reminder..."
                        value={reminderMessage}
                        onChange={e => setReminderMessage(e.target.value)}
                        className="min-h-[60px] mt-1"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                confirmationDialog.description
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (confirmationDialog.type === 'reminder') {
                  // Use notificationMethod and reminderMessage here
                  console.log('Sending reminder:', { notificationMethod, reminderMessage });
                  toast.success('Reminder sent successfully!');
                  onClose();
                  return;
                }
                executeAction();
              }}
              className={confirmationDialog.type === 'cancel' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {confirmationDialog.type === 'cancel' && !showCancelForm ? 'Continue' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditAppointmentSlider;