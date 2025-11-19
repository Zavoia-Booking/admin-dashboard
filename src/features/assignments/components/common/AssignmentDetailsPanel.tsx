import { MapPin, Users, Briefcase, MousePointerClick, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../../../../shared/components/ui/card';
import { Button } from '../../../../shared/components/ui/button';
import { Spinner } from '../../../../shared/components/ui/spinner';
import { LocationsList } from './LocationsList';
import { ServicesList } from './ServicesList';
import { TeamMembersList } from './TeamMembersList';

export interface AssignmentSection {
  title: string;
  type?: 'services' | 'team_members' | 'locations';
  assignedItems?: Array<{
    id: number | string;
    name: string;
    subtitle?: string;
  }>;
  availableItems?: Array<{
    id: number | string;
    name: string;
    address?: string;
    email?: string;
  }>;
  allItems?: Array<any>;
  assignedItemIds?: number[];
  selectedIds: number[];
  onToggleSelection?: (id: number) => void;
  onToggle?: (id: number) => void;
}

interface AssignmentDetailsPanelProps {
  sections: AssignmentSection[];
  onSave: () => void;
  isSaving?: boolean;
  saveLabel?: string;
  emptyStateMessage?: string;
  hasChanges?: boolean;
}

const getSectionIcon = (title: string): LucideIcon | null => {
  switch (title) {
    case 'Team Members':
    case 'Team Members Assigned':
      return Users;
    case 'Locations':
      return MapPin;
    case 'Services':
      return Briefcase;
    default:
      return null;
  }
};

export function AssignmentDetailsPanel({
  sections,
  onSave,
  isSaving = false,
  saveLabel = 'Save Changes',
  emptyStateMessage = 'Choose an item from the list to view and manage assignments',
  hasChanges = true,
}: AssignmentDetailsPanelProps) {
  if (!sections || sections.length === 0) {
    return (
      <Card className="col-span-8 md:col-span-8">
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 px-4 min-h-[400px]">
            <div className="flex flex-col items-center justify-center space-y-4 text-center max-w-md">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <MousePointerClick className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Select an item to get started
                </h3>
                <p className="text-sm text-muted-foreground">
                  {emptyStateMessage}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-8 md:col-span-8">
      <CardContent>
        <div className="space-y-6">
          {sections.map((section, sectionIndex) => {
            const toggleHandler = section.onToggle || section.onToggleSelection;
            
            return (
              <div key={sectionIndex}>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  {(() => {
                    const Icon = getSectionIcon(section.title);
                    return Icon ? <Icon className="h-4 w-4" /> : null;
                  })()}
                  {section.title}
                </h3>
                
                {/* Handle new type-based rendering for Locations tab */}
                {section.type === 'services' ? (
                  <ServicesList
                    allServices={section.allItems || []}
                    assignedServiceIds={section.selectedIds}
                    onToggle={toggleHandler!}
                    showEmptyState={(section.allItems || []).length === 0}
                  />
                ) : section.type === 'team_members' ? (
                  <TeamMembersList
                    allTeamMembers={section.allItems || []}
                    assignedTeamMemberIds={section.selectedIds}
                    onToggle={toggleHandler!}
                  />
                ) : section.type === 'locations' ? (
                  <LocationsList
                    allLocations={section.allItems || []}
                    assignedLocationIds={section.selectedIds}
                    onToggle={toggleHandler!}
                  />
                ) : section.title === 'Locations' ? (
                  <LocationsList
                    allLocations={(section.availableItems || [])
                      .filter(item => item.address !== undefined)
                      .map(item => ({
                        id: item.id,
                        name: item.name,
                        address: item.address!,
                      }))}
                    assignedLocationIds={section.selectedIds}
                    onToggle={toggleHandler!}
                  />
                ) : section.title === 'Services' ? (
                  <ServicesList
                    allServices={section.availableItems || []}
                    assignedServiceIds={section.selectedIds}
                    onToggle={toggleHandler!}
                    showEmptyState={(section.availableItems || []).length === 0}
                  />
                ) : section.title === 'Team Members Assigned' ? (
                  <TeamMembersList
                    allTeamMembers={(section.availableItems || []).map(item => ({
                      id: item.id,
                      name: item.name,
                      email: item.email,
                    }))}
                    assignedTeamMemberIds={section.selectedIds}
                    onToggle={toggleHandler!}
                  />
                ) : null}
              </div>
            );
          })}

          <div className="flex justify-end pt-4">
            <Button
              onClick={onSave}
              disabled={isSaving || !hasChanges}
              className="w-auto min-w-[200px]"
            >
              {isSaving ? <Spinner size="sm" /> : saveLabel}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

