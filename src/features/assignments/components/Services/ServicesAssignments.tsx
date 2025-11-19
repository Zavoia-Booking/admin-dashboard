import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AssignmentListPanel, type ListItem } from '../common/AssignmentListPanel';
import { AssignmentDetailsPanel, type AssignmentSection } from '../common/AssignmentDetailsPanel';
import { Briefcase } from 'lucide-react';
import { Pill } from '../../../../shared/components/ui/pill';
import {
  selectServiceAction,
  fetchServiceAssignmentByIdAction,
  updateServiceAssignmentsAction,
} from '../../actions';
import {
  getIsLoadingSelector,
  getIsSavingSelector,
  getSelectedServiceSelector,
} from '../../selectors';
import { getServicesAction } from '../../../services/actions';
import { getServicesListSelector } from '../../../services/selectors';

export function ServicesAssignments() {
  const dispatch = useDispatch();
  
  // State selectors
  const isLoading = useSelector(getIsLoadingSelector);
  const isSaving = useSelector(getIsSavingSelector);
  const selectedService = useSelector(getSelectedServiceSelector);
  const allServices = useSelector(getServicesListSelector);
  
  // Local state for multi-select
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([]);
  
  // Track initial state to detect changes
  const [initialUserIds, setInitialUserIds] = useState<number[]>([]);
  const [initialLocationIds, setInitialLocationIds] = useState<number[]>([]);

  useEffect(() => {
    dispatch(getServicesAction.request({ reset: true }));
  }, [dispatch]);

  // Sync local state when selected service changes
  useEffect(() => {
    if (selectedService) {
      const userIds = selectedService.assignedTeamMembers?.map((tm: any) => tm.userId) || [];
      const locationIds = selectedService.assignedLocations?.map((l: any) => l.locationId) || [];
      
      setSelectedUserIds(userIds);
      setSelectedLocationIds(locationIds);
      
      // Store initial state for change detection
      setInitialUserIds(userIds);
      setInitialLocationIds(locationIds);
    } else {
      setSelectedUserIds([]);
      setSelectedLocationIds([]);
      setInitialUserIds([]);
      setInitialLocationIds([]);
    }
  }, [selectedService]);
  
  // Detect if there are changes
  const hasChanges = useMemo(() => {
    const userIdsChanged = 
      selectedUserIds.length !== initialUserIds.length ||
      selectedUserIds.some(id => !initialUserIds.includes(id)) ||
      initialUserIds.some(id => !selectedUserIds.includes(id));
    
    const locationIdsChanged = 
      selectedLocationIds.length !== initialLocationIds.length ||
      selectedLocationIds.some(id => !initialLocationIds.includes(id)) ||
      initialLocationIds.some(id => !selectedLocationIds.includes(id));
    
    return userIdsChanged || locationIdsChanged;
  }, [selectedUserIds, selectedLocationIds, initialUserIds, initialLocationIds]);

  // Handlers
  const handleSelectService = (serviceId: number) => {
    dispatch(selectServiceAction(serviceId));
    dispatch(fetchServiceAssignmentByIdAction.request(serviceId));
  };

  const handleSave = () => {
    if (!selectedService) return;
   
    dispatch(updateServiceAssignmentsAction.request({
      serviceId: selectedService.id,
      teamMemberIds: selectedUserIds,
      locationIds: selectedLocationIds
    }));
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleLocationSelection = (locationId: number) => {
    setSelectedLocationIds(prev => 
      prev.includes(locationId)
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    );
  };

  // Transform data for list panel
  const listItems: ListItem[] = useMemo(() => {
    return allServices.map((svc) => ({
      id: svc.id,
      title: svc.name,
      subtitle: `$${svc.price} • ${svc.duration} min`,
    }));
  }, [allServices]);

  // Custom render function for service items
  const renderServiceItem = (item: ListItem, isSelected: boolean) => {
    return (
      <Pill
        key={item.id}
        selected={isSelected}
        onClick={() => handleSelectService(Number(item.id))}
        className="w-full justify-start items-center text-left"
        logo={
          <div className="h-10 w-10 shrink-0 rounded-full bg-muted flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-muted-foreground" />
          </div>
        }
      >
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{item.title}</div>
          {item.subtitle && (
            <div className="text-sm text-muted-foreground truncate">
              {item.subtitle}
            </div>
          )}
        </div>
      </Pill>
    );
  };

  // Transform data for details panel
  const detailsSections: AssignmentSection[] = useMemo(() => {
    if (!selectedService) return [];
    
    // Use allTeamMembers and allLocations from the selected service API response
    const allTeamMembersList = (selectedService.allTeamMembers || []).map((tm: any) => ({ 
      id: tm.userId, 
      name: `${tm.firstName} ${tm.lastName}`,
      subtitle: tm.email,
    }));

    // Get all locations available  
    const allLocationsList = (selectedService.allLocations || []).map((l: any) => ({ 
      id: l.locationId, 
      name: l.locationName,
      address: l.address,
    }));
    
    // Assigned team members
    const assignedTeamMembers = selectedUserIds.map(id => {
      const existing = (selectedService.assignedTeamMembers || []).find((tm: any) => tm.userId === id);
      if (existing) {
        return { id: existing.userId, name: `${existing.firstName} ${existing.lastName}`, subtitle: existing.email };
      }
      const teamMember = allTeamMembersList.find((tm: any) => tm.id === id);
      return teamMember ? { id: teamMember.id, name: teamMember.name, subtitle: teamMember.subtitle } : null;
    }).filter(Boolean) as Array<{ id: number; name: string; subtitle?: string }>;

    // Assigned locations
    const assignedLocations = selectedLocationIds.map(id => {
      const existing = (selectedService.assignedLocations || []).find((l: any) => l.locationId === id);
      if (existing) {
        return { id: existing.locationId, name: existing.locationName, subtitle: existing.address };
      }
      const location = allLocationsList.find((l: any) => l.id === id);
      return location ? { id: location.id, name: location.name, subtitle: location.address } : null;
    }).filter(Boolean) as Array<{ id: number; name: string; subtitle?: string }>;
   
    return [
      {
        title: 'Team Members Assigned',
        assignedItems: assignedTeamMembers,
        availableItems: allTeamMembersList,
        selectedIds: selectedUserIds,
        onToggleSelection: toggleUserSelection,
      },
      {
        title: 'Locations',
        assignedItems: assignedLocations,
        availableItems: allLocationsList,
        selectedIds: selectedLocationIds,
        onToggleSelection: toggleLocationSelection,
      },
    ];
  }, [
    selectedService,
    selectedUserIds,
    selectedLocationIds,
    toggleUserSelection,
    toggleLocationSelection,
  ]);

  // Custom empty state for when no services exist
  const emptyStateComponent = (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Briefcase className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-foreground">
            No services available
          </h3>
          <p className="text-xs text-muted-foreground">
            Create services to assign them to team members and locations.
          </p>
        </div>
        <button
          onClick={() => window.location.href = '/services'}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors h-9 px-4 py-2 bg-primary text-white shadow-xs hover:bg-primary-hover rounded-md mt-2"
        >
          Go to Services
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"/>
            <path d="m12 5 7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      <AssignmentListPanel
        title={`Services (${allServices.length})`}
        items={listItems}
        selectedId={selectedService?.id ?? null}
        onSelect={(id) => handleSelectService(Number(id))}
        isLoading={isLoading}
        emptyMessage="No services found"
        emptyStateComponent={emptyStateComponent}
        renderItem={renderServiceItem}
      />

      <AssignmentDetailsPanel
        sections={detailsSections}
        onSave={handleSave}
        isSaving={isSaving}
        hasChanges={hasChanges}
        emptyStateMessage="Choose a service from the list to view and manage its assignments"
      />
    </div>
  );
}

