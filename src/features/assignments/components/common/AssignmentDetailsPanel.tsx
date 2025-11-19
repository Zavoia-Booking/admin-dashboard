import { MapPin, Users, Briefcase, MousePointerClick, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../../../../shared/components/ui/card';
import { Button } from '../../../../shared/components/ui/button';
import { Spinner } from '../../../../shared/components/ui/spinner';
import { LocationsList } from './LocationsList';
import { ServicesList } from './ServicesList';
import { TeamMembersList } from './TeamMembersList';
import { AssignedTeamMembers } from './AssignedTeamMembers';
import { AvailableTeamMembers } from './AvailableTeamMembers';

export interface AssignmentSection {
  title: string;
  assignedItems: Array<{
    id: number | string;
    name: string;
    subtitle?: string;
  }>;
  availableItems: Array<{
    id: number | string;
    name: string;
    address?: string;
  }>;
  selectedIds: number[];
  onToggleSelection: (id: number) => void;
}

interface AssignmentDetailsPanelProps {
  sections: AssignmentSection[];
  onSave: () => void;
  isSaving?: boolean;
  saveLabel?: string;
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
                  Choose a team member from the list to view and manage their assignments
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
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                {(() => {
                  const Icon = getSectionIcon(section.title);
                  return Icon ? <Icon className="h-4 w-4" /> : null;
                })()}
                {section.title}
              </h3>
              
              {section.title === 'Locations' ? (
                <LocationsList
                  allLocations={section.availableItems
                    .filter(item => item.address !== undefined)
                    .map(item => ({
                      id: item.id,
                      name: item.name,
                      address: item.address!,
                    }))}
                  assignedLocationIds={section.selectedIds}
                  onToggle={section.onToggleSelection}
                />
              ) : section.title === 'Services' ? (
                <ServicesList
                  allServices={section.availableItems}
                  assignedServiceIds={section.selectedIds}
                  onToggle={section.onToggleSelection}
                  showEmptyState={section.availableItems.length === 0}
                />
              ) : section.title === 'Team Members Assigned' ? (
                <TeamMembersList
                  allTeamMembers={section.availableItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    email: item.subtitle,
                  }))}
                  assignedTeamMemberIds={section.selectedIds}
                  onToggle={section.onToggleSelection}
                />
              ) : (
                <>
                  {/* Assigned Items */}
                  {section.title === 'Team Members' ? (
                    <AssignedTeamMembers
                      teamMembers={section.assignedItems}
                      onRemove={section.onToggleSelection}
                    />
                  ) : (
                    <div className="space-y-2">
                      {section.assignedItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <div>
                            <div>{item.name}</div>
                            {item.subtitle && (
                              <div className="text-sm text-muted-foreground">
                                {item.subtitle}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => section.onToggleSelection(Number(item.id))}
                            className="text-destructive hover:underline text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Available Items */}
                  <div className="mt-3">
                    {section.title === 'Team Members' ? (
                  <AvailableTeamMembers
                    teamMembers={section.availableItems.filter(
                      item => !section.selectedIds.includes(Number(item.id))
                    )}
                    onAdd={section.onToggleSelection}
                  />
                ) : (
                  <select
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value) {
                        section.onToggleSelection(value);
                      }
                    }}
                    className="w-full border rounded px-3 py-2"
                    value=""
                  >
                    <option value="">+ Add {section.title}</option>
                    {section.availableItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}

          <div className="flex justify-end pt-4">
            <Button
              onClick={onSave}
              disabled={isSaving}
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

