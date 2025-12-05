import { useState, useMemo } from 'react';
import { Settings2 } from 'lucide-react';
import { Button } from '../../../../shared/components/ui/button';
import { Badge } from '../../../../shared/components/ui/badge';
import { ManageServicesSheet } from '../../../../shared/components/common/ManageServicesSheet';
import { AssignedServiceRow } from './AssignedServiceRow';

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
}

export function CompactServicesSection({
  assignedServices,
  assignedServiceIds,
  allServices,
  teamMemberName,
  onUpdateCustomPrice,
  onUpdateCustomDuration,
  onApplyServices,
  currency = 'USD',
}: CompactServicesSectionProps) {
  const [isManageSheetOpen, setIsManageSheetOpen] = useState(false);

  // Get summary chips (first 3-5 services + counter)
  const summaryServices = useMemo(() => {
    return assignedServices.slice(0, 5);
  }, [assignedServices]);

  const remainingCount = assignedServices.length - summaryServices.length;


  if (assignedServices.length === 0) {
    return (
      <div className="space-y-3">
        <Button
          variant="outline"
          onClick={() => setIsManageSheetOpen(true)}
          className="w-full justify-start"
        >
          <Settings2 className="h-4 w-4 mr-2" />
          Manage services
        </Button>
        <ManageServicesSheet
          isOpen={isManageSheetOpen}
          onClose={() => setIsManageSheetOpen(false)}
          teamMemberName={teamMemberName}
          allServices={allServices}
          initialSelectedIds={assignedServiceIds}
          onApply={onApplyServices}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary chips */}
      {assignedServices.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {summaryServices.map((service) => (
            <Badge
              key={service.serviceId}
              variant="secondary"
              className="text-xs px-2 py-1 font-normal"
            >
              {service.serviceName}
            </Badge>
          ))}
          {remainingCount > 0 && (
            <Badge
              variant="secondary"
              className="text-xs px-2 py-1 font-normal"
            >
              +{remainingCount}
            </Badge>
          )}
        </div>
      )}

      {/* Assigned services list - simple rows */}
      <div className="space-y-2">
        {assignedServices.map((service) => {
          const defaultService = allServices.find(s => Number(s.id) === service.serviceId);
          return (
            <AssignedServiceRow
              key={service.serviceId}
              serviceId={service.serviceId}
              serviceName={service.serviceName}
              defaultPrice={service.defaultPrice ?? defaultService?.price_amount_minor}
              defaultDisplayPrice={service.defaultDisplayPrice ?? defaultService?.price}
              defaultDuration={service.defaultDuration ?? defaultService?.duration}
              customPrice={service.customPrice}
              customDuration={service.customDuration}
              onUpdateCustomPrice={onUpdateCustomPrice}
              onUpdateCustomDuration={onUpdateCustomDuration}
              currency={currency}
            />
          );
        })}
      </div>

      {/* Manage services button */}
      <Button
        variant="outline"
        onClick={() => setIsManageSheetOpen(true)}
        className="w-full"
      >
        <Settings2 className="h-4 w-4 mr-2" />
        Manage services
      </Button>

      <ManageServicesSheet
        isOpen={isManageSheetOpen}
        onClose={() => setIsManageSheetOpen(false)}
        teamMemberName={teamMemberName}
        allServices={allServices}
        initialSelectedIds={assignedServiceIds}
        onApply={onApplyServices}
      />
    </div>
  );
}

