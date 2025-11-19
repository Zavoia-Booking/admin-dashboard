import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AssignmentListPanel, type ListItem } from '../common/AssignmentListPanel';
import { AssignmentDetailsPanel, type AssignmentSection } from '../common/AssignmentDetailsPanel';
import { Briefcase } from 'lucide-react';
import {
  selectServiceAction,
  fetchServiceAssignmentByIdAction,
  assignTeamMembersToServiceAction,
  assignLocationsToServiceAction,
} from '../../actions';
import {
  getIsLoadingSelector,
  getIsSavingSelector,
  getSelectedServiceSelector,
} from '../../selectors';
import { getAllLocationsSelector } from '../../../locations/selectors';
import { selectTeamMembers } from '../../../teamMembers/selectors';
import { MapPin, Users } from 'lucide-react';
import { listTeamMembersAction } from '../../../teamMembers/actions';
import { getServicesAction } from '../../../services/actions';
import { getServicesListSelector } from '../../../services/selectors';

export function ServicesAssignments() {
  const dispatch = useDispatch();
  
  // State selectors
  const isLoading = useSelector(getIsLoadingSelector);
  const isSaving = useSelector(getIsSavingSelector);
  const selectedService = useSelector(getSelectedServiceSelector);
  const allServices = useSelector(getServicesListSelector);
  
  // Lookup data
  const allLocations = useSelector(getAllLocationsSelector);
  const allTeamMembers = useSelector(selectTeamMembers);
  
  // Local state for multi-select
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([]);

  useEffect(() => {
    dispatch(listTeamMembersAction.request());
    dispatch(getServicesAction.request({ reset: true }));
  }, [dispatch]);

  // Sync local state when selected service changes
  useEffect(() => {
    if (selectedService) {
      setSelectedUserIds(selectedService.assignedTeamMembers.map(tm => tm.userId));
      setSelectedLocationIds(selectedService.availableLocations.map(l => l.locationId));
    } else {
      setSelectedUserIds([]);
      setSelectedLocationIds([]);
    }
  }, [selectedService]);

  // Handlers
  const handleSelectService = (serviceId: number) => {
    dispatch(selectServiceAction(serviceId));
    dispatch(fetchServiceAssignmentByIdAction.request(serviceId));
  };

  const handleSave = () => {
    if (!selectedService) return;
   
    dispatch(assignTeamMembersToServiceAction.request({
      serviceId: selectedService.serviceId,
      userIds: selectedUserIds
    }));
   
    dispatch(assignLocationsToServiceAction.request({
      serviceId: selectedService.serviceId,
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
      <button
        key={item.id}
        onClick={() => handleSelectService(Number(item.id))}
        className={`w-full text-left p-3 rounded-lg border transition-colors ${
          isSelected
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <Briefcase className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{item.title}</div>
            {item.subtitle && (
              <div className="text-sm text-muted-foreground truncate mt-1">
                {item.subtitle}
              </div>
            )}
          </div>
        </div>
      </button>
    );
  };

  // Transform data for details panel
  const detailsSections: AssignmentSection[] = useMemo(() => {
    if (!selectedService) return [];
    
    // Get all team members available
    const allTeamMembersList = allTeamMembers.map(tm => ({ 
      id: tm.id, 
      name: `${tm.firstName} ${tm.lastName}`,
      subtitle: tm.email,
    }));

    // Get all locations available  
    const allLocationsList = allLocations.map(l => ({ 
      id: l.id, 
      name: l.name,
      address: l.address,
    }));
    
    // Assigned team members
    const assignedTeamMembers = selectedUserIds.map(id => {
      const existing = selectedService.assignedTeamMembers.find(tm => tm.userId === id);
      if (existing) {
        return { id: existing.userId, name: existing.name, subtitle: existing.email };
      }
      const teamMember = allTeamMembersList.find(tm => tm.id === id);
      return teamMember ? { id: teamMember.id, name: teamMember.name, subtitle: teamMember.subtitle } : null;
    }).filter(Boolean) as Array<{ id: number; name: string; subtitle?: string }>;

    // Assigned locations
    const assignedLocations = selectedLocationIds.map(id => {
      const existing = selectedService.availableLocations.find(l => l.locationId === id);
      if (existing) {
        return { id: existing.locationId, name: existing.locationName, subtitle: existing.address };
      }
      const location = allLocationsList.find(l => l.id === id);
      return location ? { id: location.id, name: location.name, subtitle: location.address } : null;
    }).filter(Boolean) as Array<{ id: number; name: string; subtitle?: string }>;
   
    return [
      {
        title: 'Team Members Assigned',
        icon: Users,
        assignedItems: assignedTeamMembers,
        availableItems: allTeamMembersList,
        selectedIds: selectedUserIds,
        onToggleSelection: toggleUserSelection,
      },
      {
        title: 'Locations',
        icon: MapPin,
        assignedItems: assignedLocations,
        availableItems: allLocationsList,
        selectedIds: selectedLocationIds,
        onToggleSelection: toggleLocationSelection,
      },
    ];
  }, [
    selectedService,
    allTeamMembers,
    allLocations,
    selectedUserIds,
    selectedLocationIds,
    toggleUserSelection,
    toggleLocationSelection,
  ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      <AssignmentListPanel
        title={`Services (${allServices.length})`}
        items={listItems}
        selectedId={selectedService?.serviceId ?? null}
        onSelect={(id) => handleSelectService(Number(id))}
        isLoading={isLoading}
        emptyMessage="No services found"
        renderItem={renderServiceItem}
      />

      <AssignmentDetailsPanel
        sections={detailsSections}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}

