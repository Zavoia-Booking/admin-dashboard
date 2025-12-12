import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Users, Briefcase, Info, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../../../../shared/components/ui/card';
import { Button } from '../../../../shared/components/ui/button';
import { Spinner } from '../../../../shared/components/ui/spinner';
import { Skeleton } from '../../../../shared/components/ui/skeleton';
import { LocationsList } from './LocationsList';
import { ServicesList } from './ServicesList';
import { TeamMembersList } from './TeamMembersList';
import ConfirmDialog from '../../../../shared/components/common/ConfirmDialog';

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
  serviceName?: string;
  onApplyServices?: (serviceIds: number[]) => void;
}

interface AssignmentDetailsPanelProps {
  sections: AssignmentSection[];
  onSave: () => void;
  isSaving?: boolean;
  isLoading?: boolean;
  saveLabel?: string;
  emptyStateMessage?: string;
  emptyStateTitle?: string;
  hasChanges?: boolean;
  onUndo?: () => void;
  topContent?: React.ReactNode;
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
  emptyStateTitle,
  hasChanges = true,
  topContent
}: AssignmentDetailsPanelProps) {
  const { t } = useTranslation('assignments');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const finalSaveLabel = saveLabel || t('page.servicesAssignments.buttons.save') || t('page.teamMembers.buttons.saveChanges');
  const finalEmptyStateMessage = emptyStateMessage || t('page.teamMembers.emptyState.noTeamMemberSelected');

  // Get team member name from sections for confirmation dialog
  const teamMemberName = sections.find(section => section.teamMemberName)?.teamMemberName;

  const handleSaveClick = () => {
    // Prevent opening dialog if already saving
    if (isSaving) {
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmSave = () => {
    // Guard against double-clicks on Confirm button
    if (isSaving) {
      return;
    }
    setShowConfirmDialog(false);
    onSave();
  };
  // Show skeleton when loading
  if (isLoading) {
    return (
      <Card className="col-span-8 md:col-span-8">
        <CardContent>
          <div className="space-y-6">
            {/* Header skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-6 w-40 md:w-64" />
              <Skeleton className="h-4 md:w-96" />
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
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-0 pt-4 border-t border-border dark:border-border">
              <div className="flex gap-2 w-full md:w-auto">
                <Skeleton className="h-9 flex-1 md:w-20" />
                <Skeleton className="h-9 flex-1 md:w-20" />
              </div>
              <Skeleton className="h-10 w-full md:w-40" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!sections || sections.length === 0) {
    return (
      <Card className="col-span-8 md:col-span-8 py-3 cursor-default">
        <CardContent className="px-3">
          <div className="space-y-6">
            {topContent && (
              <div>
                {topContent}
              </div>
            )}
            <div className="flex flex-col items-center justify-start md:py-8 text-center gap-6 md:min-h-[400px]">
              {/* Abstract assignment detail cards illustration with enhanced depth */}
              <div className="relative w-full max-w-md h-28 md:h-44 text-left mb-14">
              {/* Subtle background glow */}
              <div className="absolute inset-0 -top-4 -bottom-4 bg-gradient-to-b from-primary/5 dark:from-primary/10 via-transparent to-transparent blur-2xl opacity-50 dark:opacity-40" />
              
              {/* back cards with better shadows */}
              <div className="absolute inset-x-10 top-2 md:h-28 h-20 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-border shadow-lg opacity-70 rotate-[-14deg] blur-[0.5px]" />
              <div className="absolute inset-x-6 top-10 md:h-30 h-25 rounded-2xl bg-neutral-50 dark:bg-neutral-900/70 border border-border shadow-xl opacity-85 rotate-[10deg] blur-[0.5px]" />

              {/* front skeleton card - more realistic assignment detail card */}
              <div className="absolute inset-x-2 top-6 h-25 md:h-32 rounded-2xl bg-surface dark:bg-neutral-900 border border-border dark:border-border-surface shadow-xl overflow-hidden">
                <div className="h-full w-full px-4 py-2 flex flex-col gap-3">
                  {/* Header section */}
                  <div className="flex flex-col gap-2">
                    {/* Title skeleton */}
                    <div className="h-4 w-40 rounded bg-neutral-300 dark:bg-neutral-800" />
                    {/* Helper text skeleton */}
                    <div className="flex items-start gap-1.5">
                      <div className="h-3 w-3 rounded bg-neutral-300/80 dark:bg-neutral-800/80 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <div className="h-2.5 w-full rounded bg-neutral-300/70 dark:bg-neutral-800/70" />
                        <div className="h-2.5 w-2/3 rounded bg-neutral-300/60 dark:bg-neutral-800/60" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Divider */}
                  <div className="h-px bg-border dark:bg-border-surface" />
                  
                  {/* List items skeleton */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-3.5 w-3.5 rounded-full bg-neutral-300/90 dark:bg-neutral-800/90 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="h-3 w-28 rounded bg-neutral-300/90 dark:bg-neutral-800/90" />
                      </div>
                      <div className="h-3.5 w-12 rounded bg-neutral-300/80 dark:bg-neutral-800/80" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3.5 w-3.5 rounded-full bg-neutral-300/80 dark:bg-neutral-800/80 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="h-3 w-24 rounded bg-neutral-300/80 dark:bg-neutral-800/80" />
                      </div>
                      <div className="h-3.5 w-10 rounded bg-neutral-300/70 dark:bg-neutral-800/70" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Copy with better spacing */}
            <div className="space-y-2 max-w-xl px-4">
              <h3 className="text-lg font-semibold text-foreground-1">
                {emptyStateTitle || t('page.teamMembers.emptyState.selectItemToGetStarted')}
              </h3>
              <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
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
          {topContent && (
            <div>
              {topContent}
            </div>
          )}
          {sections.map((section, sectionIndex) => {
            const toggleHandler = section.onToggle || section.onToggleSelection;

            const servicesTitle = t('page.teamMembers.sections.services.title');
            const locationsTitle = t('page.teamMembers.sections.locations.title');
            const teamMembersAssignedTitle = t('page.servicesAssignments.sections.teamMembersAssigned');
            const locationsForServicesTitle = t('page.servicesAssignments.sections.locations');
            
            const isServicesForTeamMember =
              (section.title === 'Services' || section.title === servicesTitle) && !!section.teamMemberName;
            const isLocationsForTeamMember =
              (section.title === 'Locations' || section.title === locationsTitle) && !!section.teamMemberName;
            
            // Check if this is a team members section for services
            const teamMembersForServiceTitle = t('page.servicesAssignments.sections.teamMembersTitle');
            const isTeamMembersForService = section.serviceName && (
              section.title === teamMembersAssignedTitle ||
              section.title === 'Team Members Assigned' ||
              section.title === teamMembersForServiceTitle ||
              section.title.includes('Team members who provide') ||
              section.title.includes('Membri ai echipei care oferă')
            );
            
            // Check if this is a locations section for services
            const locationsForServiceTitle = t('page.servicesAssignments.sections.locationsTitle');
            const isLocationsForService = section.serviceName && (
              section.title === locationsForServicesTitle ||
              section.title === 'Locations' ||
              section.title === locationsForServiceTitle ||
              section.title.includes('Locations where this service') ||
              section.title.includes('Locații unde este disponibil')
            );
            const showDescriptionInHeader =
              !!section.description && !isServicesForTeamMember && !isLocationsForTeamMember && !isTeamMembersForService && !isLocationsForService;
            
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
                      <div className="flex-1 h-px bg-border dark:bg-border-surface"></div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <h3 className="font-medium flex items-center gap-2">
                        {(() => {
                          const Icon = getSectionIcon(section.title, t);
                          return Icon ? <Icon className="h-4 w-4" /> : null;
                        })()}
                        {section.title}
                      </h3>
                      {section.summaryLine && (
                        <div className="text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">
                          {section.summaryLine}
                        </div>
                      )}
                      {section.description && (
                        <div className="text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">
                          {section.description}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Handle type-based rendering for Locations tab */}
                {section.type === 'services' ? (
                  <ServicesList
                    allServices={section.availableItems || []}
                    assignedServiceIds={section.selectedIds}
                    assignedServices={section.assignedServices}
                    onToggle={toggleHandler!}
                    onUpdateCustomPrice={section.onUpdateCustomPrice}
                    onUpdateCustomDuration={section.onUpdateCustomDuration}
                    showEmptyState={false}
                    currency={section.currency}
                    teamMemberName={section.teamMemberName}
                    onApplyServices={section.onApplyServices}
                    useCompactLayout={true}
                    summaryLine={section.summaryLine}
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
                    showEmptyState={false}
                    currency={section.currency}
                    teamMemberName={section.teamMemberName}
                    onApplyServices={section.onApplyServices}
                    useCompactLayout={true}
                    description={section.description}
                    summaryLine={section.summaryLine}
                  />
                ) : isTeamMembersForService ? (
                  <TeamMembersList
                    allTeamMembers={(section.availableItems || []).map(item => ({
                      id: item.id,
                      name: item.name,
                      email: item.email,
                    }))}
                    assignedTeamMemberIds={section.selectedIds}
                    onToggle={toggleHandler!}
                  />
                ) : isLocationsForService ? (
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
                ) : null}
              </div>
            );
          })}

          <div className="flex items-center justify-between pt-4 border-t border-border dark:border-border">
            {/* Save button */}
            <div className="ml-auto">
              <Button
                onClick={handleSaveClick}
                variant="default"
                rounded="full"
                disabled={isSaving || !hasChanges}
                className="w-auto !min-w-44"
              >
                {isSaving ? (
                  <>
                    <Spinner size="sm" color="white" className="mr-2" />
                  </>
                ) : (
                  finalSaveLabel
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirmSave}
        onCancel={() => setShowConfirmDialog(false)}
        title={
          teamMemberName
            ? t('page.teamMembers.confirmDialog.title', { teamMemberName })
            : t('page.teamMembers.confirmDialog.title')
        }
        description={t('page.teamMembers.confirmDialog.description')}
        confirmTitle={t('page.teamMembers.confirmDialog.confirm')}
        cancelTitle={t('page.teamMembers.confirmDialog.cancel')}
        showCloseButton={true}
      />
    </Card>
  );
}

