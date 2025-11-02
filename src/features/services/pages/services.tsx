'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Edit, Trash2, Clock } from "lucide-react";
import { useTranslation } from 'react-i18next';
import AddServiceSlider from '../components/AddServiceSlider';
import EditServiceSlider from '../components/EditServiceSlider';
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import { Switch } from "../../../shared/components/ui/switch";
import type { Service } from '../../../shared/types/service';
import { Button } from '../../../shared/components/ui/button';
import { getAddFormSelector, getServicesListSelector } from "../selectors.ts";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteServicesAction,
  getServicesAction,
  toggleAddFormAction,
  toggleStatusServiceAction
} from "../actions.ts";
import { getCurrentLocationSelector } from "../../locations/selectors.ts";
import BusinessSetupGate from '../../../shared/components/guards/BusinessSetupGate.tsx';
import { useConfirmRadix } from "../../../shared/hooks/useConfirm.tsx";
import { ServiceFilters } from "../components/ServiceFilters.tsx";
import { ALL } from "../../../shared/constants.ts";
import { AccessGuard } from '../../../shared/components/guards/AccessGuard.tsx';

export default function ServicesPage() {
  const text = useTranslation('services').t;
  const services: Service[] = useSelector(getServicesListSelector);
  const currentLocation = useSelector(getCurrentLocationSelector);
  const { ConfirmDialog, confirm } = useConfirmRadix();

  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [durationRange, setDurationRange] = useState({ min: '', max: '' });

  // Dialog states
  const isCreateSliderOpen = useSelector(getAddFormSelector);
  // const [isCreateSliderOpen, setIsCreateSliderOpen] = useState(false);
  const [isEditSliderOpen, setIsEditSliderOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Check for URL parameters to auto-open sliders
  useEffect(() => {
    const openParam = searchParams.get('open');
    if (openParam === 'add') {
      dispatch(toggleAddFormAction(true));
      // Remove the parameter from URL after opening (replace history entry to prevent back button issues)
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, dispatch]);

  // When opening the filter card, sync local state with main state
  useEffect(() => {
    // TODO
    // if (showFilters) {
    //   setLocalStatusFilter(statusFilter);
    //   setLocalPriceRange(priceRange);
    //   setLocalDurationRange(durationRange);
    // }
  }, [statusFilter, priceRange, durationRange]);

  // Filter logic
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = searchTerm === '' ||
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === ALL || service.isActive === (statusFilter === 'enabled');

      const matchesMinPrice = priceRange.min === '' || service.price >= parseFloat(priceRange.min);
      const matchesMaxPrice = priceRange.max === '' || service.price <= parseFloat(priceRange.max);

      const matchesMinDuration = durationRange.min === '' || service.duration >= parseInt(durationRange.min);
      const matchesMaxDuration = durationRange.max === '' || service.duration <= parseInt(durationRange.max);

      return matchesSearch && matchesStatus && matchesMinPrice && matchesMaxPrice && matchesMinDuration && matchesMaxDuration;
    });
  }, [services, searchTerm, statusFilter, priceRange, durationRange]);

  useEffect(() => {
    dispatch(getServicesAction.request());
  }, [dispatch, currentLocation?.id]);

  const handleDeleteService = useCallback((service: Service) => {
    void confirm({
      title: text('deleteService.title', { serviceName: service.name }),
      content: text('deleteService.description'),
      confirmationText: text('deleteService.confirm'),
      destructive: true,
      dismissible: false,
      onConfirm: () => {
        dispatch(deleteServicesAction.request({ serviceId: service.id }));
      },
    });
  }, [dispatch, confirm, text]);

  const handleToggleServiceStatus = async (service: Service) => {
    void await confirm({
      title: text('toggleService.title'),
      content: text('toggleService.description', { serviceName: service.name }),
      confirmationText: text('toggleService.confirm'),
      cancellationText: text('toggleService.cancel'),
      destructive: false,
      dismissible: true,
      onConfirm: () => {
        dispatch(toggleStatusServiceAction.request(service));
      },
    });
  };

  const openEditSlider = (service: Service) => {
    setEditingService(service);
    setIsEditSliderOpen(true);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  return (
    <AppLayout>
      <BusinessSetupGate>
        <AccessGuard>
          <div className="space-y-4 max-w-2xl mx-auto">
            <ServiceFilters />
            Stats Cards
            <div className="grid grid-cols-4 gap-4">
              <div className="rounded-lg border bg-white p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{services.length}</div>
                <div className="text-xs text-gray-500 mt-1">{text('page.stats.total')}</div>
              </div>
              <div className="rounded-lg border bg-white p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{services.filter(s => s.isActive).length}</div>
                <div className="text-xs text-gray-500 mt-1">{text('page.stats.active')}</div>
              </div>
              <div className="rounded-lg border bg-white p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">${Math.round(services.reduce((sum, s) => sum + s.price, 0) / (services.length || 1))}</div>
                <div className="text-xs text-gray-500 mt-1">{text('page.stats.avgPrice')}</div>
              </div>
              <div className="rounded-lg border bg-white p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">145</div>
                <div className="text-xs text-gray-500 mt-1">{text('page.stats.bookings')}</div>
              </div>
            </div>

            {/* Services Grid */}
            <div className="space-y-3">
              {filteredServices.map((service) => {
                // const bookings = service.bookings || (service.id === 1 ? 45 : service.id === 2 ? 32 : 28);
                const isInactive = !service.isActive;
                return (
                  <div
                    key={service.id}
                    className={`rounded-xl border bg-white p-4 flex flex-col gap-2 shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200 ${isInactive ? 'opacity-60' : ''}`}
                    onClick={() => openEditSlider(service)}
                  >
                    {/* Service Name and Status Row */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-lg truncate">{service.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${isInactive ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-800'}`}>{isInactive ? text('page.service.status.inactive') : text('page.service.status.active')}</span>
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
                          title={text('page.service.actions.edit')}
                          onClick={() => openEditSlider(service)}
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        {/* Delete */}
                        <button
                          className="flex items-center justify-center h-9 w-9 rounded hover:bg-muted text-red-600"
                          title={text('page.service.actions.delete')}
                          onClick={() => handleDeleteService(service)}
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
              (searchTerm || statusFilter !== ALL || priceRange.min || priceRange.max || durationRange.min || durationRange.max) ? (
                <div className="rounded-lg border bg-white p-8 text-center">
                  <div className="mb-4 text-gray-500">{text('page.emptyState.noResults')}</div>
                  <Button variant="outline" onClick={() => {
                    setSearchTerm('');
                    setStatusFilter(ALL);
                    setPriceRange({ min: '', max: '' });
                    setDurationRange({ min: '', max: '' });
                  }}>
                    {text('page.emptyState.clearFilters')}
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border bg-white p-8 text-center">
                  <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">💇‍♀️</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{text('page.emptyState.noServices')}</h3>
                  <p className="text-gray-500 mb-4">{text('page.emptyState.noServicesDescription')}</p>
                </div>
              )
            )}
            <ConfirmDialog />

            {/* Add Service Slider */}
            <AddServiceSlider
              isOpen={isCreateSliderOpen}
              onClose={() => {
                dispatch(toggleAddFormAction(false))
              }}
            />

            {/* Edit Service Slider */}
            <EditServiceSlider
              isOpen={isEditSliderOpen}
              onClose={() => setIsEditSliderOpen(false)}
              service={editingService}
            />
          </div>
        </AccessGuard>
      </BusinessSetupGate>
    </AppLayout>
  );
}
