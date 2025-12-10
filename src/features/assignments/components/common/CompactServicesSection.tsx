import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Settings2, ChevronDown } from "lucide-react";
import { Button } from "../../../../shared/components/ui/button";
import { ManageServicesSheet } from "../../../../shared/components/common/ManageServicesSheet";
import { AssignedServiceRow } from "./AssignedServiceRow";

interface AssignedService {
  serviceId: number;
  serviceName: string;
  customPrice: number | null;
  customDuration: number | null;
  defaultPrice?: number; // price_amount_minor (cents) for comparison
  defaultDisplayPrice?: number; // displayPrice (decimal) for display
  defaultDuration?: number;
  category?: { id: number; name: string; color?: string } | null;
}

interface CompactServicesSectionProps {
  assignedServices: AssignedService[];
  assignedServiceIds: number[];
  allServices: Array<{
    id: number | string;
    name: string;
    price?: number; // displayPrice (decimal)
    price_amount_minor?: number; // price_amount_minor (cents)
    duration?: number;
    category?: { id: number; name: string; color?: string } | null;
  }>;
  teamMemberName: string;
  onUpdateCustomPrice: (serviceId: number, price: number | null) => void;
  onUpdateCustomDuration: (serviceId: number, duration: number | null) => void;
  onApplyServices: (serviceIds: number[]) => void;
  currency?: string;
  summaryLine?: React.ReactNode;
}

const MAX_VISIBLE_SERVICES = 5;

