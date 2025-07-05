'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, PowerOff, Power, Filter, Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
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

  // Filter and pagination state
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    minPrice: '',
    maxPrice: '',
    minDuration: '',
    maxDuration: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    status: 'all',
    minPrice: '',
    maxPrice: '',
    minDuration: '',
    maxDuration: '',
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

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

  // Filter and pagination logic
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = appliedFilters.search === '' || 
        service.name.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
        service.description.toLowerCase().includes(appliedFilters.search.toLowerCase());
      
      const matchesStatus = appliedFilters.status === 'all' || service.status === appliedFilters.status;
      
      const matchesMinPrice = appliedFilters.minPrice === '' || service.price >= parseFloat(appliedFilters.minPrice);
      const matchesMaxPrice = appliedFilters.maxPrice === '' || service.price <= parseFloat(appliedFilters.maxPrice);
      
      const matchesMinDuration = appliedFilters.minDuration === '' || service.duration >= parseInt(appliedFilters.minDuration);
      const matchesMaxDuration = appliedFilters.maxDuration === '' || service.duration <= parseInt(appliedFilters.maxDuration);
      
      return matchesSearch && matchesStatus && matchesMinPrice && matchesMaxPrice && matchesMinDuration && matchesMaxDuration;
    });
  }, [services, appliedFilters]);

  const paginatedServices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredServices.slice(startIndex, endIndex);
  }, [filteredServices, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);

  // Filter handlers
  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
    setCurrentPage(1); // Reset to first page when applying filters
  };

  const handleRemoveFilters = () => {
    setFilters({ search: '', status: 'all', minPrice: '', maxPrice: '', minDuration: '', maxDuration: '' });
    setAppliedFilters({ search: '', status: 'all', minPrice: '', maxPrice: '', minDuration: '', maxDuration: '' });
    setCurrentPage(1);
  };

  const hasActiveFilters = appliedFilters.search !== '' || appliedFilters.status !== 'all' || 
    appliedFilters.minPrice !== '' || appliedFilters.maxPrice !== '' || 
    appliedFilters.minDuration !== '' || appliedFilters.maxDuration !== '';

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Fetch services on component mount
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/services');
      // const data = await response.json();
      // setServices(data);
    } catch (_error) {
      toast.error('Failed to fetch services');
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Show confirmation dialog instead of immediately creating
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
      const newServiceWithId: Service = {
        id: Date.now().toString(),
        ...pendingAction.createData,
        createdAt: new Date().toISOString()
      };
      
      setServices(prev => [...prev, newServiceWithId]);
      toast.success('Service created successfully');
      setIsCreateDialogOpen(false);
      setNewService({ name: '', price: 0, duration: 0, description: '', status: 'enabled' });
      fetchServices();
    } catch (_error) {
      toast.error('Failed to create service');
    } finally {
      setIsConfirmDialogOpen(false);
      setPendingAction(null);
    }
  };

  const handleEditService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    // Show confirmation dialog instead of immediately updating
    setPendingAction({
      type: 'update',
      updateData: editingService
    });
    setIsConfirmDialogOpen(true);
  };

  const confirmUpdate = async () => {
    if (!pendingAction || pendingAction.type !== 'update' || !pendingAction.updateData) return;

    try {
      // TODO: Replace with actual API call
      setServices(prev => prev.map(service => 
        service.id === pendingAction.updateData!.id ? pendingAction.updateData! : service
      ));
      
      toast.success('Service updated successfully');
      setIsEditDialogOpen(false);
      setEditingService(null);
    } catch (_error) {
      toast.error('Failed to update service');
    } finally {
      setIsConfirmDialogOpen(false);
      setPendingAction(null);
    }
  };

  const handleToggleServiceStatus = async (service: Service) => {
    const newStatus = service.status === 'enabled' ? 'disabled' : 'enabled';
    
    // Show confirmation dialog
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
      setServices(prev => prev.map(service => 
        service.id === pendingAction.toggleStatusData!.id 
          ? { ...service, status: pendingAction.toggleStatusData!.newStatus as 'enabled' | 'disabled' }
          : service
      ));
      
      const actionText = pendingAction.toggleStatusData.newStatus === 'enabled' ? 'enabled' : 'disabled';
      toast.success(`Service ${actionText} successfully`);
    } catch (_error) {
      toast.error('Failed to update service status');
    } finally {
      setIsConfirmDialogOpen(false);
      setPendingAction(null);
    }
  };

  const handleDeleteService = async (id: string) => {
    const service = services.find(s => s.id === id);
    setPendingAction({
      type: 'delete',
      serviceId: id,
      serviceName: service ? service.name : undefined
    });
    setIsConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingAction) return;

    try {
      // TODO: Replace with actual API call
      setServices(prev => prev.filter(service => service.id !== pendingAction.serviceId));
      toast.success('Service deleted successfully');
      fetchServices();
    } catch (_error) {
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
    if (!pendingAction) return { title: '', description: '' };

    if (pendingAction.type === 'delete') {
      return {
        title: 'Delete Service',
        description: `Are you sure you want to delete ${pendingAction.serviceName || 'this service'}? This action cannot be undone.`
      };
    } else if (pendingAction.type === 'create') {
      return {
        title: 'Create Service',
        description: `Are you sure you want to create the service "${pendingAction.createData?.name}"?`
      };
    } else if (pendingAction.type === 'update') {
      return {
        title: 'Update Service',
        description: `Are you sure you want to update ${pendingAction.updateData?.name}?`
      };
    } else if (pendingAction.type === 'toggleStatus') {
      const actionText = pendingAction.toggleStatusData?.newStatus === 'enabled' ? 'enable' : 'disable';
      return {
        title: `${pendingAction.toggleStatusData?.newStatus === 'enabled' ? 'Enable' : 'Disable'} Service`,
        description: `Are you sure you want to ${actionText} ${pendingAction.toggleStatusData?.name}?`
      };
    }
    
    return { title: '', description: '' };
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-10">
        <div className="bg-white rounded-xl shadow-sm p-8">
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
                  <DialogDescription>
                    Create a new service for your business.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateService} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Service Name</Label>
                    <Input
                      id="name"
                      value={newService.name}
                      onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                      placeholder="Enter service name"
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
                        onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
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
                        onChange={(e) => setNewService({ ...newService, duration: parseInt(e.target.value) || 0 })}
                        placeholder="30"
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
                      placeholder="Describe your service..."
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

          {/* Confirmation Dialog */}
          <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{getConfirmDialogContent().title}</DialogTitle>
                <DialogDescription>
                  {getConfirmDialogContent().description}
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsConfirmDialogOpen(false);
                    setPendingAction(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={pendingAction?.type === 'delete' ? confirmDelete : 
                          pendingAction?.type === 'create' ? confirmCreate : 
                          pendingAction?.type === 'update' ? confirmUpdate :
                          pendingAction?.type === 'toggleStatus' ? confirmToggleStatus : undefined}
                >
                  {pendingAction?.type === 'delete' ? 'Delete' : 
                   pendingAction?.type === 'create' ? 'Create Service' : 
                   pendingAction?.type === 'update' ? 'Update' :
                   pendingAction?.type === 'toggleStatus' ? (pendingAction.toggleStatusData?.newStatus === 'enabled' ? 'Enable' : 'Disable') : ''}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

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
                      onChange={(e) => setEditingService(prev => prev ? { ...prev, price: parseFloat(e.target.value) || 0 } : null)}
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
                      onChange={(e) => setEditingService(prev => prev ? { ...prev, duration: parseInt(e.target.value) || 0 } : null)}
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
                  <Select
                    value={editingService?.status || 'enabled'}
                    onValueChange={(value) => setEditingService(prev => prev ? { ...prev, status: value as 'enabled' | 'disabled' } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enabled">Enabled</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  Update Service
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Filters Section */}
          <div className="mb-6">
            <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <div className="flex items-center justify-between">
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                    {isFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">
                    {[
                      appliedFilters.search !== '',
                      appliedFilters.status !== 'all',
                      appliedFilters.minPrice !== '',
                      appliedFilters.maxPrice !== '',
                      appliedFilters.minDuration !== '',
                      appliedFilters.maxDuration !== ''
                    ].filter(Boolean).length} active filter{[
                      appliedFilters.search !== '',
                      appliedFilters.status !== 'all',
                      appliedFilters.minPrice !== '',
                      appliedFilters.maxPrice !== '',
                      appliedFilters.minDuration !== '',
                      appliedFilters.maxDuration !== ''
                    ].filter(Boolean).length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              
              <CollapsibleContent className="mt-4">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="search">Search</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="search"
                          placeholder="Search by name or description..."
                          value={filters.search}
                          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="statusFilter">Status</Label>
                      <Select
                        value={filters.status}
                        onValueChange={(value) => setFilters({ ...filters, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="enabled">Enabled</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Price Range ($)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Min"
                          value={filters.minPrice}
                          onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                        />
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Max"
                          value={filters.maxPrice}
                          onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label>Duration Range (minutes)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="1"
                          placeholder="Min"
                          value={filters.minDuration}
                          onChange={(e) => setFilters({ ...filters, minDuration: e.target.value })}
                        />
                        <Input
                          type="number"
                          min="1"
                          placeholder="Max"
                          value={filters.maxDuration}
                          onChange={(e) => setFilters({ ...filters, maxDuration: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleApplyFilters}>
                      Apply Filters
                    </Button>
                    <Button variant="outline" onClick={handleRemoveFilters}>
                      Remove Filters
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <Table className="rounded-xl bg-white overflow-hidden">
            <TableHeader>
              <TableRow className="bg-gray-100 border-b-2 border-gray-200">
                <TableHead className="font-semibold text-gray-700 px-6 py-4">Name</TableHead>
                <TableHead className="font-semibold text-gray-700 px-6 py-4">Price</TableHead>
                <TableHead className="font-semibold text-gray-700 px-6 py-4">Duration</TableHead>
                <TableHead className="font-semibold text-gray-700 px-6 py-4">Description</TableHead>
                <TableHead className="font-semibold text-gray-700 px-6 py-4">Status</TableHead>
                <TableHead className="font-semibold text-gray-700 px-6 py-4">Created At</TableHead>
                <TableHead className="text-right font-semibold text-gray-700 px-6 py-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedServices.map((service, index) => (
                <TableRow key={service.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors border-b border-gray-200`}>
                  <TableCell className="font-medium px-6 py-4">{service.name}</TableCell>
                  <TableCell className="px-6 py-4">${service.price.toFixed(2)}</TableCell>
                  <TableCell className="px-6 py-4">{service.duration} min</TableCell>
                  <TableCell className="px-6 py-4 max-w-md">
                    <div className="truncate" title={service.description}>
                      {service.description}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      service.status === 'enabled' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">{new Date(service.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right px-6 py-4">
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

          {/* Pagination */}
          {filteredServices.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredServices.length)} of {filteredServices.length} results
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="itemsPerPage" className="text-sm text-gray-500">
                    Items per page:
                  </Label>
                  <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first page, last page, current page, and pages around current page
                      return page === 1 || 
                             page === totalPages || 
                             (page >= currentPage - 1 && page <= currentPage + 1);
                    })
                    .map((page, index, array) => {
                      const prevPage = array[index - 1];
                      const showEllipsis = prevPage && page > prevPage + 1;
                      
                      return (
                        <React.Fragment key={page}>
                          {showEllipsis && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        </React.Fragment>
                      );
                    })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {filteredServices.length === 0 && (
            <div className="mt-6 text-center py-8 text-gray-500">
              {hasActiveFilters ? 'No services match the current filters.' : 'No services found.'}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

// Add required roles for authentication
// ServicesPage.requireAuth = true;
// ServicesPage.requiredRoles = [UserRole.ADMIN, UserRole.TEAM_MEMBER]; 