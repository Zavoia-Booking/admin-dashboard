'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Edit, Trash2, PowerOff, Power, Filter, Search, Plus, Clock, DollarSign, MoreVertical, X, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { AppLayout } from '@/components/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
  description: string;
  status: 'enabled' | 'disabled';
  createdAt: string;
  category?: string;
  bookings?: number;
  staff?: string[];
}

export default function ServicesPage() {
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
    },
    {
      id: '6',
      name: 'Hot Stone Massage',
      price: 120,
      duration: 90,
      description: 'Relaxing hot stone massage therapy',
      status: 'enabled',
      createdAt: '2024-02-08T12:15:00Z'
    },
    {
      id: '7',
      name: 'Eyebrow Shaping',
      price: 20,
      duration: 20,
      description: 'Professional eyebrow shaping and trimming',
      status: 'disabled',
      createdAt: '2024-02-12T16:30:00Z'
    },
    {
      id: '8',
      name: 'Deep Conditioning',
      price: 40,
      duration: 45,
      description: 'Intensive hair conditioning treatment',
      status: 'enabled',
      createdAt: '2024-02-15T10:45:00Z'
    }
  ]);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [durationRange, setDurationRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newService, setNewService] = useState({
    name: '',
    price: 0,
    duration: 0,
    description: '',
    status: 'enabled' as const,
  });
  const [pendingAction, setPendingAction] = useState<{
    type: 'delete' | 'create' | 'update' | 'toggleStatus';
    serviceId?: string;
    serviceName?: string;
    createData?: typeof newService;
    updateData?: Service;
    toggleStatusData?: { id: string; name: string; currentStatus: string; newStatus: string };
  } | null>(null);

  // Filter logic
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = searchTerm === '' || 
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
      
      const matchesMinPrice = priceRange.min === '' || service.price >= parseFloat(priceRange.min);
      const matchesMaxPrice = priceRange.max === '' || service.price <= parseFloat(priceRange.max);
      
      const matchesMinDuration = durationRange.min === '' || service.duration >= parseInt(durationRange.min);
      const matchesMaxDuration = durationRange.max === '' || service.duration <= parseInt(durationRange.max);
      
      return matchesSearch && matchesStatus && matchesMinPrice && matchesMaxPrice && matchesMinDuration && matchesMaxDuration;
    });
  }, [services, searchTerm, statusFilter, priceRange, durationRange]);

  const fetchServices = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/services');
      const data = await response.json();
      setServices(data);
    } catch (error) {
      toast.error('Failed to fetch services');
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setPendingAction({
      type: 'create',
      createData: { ...newService }
    });
    setIsConfirmDialogOpen(true);
  };

  const confirmCreate = async () => {
    if (!pendingAction || pendingAction.type !== 'create' || !pendingAction.createData) return;

    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pendingAction.createData),
      });

      if (!response.ok) throw new Error('Failed to create service');

      toast.success('Service created successfully');
      setIsCreateDialogOpen(false);
      setNewService({ name: '', price: 0, duration: 0, description: '', status: 'enabled' });
      fetchServices();
    } catch (error) {
      toast.error('Failed to create service');
    } finally {
      setIsConfirmDialogOpen(false);
      setPendingAction(null);
    }
  };

  const handleEditService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingService) return;

    setPendingAction({
      type: 'update',
      updateData: { ...editingService }
    });
    setIsConfirmDialogOpen(true);
  };

  const confirmUpdate = async () => {
    if (!pendingAction || pendingAction.type !== 'update' || !pendingAction.updateData) return;

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/services/${pendingAction.updateData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pendingAction.updateData),
      });

      if (!response.ok) throw new Error('Failed to update service');

      toast.success('Service updated successfully');
      setIsEditDialogOpen(false);
      setEditingService(null);
      fetchServices();
    } catch (error) {
      toast.error('Failed to update service');
    } finally {
      setIsConfirmDialogOpen(false);
      setPendingAction(null);
    }
  };

  const handleToggleServiceStatus = async (service: Service) => {
    const newStatus = service.status === 'enabled' ? 'disabled' : 'enabled';
    
    setPendingAction({
      type: 'toggleStatus',
      toggleStatusData: {
        id: service.id,
        name: service.name,
        currentStatus: service.status,
        newStatus: newStatus
      }
    });
    setIsConfirmDialogOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!pendingAction || pendingAction.type !== 'toggleStatus' || !pendingAction.toggleStatusData) return;

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/services/${pendingAction.toggleStatusData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: pendingAction.toggleStatusData.newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update service status');

      toast.success(`Service ${pendingAction.toggleStatusData.newStatus} successfully`);
      fetchServices();
    } catch (error) {
      toast.error('Failed to update service status');
    } finally {
      setIsConfirmDialogOpen(false);
      setPendingAction(null);
    }
  };

  const handleDeleteService = async (id: string) => {
    setPendingAction({
      type: 'delete',
      serviceId: id,
      serviceName: services.find(s => s.id === id)?.name
    });
    setIsConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingAction || pendingAction.type !== 'delete' || !pendingAction.serviceId) return;

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/services/${pendingAction.serviceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete service');

      toast.success('Service deleted successfully');
      fetchServices();
    } catch (error) {
      toast.error('Failed to delete service');
    } finally {
      setIsConfirmDialogOpen(false);
      setPendingAction(null);
    }
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setIsEditDialogOpen(true);
  };

  const getConfirmDialogContent = () => {
    if (!pendingAction) return null;

    switch (pendingAction.type) {
      case 'create':
        return {
          title: 'Create Service',
          description: `Are you sure you want to create the service "${pendingAction.createData?.name}"?`,
          confirmText: 'Create Service',
          onConfirm: confirmCreate
        };
      case 'update':
        return {
          title: 'Update Service',
          description: `Are you sure you want to update "${pendingAction.updateData?.name}"?`,
          confirmText: 'Update',
          onConfirm: confirmUpdate
        };
      case 'toggleStatus':
        return {
          title: 'Update Status',
          description: `Are you sure you want to ${pendingAction.toggleStatusData?.newStatus} the service "${pendingAction.toggleStatusData?.name}"?`,
          confirmText: 'Update Status',
          onConfirm: confirmToggleStatus
        };
      case 'delete':
        return {
          title: 'Delete Service',
          description: `Are you sure you want to delete "${pendingAction.serviceName}"? This action cannot be undone.`,
          confirmText: 'Delete',
          onConfirm: confirmDelete
        };
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'enabled':
        return <Badge className="bg-green-100 text-green-800 w-fit">Enabled</Badge>;
      case 'disabled':
        return <Badge className="bg-gray-100 text-gray-800 w-fit">Disabled</Badge>;
      default:
        return <Badge className="w-fit">{status}</Badge>;
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  const confirmDialogContent = getConfirmDialogContent();

  return (
    <AppLayout>
      <div className="space-y-4 max-w-2xl mx-auto">
        {/* Top Controls: Search, Filter, Add */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-11 text-base pr-12 pl-4 rounded-lg border border-input bg-white"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
          <button
            className="flex items-center justify-center h-11 w-11 rounded-lg border border-input bg-white hover:bg-muted transition-colors"
            onClick={() => setShowFilters(v => !v)}
            aria-label="Show filters"
          >
            <Filter className="h-5 w-5 text-gray-500" />
          </button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-11 px-4 rounded-lg bg-black hover:bg-gray-800 flex items-center gap-2">
                <Plus className="h-5 w-5" />
                <span className="font-semibold">Add Service</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Service</DialogTitle>
                <DialogDescription>
                  Create a new service for your business.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateService} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="mb-2 block">Service Name</Label>
                  <Input
                    id="name"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price" className="mb-2 block">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newService.price}
                      onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration" className="mb-2 block">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={newService.duration}
                      onChange={(e) => setNewService({ ...newService, duration: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description" className="mb-2 block">Description</Label>
                  <Textarea
                    id="description"
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">Create Service</Button>
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
          {priceRange.min && (
            <span className="inline-flex items-center bg-muted px-3 py-1 rounded-full text-sm">
              Min Price: ${priceRange.min}
              <button className="ml-2" onClick={() => setPriceRange({ ...priceRange, min: '' })}><X className="h-4 w-4" /></button>
            </span>
          )}
          {priceRange.max && (
            <span className="inline-flex items-center bg-muted px-3 py-1 rounded-full text-sm">
              Max Price: ${priceRange.max}
              <button className="ml-2" onClick={() => setPriceRange({ ...priceRange, max: '' })}><X className="h-4 w-4" /></button>
            </span>
          )}
          {durationRange.min && (
            <span className="inline-flex items-center bg-muted px-3 py-1 rounded-full text-sm">
              Min Duration: {durationRange.min}m
              <button className="ml-2" onClick={() => setDurationRange({ ...durationRange, min: '' })}><X className="h-4 w-4" /></button>
            </span>
          )}
          {durationRange.max && (
            <span className="inline-flex items-center bg-muted px-3 py-1 rounded-full text-sm">
              Max Duration: {durationRange.max}m
              <button className="ml-2" onClick={() => setDurationRange({ ...durationRange, max: '' })}><X className="h-4 w-4" /></button>
            </span>
          )}
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg border bg-white p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{services.length}</div>
            <div className="text-xs text-gray-500 mt-1">Total</div>
          </div>
          <div className="rounded-lg border bg-white p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{services.filter(s => s.status === 'enabled').length}</div>
            <div className="text-xs text-gray-500 mt-1">Active</div>
          </div>
          <div className="rounded-lg border bg-white p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">${Math.round(services.reduce((sum, s) => sum + s.price, 0) / (services.length || 1))}</div>
            <div className="text-xs text-gray-500 mt-1">Avg Price</div>
          </div>
          <div className="rounded-lg border bg-white p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">145</div>
            <div className="text-xs text-gray-500 mt-1">Bookings</div>
          </div>
        </div>
        
        {/* Filter Panel (dropdown style) */}
        {showFilters && (
          <div className="rounded-lg border border-input bg-white p-4 flex flex-col gap-4 shadow-md">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label className="mb-1 block">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="enabled">Enabled</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1 block">Price Range</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Min"
                    type="number"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="text-sm"
                  />
                  <Input
                    placeholder="Max"
                    type="number"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    className="text-sm"
                  />
                </div>
              </div>
              <div>
                <Label className="mb-1 block">Duration Range</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Min"
                    type="number"
                    value={durationRange.min}
                    onChange={(e) => setDurationRange({ ...durationRange, min: e.target.value })}
                    className="text-sm"
                  />
                  <Input
                    placeholder="Max"
                    type="number"
                    value={durationRange.max}
                    onChange={(e) => setDurationRange({ ...durationRange, max: e.target.value })}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => { setStatusFilter('all'); setPriceRange({ min: '', max: '' }); setDurationRange({ min: '', max: '' }); setShowFilters(false); }}>Clear filters</Button>
            </div>
          </div>
        )}
        
        {/* Services Grid */}
        <div className="space-y-3">
          {filteredServices.map((service) => {
            // Mocked data for demo
            const category = service.category || (service.id === '1' ? 'Hair Services' : service.id === '2' ? 'Wellness' : 'Skincare');
            const bookings = service.bookings || (service.id === '1' ? 45 : service.id === '2' ? 32 : 28);
            const staff = service.staff || (service.id === '1' ? ['Emma Thompson', 'David Kim'] : service.id === '2' ? ['Alex Rodriguez'] : ['Maria Garcia']);
            const isInactive = service.status === 'disabled';
            return (
              <div
                key={service.id}
                className={`rounded-xl border bg-white p-6 flex flex-col gap-2 shadow-sm ${isInactive ? 'opacity-60 pointer-events-none' : ''}`}
              >
                {/* Top Row: Name, Status, Toggle, Actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-lg truncate">{service.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold w-fit ${isInactive ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-800'}`}>{isInactive ? 'Inactive' : 'Active'}</span>
                    </div>
                    {/* Category badge */}
                    <span className="inline-block mt-2 mb-1 bg-white border px-2 py-0.5 rounded-full text-xs font-medium shadow-sm w-fit">{category}</span>
                  </div>
                  {/* Action Icons: always interactive and full opacity */}
                  <div className="flex items-center gap-1 pointer-events-auto opacity-100">
                    <Switch
                      checked={service.status === 'enabled'}
                      onCheckedChange={() => handleToggleServiceStatus(service)}
                      className={`!h-5 !w-9 !min-h-0 !min-w-0 ${service.status === 'enabled' ? 'bg-green-500' : 'bg-red-500'}`}
                    />
                    {/* Edit */}
                    <button
                      className="flex items-center justify-center h-9 w-9 rounded hover:bg-muted"
                      title="Edit"
                      onClick={() => openEditDialog(service)}
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    {/* Delete */}
                    <button
                      className="flex items-center justify-center h-9 w-9 rounded hover:bg-muted text-red-600"
                      title="Delete"
                      onClick={() => handleDeleteService(service.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                {/* Description */}
                <div className="text-sm text-gray-600 mb-2">{service.description}</div>
                {/* Info Row */}
                <div className="flex items-center gap-6 text-sm mb-2">
                  <div className="flex items-center gap-1 text-gray-700">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(service.duration)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-700">
                    <DollarSign className="h-4 w-4" />
                    <span>${service.price}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-700">
                    <Users className="h-4 w-4" />
                    <span>{bookings} booked</span>
                  </div>
                </div>
                {/* Staff Row */}
                <div className="mt-1">
                  <span className="text-xs text-gray-500 font-medium">Available Staff:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {staff.map((s) => (
                      <span key={s} className="bg-white border px-2 py-0.5 rounded-full text-xs font-medium shadow-sm">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredServices.length === 0 && (
          (searchTerm || statusFilter !== 'all' || priceRange.min || priceRange.max || durationRange.min || durationRange.max) ? (
            <div className="rounded-lg border bg-white p-8 text-center">
              <div className="mb-4 text-gray-500">No services found matching your filters.</div>
              <Button variant="outline" onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPriceRange({ min: '', max: '' });
                setDurationRange({ min: '', max: '' });
                setShowFilters(false);
              }}>
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border bg-white p-8 text-center">
              <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">💇‍♀️</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first service.</p>
            </div>
          )
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Service</DialogTitle>
              <DialogDescription>
                Update service information.
              </DialogDescription>
            </DialogHeader>
            {editingService && (
              <form onSubmit={handleEditService} className="space-y-4">
                <div>
                  <Label htmlFor="editName" className="mb-2 block">Service Name</Label>
                  <Input
                    id="editName"
                    value={editingService.name}
                    onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editPrice" className="mb-2 block">Price ($)</Label>
                    <Input
                      id="editPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingService.price}
                      onChange={(e) => setEditingService({ ...editingService, price: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="editDuration" className="mb-2 block">Duration (minutes)</Label>
                    <Input
                      id="editDuration"
                      type="number"
                      min="1"
                      value={editingService.duration}
                      onChange={(e) => setEditingService({ ...editingService, duration: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="editDescription" className="mb-2 block">Description</Label>
                  <Textarea
                    id="editDescription"
                    value={editingService.description}
                    onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">Update Service</Button>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{confirmDialogContent?.title}</DialogTitle>
              <DialogDescription>
                {confirmDialogContent?.description}
              </DialogDescription>
            </DialogHeader>
            <div className="flex space-x-2">
            <Button 
                onClick={confirmDialogContent?.onConfirm}
                className="flex-1"
              >
                {confirmDialogContent?.confirmText}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsConfirmDialogOpen(false)}
                className="flex-1"
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
// ServicesPage.requireAuth = true;
// ServicesPage.requiredRoles = [UserRole.ADMIN, UserRole.TEAM_MEMBER]; 