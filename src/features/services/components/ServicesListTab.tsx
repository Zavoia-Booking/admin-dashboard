"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Edit, Clock, MapPin, Users, Bookmark } from "lucide-react";
import { useTranslation } from "react-i18next";
import EditServiceSlider from "./EditServiceSlider";
import type { Service } from "../../../shared/types/service";
import { getServicesListSelector, getAddFormSelector } from "../selectors.ts";
import { useDispatch, useSelector } from "react-redux";
import {
  getServicesAction,
  getServiceByIdAction,
  toggleAddFormAction,
} from "../actions.ts";
import { ServiceFilters } from "./ServiceFilters.tsx";
import AddServiceSlider from "./AddServiceSlider";
import { ItemCard, type ItemCardMetadata, type ItemCardBadge } from "../../../shared/components/common/ItemCard";

export function ServicesListTab() {
  const text = useTranslation("services").t;
  const services: Service[] = useSelector(getServicesListSelector);

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
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, dispatch]);

  // Load services on mount
  useEffect(() => {
    dispatch(getServicesAction.request({ reset: true }));
  }, [dispatch]);

  const openEditSlider = (service: Service) => {
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
    <div className="space-y-6">
      <ServiceFilters />
      
      {/* Stats Cards */}
      {services.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-surface dark:bg-neutral-900 p-5">
            <div className="text-2xl font-bold text-foreground-1">
              {services.length}
            </div>
            <div className="text-sm text-foreground-3 dark:text-foreground-2 mt-1">
              {text("page.stats.total")}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-surface dark:bg-neutral-900 p-5">
            <div className="text-2xl font-bold text-foreground-1">
              $
              {Math.round(
                services.reduce((sum, s) => sum + s.price, 0) /
                  (services.length || 1)
              )}
            </div>
            <div className="text-sm text-foreground-3 dark:text-foreground-2 mt-1">
              {text("page.stats.avgPrice")}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-surface dark:bg-neutral-900 p-5">
            <div className="text-2xl font-bold text-foreground-1">145</div>
            <div className="text-sm text-foreground-3 dark:text-foreground-2 mt-1">
              {text("page.stats.bookings")}
            </div>
          </div>
        </div>
      )}

      {/* Services List */}
      {services.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {services.map((service) => {
            // Build metadata array (only duration now)
            const metadata: ItemCardMetadata[] = [
              {
                icon: Clock,
                label: "duration",
                value: formatDuration(service.duration),
              },
            ];

            // Build badges array (locations and team members)
            const badges: ItemCardBadge[] = [];
            
            const locationsCount = service.locations?.length ?? service.locationsCount ?? 0;
            if (locationsCount > 0) {
              badges.push({
                label: locationsCount === 1
                  ? text("page.service.metadata.location")
                  : text("page.service.metadata.locations"),
                count: locationsCount,
                icon: MapPin,
              });
            }

            const teamMembersCount = service.teamMembers?.length ?? service.teamMembersCount ?? 0;
            if (teamMembersCount > 0) {
              badges.push({
                label: teamMembersCount === 1
                  ? text("page.service.metadata.teamMember")
                  : text("page.service.metadata.teamMembers"),
                count: teamMembersCount,
                icon: Users,
              });
            }

            return (
              <ItemCard
                key={service.id}
                title={service.name}
                category={
                  service.category
                    ? {
                        name: service.category.name,
                        color: service.category.color,
                        icon: Bookmark,
                      }
                    : null
                }
                badges={badges}
                metadata={metadata}
                price={service.price}
                actions={[
                  {
                    icon: Edit,
                    label: text("page.service.actions.edit"),
                    onClick: (e) => {
                      e.stopPropagation();
                      openEditSlider(service);
                    },
                  },
                ]}
                onClick={() => openEditSlider(service)}
              />
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-lg border border-border bg-surface dark:bg-neutral-900 p-12 text-center">
          <div className="mx-auto h-16 w-16 bg-surface-hover rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">💇‍♀️</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground-1 mb-2">
            {text("page.emptyState.noServices")}
          </h3>
          <p className="text-sm text-foreground-3 dark:text-foreground-2 max-w-md mx-auto">
            {text("page.emptyState.noServicesDescription")}
          </p>
        </div>
      )}

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
  );
}
