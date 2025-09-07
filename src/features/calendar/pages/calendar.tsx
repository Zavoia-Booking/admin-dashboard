import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clipboard, Calendar as CalendarIcon, Filter, X, CalendarDays, List, MapPin, Users } from 'lucide-react';
import AddAppointmentSlider from '../components/AddAppointmentSlider';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../../shared/components/ui/avatar';
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import { FilterPanel } from '../../../shared/components/common/FilterPanel';
import { mockAppointments, mockClients } from '../../../mocks/calendar.mock';
import { mockLocations } from '../../../mocks/locations.mock';
import { mockTeamMembers } from '../../../mocks/team-members.mock';
import EditAppointmentSlider from '../components/EditAppointmentSlider';
import DatePicker from '../../../shared/components/ui/date-picker';
import BusinessSetupGate from '../../../shared/components/guards/BusinessSetupGate';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [viewType, setViewType] = useState<'list' | 'grid'>('list'); // Add view type toggle
  const [viewKey, setViewKey] = useState(0); // Add key to force re-render
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);
    return startOfWeek;
  });
  const [showFilters, setShowFilters] = useState(false);

  // Main filter state (used for filtering appointments)
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedTeamMember, setSelectedTeamMember] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [clientNameFilter, setClientNameFilter] = useState<string>('');
  const [clientEmailFilter, setClientEmailFilter] = useState<string>('');
  const [clientPhoneFilter, setClientPhoneFilter] = useState<string>('');
  // Local filter state (used in filter card only)
  const [localSelectedLocation, setLocalSelectedLocation] = useState<string>(selectedLocation);
  const [localSelectedTeamMember, setLocalSelectedTeamMember] = useState<string>(selectedTeamMember);
  const [localSelectedService, setLocalSelectedService] = useState<string>(selectedService);
  const [localSelectedStatus, setLocalSelectedStatus] = useState<string>(selectedStatus);
  const [localClientNameFilter, setLocalClientNameFilter] = useState<string>(clientNameFilter);
  const [localClientEmailFilter, setLocalClientEmailFilter] = useState<string>(clientEmailFilter);
  const [localClientPhoneFilter, setLocalClientPhoneFilter] = useState<string>(clientPhoneFilter);

  // When opening the filter card, sync local state with main state
  React.useEffect(() => {
    if (showFilters) {
      setLocalSelectedLocation(selectedLocation);
      setLocalSelectedTeamMember(selectedTeamMember);
      setLocalSelectedService(selectedService);
      setLocalSelectedStatus(selectedStatus);
      setLocalClientNameFilter(clientNameFilter);
      setLocalClientEmailFilter(clientEmailFilter);
      setLocalClientPhoneFilter(clientPhoneFilter);
    }
  }, [
    showFilters,
    selectedLocation,
    selectedTeamMember,
    selectedService,
    selectedStatus,
    clientNameFilter,
    clientEmailFilter,
    clientPhoneFilter
  ]);

  // Add appointment slider state
  const [showAddAppointment, setShowAddAppointment] = useState(false);
  const [showEditAppointment, setShowEditAppointment] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  // Generate days for the current week view
  const getWeekDays = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      return date;
    });
  };

  // Helper function to convert time string to minutes for sorting
  const timeToMinutes = (timeStr: string) => {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let totalHours = hours;

    if (period === 'PM' && hours !== 12) {
      totalHours += 12;
    } else if (period === 'AM' && hours === 12) {
      totalHours = 0;
    }

    return totalHours * 60 + (minutes || 0);
  };

  // Helper function to sort appointments by time
  const sortAppointmentsByTime = (appointments: typeof mockAppointments) => {
    return appointments.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  };

  // Generate weeks for week view
  const getWeeks = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(currentWeekStart.getDate() + (i - 3) * 7);
      return weekStart;
    });
  };

  // Generate months for month view
  const getMonths = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const month = new Date(selectedDate);
      month.setMonth(selectedDate.getMonth() + (i - 3));
      month.setDate(1);
      return month;
    });
  };

  const getViewItems = () => {
    switch (viewMode) {
      case 'day':
        return getWeekDays();
      case 'week':
        return getWeeks();
      case 'month':
        return getMonths();
      default:
        return getWeekDays();
    }
  };

  // Helper functions to get date ranges based on selected date
  const getWeekStart = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day;
    const weekStart = new Date(date);
    weekStart.setDate(diff);
    return weekStart;
  };

  const getWeekEnd = (date: Date) => {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return weekEnd;
  };

  const viewItems = getViewItems();
  const today = new Date();

  const goToPreviousDay = () => {
    if (viewMode === 'day') {
      const newDate = new Date(selectedDate);
      newDate.setDate(selectedDate.getDate() - 1);
      setSelectedDate(newDate);

      const newWeekStart = new Date(currentWeekStart);
      if (newDate < currentWeekStart) {
        newWeekStart.setDate(currentWeekStart.getDate() - 7);
        setCurrentWeekStart(newWeekStart);
      }
    } else if (viewMode === 'week') {
      const newDate = new Date(selectedDate);
      newDate.setDate(selectedDate.getDate() - 7);
      setSelectedDate(newDate);

      const newWeekStart = new Date(currentWeekStart);
      newWeekStart.setDate(currentWeekStart.getDate() - 7);
      setCurrentWeekStart(newWeekStart);
    } else if (viewMode === 'month') {
      const newDate = new Date(selectedDate);
      newDate.setMonth(selectedDate.getMonth() - 1);
      setSelectedDate(newDate);
    }

  };

  const goToNextDay = () => {
    if (viewMode === 'day') {
      const newDate = new Date(selectedDate);
      newDate.setDate(selectedDate.getDate() + 1);
      setSelectedDate(newDate);

      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(currentWeekStart.getDate() + 6);
      if (newDate > weekEnd) {
        const newWeekStart = new Date(currentWeekStart);
        newWeekStart.setDate(currentWeekStart.getDate() + 7);
        setCurrentWeekStart(newWeekStart);
      }
    } else if (viewMode === 'week') {
      const newDate = new Date(selectedDate);
      newDate.setDate(selectedDate.getDate() + 7);
      setSelectedDate(newDate);

      const newWeekStart = new Date(currentWeekStart);
      newWeekStart.setDate(currentWeekStart.getDate() + 7);
      setCurrentWeekStart(newWeekStart);
    } else if (viewMode === 'month') {
      const newDate = new Date(selectedDate);
      newDate.setMonth(selectedDate.getMonth() + 1);
      setSelectedDate(newDate);
    }

  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400">Completed</Badge>;
      case 'no-show':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400">No Show</Badge>;
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Fix the applyFilters function to work with existing appointment structure:
  const applyFilters = (appointments: typeof mockAppointments) => {
    return appointments.filter(appointment => {
      // Location filter
      if (selectedLocation !== 'all' && appointment.location !== selectedLocation) {
        return false;
      }

      // Team member filter
      if (selectedTeamMember !== 'all' && !appointment.teamMembers.includes(selectedTeamMember)) {
        return false;
      }

      // Service filter
      if (selectedService !== 'all' && appointment.service !== selectedService) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && appointment.status !== selectedStatus) {
        return false;
      }

      // Client filters - find the client for this appointment by name
      const client = mockClients.find(c => `${c.firstName} ${c.lastName}` === appointment.client.name);
      if (client) {
        // Client name filter
        if (clientNameFilter) {
          const fullName = `${client.firstName} ${client.lastName}`;
          if (!fullName.toLowerCase().includes(clientNameFilter.toLowerCase())) {
            return false;
          }
        }

        // Client email filter
        if (clientEmailFilter && !client.email.toLowerCase().includes(clientEmailFilter.toLowerCase())) {
          return false;
        }

        // Client phone filter
        if (clientPhoneFilter && !client.phone.includes(clientPhoneFilter)) {
          return false;
        }
      }

      return true;
    });
  };

  const getAppointmentsForDisplay = () => {
    if (viewMode === 'week') {
      // Group appointments by day for week view
      const weekDays = getWeekDays();
      return weekDays.map(day => {
        const dayAppointments = applyFilters(mockAppointments.filter(appointment =>
          appointment.date.toDateString() === day.toDateString()
        ));
        return {
          date: day,
          appointments: sortAppointmentsByTime(dayAppointments)
        };
      });
    } else if (viewMode === 'month') {
      // For month view, group appointments by day for the selected month
      const monthAppointments = applyFilters(mockAppointments.filter(appointment =>
        appointment.date.getMonth() === selectedDate.getMonth() &&
        appointment.date.getFullYear() === selectedDate.getFullYear()
      ));

      // Group by unique dates
      const groupedByDate = monthAppointments.reduce((acc, appointment) => {
        const dateKey = appointment.date.toDateString();
        if (!acc[dateKey]) {
          acc[dateKey] = {
            date: appointment.date,
            appointments: []
          };
        }
        acc[dateKey].appointments.push(appointment);
        return acc;
      }, {} as Record<string, { date: Date; appointments: typeof mockAppointments }>);

      // Sort by date and sort appointments within each day by time
      return Object.values(groupedByDate)
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map(dayData => ({
          ...dayData,
          appointments: sortAppointmentsByTime(dayData.appointments)
        }));
    } else {
      // For day view, show all appointments for selected date
      const filteredAppointments = applyFilters(mockAppointments.filter(appointment =>
        appointment.date.toDateString() === selectedDate.toDateString()
      ));
      return [{
        date: selectedDate,
        appointments: sortAppointmentsByTime(filteredAppointments)
      }];
    }
  };

  const appointmentsByDay = getAppointmentsForDisplay();
  const uniqueServices = Array.from(new Set(mockAppointments.map(a => a.service))).sort();
  const uniqueStatuses = [
    { value: 'all', label: 'All statuses' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'no-show', label: 'No Show' }
  ];

  // Calculate number of active filters
  const activeFiltersCount = [
    selectedLocation !== 'all',
    selectedTeamMember !== 'all',
    selectedService !== 'all',
    selectedStatus !== 'all',
    !!clientNameFilter,
    !!clientEmailFilter,
    !!clientPhoneFilter
  ].filter(Boolean).length;

  // Generate calendar grid for grid view
  const generateCalendarGrid = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const endDate = new Date(lastDay);

    // Go back to the first Sunday of the calendar grid
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // Go forward to the last Saturday of the calendar grid
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const calendarDays = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayAppointments = applyFilters(mockAppointments.filter(appointment =>
        appointment.date.toDateString() === currentDate.toDateString()
      ));

      calendarDays.push({
        date: new Date(currentDate),
        appointments: sortAppointmentsByTime(dayAppointments),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.toDateString() === today.toDateString()
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return calendarDays;
  };

  return (
    <AppLayout>
      <BusinessSetupGate>
        <div className="space-y-6">
          {/* Top Controls: Date Selector, Filter, View Toggle, Add */}
          <div className="flex gap-2 items-center mb-4">
            <div>
              <DatePicker
                value={selectedDate}
                onChange={(date) => {
                  setSelectedDate(date);
                  // Only switch to day view if we're currently in day view or if user explicitly selected a day
                  if (viewMode === 'day') {
                    setViewMode('day');
                  }
                  // For week/month modes, stay in the current view mode
                }}
                viewMode={viewMode}
                className="h-11 w-[130px] bg-white border border-border rounded-lg text-sm font-medium text-foreground"
              />
            </div>
            <button
              className={`
              relative flex items-center justify-center h-9 w-9 rounded-md border border-input transition-all duration-200 ease-out
              ${showFilters
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-white text-muted-foreground hover:text-foreground hover:bg-muted/50'}
            `}
              onClick={() => setShowFilters(!showFilters)}
              aria-label="Show filters"
            >
              <Filter className={`h-5 w-5 ${showFilters ? 'text-primary-foreground' : ''}`} />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] flex items-center justify-center shadow">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* View Type Toggle */}
            <div className="inline-flex bg-white border border-border rounded-lg p-1">
              <button
                onClick={() => setViewType('list')}
                className={`
                flex items-center justify-center h-9 w-9 rounded-md transition-all duration-200 ease-out
                ${viewType === 'list'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }
              `}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewType('grid')}
                className={`
                flex items-center justify-center h-9 w-9 rounded-md transition-all duration-200 ease-out
                ${viewType === 'grid'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }
              `}
                aria-label="Grid view"
              >
                <CalendarIcon className="h-4 w-4" />
              </button>
            </div>

            <Button
              size="default"
              className="h-11 px-4 gap-2"
              onClick={() => setShowAddAppointment(true)}
            >
              <Clipboard className="h-4 w-4" />
              <span>Add</span>
            </Button>
          </div>

          {showFilters && (
            <FilterPanel
              open={showFilters}
              onOpenChange={setShowFilters}
              fields={[
                {
                  type: 'select',
                  key: 'location',
                  label: 'Location',
                  value: localSelectedLocation,
                  options: [
                    { value: 'all', label: 'All locations' },
                    ...mockLocations.map(l => ({ value: l.id, label: l.name }))
                  ],
                  searchable: true,
                },
                {
                  type: 'select',
                  key: 'teamMember',
                  label: 'Team Member',
                  value: localSelectedTeamMember,
                  options: [
                    { value: 'all', label: 'All team members' },
                    ...mockTeamMembers.map(m => ({ value: m.id, label: m.firstName + ' ' + m.lastName }))
                  ],
                  searchable: true,
                },
                {
                  type: 'select',
                  key: 'service',
                  label: 'Service',
                  value: localSelectedService,
                  options: [
                    { value: 'all', label: 'All services' },
                    ...uniqueServices.map(s => ({ value: s, label: s }))
                  ],
                  searchable: true,
                },
                {
                  type: 'select',
                  key: 'status',
                  label: 'Status',
                  value: localSelectedStatus,
                  options: uniqueStatuses,
                  searchable: false,
                },
                {
                  type: 'text',
                  key: 'clientName',
                  label: 'Client Name',
                  value: localClientNameFilter,
                  placeholder: 'Search by client name...'
                },
                {
                  type: 'text',
                  key: 'clientEmail',
                  label: 'Client Email',
                  value: localClientEmailFilter,
                  placeholder: 'Search by email...'
                },
                {
                  type: 'text',
                  key: 'clientPhone',
                  label: 'Client Phone',
                  value: localClientPhoneFilter,
                  placeholder: 'Search by phone...'
                },
              ]}
              onApply={(values: any) => {
                setSelectedLocation(values.location);
                setSelectedTeamMember(values.teamMember);
                setSelectedService(values.service);
                setSelectedStatus(values.status);
                setClientNameFilter(values.clientName);
                setClientEmailFilter(values.clientEmail);
                setClientPhoneFilter(values.clientPhone);
                setShowFilters(false);
              }}
              onClear={() => {
                setSelectedLocation('all');
                setSelectedTeamMember('all');
                setSelectedService('all');
                setSelectedStatus('all');
                setClientNameFilter('');
                setClientEmailFilter('');
                setClientPhoneFilter('');
              }}
            />
          )}
          {/* Active Filter Badges - Always show when there are active filters */}
          {(selectedLocation !== 'all' || selectedTeamMember !== 'all' || selectedService !== 'all' || selectedStatus !== 'all' || clientNameFilter || clientEmailFilter || clientPhoneFilter) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedLocation !== 'all' && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                  onClick={() => setSelectedLocation('all')}
                >
                  Location: {mockLocations.find(l => l.id === selectedLocation)?.name || selectedLocation}
                  <X className="h-4 w-4 ml-1" />
                </Badge>
              )}
              {selectedTeamMember !== 'all' && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                  onClick={() => setSelectedTeamMember('all')}
                >
                  Team: {mockTeamMembers.find(m => m.id === selectedTeamMember)?.firstName + ' ' + mockTeamMembers.find(m => m.id === selectedTeamMember)?.lastName || selectedTeamMember}
                  <X className="h-4 w-4 ml-1" />
                </Badge>
              )}
              {selectedService !== 'all' && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                  onClick={() => setSelectedService('all')}
                >
                  Service: {selectedService}
                  <X className="h-4 w-4 ml-1" />
                </Badge>
              )}
              {selectedStatus !== 'all' && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                  onClick={() => setSelectedStatus('all')}
                >
                  Status: {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1).replace('-', ' ')}
                  <X className="h-4 w-4 ml-1" />
                </Badge>
              )}
              {clientNameFilter && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                  onClick={() => setClientNameFilter('')}
                >
                  Name: {clientNameFilter}
                  <X className="h-4 w-4 ml-1" />
                </Badge>
              )}
              {clientEmailFilter && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                  onClick={() => setClientEmailFilter('')}
                >
                  Email: {clientEmailFilter}
                  <X className="h-4 w-4 ml-1" />
                </Badge>
              )}
              {clientPhoneFilter && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                  onClick={() => setClientPhoneFilter('')}
                >
                  Phone: {clientPhoneFilter}
                  <X className="h-4 w-4 ml-1" />
                </Badge>
              )}
            </div>
          )}

          {/* View Mode Filter */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="inline-flex bg-muted/50 rounded-lg p-1 border border-border">
                {(['day', 'week', 'month'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setViewMode(mode);
                      setViewKey(prev => prev + 1); // Force re-render
                      if (mode === 'week') {
                        const currentDay = selectedDate.getDay();
                        const startOfWeek = new Date(selectedDate);
                        startOfWeek.setDate(selectedDate.getDate() - currentDay);
                        setCurrentWeekStart(startOfWeek);
                      }
                    }}
                    className={`
                    px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-out
                    ${viewMode === mode
                        ? 'bg-background text-foreground shadow-sm border border-border'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                      }
                  `}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  setSelectedDate(today);
                  setViewMode('day');
                  setViewKey(prev => prev + 1); // force re-render for scroll snap
                  if (viewMode === 'week') {
                    const currentDay = today.getDay();
                    const startOfWeek = new Date(today);
                    startOfWeek.setDate(today.getDate() - currentDay);
                    setCurrentWeekStart(startOfWeek);
                  }
                }}
                className="flex items-center gap-2 text-xs"
              >
                <CalendarDays className="h-4 w-4" />
                Today
              </Button>
            </div>
          </div>

          {/* Date Navigation - visible for both list and grid views */}
          <div className="mb-4 flex items-start">
            <button
              onClick={goToPreviousDay}
              className="flex items-center justify-center px-3 py-4 rounded-lg min-w-[50px] h-16 bg-white border border-border hover:bg-muted/50 transition-colors flex-shrink-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div key={viewKey} className="flex items-center gap-2 flex-1 overflow-x-auto px-2 mx-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {viewItems.map((item, index) => {
                let isSelected = false;
                let displayText = '';
                let subText = '';

                if (viewMode === 'day') {
                  isSelected = item.toDateString() === selectedDate.toDateString();
                  displayText = dayNames[item.getDay()];
                  subText = item.getDate().toString();
                } else if (viewMode === 'week') {
                  const weekEnd = new Date(item);
                  weekEnd.setDate(item.getDate() + 6);

                  // Check if selectedDate falls within this week range
                  isSelected = selectedDate >= item && selectedDate <= weekEnd;

                  // Format week range display
                  const startMonth = item.toLocaleDateString('en-US', { month: 'short' });
                  const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
                  const startDay = item.getDate();
                  const endDay = weekEnd.getDate();

                  if (startMonth === endMonth) {
                    // Same month: "Jan 6-12"
                    displayText = startMonth;
                    subText = `${startDay}-${endDay}`;
                  } else {
                    // Different months: "Jan 30-Feb 5"
                    displayText = `${startMonth} ${startDay}-`;
                    subText = `${endMonth} ${endDay}`;
                  }
                } else if (viewMode === 'month') {
                  isSelected = item.getMonth() === selectedDate.getMonth() && item.getFullYear() === selectedDate.getFullYear();
                  displayText = item.toLocaleDateString('en-US', { month: 'short' });
                  subText = item.getFullYear().toString();
                }

                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (viewMode === 'day') {
                        setSelectedDate(item);
                      } else if (viewMode === 'week') {
                        const newDate = new Date(item);
                        setSelectedDate(newDate);
                        setCurrentWeekStart(item);
                      } else if (viewMode === 'month') {
                        const newDate = new Date(item);
                        newDate.setDate(selectedDate.getDate());
                        setSelectedDate(newDate);
                      }

                    }}
                    data-selected={isSelected}
                    className={`flex-shrink-0 flex flex-col items-center ${viewMode === 'day' ? 'px-2' : 'px-1'} py-3 rounded-lg ${viewMode === 'day' ? 'w-[50px]' : 'w-[70px]'} h-16 transition-colors ${isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-white border border-border hover:bg-muted/50'
                      }`}
                  >
                    <span className="text-xs font-medium leading-tight text-center">
                      {displayText}
                    </span>
                    <span className="text-sm font-semibold leading-tight text-center">
                      {subText}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={goToNextDay}
              className="flex items-center justify-center px-3 py-4 rounded-lg min-w-[50px] h-16 bg-white border border-border hover:bg-muted/50 transition-colors flex-shrink-0"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* List View Content */}
          {viewType === 'list' && (
            <>

              {/* Appointments Card */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">
                      Appointments ({appointmentsByDay.reduce((total, day) => total + day.appointments.length, 0)})
                    </h3>
                  </div>

                  {/* List View */}
                  <div className="space-y-4">
                    {appointmentsByDay.map((dayData, dayIndex) => (
                      <div key={dayData.date.toDateString()}>
                        {(viewMode === 'week' || viewMode === 'month') && (
                          <div className="mb-3">
                            <h4 className="text-sm font-semibold text-foreground mb-2">
                              {dayData.date.toLocaleDateString('en-US', {
                                weekday: viewMode === 'week' ? 'long' : 'short',
                                month: 'short',
                                day: 'numeric'
                              })}
                              <span className="text-xs text-muted-foreground ml-2">
                                ({dayData.appointments.length} appointments)
                              </span>
                            </h4>
                          </div>
                        )}

                        {dayData.appointments.length === 0 ? (
                          (viewMode === 'week' || viewMode === 'month') && (
                            <div className="text-xs text-muted-foreground mb-4 pl-2">
                              No appointments scheduled
                            </div>
                          )
                        ) : (
                          <div className="space-y-3">
                            {dayData.appointments.map((appointment, index) => (
                              <div
                                key={appointment.id}
                                className={`flex items-center gap-3 py-2 cursor-pointer hover:bg-muted/30 rounded-lg transition-colors ${index !== dayData.appointments.length - 1 ? 'border-b border-border' : ''}`}
                                onClick={() => {
                                  setSelectedAppointment(appointment);
                                  setShowEditAppointment(true);
                                }}
                              >
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={appointment.client.avatar} />
                                  <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                                    {appointment.client.initials}
                                  </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    {/* Column 1: Customer info */}
                                    <div className="flex-1 min-w-0 space-y-1">
                                      {/* Customer name */}
                                      <h4 className="font-medium text-sm text-foreground">
                                        {appointment.client.name}
                                      </h4>
                                      {/* Service */}
                                      <p className="text-xs text-muted-foreground">
                                        {appointment.service}
                                      </p>
                                      {/* Location */}
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <MapPin className="h-3 w-3" />
                                        {mockLocations.find(l => l.id === appointment.location)?.name}
                                      </div>
                                      {/* Team Members */}
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Users className="h-3 w-3" />
                                        {appointment.teamMembers.length > 1
                                          ? `${appointment.teamMembers.length} team members`
                                          : mockTeamMembers.find(m => m.id === appointment.teamMembers[0])?.firstName + ' ' + mockTeamMembers.find(m => m.id === appointment.teamMembers[0])?.lastName
                                        }
                                      </div>
                                    </div>

                                    {/* Column 2: Status and Time */}
                                    <div className="flex-shrink-0 flex flex-col items-center gap-1">
                                      {getStatusBadge(appointment.status)}
                                      <div className="font-semibold text-sm text-foreground">
                                        {appointment.time}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {(viewMode === 'week' || viewMode === 'month') && dayIndex !== appointmentsByDay.length - 1 && dayData.appointments.length > 0 && (
                          <div className="border-b border-border mt-4"></div>
                        )}
                      </div>
                    ))}

                    {appointmentsByDay.every(day => day.appointments.length === 0) && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">No appointments scheduled for {viewMode === 'week' ? 'this week' : viewMode === 'month' ? 'this month' : 'this day'}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Grid View - Custom Day Timeline */}
          {viewType === 'grid' && viewMode === 'day' && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>
                </div>
                <div className="flex">
                  {/* Time slots */}
                  <div className="flex flex-col items-end pr-4 select-none" style={{ minWidth: 48 }}>
                    {Array.from({ length: 13 }, (_, i) => 7 + i).map(hour => (
                      <div key={hour} className="h-16 text-xs text-muted-foreground flex items-start justify-end" style={{ height: 64 }}>
                        {hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                      </div>
                    ))}
                  </div>
                  {/* Timeline slots */}
                  <div className="flex-1 relative">
                    {Array.from({ length: 13 }, (_, i) => 7 + i).map(hour => {
                      const slotTime = new Date(selectedDate);
                      slotTime.setHours(hour, 0, 0, 0);
                      // Find appointments that start in this hour
                      const slotAppointments = applyFilters(mockAppointments.filter(a => {
                        return (
                          a.date.toDateString() === selectedDate.toDateString() &&
                          timeToMinutes(a.time) >= hour * 60 &&
                          timeToMinutes(a.time) < (hour + 1) * 60
                        );
                      }));
                      return (
                        <div
                          key={hour}
                          className="border-b border-border h-16 relative group cursor-pointer hover:bg-muted/20"
                          style={{ height: 64 }}
                          onClick={e => {
                            if ((e.target as Element).classList.contains('timeline-slot')) {
                              setSelectedDate(slotTime);
                              setShowAddAppointment(true);
                            }
                          }}
                        >
                          {/* Appointments in this slot */}
                          {slotAppointments.map(appointment => {
                            // Calculate block height based on duration (default 1 slot = 1 hour)
                            const [startHour, startMin] = appointment.time.split(/:| /)[0].split(':').map(Number);
                            const [endHour, endMin] = (() => {
                              // Try to parse end time from service string or use +1 hour fallback
                              const match = appointment.service.match(/\((\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
                              if (match) return [parseInt(match[3]), parseInt(match[4])];
                              // fallback: 1 hour duration
                              return [startHour + 1, startMin];
                            })();
                            const duration = ((endHour * 60 + endMin) - (startHour * 60 + startMin)) || 60;
                            const blockHeight = Math.max(48, (duration / 60) * 64); // min 48px
                            return (
                              <div
                                key={appointment.id}
                                draggable
                                onDragStart={e => {
                                  e.dataTransfer.setData('text/plain', appointment.id.toString());
                                  e.currentTarget.classList.add('opacity-50');
                                }}
                                onDragEnd={e => {
                                  e.currentTarget.classList.remove('opacity-50');
                                }}
                                className={`absolute left-2 right-2 top-1 z-10 rounded-lg shadow-md px-4 py-2 cursor-move flex flex-col justify-center
                                ${appointment.status === 'completed' ? 'bg-green-500 text-white' :
                                    appointment.status === 'no-show' ? 'bg-red-400 text-white' :
                                      'bg-orange-400 text-white'}
                                hover:brightness-110 transition-all`}
                                style={{ height: blockHeight, top: 4 }}
                                onClick={e => {
                                  setSelectedAppointment(appointment);
                                  setShowEditAppointment(true);
                                }}
                              >
                                <div className="font-semibold text-xs truncate">{appointment.service}</div>
                                <div className="text-xs opacity-90 truncate">{appointment.client.name}</div>
                                <div className="text-xs opacity-70">{appointment.time}</div>
                              </div>
                            );
                          })}
                          {/* Empty slot overlay for add */}
                          {slotAppointments.length === 0 && (
                            <div className="timeline-slot absolute inset-0 flex items-center justify-center text-xs text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                              + Add appointment
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Grid View - Custom Week/Month Calendar */}
          {viewType === 'grid' && (viewMode === 'week' || viewMode === 'month') && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    {viewMode === 'week'
                      ? `${getWeekStart(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${getWeekEnd(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                      : selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                </div>
                {/* Calendar Header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {dayNames.map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    if (viewMode === 'week') {
                      // 7 days of the current week
                      const weekStart = getWeekStart(selectedDate);
                      return Array.from({ length: 7 }, (_, i) => {
                        const day = new Date(weekStart);
                        day.setDate(weekStart.getDate() + i);
                        const dayAppointments = applyFilters(mockAppointments.filter(a => a.date.toDateString() === day.toDateString()));
                        return (
                          <div
                            key={day.toDateString()}
                            className={`min-h-[90px] border border-border bg-white transition-colors relative
                            ${day.toDateString() === new Date().toDateString() ? 'ring-1 ring-primary' : ''}
                            ${selectedDate.toDateString() === day.toDateString() ? 'bg-primary/5' : ''}`}
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedDate(day);
                              setViewMode('day');
                            }}
                            onDragOver={e => {
                              e.preventDefault();
                              e.currentTarget.classList.add('bg-primary/10');
                            }}
                            onDragLeave={e => {
                              e.currentTarget.classList.remove('bg-primary/10');
                            }}
                            onDrop={e => {
                              e.preventDefault();
                              e.currentTarget.classList.remove('bg-primary/10');
                              const appointmentId = e.dataTransfer.getData('text/plain');
                              // Implement move logic here
                            }}
                          >
                            <div className="text-xs font-medium opacity-60 pl-1 pt-1 absolute left-0 top-0">{day.getDate()}</div>
                            <div className="flex flex-col justify-start items-start h-full pt-5 px-1 pb-1">
                              {dayAppointments.slice(0, 3).map((appointment, idx) => (
                                <div
                                  key={appointment.id}
                                  draggable
                                  onDragStart={e => {
                                    e.dataTransfer.setData('text/plain', appointment.id.toString());
                                    e.currentTarget.classList.add('opacity-50');
                                  }}
                                  onDragEnd={e => {
                                    e.currentTarget.classList.remove('opacity-50');
                                  }}
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium truncate mb-0.5 cursor-pointer
                                  ${appointment.status === 'completed' ? 'bg-green-200 text-green-900' :
                                      appointment.status === 'no-show' ? 'bg-red-200 text-red-900' :
                                        'bg-blue-200 text-blue-900'}
                                  hover:opacity-80 transition-opacity`}
                                  onClick={e => {
                                    e.stopPropagation();
                                    setSelectedDate(day);
                                    setViewMode('day');
                                  }}
                                  style={{ maxWidth: '100%' }}
                                >
                                  <span className="truncate">{appointment.service}</span>
                                </div>
                              ))}
                              {dayAppointments.length > 3 && (
                                <div className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium truncate bg-muted text-muted-foreground">
                                  <span className="sm:inline hidden">+{dayAppointments.length - 3} more</span>
                                  <span className="inline sm:hidden">+{dayAppointments.length - 3}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      });
                    } else {
                      // Month view: show all days of the month in a grid
                      const year = selectedDate.getFullYear();
                      const month = selectedDate.getMonth();
                      const firstDay = new Date(year, month, 1);
                      const lastDay = new Date(year, month + 1, 0);
                      const startDate = new Date(firstDay);
                      startDate.setDate(firstDay.getDate() - firstDay.getDay());
                      const endDate = new Date(lastDay);
                      endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
                      const days = [];
                      const currentDate = new Date(startDate);
                      while (currentDate <= endDate) {
                        const isCurrentMonth = currentDate.getMonth() === month;
                        const dayAppointments = applyFilters(mockAppointments.filter(a => a.date.toDateString() === currentDate.toDateString()));
                        const dayDate = new Date(currentDate); // Capture the current date value
                        days.push(
                          <div
                            key={currentDate.toDateString()}
                            className={`min-h-[90px] border border-border bg-white transition-colors relative
                            ${isCurrentMonth ? 'bg-white border-border hover:bg-muted/10' : 'bg-muted/20 border-muted text-muted-foreground'}
                            ${currentDate.toDateString() === new Date().toDateString() ? 'ring-1 ring-primary' : ''}
                            ${selectedDate.toDateString() === currentDate.toDateString() ? 'bg-primary/5' : ''}`}
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedDate(dayDate);
                              setViewMode('day');
                            }}
                            onDragOver={e => {
                              e.preventDefault();
                              e.currentTarget.classList.add('bg-primary/10');
                            }}
                            onDragLeave={e => {
                              e.currentTarget.classList.remove('bg-primary/10');
                            }}
                            onDrop={e => {
                              e.preventDefault();
                              e.currentTarget.classList.remove('bg-primary/10');
                              const appointmentId = e.dataTransfer.getData('text/plain');
                              // Implement move logic here
                            }}
                          >
                            <div className="text-xs font-medium opacity-60 pl-1 pt-1 absolute left-0 top-0">{currentDate.getDate()}</div>
                            <div className="flex flex-col justify-start items-start h-full pt-5 px-1 pb-1">
                              {dayAppointments.slice(0, 3).map((appointment, idx) => (
                                <div
                                  key={appointment.id}
                                  draggable
                                  onDragStart={e => {
                                    e.dataTransfer.setData('text/plain', appointment.id.toString());
                                    e.currentTarget.classList.add('opacity-50');
                                  }}
                                  onDragEnd={e => {
                                    e.currentTarget.classList.remove('opacity-50');
                                  }}
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium truncate mb-0.5 cursor-pointer
                                  ${appointment.status === 'completed' ? 'bg-green-200 text-green-900' :
                                      appointment.status === 'no-show' ? 'bg-red-200 text-red-900' :
                                        'bg-blue-200 text-blue-900'}
                                  hover:opacity-80 transition-opacity`}
                                  onClick={e => {
                                    e.stopPropagation();
                                    setSelectedDate(dayDate);
                                    setViewMode('day');
                                  }}
                                  style={{ maxWidth: '100%' }}
                                >
                                  <span className="truncate">{appointment.service}</span>
                                </div>
                              ))}
                              {dayAppointments.length > 3 && (
                                <div className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium truncate bg-muted text-muted-foreground">
                                  <span className="sm:inline hidden">+{dayAppointments.length - 3} more</span>
                                  <span className="inline sm:hidden">+{dayAppointments.length - 3}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                        currentDate.setDate(currentDate.getDate() + 1);
                      }
                      return days;
                    }
                  })()}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Add Appointment Slider */}
        <AddAppointmentSlider
          isOpen={showAddAppointment}
          onClose={() => setShowAddAppointment(false)}
        />

        {/* Edit Appointment Slider */}
        <EditAppointmentSlider
          isOpen={showEditAppointment}
          onClose={() => setShowEditAppointment(false)}
          appointment={selectedAppointment}
        />
      </BusinessSetupGate>
    </AppLayout>
  );
};

export default Calendar;