import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Users, Briefcase, MousePointerClick, Info, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../../../../shared/components/ui/card';
import { Button } from '../../../../shared/components/ui/button';
import { Spinner } from '../../../../shared/components/ui/spinner';
import { Skeleton } from '../../../../shared/components/ui/skeleton';
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
  summaryLine?: React.ReactNode;
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
  isLoading?: boolean;
  saveLabel?: string;
  emptyStateMessage?: string;
  hasChanges?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

const getSectionIcon = (title: string, t?: (key: string) => string): LucideIcon | null => {
  // Compare with translated titles if translation function is available
  if (t) {
    if (title === t('page.teamMembers.sections.services.title') || title === 'Services') {
      return Briefcase;
    }
    if (title === t('page.teamMembers.sections.locations.title') || title === 'Locations') {
      return MapPin;
    }
    if (title === 'Team Members' || title === 'Team Members Assigned') {
      return Users;
    }
  } else {
    // Fallback for when translation is not available
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
  }
  return null;
};

export function AssignmentDetailsPanel({
  sections,
  onSave,
  isSaving = false,
  isLoading = false,
  saveLabel,
  emptyStateMessage,
  hasChanges = true
}: AssignmentDetailsPanelProps) {
  const { t } = useTranslation('assignments');
  const finalSaveLabel = saveLabel || t('page.teamMembers.buttons.saveChanges');
  const finalEmptyStateMessage = emptyStateMessage || t('page.teamMembers.emptyState.noTeamMemberSelected');
  // Show skeleton when loading
  if (isLoading) {
    return (
      <Card className="col-span-8 md:col-span-8">
        <CardContent>
          <div className="space-y-6">
            {/* Header skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>

            {/* Service tags/pills skeleton */}
            <div className="flex gap-2 flex-wrap">
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-28 rounded-full" />
              <Skeleton className="h-7 w-32 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-16 rounded-full" />
            </div>

            {/* Service cards skeleton */}
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-white dark:bg-surface"
                >
                  <Skeleton className="h-5 w-5 rounded shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-4 rounded shrink-0" />
                </div>
              ))}
            </div>

            {/* Footer skeleton */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex gap-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
              </div>
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
                  {t('page.teamMembers.emptyState.selectItemToGetStarted')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {finalEmptyStateMessage}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-8 md:col-span-8 py-3 cursor-default">
      <CardContent className="px-3">
        <div className="space-y-6">
          {sections.map((section, sectionIndex) => {
            const toggleHandler = section.onToggle || section.onToggleSelection;

            const servicesTitle = t('page.teamMembers.sections.services.title');
            const locationsTitle = t('page.teamMembers.sections.locations.title');
            const isServicesForTeamMember =
              (section.title === 'Services' || section.title === servicesTitle) && !!section.teamMemberName;
            const isLocationsForTeamMember =
              (section.title === 'Locations' || section.title === locationsTitle) && !!section.teamMemberName;
            const showDescriptionInHeader =
              !!section.description && !isServicesForTeamMember && !isLocationsForTeamMember;
            
            return (
              <div key={sectionIndex}>
                <div className="mb-3">
                  {isServicesForTeamMember ? (
                    <div className="space-y-1.5">
                      <h3 className="text-lg font-semibold text-foreground-1">
                        {t('page.teamMembers.sections.services.titleWithPricing')}
                      </h3>
                      <div className="flex items-start gap-1.5 text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">
                        <Info className="h-3.5 w-3.5 mt-0.5 text-primary" />
                        <span>
                          {t('page.teamMembers.sections.services.description.controlServices')}{" "}
                          <span className="font-semibold text-foreground-1">
                            {section.teamMemberName}
                          </span>{" "}
                          {t('page.teamMembers.sections.services.description.offersAndCustomize')}
                        </span>
                      </div>
                    </div>
                  ) : isLocationsForTeamMember ? (
                    <div className="space-y-1.5">
                      <h3 className="text-lg font-semibold text-foreground-1">
                        {t('page.teamMembers.sections.locations.titleAssignments')}
                      </h3>
                      <div className="flex items-start gap-1.5 text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">
                        <Info className="h-3.5 w-3.5 mt-0.5 text-primary" />
                        <span>
                          {t('page.teamMembers.sections.locations.description.controlLocations')}{" "}
                          <span className="font-semibold text-foreground-1">
                            {section.teamMemberName}
                          </span>{" "}
                          {t('page.teamMembers.sections.locations.description.canWorkAt')}
                        </span>
                      </div>
                      {section.description && (
                        <div className="text-sm mt-4 text-foreground-3 dark:text-foreground-2 leading-relaxed">
                          {section.description}
                        </div>
                      )}
                    </div>
                  ) : showDescriptionInHeader ? (
                    <div className="flex items-end gap-1 mb-3">
                      <div className="text-sm text-foreground-3 dark:text-foreground-2 cursor-default leading-relaxed">
                        {section.description}
                      </div>
                      <div className="flex-1 h-px bg-border dark:bg-border-strong"></div>
                    </div>
                  ) : (
                    <h3 className="font-medium flex items-center gap-2">
                      {(() => {
                        const Icon = getSectionIcon(section.title, t);
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
                    description={section.description}
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
                ) : (section.title === 'Locations' || section.title === locationsTitle) ? (
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
                ) : (section.title === 'Services' || section.title === servicesTitle) ? (
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
                    description={section.description}
                    summaryLine={section.summaryLine}
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
            {/* Save button */}
            <div className="ml-auto">
              <Button
                onClick={onSave}
                variant="default"
                rounded="full"
                disabled={isSaving || !hasChanges}
                className="w-auto min-w-[200px]"
              >
                {isSaving ? <Spinner size="sm" /> : finalSaveLabel}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

