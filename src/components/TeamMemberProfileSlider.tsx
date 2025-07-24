import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Phone, MapPin, Clock, Calendar, Settings, FileText, AlertTriangle, Edit, Trash2, Plus, X, Check, ChevronsUpDown, Power } from 'lucide-react';
import { useRouter } from 'next/router';
import AddAppointmentSlider from '@/components/Calendar/AddAppointmentSlider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { UserRole } from '@/types/auth';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: 'pending' | 'active' | 'inactive';
  createdAt: string;
  location?: string;
  services?: string[];
  workingHours?: {
    monday: { open: string; close: string; isOpen: boolean };
    tuesday: { open: string; close: string; isOpen: boolean };
    wednesday: { open: string; close: string; isOpen: boolean };
    thursday: { open: string; close: string; isOpen: boolean };
    friday: { open: string; close: string; isOpen: boolean };
    saturday: { open: string; close: string; isOpen: boolean };
    sunday: { open: string; close: string; isOpen: boolean };
  };
  accessLevel?: 'admin' | 'staff' | 'readonly';
  canReceiveNotifications?: boolean;
  canManageOwnCalendar?: boolean;
  googleCalendarSync?: boolean;
  notes?: string[];
}

interface TeamMemberProfileSliderProps {
  isOpen: boolean;
  onClose: () => void;
  teamMember: TeamMember | null;
  onUpdate: (data: Partial<TeamMember>) => void;
  onDelete: (id: string) => void;
  locations: Array<{ id: string; name: string }>;
}

