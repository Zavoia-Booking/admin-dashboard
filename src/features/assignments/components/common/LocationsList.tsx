import { MapPin } from 'lucide-react';
import { Pill } from '../../../../shared/components/ui/pill';

interface Location {
  id: number | string;
  name: string;
  address: string;
}

interface LocationsListProps {
  allLocations: Location[];
  assignedLocationIds: number[];
  onToggle: (id: number) => void;
}

export function LocationsList({ allLocations, assignedLocationIds, onToggle }: LocationsListProps) {
  if (allLocations.length === 0) {
    return null;
  }

  // Can remove if there's more than 1 assigned location (team member must always have at least one location)
  const canRemove = assignedLocationIds.length > 1;

  return (
    <div className="flex flex-wrap gap-2 sm:gap-3">
      {allLocations.map((location) => {
        const isAssigned = assignedLocationIds.includes(Number(location.id));
        const isClickable = isAssigned ? canRemove : true;

        return (
          <Pill
            key={location.id}
            selected={isAssigned}
            icon={MapPin}
            className="w-auto justify-start items-start transition-none active:scale-100"
            showCheckmark={true}
            onClick={isClickable ? () => onToggle(Number(location.id)) : undefined}
          >
            <div className="flex flex-col text-left">
              <div className="flex items-center">
                {location.name}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {location.address}
              </div>
            </div>
          </Pill>
        );
      })}
    </div>
  );
}

