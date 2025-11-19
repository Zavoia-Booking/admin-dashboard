import { useNavigate } from 'react-router-dom';
import { Briefcase, ArrowRight } from 'lucide-react';
import { Button } from '../../../../shared/components/ui/button';
import { MultiSelect } from '../../../../shared/components/common/MultiSelect';

interface Service {
  id: number | string;
  name: string;
}

interface ServicesListProps {
  allServices: Service[];
  assignedServiceIds: number[];
  onToggle: (id: number) => void;
  showEmptyState?: boolean;
}

export function ServicesList({ allServices, assignedServiceIds, onToggle, showEmptyState = false }: ServicesListProps) {
  const navigate = useNavigate();

  if (allServices.length === 0 && showEmptyState) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-border rounded-lg bg-muted/30">
        <div className="flex flex-col items-center justify-center space-y-4 text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Briefcase className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              No services available
            </h3>
            <p className="text-sm text-muted-foreground">
              You need to create services before you can assign them to team members. Get started by creating your first service.
            </p>
          </div>
          <Button
            onClick={() => navigate('/services')}
            className="mt-2"
          >
            Go to Services
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  if (allServices.length === 0) {
    return null;
  }

  return (
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
        placeholder="+ Add Services"
        searchPlaceholder="Search services..."
      />
    </div>
  );
}

