import { useEffect, useMemo, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { AssignmentListPanel, type ListItem } from '../common/AssignmentListPanel';
import { AssignmentDetailsPanel, type AssignmentSection } from '../common/AssignmentDetailsPanel';
import { Avatar, AvatarImage, AvatarFallback } from '../../../../shared/components/ui/avatar';
import { Pill } from '../../../../shared/components/ui/pill';
import { Badge } from '../../../../shared/components/ui/badge';
import { SearchInput } from '../../../../shared/components/common/SearchInput';
import { highlightMatches } from '../../../../shared/utils/highlight';
import { useUndoRedo } from '../../../../shared/hooks/useUndoRedo';
import type { TeamMember } from '../../../../shared/types/team-member';
import { getAvatarBgColor } from '../../../setupWizard/components/StepTeam';
import {
  selectTeamMemberAction,
  fetchTeamMemberAssignmentByIdAction,
  updateTeamMemberAssignmentsAction,
} from '../../actions';
import {
  getIsLoadingSelector,
  getIsSavingSelector,
  getSelectedTeamMemberSelector,
} from '../../selectors';
import { listTeamMembersAction } from '../../../teamMembers/actions';
import { selectTeamMembers } from '../../../teamMembers/selectors';
import { getServicesListSelector } from '../../../services/selectors';
import { getAllLocationsSelector } from '../../../locations/selectors';
import { MapPin, Wrench, Briefcase } from 'lucide-react';

export function TeamMembersAssignments() {
  const { t } = useTranslation('assignments');
  const dispatch = useDispatch();
  
  // State selectors
  const isLoading = useSelector(getIsLoadingSelector);
  const isSaving = useSelector(getIsSavingSelector);
  const selectedTeamMember = useSelector(getSelectedTeamMemberSelector);
  const allTeamMembers = useSelector(selectTeamMembers);
  const allServices = useSelector(getServicesListSelector);
  const allLocations = useSelector(getAllLocationsSelector);
  
  // Local state for selected IDs with undo/redo
  interface AssignmentState {
    serviceIds: number[];
    locationIds: number[];
    customPrices: Record<number, number | null>; // serviceId -> customPrice in cents
    customDurations: Record<number, number | null>; // serviceId -> customDuration in minutes
  }
  
  const {
    state: assignmentState,
    setState: setAssignmentState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
  } = useUndoRedo<AssignmentState>(
    { serviceIds: [], locationIds: [], customPrices: {}, customDurations: {} },
    50
  );
  
  const selectedServiceIds = assignmentState.serviceIds;
  const selectedLocationIds = assignmentState.locationIds;
  
  // Track initial state to detect changes
  const [initialServiceIds, setInitialServiceIds] = useState<number[]>([]);
  const [initialLocationIds, setInitialLocationIds] = useState<number[]>([]);
  
  // Search/filter state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter out team members with pending_acceptance status
  const activeTeamMembers = useMemo(() => {
    return allTeamMembers.filter((member: TeamMember) => member.roleStatus !== 'pending_acceptance');
  }, [allTeamMembers]);
  
  // Filter and search team members
  const filteredTeamMembers = useMemo(() => {
    if (!searchTerm.trim()) return activeTeamMembers;
    
    const query = searchTerm.trim().toLowerCase();
    const tokens = query.split(/\s+/).filter(Boolean);
    
    return activeTeamMembers.filter((member: TeamMember) => {
      const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
      const email = (member.email || '').toLowerCase();
      
      return tokens.every(token => 
        fullName.includes(token) || email.includes(token)
      );
    });
  }, [activeTeamMembers, searchTerm]);
  
  // Handlers
  const handleSelectTeamMember = (userId: number) => {
    dispatch(selectTeamMemberAction(userId));
    dispatch(fetchTeamMemberAssignmentByIdAction.request(userId));
  };

  useEffect(() => {
    dispatch(listTeamMembersAction.request());
  }, [dispatch]);

  // Sync local state when selected team member changes
  useEffect(() => {
    if (selectedTeamMember) {
      const serviceIds = selectedTeamMember.assignedServices.map(s => s.serviceId);
      const locationIds = selectedTeamMember.assignedLocations.map(l => l.locationId);
      
      // Build custom prices/durations map from API response
      const customPrices: Record<number, number | null> = {};
      const customDurations: Record<number, number | null> = {};
      selectedTeamMember.assignedServices.forEach(s => {
        customPrices[s.serviceId] = s.customPrice;
        customDurations[s.serviceId] = s.customDuration;
      });
      
      // Update state without recording history (this is initialization)
      setAssignmentState({ 
        serviceIds, 
        locationIds, 
        customPrices,
        customDurations,
      }, false);
      clearHistory();
      
      // Store initial state for change detection
      setInitialServiceIds(serviceIds);
      setInitialLocationIds(locationIds);
    } else {
      setAssignmentState({ 
        serviceIds: [], 
        locationIds: [], 
        customPrices: {},
        customDurations: {},
      }, false);
      clearHistory();
      setInitialServiceIds([]);
      setInitialLocationIds([]);
    }
  }, [selectedTeamMember, setAssignmentState, clearHistory]);
  
  // Detect if there are changes
  const hasChanges = useMemo(() => {
    const serviceIdsChanged = 
      selectedServiceIds.length !== initialServiceIds.length ||
      selectedServiceIds.some(id => !initialServiceIds.includes(id)) ||
      initialServiceIds.some(id => !selectedServiceIds.includes(id));
    
    const locationIdsChanged = 
      selectedLocationIds.length !== initialLocationIds.length ||
      selectedLocationIds.some(id => !initialLocationIds.includes(id)) ||
      initialLocationIds.some(id => !selectedLocationIds.includes(id));
    
    return serviceIdsChanged || locationIdsChanged;
  }, [selectedServiceIds, selectedLocationIds, initialServiceIds, initialLocationIds]);

  // Get assignment counts for each team member (from Redux or calculate)
  const getAssignmentCounts = useCallback((memberId: number) => {
    // Try to get from selectedTeamMember if it's the current one
    if (selectedTeamMember && selectedTeamMember.id === memberId) {
      return {
        services: selectedTeamMember.assignedServices?.length || 0,
        locations: selectedTeamMember.assignedLocations?.length || 0,
      };
    }
    
    // Fallback: use counts from TeamMember type if available
    const member = allTeamMembers.find((m: TeamMember) => m.id === memberId);
    return {
      services: member?.servicesCount || 0,
      locations: member?.locationsCount || 0,
    };
  }, [selectedTeamMember, allTeamMembers]);
  
  // Transform team members into list items with badges
  const listItems: ListItem[] = useMemo(() => {
    return filteredTeamMembers.map((member: TeamMember) => {
      const counts = getAssignmentCounts(member.id);
      const badges: Array<{ label: string; value: number }> = [];
      
      if (counts.services > 0) {
        badges.push({ label: counts.services === 1 ? 'Service' : 'Services', value: counts.services });
      }
      if (counts.locations > 0) {
        badges.push({ label: counts.locations === 1 ? 'Location' : 'Locations', value: counts.locations });
      }
      
      return {
        id: member.id,
        title: `${member.firstName} ${member.lastName}`,
        subtitle: member.email,
        badges,
      };
    });
  }, [filteredTeamMembers, getAssignmentCounts]);

  // Custom render function for team member items
  const renderTeamMemberItem = (item: ListItem, isSelected: boolean) => {
    const member = filteredTeamMembers.find((m: TeamMember) => m.id === item.id);
    if (!member) return null;

    const initials = `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();
    const counts = getAssignmentCounts(member.id);

    return (
      <Pill
        key={item.id}
        selected={isSelected}
        onClick={() => handleSelectTeamMember(Number(item.id))}
        className="w-full justify-start items-center text-left"
        logo={
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={member.profileImage || undefined} alt={`${member.firstName} ${member.lastName}`} />
            <AvatarFallback 
              className="text-sm font-medium"
              style={{ backgroundColor: getAvatarBgColor(member.email) }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
        }
      >
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">
            {searchTerm ? highlightMatches(item.title, searchTerm) : item.title}
          </div>
          {item.subtitle && (
            <div className="text-sm text-muted-foreground truncate">
              {searchTerm ? highlightMatches(item.subtitle, searchTerm) : item.subtitle}
            </div>
          )}
          {item.badges && item.badges.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {counts.services > 0 && (
                <Badge variant="secondary" className="text-xs h-5 px-1.5 gap-1">
                  <Briefcase className="h-3 w-3" />
                  {counts.services}
                </Badge>
              )}
              {counts.locations > 0 && (
                <Badge variant="secondary" className="text-xs h-5 px-1.5 gap-1">
                  <MapPin className="h-3 w-3" />
                  {counts.locations}
                </Badge>
              )}
            </div>
          )}
        </div>
      </Pill>
    );
  };

  // Handlers for toggling selections (with undo/redo support)
  const toggleServiceSelection = useCallback((serviceId: number) => {
    setAssignmentState(prev => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter(id => id !== serviceId)
        : [...prev.serviceIds, serviceId],
    }));
  }, [setAssignmentState]);

  const toggleLocationSelection = useCallback((locationId: number) => {
    setAssignmentState(prev => ({
      ...prev,
      locationIds: prev.locationIds.includes(locationId)
        ? prev.locationIds.filter(id => id !== locationId)
        : [...prev.locationIds, locationId],
    }));
  }, [setAssignmentState]);

  // Handlers for custom price/duration
  const handleUpdateCustomPrice = useCallback((serviceId: number, price: number | null) => {
    setAssignmentState(prev => ({
      ...prev,
      customPrices: {
        ...prev.customPrices,
        [serviceId]: price,
      },
    }));
  }, [setAssignmentState]);

  const handleUpdateCustomDuration = useCallback((serviceId: number, duration: number | null) => {
    setAssignmentState(prev => ({
      ...prev,
      customDurations: {
        ...prev.customDurations,
        [serviceId]: duration,
      },
    }));
  }, [setAssignmentState]);

  // Handle save
  const handleSave = () => {
    if (!selectedTeamMember) return;
    
    dispatch(updateTeamMemberAssignmentsAction.request({
      userId: selectedTeamMember.id,
      serviceIds: selectedServiceIds,
      locationIds: selectedLocationIds
    }));
  };

  // Handle apply services from ManageServicesSheet
  const handleApplyServices = useCallback((serviceIds: number[]) => {
    setAssignmentState(prev => ({
      ...prev,
      serviceIds,
    }));
  }, [setAssignmentState]);

  // Transform data for details panel
  const detailsSections: AssignmentSection[] = useMemo(() => {
    if (!selectedTeamMember) return [];
    
    // Use allServices from API response if available, otherwise fallback to Redux store
    const servicesFromApi = selectedTeamMember.allServices || [];
    const allServicesList = servicesFromApi.length > 0 
      ? servicesFromApi.map(s => ({
          id: s.serviceId, 
          name: s.serviceName,
          price_amount_minor: s.price_amount_minor, // For comparisons with customPrice (cents)
          price: s.displayPrice, // For display (decimal)
          duration: s.duration,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          category: s.category || null,
        }))
      : allServices.map(s => ({ 
          id: s.id, 
          name: s.name, 
          price_amount_minor: s.price ? Math.round(s.price * 100) : undefined, // Fallback conversion
          price: s.price, // Already in decimal format
          duration: s.duration,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          category: s.category || null,
        }));
    
    // Use allLocations from API response if available, otherwise fallback to Redux store
    const locationsFromApi = selectedTeamMember.allLocations || [];
    const allLocationsList = locationsFromApi.length > 0
      ? locationsFromApi.map(l => ({ id: l.locationId, name: l.locationName, address: l.address }))
      : allLocations.map(l => ({ id: l.id, name: l.name, address: l.address }));
    
    // Assigned services: items whose IDs are in selectedServiceIds with custom prices/durations
    const assignedServicesData: Array<{
      serviceId: number;
      serviceName: string;
      customPrice: number | null;
      customDuration: number | null;
      defaultPrice?: number;
      defaultDuration?: number;
      category?: { id: number; name: string; color?: string } | null;
    }> = selectedServiceIds
      .map(id => {
        const existing = selectedTeamMember.assignedServices.find(s => s.serviceId === id);
        const service = allServicesList.find(s => Number(s.id) === id);
        
        if (existing) {
          return {
            serviceId: existing.serviceId,
            serviceName: existing.serviceName,
            customPrice: assignmentState.customPrices[id] ?? existing.customPrice,
            customDuration: assignmentState.customDurations[id] ?? existing.customDuration,
            defaultPrice: service?.price_amount_minor, // Use price_amount_minor (cents) for comparison
            defaultDisplayPrice: service?.price, // Use displayPrice (decimal) for display
            defaultDuration: service?.duration,
            category: service?.category || null,
          };
        }
        
        if (service) {
          return {
            serviceId: Number(service.id),
            serviceName: service.name,
            customPrice: assignmentState.customPrices[id] ?? null,
            customDuration: assignmentState.customDurations[id] ?? null,
            defaultPrice: service.price_amount_minor, // Use price_amount_minor (cents) from backend
            defaultDisplayPrice: service.price, // Use displayPrice (decimal) from backend
            defaultDuration: service.duration,
            category: service.category || null,
          };
        }
        
        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
    
    // Also create simple assignedItems for backward compatibility
    const assignedServices = assignedServicesData.map(s => ({
      id: s!.serviceId,
      name: s!.serviceName,
    }));

    // Assigned locations: items whose IDs are in selectedLocationIds
    const assignedLocations = selectedLocationIds.map(id => {
      const existing = selectedTeamMember.assignedLocations.find(l => l.locationId === id);
      if (existing) {
        return { id: existing.locationId, name: existing.locationName, subtitle: existing.address };
      }
      const location = allLocationsList.find(l => l.id === id);
      return location ? { id: location.id, name: location.name } : null;
    }).filter(Boolean) as Array<{ id: number; name: string; subtitle?: string }>;
    
    const teamMemberName = `${selectedTeamMember.firstName} ${selectedTeamMember.lastName}`;
    const servicesCount = selectedServiceIds.length;
    const locationsCount = selectedLocationIds.length;
    
    // Format descriptions matching ServicesListTab pattern with emphasized names/numbers
    const servicesDescription = servicesCount === 0 ? (
      <>
        <div>
          <span className="font-semibold text-foreground-1">{teamMemberName}</span>
          {' '}
          {t('page.teamMembers.sections.services.description.notAssigned')}
        </div>
        <div className="mt-1">
          {t('page.teamMembers.sections.services.description.notAssignedHelper')}
        </div>
      </>
    ) : (
      <>
        <div>
          <span className="font-semibold text-foreground-1">{teamMemberName}</span>
          {' '}
          {t('page.teamMembers.sections.services.description.assignedPrefix')}{' '}
          <span className="font-semibold text-foreground-1">
            {servicesCount}{' '}
            {t(
              servicesCount === 1
                ? 'page.teamMembers.sections.services.serviceOne'
                : 'page.teamMembers.sections.services.serviceOther'
            )}
          </span>{' '}
          {t('page.teamMembers.sections.services.description.assignedSuffix')}
        </div>
        <div className="mt-1">
          {t('page.teamMembers.sections.services.description.assignedHelper')}
        </div>
      </>
    );
    
    const locationsDescription = locationsCount === 0 ? (
      <>
        <div>
          <span className="font-semibold text-foreground-1">{teamMemberName}</span>
          {' '}
          {t('page.teamMembers.sections.locations.description.notAssigned')}
        </div>
        <div className="mt-1">
          {t('page.teamMembers.sections.locations.description.notAssignedHelper')}
        </div>
      </>
    ) : (
      <>
        <div>
          <span className="font-semibold text-foreground-1">{teamMemberName}</span>
          {' '}
          {t('page.teamMembers.sections.locations.description.assignedPrefix')}{' '}
          <span className="font-semibold text-foreground-1">
            {locationsCount}{' '}
            {t(
              locationsCount === 1
                ? 'page.teamMembers.sections.locations.locationOne'
                : 'page.teamMembers.sections.locations.locationOther'
            )}
          </span>
          {t('page.teamMembers.sections.locations.description.assignedSuffix')}
        </div>
        <div className="mt-1">
          {t('page.teamMembers.sections.locations.description.assignedHelper')}
        </div>
      </>
    );

    return [
      {
        title: 'Services',
        description: servicesDescription,
        icon: Wrench,
        assignedItems: assignedServices,
        assignedServices: assignedServicesData,
        availableItems: allServicesList, // Show ALL services in dropdown
        selectedIds: selectedServiceIds,
        onToggleSelection: toggleServiceSelection,
        onUpdateCustomPrice: handleUpdateCustomPrice,
        onUpdateCustomDuration: handleUpdateCustomDuration,
        teamMemberName: teamMemberName,
        onApplyServices: handleApplyServices,
      },
      {
        title: 'Locations',
        description: locationsDescription,
        icon: MapPin,
        assignedItems: assignedLocations,
        availableItems: allLocationsList, // Show ALL locations in dropdown
        selectedIds: selectedLocationIds,
        onToggleSelection: toggleLocationSelection,
      },
    ];
  }, [
    selectedTeamMember,
    allServices,
    allLocations,
    selectedServiceIds,
    selectedLocationIds,
    toggleServiceSelection,
    toggleLocationSelection,
  ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      <div className="col-span-4 md:col-span-4">
        <div className="space-y-4">
          {/* Search Input */}
          <SearchInput
            placeholder="Search team members..."
            value={searchTerm}
            onChange={setSearchTerm}
            className="w-full"
          />
          
          <AssignmentListPanel
            title={`Team Members (${filteredTeamMembers.length}${searchTerm ? ` of ${activeTeamMembers.length}` : ''})`}
            items={listItems}
            selectedId={selectedTeamMember?.id ?? null}
            onSelect={(id) => handleSelectTeamMember(Number(id))}
            isLoading={isLoading}
            emptyMessage={searchTerm ? "No team members match your search" : "No team members found"}
            renderItem={renderTeamMemberItem}
          />
        </div>
      </div>

      <AssignmentDetailsPanel
        sections={detailsSections}
        onSave={handleSave}
        isSaving={isSaving}
        hasChanges={hasChanges}
        emptyStateMessage={t('page.teamMembers.emptyState.noTeamMemberSelected')}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
    </div>
  );
}

