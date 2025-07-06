'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { UserRole } from '@/types/auth';
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Power, PowerOff, MapPin, Clock, Phone, Mail, MoreVertical, Search, Filter, X, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStores } from '@/pages/_app';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

interface Location {
  id: string;
  name: string;
  address: string;
  email: string;
  phoneNumber: string;
  description: string;
  workingHours: {
    monday: { open: string; close: string; isOpen: boolean };
    tuesday: { open: string; close: string; isOpen: boolean };
    wednesday: { open: string; close: string; isOpen: boolean };
    thursday: { open: string; close: string; isOpen: boolean };
    friday: { open: string; close: string; isOpen: boolean };
    saturday: { open: string; close: string; isOpen: boolean };
    sunday: { open: string; close: string; isOpen: boolean };
  };
  status: 'active' | 'inactive';
  createdAt: string;
}

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
function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Helper to check if a day is today
function isToday(day: string) {
  const todayIdx = new Date().getDay(); // 0 (Sun) - 6 (Sat)
  const map: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
  };
  return map[day] === todayIdx;
}

// Helper to get short day names
const shortDay = (day: string) => {
  const map: Record<string, string> = {
    monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun'
  };
  return map[day.toLowerCase()] || day;
};

export default function LocationsPage() {
  const { authStore } = useStores();
  const [locations, setLocations] = useState<Location[]>([
    {
      id: '1',
      name: 'Downtown Salon',
      address: '123 Main Street, Downtown, City, State 12345',
      email: 'downtown@salon.com',
      phoneNumber: '(555) 123-4567',
      description: 'Our flagship location in the heart of downtown',
      workingHours: defaultWorkingHours,
      status: 'active',
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      name: 'Westside Branch',
      address: '456 West Avenue, Westside, City, State 12345',
      email: 'westside@salon.com',
      phoneNumber: '(555) 987-6543',
      description: 'Convenient location for westside residents',
      workingHours: {
        ...defaultWorkingHours,
        sunday: { open: '10:00', close: '15:00', isOpen: true },
      },
      status: 'active',
      createdAt: '2024-02-01T15:45:00Z'
    },
    {
      id: '3',
      name: 'Mall Location',
      address: '789 Shopping Center, Mall District, City, State 12345',
      email: 'mall@salon.com',
      phoneNumber: '(555) 456-7890',
      description: 'Located inside the shopping mall for convenience',
      workingHours: {
        ...defaultWorkingHours,
        saturday: { open: '09:00', close: '18:00', isOpen: true },
        sunday: { open: '11:00', close: '17:00', isOpen: true },
      },
      status: 'inactive',
      createdAt: '2024-01-20T09:15:00Z'
    }
  ]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    email: '',
    phoneNumber: '',
    description: '',
    workingHours: defaultWorkingHours,
    status: 'active' as const,
  });
  const [isWorkingHoursModalOpen, setIsWorkingHoursModalOpen] = useState(false);
  const [editingWorkingHoursLocation, setEditingWorkingHoursLocation] = useState<Location | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [isDayEditModalOpen, setIsDayEditModalOpen] = useState(false);
  const [editingDayData, setEditingDayData] = useState<{
    location: Location;
    day: string;
    dayLabel: string;
  } | null>(null);

  // Fetch locations on component mount
  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/locations');
      const data = await response.json();
      setLocations(data);
    } catch (error) {
      toast.error('Failed to fetch locations');
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newLocation),
      });

      if (!response.ok) throw new Error('Failed to create location');

      toast.success('Location created successfully');
      setIsCreateDialogOpen(false);
      setNewLocation({
        name: '',
        address: '',
        email: '',
        phoneNumber: '',
        description: '',
        workingHours: defaultWorkingHours,
        status: 'active'
      });
      fetchLocations();
    } catch (error) {
      toast.error('Failed to create location');
    }
  };

  const handleEditLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation) return;

    try {
      const response = await fetch(`/api/locations/${editingLocation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingLocation),
      });

      if (!response.ok) throw new Error('Failed to update location');

      toast.success('Location updated successfully');
      setIsEditDialogOpen(false);
      setEditingLocation(null);
      fetchLocations();
    } catch (error) {
      toast.error('Failed to update location');
    }
  };

  const handleToggleLocationStatus = async (location: Location) => {
    try {
      const newStatus = location.status === 'active' ? 'inactive' : 'active';
      const response = await fetch(`/api/locations/${location.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...location,
          status: newStatus,
        }),
      });

      if (!response.ok) throw new Error('Failed to update location status');

      toast.success(`Location ${newStatus} successfully`);
      fetchLocations();
    } catch (error) {
      toast.error('Failed to update location status');
    }
  };

  const handleDeleteLocation = async (id: string) => {
    try {
      const response = await fetch(`/api/locations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete location');

      toast.success('Location deleted successfully');
      fetchLocations();
    } catch (error) {
      toast.error('Failed to delete location');
    }
  };

  const openEditDialog = (location: Location) => {
    setEditingLocation(location);
    setIsEditDialogOpen(true);
  };

  const updateWorkingHours = (day: keyof typeof defaultWorkingHours, field: 'open' | 'close' | 'isOpen', value: string | boolean) => {
    if (!editingLocation) return;
    setEditingLocation({
      ...editingLocation,
      workingHours: {
        ...editingLocation.workingHours,
        [day]: {
          ...editingLocation.workingHours[day],
          [field]: value,
        },
      },
    });
  };

  const updateNewLocationWorkingHours = (day: keyof typeof defaultWorkingHours, field: 'open' | 'close' | 'isOpen', value: string | boolean) => {
    setNewLocation({
      ...newLocation,
      workingHours: {
        ...newLocation.workingHours,
        [day]: {
          ...newLocation.workingHours[day],
          [field]: value,
        },
      },
    });
  };

  const updateLocationDayHours = (locationId: string, day: string, field: 'open' | 'close' | 'isOpen', value: string | boolean) => {
    setLocations(locations.map(location => {
      if (location.id === locationId) {
        return {
          ...location,
          workingHours: {
            ...location.workingHours,
            [day]: {
              ...location.workingHours[day as keyof typeof defaultWorkingHours],
              [field]: value,
            },
          },
        };
      }
      return location;
    }));
  };

  const openDayEditModal = (location: Location, day: string, dayLabel: string) => {
    setEditingDayData({ location, day, dayLabel });
    setIsDayEditModalOpen(true);
  };

  const renderWorkingHoursForm = (workingHours: typeof defaultWorkingHours, updateFn: (day: keyof typeof defaultWorkingHours, field: 'open' | 'close' | 'isOpen', value: string | boolean) => void) => {
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
                    className="h-10 text-center"
                  />
                </div>
                <div className="mt-2">
                  <Label className="text-xs text-gray-500 mb-1 block">Closing Time</Label>
                  <Input
                    type="time"
                    value={workingHours[key].close}
                    onChange={(e) => updateFn(key, 'close', e.target.value)}
                    className="h-10 text-center"
                  />
                </div>
              </>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-400 italic text-sm mt-2">
                This location is closed on {capitalize(label)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Filter locations based on search and status
  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || location.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout>
      <div className="space-y-4 max-w-2xl mx-auto">
        {/* Top Controls: Search, Filter, Add */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Input
              placeholder="Search locations..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-11 text-base pr-12 pl-4 rounded-lg border border-input bg-white"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
          <button
            className="flex items-center justify-center h-11 w-11 rounded-lg border border-input bg-white hover:bg-muted transition-colors"
            onClick={() => setStatusFilter(statusFilter === 'all' ? 'active' : 'all')}
            aria-label="Show filters"
          >
            <Filter className="h-5 w-5 text-gray-500" />
          </button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-11 px-4 rounded-lg bg-black hover:bg-gray-800 flex items-center gap-2">
                <Plus className="h-5 w-5" />
                <span className="font-semibold">Add Location</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Location</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateLocation} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="mb-2 block">Location Name</Label>
                    <Input
                      id="name"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="mb-2 block">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newLocation.email}
                      onChange={(e) => setNewLocation({ ...newLocation, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address" className="mb-2 block">Address</Label>
                  <Textarea
                    id="address"
                    value={newLocation.address}
                    onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumber" className="mb-2 block">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={newLocation.phoneNumber}
                    onChange={(e) => setNewLocation({ ...newLocation, phoneNumber: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="mb-2 block">Description</Label>
                  <Textarea
                    id="description"
                    value={newLocation.description}
                    onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                  />
                </div>
                {renderWorkingHoursForm(newLocation.workingHours, updateNewLocationWorkingHours)}
                <Button type="submit" className="w-full">Create Location</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Active Filters as tags */}
        <div className="flex flex-wrap gap-2">
          {searchTerm && (
            <span className="inline-flex items-center bg-muted px-3 py-1 rounded-full text-sm">
              Search: "{searchTerm}"
              <button className="ml-2" onClick={() => setSearchTerm('')}><X className="h-4 w-4" /></button>
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className="inline-flex items-center bg-muted px-3 py-1 rounded-full text-sm">
              Status: {statusFilter}
              <button className="ml-2" onClick={() => setStatusFilter('all')}><X className="h-4 w-4" /></button>
            </span>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border bg-white p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{locations.length}</div>
            <div className="text-xs text-gray-500 mt-1">Total</div>
          </div>
          <div className="rounded-lg border bg-white p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{locations.filter(l => l.status === 'active').length}</div>
            <div className="text-xs text-gray-500 mt-1">Active</div>
          </div>
          <div className="rounded-lg border bg-white p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{locations.filter(l => l.status === 'inactive').length}</div>
            <div className="text-xs text-gray-500 mt-1">Inactive</div>
          </div>
        </div>

        {/* Locations Grid */}
        <div className="space-y-3">
          {filteredLocations.map((location) => (
            <div key={location.id} className="rounded-xl border bg-white p-6 flex flex-col gap-2 shadow-sm">
              {/* Top Row: Name, Status, Actions */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-lg truncate">{location.name}</span>
                    {getStatusBadge(location.status)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    className="flex items-center justify-center h-9 w-9 rounded hover:bg-gray-100 active:bg-gray-200 transition-colors"
                    title="Edit Working Hours"
                    aria-label="Edit Working Hours"
                    onClick={() => { setEditingWorkingHoursLocation(location); setIsWorkingHoursModalOpen(true); }}
                  >
                    <Clock className="h-5 w-5" />
                  </button>
                  <button
                    className="flex items-center justify-center h-9 w-9 rounded hover:bg-gray-100 active:bg-gray-200 transition-colors"
                    title="Edit Location"
                    aria-label="Edit Location"
                    onClick={() => openEditDialog(location)}
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    className="flex items-center justify-center h-9 w-9 rounded hover:bg-red-50 active:bg-red-100 text-red-600 transition-colors"
                    title="Delete Location"
                    aria-label="Delete Location"
                    onClick={() => { setLocationToDelete(location); setIsDeleteDialogOpen(true); }}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              {/* Info Rows */}
              <div className="flex flex-col gap-1 text-sm mt-2">
                <div className="flex items-center gap-2 text-gray-500">
                  <MapPin className="h-4 w-4" />
                  <span>{location.address}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Phone className="h-4 w-4" />
                  <span>{location.phoneNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Mail className="h-4 w-4" />
                  <span>{location.email}</span>
                </div>
              </div>
              {/* Description (moved up) */}
              {location.description && (
                <p className="text-sm text-gray-600 mt-2 mb-1">{location.description}</p>
              )}
              {/* Divider */}
              <hr className="my-1 border-gray-200" />
              {/* Working Hours Section */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="font-semibold text-base">Working Hours</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex flex-col gap-2">
                  {Object.entries(location.workingHours).map(([day, { open, close, isOpen }]) => (
                    <button
                      key={day}
                      onClick={() => openDayEditModal(location, day, capitalize(day))}
                      className="flex justify-between items-center bg-white rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <span>{shortDay(day)}</span>
                      {isOpen ? (
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-mono font-semibold">
                          {open} - {close}
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">Closed</span>
                      )}
                    </button>
                  ))}
                </div>
                <hr className="my-1 border-gray-200 mt-3" />
                {/* Summary row */}
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Open: {Object.values(location.workingHours).filter(d => d.isOpen).length} days</span>
                  <span>Closed: {Object.values(location.workingHours).filter(d => !d.isOpen).length} days</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredLocations.length === 0 && (
          (searchTerm || statusFilter !== 'all') ? (
            <div className="rounded-lg border bg-white p-8 text-center">
              <div className="mb-4 text-gray-500">No locations found matching your filters.</div>
              <Button variant="outline" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}>
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border bg-white p-8 text-center">
              <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first location.</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Location
              </Button>
            </div>
          )
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto p-6">
            <DialogHeader>
              <DialogTitle>Edit Location</DialogTitle>
            </DialogHeader>
            {editingLocation && (
              <form onSubmit={handleEditLocation} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editName" className="mb-2 block">Location Name</Label>
                    <Input
                      id="editName"
                      value={editingLocation.name}
                      onChange={(e) => setEditingLocation({ ...editingLocation, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="editEmail" className="mb-2 block">Email</Label>
                    <Input
                      id="editEmail"
                      type="email"
                      value={editingLocation.email}
                      onChange={(e) => setEditingLocation({ ...editingLocation, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="editAddress" className="mb-2 block">Address</Label>
                  <Textarea
                    id="editAddress"
                    value={editingLocation.address}
                    onChange={(e) => setEditingLocation({ ...editingLocation, address: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="editPhoneNumber" className="mb-2 block">Phone Number</Label>
                  <Input
                    id="editPhoneNumber"
                    value={editingLocation.phoneNumber}
                    onChange={(e) => setEditingLocation({ ...editingLocation, phoneNumber: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="editDescription" className="mb-2 block">Description</Label>
                  <Textarea
                    id="editDescription"
                    value={editingLocation.description}
                    onChange={(e) => setEditingLocation({ ...editingLocation, description: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">Update Location</Button>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Working Hours Modal */}
        <Dialog open={isWorkingHoursModalOpen} onOpenChange={setIsWorkingHoursModalOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto p-6">
            <DialogHeader>
              <DialogTitle className="text-center pr-10">Working Hours - {editingWorkingHoursLocation?.name || ''}</DialogTitle>
            </DialogHeader>
            {editingWorkingHoursLocation && (
              <form onSubmit={async (e) => {
                e.preventDefault();
                setIsWorkingHoursModalOpen(false);
                setEditingWorkingHoursLocation(null);
              }} className="space-y-6">
                <div className="flex flex-col gap-4">
                  {Object.entries(editingWorkingHoursLocation.workingHours).map(([day, wh]) => (
                    <div key={day} className="bg-white rounded-xl shadow-xs p-4 flex flex-col gap-2 border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-base">{capitalize(day)}</span>
                        {wh.isOpen ? (
                          <button
                            type="button"
                            className="px-2 py-0 rounded-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-xs font-medium"
                            onClick={() => setEditingWorkingHoursLocation({
                              ...editingWorkingHoursLocation,
                              workingHours: {
                                ...editingWorkingHoursLocation.workingHours,
                                [day]: { ...wh, isOpen: false }
                              }
                            })}
                          >
                            Mark as Closed
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="px-2 py-0 rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-xs font-medium"
                            onClick={() => setEditingWorkingHoursLocation({
                              ...editingWorkingHoursLocation,
                              workingHours: {
                                ...editingWorkingHoursLocation.workingHours,
                                [day]: { ...wh, isOpen: true }
                              }
                            })}
                          >
                            Mark as Open
                          </button>
                        )}
                      </div>
                      {wh.isOpen ? (
                        <>
                          <div>
                            <Label className="text-xs text-gray-500 mb-1 block">Opening Time</Label>
                            <Input
                              type="time"
                              value={wh.open}
                              onChange={(e) => setEditingWorkingHoursLocation({
                                ...editingWorkingHoursLocation,
                                workingHours: {
                                  ...editingWorkingHoursLocation.workingHours,
                                  [day]: { ...wh, open: e.target.value }
                                }
                              })}
                              className="h-10 text-center"
                            />
                          </div>
                          <div className="mt-2">
                            <Label className="text-xs text-gray-500 mb-1 block">Closing Time</Label>
                            <Input
                              type="time"
                              value={wh.close}
                              onChange={(e) => setEditingWorkingHoursLocation({
                                ...editingWorkingHoursLocation,
                                workingHours: {
                                  ...editingWorkingHoursLocation.workingHours,
                                  [day]: { ...wh, close: e.target.value }
                                }
                              })}
                              className="h-10 text-center"
                            />
                          </div>
                        </>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-400 italic text-sm mt-2">
                          This location is closed on {capitalize(day)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2 mt-6">
                  <Button type="submit" className="w-full bg-black hover:bg-gray-900">Save Changes</Button>
                  <Button type="button" variant="outline" className="w-full" onClick={() => { setIsWorkingHoursModalOpen(false); setEditingWorkingHoursLocation(null); }}>Cancel</Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Day Edit Modal */}
        <Dialog open={isDayEditModalOpen} onOpenChange={setIsDayEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit {editingDayData?.dayLabel} Hours</DialogTitle>
              <DialogDescription>
                Update working hours for {editingDayData?.location?.name} on {editingDayData?.dayLabel}.
              </DialogDescription>
            </DialogHeader>
            {editingDayData && (() => {
              const currentLocation = locations.find(loc => loc.id === editingDayData.location.id);
              const currentDayHours = currentLocation?.workingHours[editingDayData.day as keyof typeof defaultWorkingHours];
              
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{editingDayData.dayLabel}</span>
                    {currentDayHours?.isOpen ? (
                      <button
                        type="button"
                        className="px-3 py-1 rounded-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-sm font-medium"
                        onClick={() => updateLocationDayHours(editingDayData.location.id, editingDayData.day, 'isOpen', false)}
                      >
                        Mark as Closed
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="px-3 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-sm font-medium"
                        onClick={() => updateLocationDayHours(editingDayData.location.id, editingDayData.day, 'isOpen', true)}
                      >
                        Mark as Open
                      </button>
                    )}
                  </div>
                  {currentDayHours?.isOpen ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm text-gray-600 mb-1 block">Opening Time</Label>
                        <Input
                          type="time"
                          value={currentDayHours.open}
                          onChange={(e) => updateLocationDayHours(editingDayData.location.id, editingDayData.day, 'open', e.target.value)}
                          className="h-10 text-center"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600 mb-1 block">Closing Time</Label>
                        <Input
                          type="time"
                          value={currentDayHours.close}
                          onChange={(e) => updateLocationDayHours(editingDayData.location.id, editingDayData.day, 'close', e.target.value)}
                          className="h-10 text-center"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-400 italic text-sm">
                      This location is closed on {editingDayData.dayLabel}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => {
                        setIsDayEditModalOpen(false);
                        setEditingDayData(null);
                      }}
                      className="flex-1"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Location</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <span className="font-semibold">{locationToDelete?.name}</span>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  if (locationToDelete) await handleDeleteLocation(locationToDelete.id);
                  setIsDeleteDialogOpen(false);
                  setLocationToDelete(null);
                }}
                className="flex-1"
              >
                Delete
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setIsDeleteDialogOpen(false); setLocationToDelete(null); }}
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

// Add required roles for authentication
// LocationsPage.requireAuth = true;
// LocationsPage.requiredRoles = [UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER]; 