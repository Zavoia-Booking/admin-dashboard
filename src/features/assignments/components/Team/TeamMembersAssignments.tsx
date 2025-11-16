import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AssignmentListPanel, type ListItem } from '../common/AssignmentListPanel';
import { AssignmentDetailsPanel, type AssignmentSection } from '../common/AssignmentDetailsPanel';
import { Avatar, AvatarImage, AvatarFallback } from '../../../../shared/components/ui/avatar';
import type { TeamMember } from '../../../../shared/types/team-member';
import {
  selectTeamMemberAction,
  fetchTeamMemberAssignmentByIdAction,
  assignServicesToTeamMemberAction,
  assignLocationsToTeamMemberAction,
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

export function TeamMembersAssignments() {
  const dispatch = useDispatch();
  
  // State selectors
  const isLoading = useSelector(getIsLoadingSelector);
  const isSaving = useSelector(getIsSavingSelector);
  const selectedTeamMember = useSelector(getSelectedTeamMemberSelector);
  const allTeamMembers = useSelector(selectTeamMembers);
  const allServices = useSelector(getServicesListSelector);
  const allLocations = useSelector(getAllLocationsSelector);
  
  // Local state for selected IDs
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([]);
  
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
      setSelectedServiceIds(selectedTeamMember.assignedServices.map(s => s.serviceId));
      setSelectedLocationIds(selectedTeamMember.assignedLocations.map(l => l.locationId));
    } else {
      setSelectedServiceIds([]);
      setSelectedLocationIds([]);
    }
  }, [selectedTeamMember]);

  // Transform team members into list items
  const listItems: ListItem[] = useMemo(() => {
    return allTeamMembers.map((member: TeamMember) => ({
      id: member.id,
      title: `${member.firstName} ${member.lastName}`,
      subtitle: member.email,
    }));
  }, [allTeamMembers]);

  // Custom render function for team member items
  const renderTeamMemberItem = (item: ListItem, isSelected: boolean) => {
    const member = allTeamMembers.find((m: TeamMember) => m.id === item.id);
    if (!member) return null;

    const initials = `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();

    return (
      <button
        key={item.id}
        onClick={() => handleSelectTeamMember(Number(item.id))}
        className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
          isSelected
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
      >
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src="" alt={`${member.firstName} ${member.lastName}`} />
            <AvatarFallback className="text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{item.title}</div>
            {item.subtitle && (
              <div className="text-sm text-muted-foreground truncate">
                {item.subtitle}
              </div>
            )}
          </div>
        </div>
      </button>
    );
  };

  // Handlers for toggling selections
  const toggleServiceSelection = (serviceId: number) => {
    setSelectedServiceIds(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const toggleLocationSelection = (locationId: number) => {
    setSelectedLocationIds(prev => 
      prev.includes(locationId)
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    );
  };

  // Handle save
  const handleSave = () => {
    if (!selectedTeamMember) return;
    
    dispatch(assignServicesToTeamMemberAction.request({
      userId: selectedTeamMember.id,
      serviceIds: selectedServiceIds
    }));
    
    dispatch(assignLocationsToTeamMemberAction.request({
      userId: selectedTeamMember.id,
      locationIds: selectedLocationIds
    }));
  };

  // Transform data for details panel
  const detailsSections: AssignmentSection[] = useMemo(() => {
    if (!selectedTeamMember) return [];
    
    // Use allServices from API response if available, otherwise fallback to Redux store
    const servicesFromApi = selectedTeamMember.allServices || [];
    const allServicesList = servicesFromApi.length > 0 
      ? servicesFromApi.map(s => ({ id: s.serviceId, name: s.serviceName }))
      : allServices.map(s => ({ id: s.id, name: s.name }));
    
    // Use allLocations from API response if available, otherwise fallback to Redux store
    const locationsFromApi = selectedTeamMember.allLocations || [];
    const allLocationsList = locationsFromApi.length > 0
      ? locationsFromApi.map(l => ({ id: l.locationId, name: l.locationName }))
      : allLocations.map(l => ({ id: l.id, name: l.name }));
    
    // Assigned services: items whose IDs are in selectedServiceIds
    const assignedServices = selectedServiceIds.map(id => {
      const existing = selectedTeamMember.assignedServices.find(s => s.serviceId === id);
      if (existing) {
        return { id: existing.serviceId, name: existing.serviceName };
      }
      const service = allServicesList.find(s => s.id === id);
      return service ? { id: service.id, name: service.name } : null;
    }).filter(Boolean) as Array<{ id: number; name: string }>;

    // Assigned locations: items whose IDs are in selectedLocationIds
    const assignedLocations = selectedLocationIds.map(id => {
      const existing = selectedTeamMember.assignedLocations.find(l => l.locationId === id);
      if (existing) {
        return { id: existing.locationId, name: existing.locationName, subtitle: existing.address };
      }
      const location = allLocationsList.find(l => l.id === id);
      return location ? { id: location.id, name: location.name } : null;
    }).filter(Boolean) as Array<{ id: number; name: string; subtitle?: string }>;
    
    return [
      {
        title: 'Services',
        icon: '📌',
        assignedItems: assignedServices,
        availableItems: allServicesList, // Show ALL services in dropdown
        selectedIds: selectedServiceIds,
        onToggleSelection: toggleServiceSelection,
      },
      {
        title: 'Locations',
        icon: '📍',
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

  const detailsTitle = selectedTeamMember
    ? `Managing: ${selectedTeamMember.firstName} ${selectedTeamMember.lastName}`
    : 'Select an item to manage assignments';

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      <AssignmentListPanel
        title={`Team Members (${allTeamMembers.length})`}
        items={listItems}
        selectedId={selectedTeamMember?.id ?? null}
        onSelect={(id) => handleSelectTeamMember(Number(id))}
        isLoading={isLoading}
        emptyMessage="No team members found"
        renderItem={renderTeamMemberItem}
      />

      <AssignmentDetailsPanel
        title={detailsTitle}
        sections={detailsSections}
        onSave={handleSave}
        isSaving={isSaving}
        emptyMessage="Select an item from the list to manage its assignments"
      />
    </div>
  );
}

