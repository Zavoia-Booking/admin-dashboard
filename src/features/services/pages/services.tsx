"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Edit, Trash2, Clock, MapPin, Users, Tag } from "lucide-react";
import { Badge } from "../../../shared/components/ui/badge";
import { useTranslation } from "react-i18next";
import AddServiceSlider from "../components/AddServiceSlider";
import EditServiceSlider from "../components/EditServiceSlider";
import { AppLayout } from "../../../shared/components/layouts/app-layout";
import type { Service } from "../../../shared/types/service";
import {
  getAddFormSelector,
  getServicesListSelector,
} from "../selectors.ts";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteServicesAction,
  getServicesAction,
  getServiceByIdAction,
  toggleAddFormAction,
} from "../actions.ts";
import BusinessSetupGate from "../../../shared/components/guards/BusinessSetupGate.tsx";
import { useConfirmRadix } from "../../../shared/hooks/useConfirm.tsx";
import { ServiceFilters } from "../components/ServiceFilters.tsx";
import { AccessGuard } from "../../../shared/components/guards/AccessGuard.tsx";

export default function ServicesPage() {
  const text = useTranslation("services").t;
  const services: Service[] = useSelector(getServicesListSelector);
  const { ConfirmDialog, confirm } = useConfirmRadix();

  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // Dialog states
  const isCreateSliderOpen = useSelector(getAddFormSelector);
  const [isEditSliderOpen, setIsEditSliderOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Reset the "add form open" flag when leaving this page
  useEffect(() => {
    return () => {
      dispatch(toggleAddFormAction(false));
    };
  }, [dispatch]);

  // Check for URL parameters to auto-open sliders
  useEffect(() => {
    const openParam = searchParams.get("open");
    if (openParam === "add") {
      dispatch(toggleAddFormAction(true));
      // Remove the parameter from URL after opening (replace history entry to prevent back button issues)
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, dispatch]);

  // Load services on mount
  useEffect(() => {
    dispatch(getServicesAction.request({ reset: true }));
  }, [dispatch]);

  const handleDeleteService = useCallback(
    (service: Service) => {
      void confirm({
        title: text("deleteService.title", { serviceName: service.name }),
        content: text("deleteService.description"),
        confirmationText: text("deleteService.confirm"),
        destructive: true,
        dismissible: false,
        onConfirm: () => {
          dispatch(deleteServicesAction.request({ serviceId: service.id }));
        },
      });
    },
    [dispatch, confirm, text]
  );

  const openEditSlider = (service: Service) => {
    // Fetch full service details with all relations
    dispatch(getServiceByIdAction.request(service.id));
    setEditingService(service);
    setIsEditSliderOpen(true);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ""}`;
    }
    return `${mins}m`;
  };

  return (
    <AppLayout>
      <BusinessSetupGate>
        <AccessGuard>
          <div className="space-y-4 max-w-2xl mx-auto">
            <ServiceFilters />
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="rounded-lg border border-border bg-surface dark:bg-neutral-900 p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {services.length}
                </div>
                <div className="text-xs text-foreground-3 dark:text-foreground-2 mt-1">
                  {text("page.stats.total")}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-surface dark:bg-neutral-900 p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  $
                  {Math.round(
                    services.reduce((sum, s) => sum + s.price, 0) /
                      (services.length || 1)
                  )}
                </div>
                <div className="text-xs text-foreground-3 dark:text-foreground-2 mt-1">
                  {text("page.stats.avgPrice")}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-surface dark:bg-neutral-900 p-4 text-center">
                <div className="text-2xl font-bold text-primary">145</div>
                <div className="text-xs text-foreground-3 dark:text-foreground-2 mt-1">
                  {text("page.stats.bookings")}
                </div>
              </div>
            </div>

            {/* Services Grid */}
            <div className="space-y-3">
              {services.map((service) => {
                // const bookings = service.bookings || (service.id === 1 ? 45 : service.id === 2 ? 32 : 28);
                return (
                  <div
                    key={service.id}
                    className={`rounded-xl border border-border bg-surface dark:bg-neutral-900 p-4 flex flex-col gap-2 shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200 ${
                      "bg-green-50 dark:bg-success-bg text-green-700 dark:text-success"
                    }`}
                    onClick={() => openEditSlider(service)}
                  >
                    {/* Service Name and Status Row */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-lg truncate text-foreground-1">
                        {service.name}
                      </span>
                    </div>
                    {/* Description */}
                    <div className="text-sm text-foreground-3 dark:text-foreground-2 mb-2">
                      {service.description}
                    </div>

                    {/* Category Badge */}
                    {service.category && (
                      <div className="mb-2">
                        <Badge variant="secondary" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {service.category.name}
                        </Badge>
                      </div>
                    )}

                    {/* Locations and Team Members */}
                    {(service.locations && service.locations.length > 0) ||
                    (service.teamMembers && service.teamMembers.length > 0) ? (
                      <div className="flex flex-wrap items-center gap-2 mb-2 text-xs text-foreground-3 dark:text-foreground-2">
                        {service.locations && service.locations.length > 0 && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>
                              {service.locations.length}{" "}
                              {service.locations.length === 1
                                ? "location"
                                : "locations"}
                            </span>
                          </div>
                        )}
                        {service.teamMembers &&
                          service.teamMembers.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              <span>
                                {service.teamMembers.length}{" "}
                                {service.teamMembers.length === 1
                                  ? "team member"
                                  : "team members"}
                              </span>
                            </div>
                          )}
                      </div>
                    ) : null}

                    {/* Info Row */}
                    <div className="flex items-center gap-6 text-sm mb-2">
                      <div className="flex items-center gap-1 text-foreground-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDuration(service.duration)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-foreground-1">
                        <span>${service.price}</span>
                      </div>
                    </div>

                    {/* Separator */}
                    <div className="border-t border-border"></div>

                    {/* Action Buttons Row */}
                    <div
                      className="flex items-center justify-between gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Column 2: Edit/Delete */}
                      <div className="flex items-center gap-1">
                        {/* Edit */}
                        <button
                          className="flex items-center justify-center h-9 w-9 rounded hover:bg-muted"
                          title={text("page.service.actions.edit")}
                          onClick={() => openEditSlider(service)}
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        {/* Delete */}
                        <button
                          className="flex items-center justify-center h-9 w-9 rounded hover:bg-error-bg text-destructive"
                          title={text("page.service.actions.delete")}
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
            {services.length === 0 && (
              <div className="rounded-lg border border-border bg-surface dark:bg-neutral-900 p-8 text-center">
                <div className="mx-auto h-12 w-12 bg-surface-hover rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">💇‍♀️</span>
                </div>
                <h3 className="text-lg font-medium text-foreground-1 mb-2">
                  {text("page.emptyState.noServices")}
                </h3>
                <p className="text-foreground-3 dark:text-foreground-2 mb-4">
                  {text("page.emptyState.noServicesDescription")}
                </p>
              </div>
            )}
            <ConfirmDialog />

            {/* Add Service Slider */}
            <AddServiceSlider
              isOpen={isCreateSliderOpen}
              onClose={() => {
                dispatch(toggleAddFormAction(false));
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
