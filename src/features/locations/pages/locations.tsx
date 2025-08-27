'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, MapPin, Clock, Phone, Mail, Search, Filter, X, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../shared/components/ui/dialog";
import { toast } from 'sonner';
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import { Badge } from "../../../shared/components/ui/badge";
import AddLocationSlider from '../components/AddLocationSlider';
import EditLocationSlider from '../components/EditLocationSlider';
import EditWorkingHoursSlider from '../components/EditWorkingHoursSlider';
import { FilterPanel } from '../../../shared/components/common/FilterPanel';
import { mockLocations } from '../../../mocks/locations.mock';
import type { LocationType } from '../../../shared/types/location';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';

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

// Helper to get short day names
const shortDay = (day: string) => {
  const map: Record<string, string> = {
    monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun'
  };
  return map[day.toLowerCase()] || day;
};

export default function LocationsPage() {
  const [locations, setLocations] = useState<LocationType[]>(mockLocations);
  const [isCreateSliderOpen, setIsCreateSliderOpen] = useState(false);
  const [isEditSliderOpen, setIsEditSliderOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Local filter state (used in filter card only)
  const [localStatusFilter, setLocalStatusFilter] = useState(statusFilter);
  
  const [isWorkingHoursSliderOpen, setIsWorkingHoursSliderOpen] = useState(false);
  const [editingWorkingHoursLocation, setEditingWorkingHoursLocation] = useState<LocationType | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<LocationType | null>(null);
  const [isDayEditModalOpen, setIsDayEditModalOpen] = useState(false);
  const [editingDayData, setEditingDayData] = useState<{
    location: LocationType;
    day: string;
    dayLabel: string;
  } | null>(null);

  // Fetch locations on component mount
  useEffect(() => {
    fetchLocations();
  }, []);

  // When opening the filter card, sync local state with main state
  React.useEffect(() => {
    if (showFilters) {
      setLocalStatusFilter(statusFilter);
    }
  }, [showFilters, statusFilter]);

  // Calculate number of active filters
  const activeFiltersCount = [
    !!searchTerm,
    statusFilter !== 'all'
  ].filter(Boolean).length;

  const fetchLocations = async () => {
    setLocations(mockLocations);
  };

  const handleCreateLocationSlider = async (locationData: {
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
  }) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });

      if (!response.ok) throw new Error('Failed to create location');

      toast.success('Location created successfully');
      setIsCreateSliderOpen(false);
      fetchLocations();
    } catch (error) {
      toast.error('Failed to create location');
    }
  };

  const handleEditLocationSlider = async (locationData: LocationType) => {
    try {
      const response = await fetch(`/api/locations/${locationData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });

      if (!response.ok) throw new Error('Failed to update location');

      toast.success('Location updated successfully');
      setIsEditSliderOpen(false);
      setEditingLocation(null);
      fetchLocations();
    } catch (error) {
      toast.error('Failed to update location');
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

  const openEditSlider = (location: LocationType) => {
    setEditingLocation(location);
    setIsEditSliderOpen(true);
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

  const openDayEditModal = (location: LocationType, day: string, dayLabel: string) => {
    setEditingDayData({ location, day, dayLabel });
    setIsDayEditModalOpen(true);
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
            className={`
              relative flex items-center justify-center h-9 w-9 rounded-md border border-input transition-all duration-200 ease-out
              ${showFilters
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-white text-muted-foreground hover:text-foreground hover:bg-muted/50'}
            `}
            onClick={() => setShowFilters(v => !v)}
            aria-label="Show filters"
          >
            <Filter className={`h-5 w-5 ${showFilters ? 'text-primary-foreground' : ''}`} />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] flex items-center justify-center shadow">
                {activeFiltersCount}
              </span>
            )}
          </button>
          <Button
            className="h-11 px-4 rounded-lg bg-black hover:bg-gray-800 flex items-center gap-2"
            onClick={() => setIsCreateSliderOpen(true)}
          >
            <Plus className="h-5 w-5" />
            <span className="font-semibold">Add Location</span>
          </Button>
        </div>
        
        {/* Filter Panel (dropdown style) */}
        {showFilters && (
          <FilterPanel
            open={showFilters}
            onOpenChange={setShowFilters}
            fields={[
              {
                type: 'select',
                key: 'status',
                label: 'Status',
                value: localStatusFilter,
                options: [
                  { value: 'all', label: 'All statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ],
                searchable: true,
              },
              {
                type: 'text',
                key: 'search',
                label: 'Search',
                value: searchTerm,
                placeholder: 'Search locations...'
              },
            ]}
            onApply={values => {
              setStatusFilter(values.status);
              setSearchTerm(values.search);
              setShowFilters(false);
            }}
            onClear={() => {
              setStatusFilter('all');
              setSearchTerm('');
            }}
          />
        )}
        {/* Active Filter Badges - Always show when there are active filters */}
        {(searchTerm || statusFilter !== 'all') && (
          <div className="flex flex-wrap gap-2 mb-2">
            {searchTerm && (
              <Badge 
                variant="secondary" 
                className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                onClick={() => setSearchTerm('')}
              >
                {`Search: "{searchTerm}"`}
                <X className="h-4 w-4 ml-1" />
              </Badge>
            )}
            {statusFilter !== 'all' && (
              <Badge 
                variant="secondary" 
                className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                onClick={() => setStatusFilter('all')}
              >
                Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                <X className="h-4 w-4 ml-1" />
              </Badge>
            )}
          </div>
        )}

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
              {/* Top Row: Name and Status */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-lg truncate">{location.name}</span>
                {getStatusBadge(location.status)}
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
              {/* Actions Row at Bottom */}
              <hr className="my-2 border-gray-200" />
              <div className="flex items-center justify-end gap-2 mt-2">
                <div
                  className="flex items-center justify-center h-8 w-8 rounded hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
                  title="Edit Working Hours"
                  aria-label="Edit Working Hours"
                  onClick={() => { setEditingWorkingHoursLocation(location); setIsWorkingHoursSliderOpen(true); }}
                >
                  <Clock className="h-5 w-5" />
                </div>
                <div
                  className="flex items-center justify-center h-8 w-8 rounded hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
                  title="Edit Location"
                  aria-label="Edit Location"
                  onClick={() => openEditSlider(location)}
                >
                  <Edit className="h-5 w-5" />
                </div>
                <div
                  className="flex items-center justify-center h-8 w-8 rounded hover:bg-red-50 active:bg-red-100 text-red-600 transition-colors cursor-pointer"
                  title="Delete Location"
                  aria-label="Delete Location"
                  onClick={() => { setLocationToDelete(location); setIsDeleteDialogOpen(true); }}
                >
                  <Trash2 className="h-5 w-5" />
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
              <Button onClick={() => setIsCreateSliderOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Location
              </Button>
            </div>
          )
        )}

        {/* Edit Dialog - Replaced with EditLocationSlider */}

        {/* Working Hours Slider */}
        <EditWorkingHoursSlider 
          isOpen={isWorkingHoursSliderOpen}
          onClose={() => {
            setIsWorkingHoursSliderOpen(false);
            setEditingWorkingHoursLocation(null);
          }}
          onUpdate={async (locationData) => {
            try {
              const response = await fetch(`/api/locations/${locationData.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(locationData),
              });

              if (!response.ok) throw new Error('Failed to update working hours');

              toast.success('Working hours updated successfully');
              fetchLocations();
            } catch (error) {
              toast.error('Failed to update working hours');
            }
          }}
          location={editingWorkingHoursLocation}
        />

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
                          onClick={(e) => e.currentTarget.showPicker?.()}
                          className="h-10 text-center cursor-pointer"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600 mb-1 block">Closing Time</Label>
                        <Input
                          type="time"
                          value={currentDayHours.close}
                          onChange={(e) => updateLocationDayHours(editingDayData.location.id, editingDayData.day, 'close', e.target.value)}
                          onClick={(e) => e.currentTarget.showPicker?.()}
                          className="h-10 text-center cursor-pointer"
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

        {/* Add Location Slider */}
        <AddLocationSlider 
          isOpen={isCreateSliderOpen}
          onClose={() => setIsCreateSliderOpen(false)}
          onCreate={handleCreateLocationSlider}
        />
        
        {/* Edit Location Slider */}
        <EditLocationSlider 
          isOpen={isEditSliderOpen}
          onClose={() => setIsEditSliderOpen(false)}
          onUpdate={handleEditLocationSlider}
          location={editingLocation}
        />
      </div>
    </AppLayout>
  );
}

// Add required roles for authentication
// LocationsPage.requireAuth = true;
// LocationsPage.requiredRoles = [UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER]; 