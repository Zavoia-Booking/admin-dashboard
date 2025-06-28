'use client';

import React, { useState, useEffect } from 'react';
import { UserRole } from '@/types/auth';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Power, PowerOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStores } from '@/pages/_app';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layouts/app-layout';

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
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    email: '',
    phoneNumber: '',
    description: '',
    workingHours: defaultWorkingHours,
    status: 'active' as const,
  });

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
    if (!confirm('Are you sure you want to delete this location?')) return;

    try {
      // TODO: Replace with actual API call
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
    if (editingLocation) {
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
    }
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
        <Label>Working Hours</Label>
        {days.map(({ key, label }) => (
          <div key={key} className="flex items-center space-x-4 p-3 border rounded-lg">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`${key}-open`}
                checked={workingHours[key].isOpen}
                onChange={(e) => updateFn(key, 'isOpen', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor={`${key}-open`} className="w-20">{label}</Label>
            </div>
            {workingHours[key].isOpen && (
              <>
                <Input
                  type="time"
                  value={workingHours[key].open}
                  onChange={(e) => updateFn(key, 'open', e.target.value)}
                  className="w-24"
                />
                <span>to</span>
                <Input
                  type="time"
                  value={workingHours[key].close}
                  onChange={(e) => updateFn(key, 'close', e.target.value)}
                  className="w-24"
                />
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Locations</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Location
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Location</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateLocation} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Location Name</Label>
                  <Input
                    id="name"
                    value={newLocation.name}
                    onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={newLocation.address}
                    onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newLocation.email}
                      onChange={(e) => setNewLocation({ ...newLocation, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={newLocation.phoneNumber}
                      onChange={(e) => setNewLocation({ ...newLocation, phoneNumber: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newLocation.description}
                    onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                    required
                  />
                </div>
                {renderWorkingHoursForm(newLocation.workingHours, updateNewLocationWorkingHours)}
                <Button type="submit" className="w-full">
                  Create Location
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Location</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditLocation} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Location Name</Label>
                <Input
                  id="editName"
                  value={editingLocation?.name || ''}
                  onChange={(e) => setEditingLocation(prev => prev ? { ...prev, name: e.target.value } : null)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editAddress">Address</Label>
                <Textarea
                  id="editAddress"
                  value={editingLocation?.address || ''}
                  onChange={(e) => setEditingLocation(prev => prev ? { ...prev, address: e.target.value } : null)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editEmail">Email</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={editingLocation?.email || ''}
                    onChange={(e) => setEditingLocation(prev => prev ? { ...prev, email: e.target.value } : null)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPhoneNumber">Phone Number</Label>
                  <Input
                    id="editPhoneNumber"
                    type="tel"
                    value={editingLocation?.phoneNumber || ''}
                    onChange={(e) => setEditingLocation(prev => prev ? { ...prev, phoneNumber: e.target.value } : null)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={editingLocation?.description || ''}
                  onChange={(e) => setEditingLocation(prev => prev ? { ...prev, description: e.target.value } : null)}
                  required
                />
              </div>
              {editingLocation && renderWorkingHoursForm(editingLocation.workingHours, updateWorkingHours)}
              <div className="space-y-2">
                <Label htmlFor="editStatus">Status</Label>
                <select
                  id="editStatus"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={editingLocation?.status || 'active'}
                  onChange={(e) => setEditingLocation(prev => prev ? { ...prev, status: e.target.value as 'active' | 'inactive' } : null)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <Button type="submit" className="w-full">
                Update Location
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.map((location) => (
              <TableRow key={location.id}>
                <TableCell className="font-medium">{location.name}</TableCell>
                <TableCell className="max-w-xs truncate">{location.address}</TableCell>
                <TableCell>{location.email}</TableCell>
                <TableCell>{location.phoneNumber}</TableCell>
                <TableCell className="max-w-md truncate">{location.description}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    location.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {location.status.charAt(0).toUpperCase() + location.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell>{new Date(location.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleToggleLocationStatus(location)}
                      title={location.status === 'active' ? 'Deactivate Location' : 'Activate Location'}
                    >
                      {location.status === 'active' ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditDialog(location)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteLocation(location.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
}

// Add required roles for authentication
// LocationsPage.requireAuth = true;
// LocationsPage.requiredRoles = [UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER]; 