export function CompactServicesSection({
  assignedServices,
  assignedServiceIds,
  allServices,
  teamMemberName,
  onUpdateCustomPrice,
  onUpdateCustomDuration,
  onApplyServices,
  currency = "USD",
  summaryLine,
}: CompactServicesSectionProps) {
  const { t } = useTranslation('assignments');
  const [isManageSheetOpen, setIsManageSheetOpen] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false); // Track if user toggled
  const restRef = useRef<HTMLDivElement>(null);
  const [restHeight, setRestHeight] = useState(0);

  // Collapsible services logic
  const hasMoreServices = assignedServices.length > MAX_VISIBLE_SERVICES;

  // Reset when team member changes
  useEffect(() => {
    setShowAllServices(false);
    setHasInteracted(false); // Reset interaction state
    setRestHeight(0);
  }, [teamMemberName]);

  // Calculate height for Radix Collapsible CSS variable
  useEffect(() => {
    if (!hasMoreServices) return;
    const el = restRef.current;
    if (!el) return;
    // Measure full height for animation variable
    const fullHeight = Array.from(el.children).reduce(
      (acc, child) => acc + (child as HTMLElement).offsetHeight,
      0
    );
    setRestHeight(fullHeight);
    el.style.setProperty(
      "--radix-collapsible-content-height",
      `${fullHeight}px`
    );
  }, [assignedServices, showAllServices, hasMoreServices]);

  const handleShowMore = () => {
    setHasInteracted(true);
    setShowAllServices(true);
  };

  const handleShowLess = () => {
    setShowAllServices(false);
  };

  if (assignedServices.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex">
          <Button
            variant="outline"
            rounded="full"
            onClick={() => setIsManageSheetOpen(true)}
            className="!px-6 mt-2 border-border-strong text-foreground-1"
            >
            <Settings2 className="h-3 w-3 text-primary" />
            <span>{t('page.compactServices.buttons.manageServices')}</span>
          </Button>
        </div>
        <ManageServicesSheet
          isOpen={isManageSheetOpen}
          onClose={() => setIsManageSheetOpen(false)}
          teamMemberName={teamMemberName}
          allServices={allServices}
          initialSelectedIds={assignedServiceIds}
          onApply={onApplyServices}
        />

        <div className="border-b border-border mb-6 pb-6 mt-5">
          <div className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
            {summaryLine}
          </div>
          <span className="text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">{t('page.teamMembers.sections.services.description.assignFirstHelper')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Manage services button */}
      <div className="flex border-b border-border mb-6 pb-6">
        <Button
          variant="outline"
          rounded="full"
          onClick={() => setIsManageSheetOpen(true)}
          className="!px-6 mt-2 border-border-strong text-foreground-1"
        >
          <Settings2 className="h-3 w-3 text-primary" />
          <span>{t('page.compactServices.buttons.manageServices')}</span>
        </Button>
      </div>

      <ManageServicesSheet
        isOpen={isManageSheetOpen}
        onClose={() => setIsManageSheetOpen(false)}
        teamMemberName={teamMemberName}
        allServices={allServices}
        initialSelectedIds={assignedServiceIds}
        onApply={onApplyServices}
      />

      {summaryLine && (
        <div>
          <div className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
            {summaryLine}
          </div>

          <span className="text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">
            {t('page.teamMembers.sections.services.description.setCustomPricingHelper')}
          </span>
        </div>
      )}

      {/* Assigned services list - simple rows with dividers */}
      <div className="space-y-2 border border-border rounded-lg p-2">
        {/* Always render first 5 services */}
        <div className="divide-y divide-border">
          {assignedServices.slice(0, MAX_VISIBLE_SERVICES).map((service) => {
            const defaultService = allServices.find(
              (s) => Number(s.id) === service.serviceId
            );
            const category =
              service.category ?? defaultService?.category ?? null;
            return (
              <AssignedServiceRow
                key={service.serviceId}
                serviceId={service.serviceId}
                serviceName={service.serviceName}
                defaultPrice={
                  service.defaultPrice ?? defaultService?.price_amount_minor
                }
                defaultDisplayPrice={
                  service.defaultDisplayPrice ?? defaultService?.price
                }
                defaultDuration={
                  service.defaultDuration ?? defaultService?.duration
                }
                categoryName={category?.name}
                categoryColor={category?.color ?? null}
                customPrice={service.customPrice}
                customDuration={service.customDuration}
                onUpdateCustomPrice={onUpdateCustomPrice}
                onUpdateCustomDuration={onUpdateCustomDuration}
                currency={currency}
                teamMemberName={teamMemberName}
              />
            );
          })}
        </div>

        {/* Collapsible section for remaining services */}
        {hasMoreServices && (
          <div
            key={teamMemberName}
            ref={restRef}
            {...(hasInteracted
              ? {
                  "data-slot": "collapsible-content",
                  "data-state": showAllServices ? "open" : "closed",
                }
              : {})}
            className={`overflow-hidden ${showAllServices ? "h-auto" : "h-0"}`}
            style={
              {
                ["--radix-collapsible-content-height" as any]: `${restHeight}px`,
              } as React.CSSProperties
            }
          >
            <div className="divide-y divide-border">
              {assignedServices.slice(MAX_VISIBLE_SERVICES).map((service) => {
                const defaultService = allServices.find(
                  (s) => Number(s.id) === service.serviceId
                );
                const category =
                  service.category ?? defaultService?.category ?? null;
                return (
                  <AssignedServiceRow
                    key={service.serviceId}
                    serviceId={service.serviceId}
                    serviceName={service.serviceName}
                    defaultPrice={
                      service.defaultPrice ?? defaultService?.price_amount_minor
                    }
                    defaultDisplayPrice={
                      service.defaultDisplayPrice ?? defaultService?.price
                    }
                    defaultDuration={
                      service.defaultDuration ?? defaultService?.duration
                    }
                    categoryName={category?.name}
                    categoryColor={category?.color ?? null}
                    customPrice={service.customPrice}
                    customDuration={service.customDuration}
                    onUpdateCustomPrice={onUpdateCustomPrice}
                    onUpdateCustomDuration={onUpdateCustomDuration}
                    currency={currency}
                teamMemberName={teamMemberName}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* "Show more" button (only when collapsed and there are more services) */}
        {hasMoreServices && !showAllServices && (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              rounded="full"
              onClick={handleShowMore}
              className="group h-auto px-3 py-1.5 gap-1.5 border-border w-1/3"
            >
              <span>
                {t('page.compactServices.buttons.showMore', { count: assignedServices.length - MAX_VISIBLE_SERVICES })}
              </span>
              <ChevronDown className="h-3.5 w-3.5 mt-0.5 text-foreground-3 group-hover:text-foreground-1 rotate-0" />
            </Button>
          </div>
        )}

        {/* "Show less" button (only when expanded) */}
        {hasMoreServices && showAllServices && (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              rounded="full"
              onClick={handleShowLess}
              className="group h-auto px-3 py-1.5 gap-1.5 border-border w-1/3"
            >
              <span>{t('page.compactServices.buttons.showLess')}</span>
              <ChevronDown className="h-3.5 w-3.5 mt-0.5 text-foreground-3 group-hover:text-foreground-1 rotate-180" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