const TeamMemberProfileSlider: React.FC<TeamMemberProfileSliderProps> = ({
  isOpen,
  onClose,
  teamMember,
  onUpdate,
  onDelete,
  locations
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [locationOpen, setLocationOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [localTeamMember, setLocalTeamMember] = useState<TeamMember | null>(null);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [useLocationHours, setUseLocationHours] = useState(true);
  const [locationWorkingHours, setLocationWorkingHours] = useState<typeof defaultWorkingHours | null>(null);
  const [isAddAppointmentSliderOpen, setIsAddAppointmentSliderOpen] = useState(false);
  const router = useRouter();

  // Default working hours structure
  const defaultWorkingHours = {
    monday: { open: '09:00', close: '17:00', isOpen: true },
    tuesday: { open: '09:00', close: '17:00', isOpen: true },
    wednesday: { open: '09:00', close: '17:00', isOpen: true },
    thursday: { open: '09:00', close: '17:00', isOpen: true },
    friday: { open: '09:00', close: '17:00', isOpen: true },
    saturday: { open: '10:00', close: '15:00', isOpen: true },
    sunday: { open: '10:00', close: '15:00', isOpen: false },
  };

  // Helper to capitalize day names
  const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Helper to get short day names (same as locations page)
  const shortDay = (day: string) => {
    const map: Record<string, string> = {
      monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun'
    };
    return map[day.toLowerCase()] || day;
  };

  // Working hours form component
  const renderWorkingHoursForm = (
    workingHours: typeof defaultWorkingHours, 
    updateFn: (day: keyof typeof defaultWorkingHours, field: 'open' | 'close' | 'isOpen', value: string | boolean) => void
  ) => {
    const days = [
      { key: 'monday', label: 'Monday' },
      { key: 'tuesday', label: 'Tuesday' },
      { key: 'wednesday', label: 'Wednesday' },
      { key: 'thursday', label: 'Thursday' },
      { key: 'friday', label: 'Friday' },
      { key: 'saturday', label: 'Saturday' },
      { key: 'sunday', label: 'Sunday' },
    ] as const;

    return (
      <div className="space-y-4">
        <Label className="text-base font-semibold">Working Hours</Label>
        {days.map(({ key, label }) => (
          <div key={key} className="bg-white rounded-xl shadow-xs p-4 flex flex-col gap-2 border">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-base">{capitalize(label)}</span>
              {workingHours[key].isOpen ? (
                <button
                  type="button"
                  className="px-2 py-0 rounded-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-xs font-medium"
                  onClick={() => updateFn(key, 'isOpen', false)}
                >
                  Mark as Closed
                </button>
              ) : (
                <button
                  type="button"
                  className="px-2 py-0 rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-xs font-medium"
                  onClick={() => updateFn(key, 'isOpen', true)}
                >
                  Mark as Open
                </button>
              )}
            </div>
            {workingHours[key].isOpen ? (
              <>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Opening Time</Label>
                  <Input
                    type="time"
                    value={workingHours[key].open}
                    onChange={(e) => updateFn(key, 'open', e.target.value)}
                    onClick={(e) => {
                      e.currentTarget.showPicker?.();
                    }}
                    className="h-10 text-center cursor-pointer"
                  />
                </div>
                <div className="mt-2">
                  <Label className="text-xs text-gray-500 mb-1 block">Closing Time</Label>
                  <Input
                    type="time"
                    value={workingHours[key].close}
                    onChange={(e) => updateFn(key, 'close', e.target.value)}
                    onClick={(e) => {
                      e.currentTarget.showPicker?.();
                    }}
                    className="h-10 text-center cursor-pointer"
                  />
                </div>
              </>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-400 italic text-sm mt-2">
                This team member is not available on {capitalize(label)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Sync local state with prop
  useEffect(() => {
    setLocalTeamMember(teamMember);
  }, [teamMember]);

  // Fetch location working hours when team member changes
  useEffect(() => {
    if (teamMember?.location) {
      fetchLocationWorkingHours(teamMember.location);
    }
  }, [teamMember?.location]);

  // Function to fetch location working hours
  const fetchLocationWorkingHours = async (locationName: string) => {
    try {
      // TODO: Replace with actual API call
      // Use mock location data for testing
      const mockLocationData = (window as any).mockLocationData || [];
      const location = mockLocationData.find((loc: any) => loc.name === locationName);
      if (location) {
        setLocationWorkingHours(location.workingHours);
      }
    } catch (error) {
      console.error('Failed to fetch location working hours:', error);
    }
  };

  // Available services for selection
  const availableServices = [
    'Haircut', 'Beard Trim', 'Hair Coloring', 'Styling', 'Manicure', 'Pedicure',
    'Facial Treatment', 'Massage', 'Hot Stone Massage', 'Deep Conditioning',
    'Eyebrow Shaping', 'Hair Extensions', 'Balayage', 'Highlights', 'Perm'
  ];

  // Working days
  const workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Mock upcoming appointments
  const upcomingAppointments = [
    {
      id: '1',
      date: '2024-07-22',
      time: '10:00 AM',
      service: 'Haircut',
      client: 'Emily Carter',
      status: 'Confirmed'
    },
    {
      id: '2',
      date: '2024-07-23',
      time: '1:00 PM',
      service: 'Styling',
      client: 'Robert James',
      status: 'Pending'
    },
    {
      id: '3',
      date: '2024-07-24',
      time: '3:30 PM',
      service: 'Hair Coloring',
      client: 'Sarah Wilson',
      status: 'Confirmed'
    }
  ];

  useEffect(() => {
    if (teamMember) {
      setSelectedServices(teamMember.services || []);
    }
  }, [teamMember]);

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

  const handleEditField = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value);
  };

  const handleSaveField = () => {
    if (!teamMember || !editingField) return;

    const updates: Partial<TeamMember> = {};
    (updates as any)[editingField] = editValue;

    onUpdate(updates);
    setEditingField(null);
    setEditValue('');
    toast.success('Profile updated successfully');
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleStatusToggle = () => {
    if (!teamMember) return;
    const newStatus = teamMember.status === 'active' ? 'inactive' : 'active';
    onUpdate({ status: newStatus });
    setShowStatusDialog(false);
    toast.success(`Status updated to ${newStatus}`);
  };

  const handleServicesUpdate = () => {
    onUpdate({ services: selectedServices });
    setShowServicesModal(false);
    toast.success('Services updated successfully');
  };



  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return <Badge className="bg-purple-100 text-purple-800">Admin</Badge>;
      case UserRole.OWNER:
        return <Badge className="bg-blue-100 text-blue-800">Owner</Badge>;
      case UserRole.MANAGER:
        return <Badge className="bg-orange-100 text-orange-800">Manager</Badge>;
      case UserRole.TEAM_MEMBER:
        return <Badge className="bg-gray-100 text-gray-800">Team Member</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  if (!teamMember) return null;

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
        className={`fixed top-0 left-0 h-full w-full bg-background shadow-2xl z-70 transition-transform duration-300 ease-out ${
          isOpen && shouldAnimate ? 'translate-x-0' : 'translate-x-full'
        }`}
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
            <h2 className="text-lg font-semibold text-foreground absolute left-1/2 transform -translate-x-1/2">
              {teamMember.firstName} {teamMember.lastName} Profile
            </h2>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-muted/50">
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* Section 1: Profile Summary */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Avatar with verification badge */}
                    <div className="relative">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src="" />
                        <AvatarFallback className="text-lg font-semibold">
                          {teamMember.firstName[0]}{teamMember.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    
                    {/* Name and Role */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-foreground">
                            {teamMember.firstName} {teamMember.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {teamMember.role}
                          </p>
                        </div>
                        {getStatusBadge(teamMember.status)}
                      </div>
                      

                    </div>
                  </div>
                  
                  {/* Contact Info - Aligned to the left */}
                  <div className="space-y-3 mt-4">
                    {isEditingContact ? (
                      <>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <Input
                            value={localTeamMember?.email || ''}
                            onChange={(e) => setLocalTeamMember(prev => prev ? { ...prev, email: e.target.value } : null)}
                            className="h-7 text-sm border-0 bg-transparent focus:ring-0 focus:ring-offset-0 px-0"
                            placeholder="Enter email"
                            autoFocus
                          />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <Input
                            value={localTeamMember?.phone || ''}
                            onChange={(e) => setLocalTeamMember(prev => prev ? { ...prev, phone: e.target.value } : null)}
                            className="h-7 text-sm border-0 bg-transparent focus:ring-0 focus:ring-offset-0 px-0"
                            placeholder="Enter phone"
                          />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={locationOpen}
                                className="flex-1 border-0 bg-transparent hover:bg-gray-50 h-8 text-sm justify-between px-0"
                              >
                                {localTeamMember?.location || "No location assigned"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0 z-[80]">
                              <Command>
                                <CommandInput placeholder="Search locations..." />
                                <CommandList>
                                  <CommandEmpty>No locations found.</CommandEmpty>
                                  <CommandGroup>
                                    <CommandItem
                                      value="none"
                                      onSelect={() => {
                                        setLocalTeamMember(prev => prev ? { ...prev, location: undefined } : null);
                                        setLocationOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          !localTeamMember?.location ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      No location assigned
                                    </CommandItem>
                                    {locations.map((location) => (
                                      <CommandItem
                                        key={location.id}
                                        value={location.name}
                                        onSelect={() => {
                                          setLocalTeamMember(prev => prev ? { ...prev, location: location.name } : null);
                                          setLocationOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            localTeamMember?.location === location.name ? "opacity-100" : "opacity-0"
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
                        <div className="flex gap-2 mt-2">
                          <Button 
                            size="sm" 
                            onClick={() => setIsEditingContact(false)}
                            className="h-7 px-3 text-xs"
                          >
                            Done
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setLocalTeamMember(teamMember);
                              setIsEditingContact(false);
                            }}
                            className="h-7 px-3 text-xs"
                          >
                            Cancel
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span className="flex-1">{localTeamMember?.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span className="flex-1">{localTeamMember?.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span className="flex-1">{localTeamMember?.location || 'Not assigned'}</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setIsEditingContact(true)}
                          className="h-7 px-3 text-xs font-medium bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
                        >
                          Edit Contact Info
                        </Button>
                      </>
                    )}
                    
                    {/* Status Change Button */}
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowStatusDialog(true)}
                        className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <Power className="h-4 w-4 mr-2" />
                        Change to {teamMember.status === 'active' ? 'Inactive' : 'Active'}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {teamMember.services?.length || 0}
                      </div>
                      <div className="text-xs text-gray-500">Services</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {teamMember.status === 'active' ? 'Active' : 'Inactive'}
                      </div>
                      <div className="text-xs text-gray-500">Status</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {new Date(teamMember.createdAt).getFullYear()}
                      </div>
                      <div className="text-xs text-gray-500">Joined</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section 2: Appointments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Quick view of their upcoming bookings.
                  </p>
                  
                  <div className="space-y-2">
                    {upcomingAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between py-2 border-b">
                        <div>
                          <div className="font-medium">
                            {appointment.date} @ {appointment.time} – {appointment.service}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {appointment.client} – Status: {appointment.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1 h-10 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center justify-center"
                      onClick={() => router.push('/calendar')}
                    >
                      <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>View Calendar</span>
                    </Button>
                    <Button 
                      variant="default"
                      className="flex-1 h-10 bg-black text-white hover:bg-gray-800 transition-all duration-200 flex items-center justify-center"
                      onClick={() => setIsAddAppointmentSliderOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>Add</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Section 3: Services */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Services Offered
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    These are the services this team member is assigned to. Used when clients book with them.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-foreground">Assigned Services:</div>
                    
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {localTeamMember?.services?.map((service) => (
                          <div 
                            key={service} 
                            className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 cursor-pointer hover:bg-blue-100 transition-colors"
                            onClick={() => {
                              setLocalTeamMember(prev => prev ? {
                                ...prev,
                                services: prev.services?.filter(s => s !== service) || []
                              } : null);
                            }}
                          >
                            <span className="text-sm text-blue-800">{service}</span>
                            <div className="ml-0.5 text-blue-600">
                              <X className="h-3.5 w-3.5" />
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <Popover open={servicesOpen} onOpenChange={setServicesOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-sm border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Service
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 z-[80]">
                          <Command>
                            <CommandInput placeholder="Search services..." />
                            <CommandList>
                              <CommandEmpty>No services found.</CommandEmpty>
                              <CommandGroup>
                                {availableServices
                                  .filter(service => !localTeamMember?.services?.includes(service))
                                  .map((service) => (
                                    <CommandItem
                                      key={service}
                                      value={service}
                                      onSelect={() => {
                                        setLocalTeamMember(prev => prev ? {
                                          ...prev,
                                          services: [...(prev.services || []), service]
                                        } : null);
                                        setServicesOpen(false);
                                      }}
                                    >
                                      <Plus className="mr-2 h-4 w-4" />
                                      {service}
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      Tip: Click ✕ to unassign, or use Add to assign new ones.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Section 4: Working Hours */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Weekly Availability
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Customize this team member's weekly schedule.
                  </p>
                  
                  {/* Question for Location vs Custom Hours */}
                  {teamMember?.location ? (
                    locationWorkingHours ? (
                      <div className="p-4 bg-muted/30 rounded-lg border">
                        <div className="flex items-center gap-3 mb-3">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">Working Hours</div>
                            <div className="text-xs text-muted-foreground">
                              {useLocationHours 
                                ? `Using ${teamMember.location} hours` 
                                : 'Using custom hours'
                              }
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="text-sm font-medium text-foreground">
                            Would you like to use the same working hours as the location?
                          </div>
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => {
                                setUseLocationHours(true);
                                if (locationWorkingHours) {
                                  setLocalTeamMember(prev => prev ? {
                                    ...prev,
                                    workingHours: locationWorkingHours
                                  } : null);
                                }
                              }}
                              className={`w-16 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                useLocationHours
                                  ? 'bg-primary text-primary-foreground shadow-sm'
                                  : 'bg-white border border-input text-muted-foreground hover:bg-muted/50'
                              }`}
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => {
                                setUseLocationHours(false);
                                setLocalTeamMember(prev => prev ? {
                                  ...prev,
                                  workingHours: prev.workingHours || defaultWorkingHours
                                } : null);
                              }}
                              className={`w-16 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                !useLocationHours
                                  ? 'bg-primary text-primary-foreground shadow-sm'
                                  : 'bg-white border border-input text-muted-foreground hover:bg-muted/50'
                              }`}
                            >
                              No
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <div className="text-sm text-yellow-800">
                          Location "{teamMember.location}" working hours not found. Using custom hours.
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <div className="text-sm text-blue-800">
                        No location assigned. Using custom working hours.
                      </div>
                    </div>
                  )}
                  
                  {/* Show location working hours in read-only format when "Yes" is selected */}
                  {useLocationHours && locationWorkingHours ? (
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Working Hours</Label>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">
                            Using {teamMember.location} working hours
                          </span>
                        </div>
                        <p className="text-xs text-blue-700">
                          These hours are inherited from the location and cannot be modified here.
                        </p>
                      </div>
                      
                      {/* EXACT same styling as locations page */}
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex flex-col gap-2">
                          {Object.entries(locationWorkingHours).map(([day, { open, close, isOpen }]) => (
                            <div
                              key={day}
                              className="flex justify-between items-center bg-white rounded-lg px-4 py-2"
                            >
                              <span>{shortDay(day)}</span>
                              {isOpen ? (
                                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-mono font-semibold">
                                  {open} - {close}
                                </span>
                              ) : (
                                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">Closed</span>
                              )}
                            </div>
                          ))}
                        </div>
                        <hr className="my-1 border-gray-200 mt-3" />
                        {/* Summary row */}
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                          <span>Open: {Object.values(locationWorkingHours).filter(d => d.isOpen).length} days</span>
                          <span>Closed: {Object.values(locationWorkingHours).filter(d => !d.isOpen).length} days</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Show editable working hours when "No" is selected */
                    renderWorkingHoursForm(
                      localTeamMember?.workingHours || defaultWorkingHours,
                      (day, field, value) => {
                        // Update custom hours
                        setLocalTeamMember(prev => prev ? {
                          ...prev,
                          workingHours: {
                            ...defaultWorkingHours,
                            ...prev.workingHours,
                            [day]: {
                              ...defaultWorkingHours[day],
                              ...prev.workingHours?.[day],
                              [field]: value
                            }
                          }
                        } : null);
                      }
                    )
                  )}
                </CardContent>
              </Card>

              {/* Section 5: Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Preferences & Access
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <div className="flex items-center gap-2">
                        {getRoleBadge(teamMember.role)}
                        <Popover open={roleOpen} onOpenChange={setRoleOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm">Change Role</Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[200px] p-0">
                            <Command>
                              <CommandInput placeholder="Search roles..." />
                              <CommandList>
                                <CommandEmpty>No roles found.</CommandEmpty>
                                <CommandGroup>
                                  {Object.values(UserRole).map((role) => (
                                    <CommandItem
                                      key={role}
                                      onSelect={() => {
                                        onUpdate({ role });
                                        setRoleOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          teamMember.role === role ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {role}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Access Level</Label>
                      <Select 
                        value={teamMember.accessLevel || 'staff'} 
                        onValueChange={(value) => onUpdate({ accessLevel: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="readonly">Read-only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Can receive notifications?</Label>
                      <Switch 
                        checked={teamMember.canReceiveNotifications ?? true}
                        onCheckedChange={(checked) => onUpdate({ canReceiveNotifications: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Can manage own calendar?</Label>
                      <Switch 
                        checked={teamMember.canManageOwnCalendar ?? true}
                        onCheckedChange={(checked) => onUpdate({ canManageOwnCalendar: checked })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Google Calendar Sync</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {teamMember.googleCalendarSync ? 'Connected' : 'Not Connected'}
                      </span>
                      <Button variant="outline" size="sm">
                        {teamMember.googleCalendarSync ? 'Disconnect' : 'Connect'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>



              {/* Danger Zone */}
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-5 w-5" />
                    Remove This Team Member
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-red-700">
                    These actions cannot be undone. Please be certain.
                  </p>
                  
                  <div className="flex flex-col gap-3">
                    <Button 
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      className="w-full"
                    >
                      Delete Account Permanently
                    </Button>
                    <Button 
                      variant="outline"
                      className="text-red-600 hover:text-red-700 w-full"
                      onClick={() => setShowDeactivateDialog(true)}
                    >
                      Deactivate Instead
                    </Button>
                  </div>
                </CardContent>
              </Card>

            </div>
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
                onClick={() => {
                  if (localTeamMember && teamMember) {
                    // Check for any changes in contact info and services
                    const hasLocationChange = localTeamMember.location !== teamMember.location;
                    const hasEmailChange = localTeamMember.email !== teamMember.email;
                    const hasPhoneChange = localTeamMember.phone !== teamMember.phone;
                    const hasServicesChange = JSON.stringify(localTeamMember.services) !== JSON.stringify(teamMember.services);
                    const hasWorkingHoursChange = JSON.stringify(localTeamMember.workingHours) !== JSON.stringify(teamMember.workingHours);
                    
                    if (hasLocationChange || hasEmailChange || hasPhoneChange || hasServicesChange || hasWorkingHoursChange) {
                      const updates: Partial<TeamMember> = {};
                      if (hasLocationChange) updates.location = localTeamMember.location;
                      if (hasEmailChange) updates.email = localTeamMember.email;
                      if (hasPhoneChange) updates.phone = localTeamMember.phone;
                      if (hasServicesChange) updates.services = localTeamMember.services;
                      if (hasWorkingHoursChange) updates.workingHours = localTeamMember.workingHours;
                      onUpdate(updates);
                    }
                  }
                  toast.success('Team member updated successfully');
                  onClose();
                }}
                className="flex-1"
              >
                Update Member
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Services Modal */}
      <Dialog open={showServicesModal} onOpenChange={setShowServicesModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Services</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-60 overflow-y-auto space-y-2">
              {availableServices.map((service) => (
                <div key={service} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={service}
                    checked={selectedServices.includes(service)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedServices([...selectedServices, service]);
                      } else {
                        setSelectedServices(selectedServices.filter(s => s !== service));
                      }
                    }}
                  />
                  <Label htmlFor={service}>{service}</Label>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleServicesUpdate}>Save Changes</Button>
              <Button variant="outline" onClick={() => setShowServicesModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>



      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Account Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the status of this account to {teamMember.status === 'active' ? 'inactive' : 'active'}? Your customers will no longer see this team member.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleStatusToggle}
              className={teamMember.status === 'active' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}
            >
              Change Status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account Permanently</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete {teamMember.firstName} {teamMember.lastName}'s account? This action will remove the account and everything associated with it from the system. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                onDelete(teamMember.id);
                setShowDeleteDialog(false);
                onClose();
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate {teamMember.firstName} {teamMember.lastName}'s account? The team member will not be visible to customers and will not be able to log into their account while deactivated. The account can be reactivated at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                handleStatusToggle();
                setShowDeactivateDialog(false);
              }}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Deactivate Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Appointment Slider */}
      <AddAppointmentSlider 
        isOpen={isAddAppointmentSliderOpen}
        onClose={() => setIsAddAppointmentSliderOpen(false)}
      />
    </>
  );
};

export default TeamMemberProfileSlider; 