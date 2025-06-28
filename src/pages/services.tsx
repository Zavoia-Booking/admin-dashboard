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
// TODO: fix sonner / toast component
import { toast } from 'sonner';
import { AppLayout } from '@/components/layouts/app-layout';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
  description: string;
  status: 'enabled' | 'disabled';
  createdAt: string;
}

export default function ServicesPage() {
  const { authStore } = useStores();
  const [services, setServices] = useState<Service[]>([
    {
      id: '1',
      name: 'Haircut',
      price: 30,
      duration: 30,
      description: 'Basic haircut service including consultation and styling',
      status: 'enabled',
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      name: 'Hair Coloring',
      price: 80,
      duration: 120,
      description: 'Full hair coloring service with premium products',
      status: 'enabled',
      createdAt: '2024-02-01T15:45:00Z'
    },
    {
      id: '3',
      name: 'Manicure',
      price: 25,
      duration: 45,
      description: 'Classic manicure with polish',
      status: 'disabled',
      createdAt: '2024-01-20T09:15:00Z'
    },
    {
      id: '4',
      name: 'Pedicure',
      price: 45,
      duration: 60,
      description: 'Luxury pedicure with massage',
      status: 'enabled',
      createdAt: '2024-01-10T14:20:00Z'
    },
    {
      id: '5',
      name: 'Facial Treatment',
      price: 60,
      duration: 60,
      description: 'Deep cleansing facial with mask',
      status: 'enabled',
      createdAt: '2024-02-05T11:30:00Z'
    }
  ]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newService, setNewService] = useState({
    name: '',
    price: 0,
    duration: 0,
    description: '',
    status: 'enabled' as const,
  });

  // Fetch services on component mount
  useEffect(() => {
    // No API call needed - using mock data in state
    // fetchServices();
  }, []);

  const fetchServices = async () => {
    // Mock implementation - no API call
    // Services are already in state
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Mock implementation - add to local state
      const newServiceWithId: Service = {
        id: Date.now().toString(),
        ...newService,
        createdAt: new Date().toISOString()
      };
      
      setServices(prev => [...prev, newServiceWithId]);
      toast.success('Service created successfully');
      setIsCreateDialogOpen(false);
      setNewService({ name: '', price: 0, duration: 0, description: '', status: 'enabled' });
    } catch (error) {
      toast.error('Failed to create service');
    }
  };

  const handleEditService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    try {
      // Mock implementation - update in local state
      setServices(prev => prev.map(service => 
        service.id === editingService.id ? editingService : service
      ));
      
      toast.success('Service updated successfully');
      setIsEditDialogOpen(false);
      setEditingService(null);
    } catch (error) {
      toast.error('Failed to update service');
    }
  };

  const handleToggleServiceStatus = async (service: Service) => {
    try {
      const newStatus: 'enabled' | 'disabled' = service.status === 'enabled' ? 'disabled' : 'enabled';
      const updatedService = { ...service, status: newStatus };
      
      // Mock implementation - update in local state
      setServices(prev => prev.map(s => 
        s.id === service.id ? updatedService : s
      ));
      
      toast.success(`Service ${newStatus} successfully`);
    } catch (error) {
      toast.error('Failed to update service status');
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      // Mock implementation - remove from local state
      setServices(prev => prev.filter(service => service.id !== id));
      toast.success('Service deleted successfully');
    } catch (error) {
      toast.error('Failed to delete service');
    }
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setIsEditDialogOpen(true);
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Services</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Service</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateService} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Service Name</Label>
                  <Input
                    id="name"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newService.price}
                      onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={newService.duration}
                      onChange={(e) => setNewService({ ...newService, duration: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Create Service
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Service</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditService} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Service Name</Label>
                <Input
                  id="editName"
                  value={editingService?.name || ''}
                  onChange={(e) => setEditingService(prev => prev ? { ...prev, name: e.target.value } : null)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editPrice">Price ($)</Label>
                  <Input
                    id="editPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingService?.price || 0}
                    onChange={(e) => setEditingService(prev => prev ? { ...prev, price: parseFloat(e.target.value) } : null)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editDuration">Duration (minutes)</Label>
                  <Input
                    id="editDuration"
                    type="number"
                    min="1"
                    value={editingService?.duration || 0}
                    onChange={(e) => setEditingService(prev => prev ? { ...prev, duration: parseInt(e.target.value) } : null)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={editingService?.description || ''}
                  onChange={(e) => setEditingService(prev => prev ? { ...prev, description: e.target.value } : null)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editStatus">Status</Label>
                <select
                  id="editStatus"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={editingService?.status || 'enabled'}
                  onChange={(e) => setEditingService(prev => prev ? { ...prev, status: e.target.value as 'enabled' | 'disabled' } : null)}
                >
                  <option value="enabled">Enabled</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
              <Button type="submit" className="w-full">
                Update Service
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell>{service.name}</TableCell>
                <TableCell>${service.price.toFixed(2)}</TableCell>
                <TableCell>{service.duration} min</TableCell>
                <TableCell className="max-w-md truncate">{service.description}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    service.status === 'enabled' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell>{new Date(service.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleToggleServiceStatus(service)}
                      title={service.status === 'enabled' ? 'Disable Service' : 'Enable Service'}
                    >
                      {service.status === 'enabled' ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditDialog(service)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteService(service.id)}
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
// ServicesPage.requireAuth = true;
// ServicesPage.requiredRoles = [UserRole.ADMIN, UserRole.TEAM_MEMBER]; 