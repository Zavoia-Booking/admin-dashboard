import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ArrowRight } from 'lucide-react';
import { Button } from '../../../../shared/components/ui/button';
import { MultiSelect } from '../../../../shared/components/common/MultiSelect';
import { ServicePill } from './ServicePill';
import { CompactServicesSection } from './CompactServicesSection';

interface Service {
  id: number | string;
  name: string;
  price?: number; // displayPrice (decimal) for display
  price_amount_minor?: number; // price_amount_minor (cents) for comparison
  duration?: number;
}

interface AssignedService {
  serviceId: number;
  serviceName: string;
  customPrice: number | null;
  customDuration: number | null;
  defaultPrice?: number; // price_amount_minor (cents) for comparison
  defaultDisplayPrice?: number; // displayPrice (decimal) for display
  defaultDuration?: number;
}

interface ServicesListProps {
  allServices: Service[];
  assignedServiceIds: number[];
  assignedServices?: AssignedService[];
  onToggle: (id: number) => void;
  onUpdateCustomPrice?: (serviceId: number, price: number | null) => void;
  onUpdateCustomDuration?: (serviceId: number, duration: number | null) => void;
  showEmptyState?: boolean;
  currency?: string;
  teamMemberName?: string;
  onApplyServices?: (serviceIds: number[]) => void;
  useCompactLayout?: boolean;
  description?: React.ReactNode;
  summaryLine?: React.ReactNode;
}

export function ServicesList({ 
  allServices, 
  assignedServiceIds, 
  assignedServices = [],
  onToggle,
  onUpdateCustomPrice,
  onUpdateCustomDuration,
  showEmptyState = false,
  currency = 'USD',
  teamMemberName,
  onApplyServices,
  useCompactLayout = false,
  description,
  summaryLine,
}: ServicesListProps) {
  const { t } = useTranslation('assignments');
  const navigate = useNavigate();

  // Use compact layout if requested and we have team member name
  if (useCompactLayout && teamMemberName && onApplyServices && assignedServices) {
    return (
      <CompactServicesSection
        assignedServices={assignedServices}
        assignedServiceIds={assignedServiceIds}
        allServices={allServices}
        teamMemberName={teamMemberName}
        onUpdateCustomPrice={onUpdateCustomPrice!}
        onUpdateCustomDuration={onUpdateCustomDuration!}
        onApplyServices={onApplyServices}
        currency={currency}
        summaryLine={summaryLine}
      />
    );
  }

  if (allServices.length === 0 && showEmptyState) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-border rounded-lg bg-muted/30">
        <div className="flex flex-col items-center justify-center space-y-4 text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Briefcase className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {t('page.servicesList.emptyState.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('page.servicesList.emptyState.description')}
            </p>
          </div>
          <Button
            onClick={() => navigate('/services')}
            className="mt-2"
          >
            {t('page.servicesList.emptyState.goToServices')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  if (allServices.length === 0) {
    return null;
  }

  // Show assigned services as Pills (matching LocationsList pattern)
  const hasAssignedServices = assignedServices.length > 0 && onUpdateCustomPrice && onUpdateCustomDuration;

  return (
    <div className="space-y-4">
      {/* Assigned Services as Pills */}
      {hasAssignedServices && assignedServices.length > 0 && (
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {assignedServices.map((assigned) => {
            const defaultService = allServices.find(s => Number(s.id) === assigned.serviceId);
            return (
              <ServicePill
                key={assigned.serviceId}
                serviceId={assigned.serviceId}
                serviceName={assigned.serviceName}
                defaultPrice={assigned.defaultPrice ?? defaultService?.price_amount_minor}
                defaultDisplayPrice={assigned.defaultDisplayPrice ?? defaultService?.price}
                defaultDuration={assigned.defaultDuration ?? defaultService?.duration}
                customPrice={assigned.customPrice}
                customDuration={assigned.customDuration}
                onUpdateCustomPrice={onUpdateCustomPrice}
                onUpdateCustomDuration={onUpdateCustomDuration}
                onToggle={onToggle}
                currency={currency}
              />
            );
          })}
        </div>
      )}

      {/* MultiSelect for adding services */}
      <div className="max-w-md">
        <MultiSelect
          value={assignedServiceIds.map(String)}
          onChange={(newSelectedIds) => {
            // Find newly selected items and toggle them
            const currentIds = new Set(assignedServiceIds.map(String));
            newSelectedIds.forEach((id) => {
              if (!currentIds.has(String(id))) {
                onToggle(Number(id));
              }
            });
            // Find removed items and toggle them
            assignedServiceIds.forEach((id) => {
              if (!newSelectedIds.includes(String(id))) {
                onToggle(Number(id));
              }
            });
          }}
          options={allServices.map(service => ({
            id: String(service.id),
            name: service.name,
          }))}
          placeholder={t('page.servicesList.multiSelect.placeholder')}
          searchPlaceholder={t('page.servicesList.multiSelect.searchPlaceholder')}
        />
      </div>
    </div>
  );
}

