import React from 'react';
import { MapPin, Users, Briefcase, MousePointerClick, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../../../../shared/components/ui/card';
import { Button } from '../../../../shared/components/ui/button';
import { Spinner } from '../../../../shared/components/ui/spinner';
import { LocationsList } from './LocationsList';
import { ServicesList } from './ServicesList';
import { TeamMembersList } from './TeamMembersList';

export interface AssignedService {
  serviceId: number;
  serviceName: string;
  customPrice: number | null;
  customDuration: number | null;
  defaultPrice?: number;
  defaultDuration?: number;
}

export interface AssignmentSection {
  title: string;
  description?: React.ReactNode;
  type?: 'services' | 'team_members' | 'locations';
  assignedItems?: Array<{
    id: number | string;
    name: string;
    subtitle?: string;
  }>;
  assignedServices?: AssignedService[];
  availableItems?: Array<{
    id: number | string;
    name: string;
    address?: string;
    email?: string;
    price?: number;
    duration?: number;
  }>;
  allItems?: Array<any>;
  assignedItemIds?: number[];
  selectedIds: number[];
  onToggleSelection?: (id: number) => void;
  onToggle?: (id: number) => void;
  onUpdateCustomPrice?: (serviceId: number, price: number | null) => void;
  onUpdateCustomDuration?: (serviceId: number, duration: number | null) => void;
  currency?: string;
  teamMemberName?: string;
  onApplyServices?: (serviceIds: number[]) => void;
}

interface AssignmentDetailsPanelProps {
  sections: AssignmentSection[];
  onSave: () => void;
  isSaving?: boolean;
  saveLabel?: string;
  emptyStateMessage?: string;
  hasChanges?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
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
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
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
                <div className="mb-3">
                  {section.description ? (
                    <div className="flex items-end gap-1 mb-3">
                      <div className="text-sm text-foreground-3 dark:text-foreground-2 cursor-default leading-relaxed">
                        {section.description}
                      </div>
                      <div className="flex-1 h-px bg-border dark:bg-border-strong"></div>
                    </div>
                  ) : (
                    <h3 className="font-medium flex items-center gap-2">
                      {(() => {
                        const Icon = getSectionIcon(section.title);
                        return Icon ? <Icon className="h-4 w-4" /> : null;
                      })()}
                      {section.title}
                    </h3>
                  )}
                </div>
                
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
                    assignedServices={section.assignedServices}
                    onToggle={toggleHandler!}
                    onUpdateCustomPrice={section.onUpdateCustomPrice}
                    onUpdateCustomDuration={section.onUpdateCustomDuration}
                    showEmptyState={(section.availableItems || []).length === 0}
                    currency={section.currency}
                    teamMemberName={section.teamMemberName}
                    onApplyServices={section.onApplyServices}
                    useCompactLayout={true}
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

          <div className="flex items-center justify-between pt-4 border-t border-border">
            {/* Undo/Redo buttons */}
            {(onUndo || onRedo) && (canUndo || canRedo) && (
              <div className="flex gap-2">
                {onUndo && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onUndo}
                    disabled={!canUndo}
                    className="gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 7v6h6"/>
                      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
                    </svg>
                    Undo
                  </Button>
                )}
                {onRedo && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRedo}
                    disabled={!canRedo}
                    className="gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 7v6h-6"/>
                      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/>
                    </svg>
                    Redo
                  </Button>
                )}
              </div>
            )}
            
            {/* Save button */}
            <div className="ml-auto">
              <Button
                onClick={onSave}
                disabled={isSaving || !hasChanges}
                className="w-auto min-w-[200px]"
              >
                {isSaving ? <Spinner size="sm" /> : saveLabel}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

