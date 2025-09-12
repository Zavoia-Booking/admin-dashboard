'use client';

import { useState, useMemo, useEffect } from 'react';
import { Edit, Trash2, Filter, Search, Plus, Clock, X, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../shared/components/ui/dialog";
import AddServiceSlider from '../components/AddServiceSlider';
import EditServiceSlider from '../components/EditServiceSlider';
import { Badge } from "../../../shared/components/ui/badge";
import { toast } from 'sonner';
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import { Switch } from "../../../shared/components/ui/switch";
import { FilterPanel } from '../../../shared/components/common/FilterPanel';
import type { Service } from '../../../shared/types/service';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { getServicesListSelector } from "../selectors.ts";
import { useDispatch, useSelector } from "react-redux";
import { deleteServicesAction, getServicesAction } from "../actions.ts";
import { getCurrentLocationSelector } from "../../locations/selectors.ts";
import BusinessSetupGate from '../../../shared/components/guards/BusinessSetupGate.tsx';

export default function ServicesPage() {
  const services: Service[] = useSelector(getServicesListSelector);
  const currentLocation = useSelector(getCurrentLocationSelector);

  const dispatch = useDispatch();

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
    serviceId?: number;
    serviceName?: string;
    toggleStatusData?: { id: number; name: string; currentStatus: string; newStatus: string };
  } | null>(null);

  // When opening the filter card, sync local state with main state
  useEffect(() => {
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

      const matchesStatus = statusFilter === 'all' || service.isActive === (statusFilter === 'enabled');

      const matchesMinPrice = priceRange.min === '' || service.price >= parseFloat(priceRange.min);
      const matchesMaxPrice = priceRange.max === '' || service.price <= parseFloat(priceRange.max);

      const matchesMinDuration = durationRange.min === '' || service.duration >= parseInt(durationRange.min);
      const matchesMaxDuration = durationRange.max === '' || service.duration <= parseInt(durationRange.max);

      return matchesSearch && matchesStatus && matchesMinPrice && matchesMaxPrice && matchesMinDuration && matchesMaxDuration;
    });
  }, [services, searchTerm, statusFilter, priceRange, durationRange]);

  useEffect(() => {
    // Refetch whenever location changes, including when cleared to "All locations"
    dispatch(getServicesAction.request());
  }, [dispatch, currentLocation?.id]);

  // creation handled inside AddServiceSlider via react-hook-form + dispatch

  const handleDeleteService = async (id: number) => {
    setPendingAction({
      type: 'delete',
      serviceId: id,
      serviceName: services.find((service: Service) => service.id === id)?.name
    });
    setIsConfirmDialogOpen(true);
  };

  const handleToggleServiceStatus = async (service: Service) => {
    const newStatus = service.isActive ? 'disabled' : 'enabled';

    setPendingAction({
      type: 'toggleStatus',
      toggleStatusData: {
        id: service.id,
        name: service.name,
        currentStatus: service.isActive ? 'enabled' : 'disabled',
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
      // TODO
      // fetchServices();
    } catch (error: unknown) {
      console.log(error)
      toast.error('Failed to update service status');
    } finally {
      setIsConfirmDialogOpen(false);
      setPendingAction(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingAction || pendingAction.type !== 'delete' || !pendingAction.serviceId) return;

    dispatch(deleteServicesAction.request({ serviceId: pendingAction.serviceId }));
    setIsConfirmDialogOpen(false);
    setPendingAction(null);
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
      <BusinessSetupGate>
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
                  Search: &#34;{searchTerm}&#34;
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

          Stats Cards
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-lg border bg-white p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{services.length}</div>
              <div className="text-xs text-gray-500 mt-1">Total</div>
            </div>
            <div className="rounded-lg border bg-white p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{services.filter(s => s.isActive).length}</div>
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
              // const bookings = service.bookings || (service.id === 1 ? 45 : service.id === 2 ? 32 : 28);
              const isInactive = service.isActive === false;
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
                      <span>0 booked</span>
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="border-t border-gray-200"></div>

                  {/* Action Buttons Row */}
                  <div className="flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                    {/* Column 1: Toggle */}
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={service.isActive}
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
          />

          {/* Edit Service Slider */}
          <EditServiceSlider
            isOpen={isEditSliderOpen}
            onClose={() => setIsEditSliderOpen(false)}
            service={editingService}
          />
        </div>
      </BusinessSetupGate>
    </AppLayout>
  );
}
