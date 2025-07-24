'use client';

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Filter, Search, Plus, Clock, X, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import AddServiceSlider from '@/components/AddServiceSlider';
import EditServiceSlider from '@/components/EditServiceSlider';
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { AppLayout } from '@/components/layouts/app-layout';
import { Switch } from "@/components/ui/switch";
import { FilterPanel } from '@/components/common/FilterPanel';
import { Input } from "@/components/ui/input";

interface StaffAssignment {
  name: string;
  price?: number;
  duration?: number;
}

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
  staff?: StaffAssignment[];
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

  // Local filter state (used in filter card only)
  const [localStatusFilter, setLocalStatusFilter] = useState(statusFilter);
  const [localPriceRange, setLocalPriceRange] = useState(priceRange);
  const [localDurationRange, setLocalDurationRange] = useState(durationRange);

  // Dialog states
  const [isCreateSliderOpen, setIsCreateSliderOpen] = useState(false);
  const [isEditSliderOpen, setIsEditSliderOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    type: 'delete' | 'toggleStatus';
    serviceId?: string;
    serviceName?: string;
    toggleStatusData?: { id: string; name: string; currentStatus: string; newStatus: string };
  } | null>(null);

  // When opening the filter card, sync local state with main state
  React.useEffect(() => {
    if (showFilters) {
      setLocalStatusFilter(statusFilter);
      setLocalPriceRange(priceRange);
      setLocalDurationRange(durationRange);
    }
  }, [showFilters, statusFilter, priceRange, durationRange]);

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

  const handleCreateService = async (serviceData: { name: string; price: number; duration: number; description: string; status: 'enabled' | 'disabled'; staff?: StaffAssignment[] }) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      });

      if (!response.ok) throw new Error('Failed to create service');

      toast.success('Service created successfully');
      setIsCreateSliderOpen(false);
      fetchServices();
    } catch (error) {
      toast.error('Failed to create service');
    }
  };

  const handleEditService = async (serviceData: Service) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/services/${serviceData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      });

      if (!response.ok) throw new Error('Failed to update service');

      toast.success('Service updated successfully');
      setIsEditSliderOpen(false);
      setEditingService(null);
      fetchServices();
    } catch (error) {
      toast.error('Failed to update service');
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

  const openEditSlider = (service: Service) => {
    setEditingService(service);
    setIsEditSliderOpen(true);
  };

  const getConfirmDialogContent = () => {
    if (!pendingAction) return null;

    switch (pendingAction.type) {
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  const confirmDialogContent = getConfirmDialogContent();

  // Calculate number of active filters
  const activeFiltersCount = [
    !!searchTerm,
    statusFilter !== 'all',
    !!priceRange.min,
    !!priceRange.max,
    !!durationRange.min,
    !!durationRange.max
  ].filter(Boolean).length;

  return (
    <AppLayout>
      <div className="space-y-4 max-w-2xl mx-auto">
        {/* Top Controls: Search, Filter, Add */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
            <span className="font-semibold">Add Service</span>
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
                  { value: 'enabled', label: 'Enabled' },
                  { value: 'disabled', label: 'Disabled' },
                ],
                searchable: true,
              },
              {
                type: 'text',
                key: 'priceMin',
                label: 'Min Price',
                value: localPriceRange.min,
                placeholder: 'Min',
              },
              {
                type: 'text',
                key: 'priceMax',
                label: 'Max Price',
                value: localPriceRange.max,
                placeholder: 'Max',
              },
              {
                type: 'text',
                key: 'durationMin',
                label: 'Min Duration',
                value: localDurationRange.min,
                placeholder: 'Min',
              },
              {
                type: 'text',
                key: 'durationMax',
                label: 'Max Duration',
                value: localDurationRange.max,
                placeholder: 'Max',
              },
              {
                type: 'text',
                key: 'search',
                label: 'Search',
                value: searchTerm,
                placeholder: 'Search services...'
              },
            ]}
            onApply={values => {
              setStatusFilter(values.status);
              setPriceRange({ min: values.priceMin, max: values.priceMax });
              setDurationRange({ min: values.durationMin, max: values.durationMax });
              setSearchTerm(values.search);
              setShowFilters(false);
            }}
            onClear={() => {
              setStatusFilter('all');
              setPriceRange({ min: '', max: '' });
              setDurationRange({ min: '', max: '' });
              setSearchTerm('');
            }}
          />
        )}
        
        {/* Active Filter Badges - Always show when there are active filters */}
        {(searchTerm || statusFilter !== 'all' || priceRange.min || priceRange.max || durationRange.min || durationRange.max) && (
          <div className="flex flex-wrap gap-2 mb-2">
            {searchTerm && (
              <Badge 
                variant="secondary" 
                className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                onClick={() => setSearchTerm('')}
              >
                Search: "{searchTerm}"
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
            {priceRange.min && (
              <Badge 
                variant="secondary" 
                className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                onClick={() => setPriceRange({ ...priceRange, min: '' })}
              >
                Min Price: {priceRange.min}
                <X className="h-4 w-4 ml-1" />
              </Badge>
            )}
            {priceRange.max && (
              <Badge 
                variant="secondary" 
                className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                onClick={() => setPriceRange({ ...priceRange, max: '' })}
              >
                Max Price: {priceRange.max}
                <X className="h-4 w-4 ml-1" />
              </Badge>
            )}
            {durationRange.min && (
              <Badge 
                variant="secondary" 
                className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                onClick={() => setDurationRange({ ...durationRange, min: '' })}
              >
                Min Duration: {durationRange.min}m
                <X className="h-4 w-4 ml-1" />
              </Badge>
            )}
            {durationRange.max && (
              <Badge 
                variant="secondary" 
                className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                onClick={() => setDurationRange({ ...durationRange, max: '' })}
              >
                Max Duration: {durationRange.max}m
                <X className="h-4 w-4 ml-1" />
              </Badge>
            )}
          </div>
        )}
        
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
                className={`rounded-xl border bg-white p-4 flex flex-col gap-2 shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200 ${isInactive ? 'opacity-60' : ''}`}
                onClick={() => openEditSlider(service)}
              >
                                {/* Service Name and Status Row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-lg truncate">{service.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${isInactive ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-800'}`}>{isInactive ? 'Inactive' : 'Active'}</span>
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
                    <span>${service.price}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-700">
                    <Users className="h-4 w-4" />
                    <span>{bookings} booked</span>
                  </div>
                </div>
                
                {/* Separator */}
                <div className="border-t border-gray-200"></div>
                
                {/* Action Buttons Row */}
                <div className="flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                  {/* Column 1: Toggle */}
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={service.status === 'enabled'}
                      onCheckedChange={() => handleToggleServiceStatus(service)}
                      className={`!h-5 !w-9 !min-h-0 !min-w-0`}
                    />
                  </div>
                  
                  {/* Column 2: Edit/Delete */}
                  <div className="flex items-center gap-1">
                    {/* Edit */}
                    <button
                      className="flex items-center justify-center h-9 w-9 rounded hover:bg-muted"
                      title="Edit"
                      onClick={() => openEditSlider(service)}
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

        {/* Add Service Slider */}
        <AddServiceSlider 
          isOpen={isCreateSliderOpen}
          onClose={() => setIsCreateSliderOpen(false)}
          onCreate={handleCreateService}
        />
        
        {/* Edit Service Slider */}
        <EditServiceSlider 
          isOpen={isEditSliderOpen}
          onClose={() => setIsEditSliderOpen(false)}
          onUpdate={handleEditService}
          service={editingService}
        />
      </div>
    </AppLayout>
  );
}

// Add required roles for authentication
// ServicesPage.requireAuth = true;
// ServicesPage.requiredRoles = [UserRole.ADMIN, UserRole.TEAM_MEMBER]; 