import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Clock, Calendar, Settings, Plus, X, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AddAppointmentSlider from '../../../features/calendar/components/AddAppointmentSlider';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { Badge } from '../../../shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../../shared/components/ui/avatar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../../shared/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../../../shared/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../shared/components/ui/alert-dialog';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import { toast } from 'sonner';
import type { TeamMember } from '../../../shared/types/team-member';
import { deleteTeamMemberAction } from '../actions';
import { selectIsDeleting } from '../selectors';

interface TeamMemberProfileSliderProps {
  isOpen: boolean;
  onClose: () => void;
  teamMember: TeamMember;
  onUpdate: (data: Partial<TeamMember>) => void;
  onDelete: (id: string | number) => void;
  locations: Array<{ id: string; name: string }>;
}

const TeamMemberProfileSlider: React.FC<TeamMemberProfileSliderProps> = ({
  isOpen,
  onClose,
  teamMember,
  onUpdate,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isDeleting = useSelector(selectIsDeleting) as boolean;
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [localTeamMember, setLocalTeamMember] = useState<TeamMember | null>(null);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [useLocationHours, setUseLocationHours] = useState(true);
  const [locationWorkingHours, setLocationWorkingHours] = useState<typeof defaultWorkingHours | null>(null);
  const [isAddAppointmentSliderOpen, setIsAddAppointmentSliderOpen] = useState(false);

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

  // Helper to get short day names
  const shortDay = (day: string) => {
    const map: Record<string, string> = {
      monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun'
    };
    return map[day.toLowerCase()] || day;
  };

  // Update local state when teamMember changes
  useEffect(() => {
    if (teamMember) {
      setLocalTeamMember({ ...teamMember });
    }
  }, [teamMember]);

  // Fetch location working hours when team member changes
  useEffect(() => {
    if (teamMember?.location) {
      fetchLocationWorkingHours(`${teamMember.location}`);
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

  // Helper functions
  const getStatusBadge = (status: string) => {
    const badgeClasses = status === 'active' 
      ? 'bg-green-100 text-green-800 hover:bg-green-100' 
      : 'bg-red-100 text-red-800 hover:bg-red-100';
    return (
      <Badge className={badgeClasses}>
        {status === 'active' ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  const handleStatusToggle = () => {
    if (!teamMember) return;
    const newStatus = teamMember.status === 'active' ? 'inactive' : 'active';
    onUpdate({ status: newStatus });
  };

  // Mock data
  const upcomingAppointments = [
    {
      id: 1,
      date: 'Dec 15, 2024',
      time: '10:00 AM',
      service: 'Haircut',
      client: 'John Doe',
      status: 'confirmed'
    }
  ];

  const availableServices = [
    'Haircut',
    'Hair Coloring',
    'Beard Trim',
    'Hair Styling',
    'Shampoo & Conditioning'
  ];

  if (!teamMember) return null;

  return (
    <>
      <BaseSlider
        isOpen={isOpen}
        onClose={onClose}
        title={`${teamMember.firstName} ${teamMember.lastName} Profile`}
        contentClassName="bg-muted/50"
        footer={
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
                  // Check for any changes
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
        }
      >
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
              
              {/* Contact Info */}
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
                  onClick={() => navigate('/calendar')}
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
                These are the services this team member is assigned to.
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
                              .filter(service => !localTeamMember?.services?.includes(+service))
                              .map((service) => (
                                <CommandItem
                                  key={service}
                                  value={service}
                                  onSelect={() => {
                                    // TODO
                                    // setLocalTeamMember((prev) => prev ? {
                                    //   ...prev,
                                    //   services: [...(prev.services || []), service]
                                    // } : null);
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
                {`Customize this team member's weekly schedule.`}
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
                      {`Location "${teamMember.location}" working hours not found. Using custom hours.`}
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
                This action will remove the team member from your organisation and they will no longer be able to access your business.
              </p>
              
              <div className="flex flex-col gap-3">
                <Button 
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="w-full"
                  disabled={isDeleting as boolean}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    'Remove from organisation'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          
        </div>
      </BaseSlider>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Account Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the status of this account to
              {teamMember.status === 'active' ? 'inactive' : 'active'} ? Your customers will no longer see this team member.
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
            <AlertDialogTitle>Remove Account</AlertDialogTitle>
            <AlertDialogDescription>
              {`Are you sure you want to remove {teamMember.firstName} {teamMember.lastName}'s account? This action will remove the account and everything associated with it from the system. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting as boolean}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                dispatch(deleteTeamMemberAction.request({ id: teamMember.id }));
                setShowDeleteDialog(false);
                onClose();
              }}
              disabled={isDeleting as boolean}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove Account'
              )}
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