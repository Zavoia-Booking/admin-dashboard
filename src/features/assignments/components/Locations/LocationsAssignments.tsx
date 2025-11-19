import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AssignmentListPanel, type ListItem } from '../common/AssignmentListPanel';
import { AssignmentDetailsPanel } from '../common/AssignmentDetailsPanel';
import {
  selectLocationAction,
  assignTeamMembersToLocationAction,
  assignServicesToLocationAction,
} from '../../actions';
import {
  getIsLoadingSelector,
  getIsSavingSelector,
  getFilteredLocationsSelector,
  getSelectedLocationSelector,
} from '../../selectors';
import { getFilteredTeamMembersSelector } from '../../selectors';
import { getServicesListSelector } from '../../../services/selectors';

export function LocationsAssignments() {
  // const dispatch = useDispatch();
  
  // // State selectors
  // const isLoading = useSelector(getIsLoadingSelector);
  // const isSaving = useSelector(getIsSavingSelector);
  // const locations = useSelector(getFilteredLocationsSelector);
  // const selectedLocation = useSelector(getSelectedLocationSelector);
  // const teamMembers = useSelector(getFilteredTeamMembersSelector);
  
  // // Lookup data
  // const allServices = useSelector(getServicesListSelector);
  
  // // Local state for multi-select
  // const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  // const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);

  // // Sync local state when selected location changes
  // useEffect(() => {
  //   if (selectedLocation) {
  //     setSelectedUserIds(selectedLocation.assignedTeamMembers.map(tm => tm.userId));
  //     setSelectedServiceIds(selectedLocation.offeredServices.map(s => s.serviceId));
  //   }
  // }, [selectedLocation]);

  // // Handlers
  // const handleSelectLocation = (locationId: number) => {
  //   dispatch(selectLocationAction(locationId));
  // };

  // const handleSave = () => {
  //   if (!selectedLocation) return;
    
  //   dispatch(assignTeamMembersToLocationAction.request({
  //     locationId: selectedLocation.locationId,
  //     userIds: selectedUserIds
  //   }));
    
  //   dispatch(assignServicesToLocationAction.request({
  //     locationId: selectedLocation.locationId,
  //     serviceIds: selectedServiceIds
  //   }));
  // };

  // const toggleUserSelection = (userId: number) => {
  //   setSelectedUserIds(prev => 
  //     prev.includes(userId)
  //       ? prev.filter(id => id !== userId)
  //       : [...prev, userId]
  //   );
  // };

  // const toggleServiceSelection = (serviceId: number) => {
  //   setSelectedServiceIds(prev => 
  //     prev.includes(serviceId) 
  //       ? prev.filter(id => id !== serviceId)
  //       : [...prev, serviceId]
  //   );
  // };

  // // Get available options (not already assigned)
  // const availableUsers = useMemo(() => {
  //   if (selectedLocation) {
  //     const assignedIds = selectedLocation.assignedTeamMembers.map(tm => tm.userId);
  //     return teamMembers.filter(tm => !assignedIds.includes(tm.id));
  //   }
  //   return teamMembers;
  // }, [selectedLocation, teamMembers]);

  // const availableServices = useMemo(() => {
  //   if (selectedLocation) {
  //     const assignedIds = selectedLocation.offeredServices.map(s => s.serviceId);
  //     return allServices.filter(s => !assignedIds.includes(s.id));
  //   }
  //   return allServices;
  // }, [selectedLocation, allServices]);

  // // Transform data for list panel
  // const listItems: ListItem[] = useMemo(() => {
  //   return locations.map((loc) => ({
  //     id: loc.locationId,
  //     title: loc.locationName,
  //     subtitle: loc.address,
  //     badges: [
  //       { label: 'team members', value: loc.assignedTeamMembers.length },
  //       { label: 'services', value: loc.offeredServices.length },
  //     ],
  //   }));
  // }, [locations]);

  // // Transform data for details panel
  // const detailsSections = useMemo(() => {
  //   if (!selectedLocation) return [];
    
  //   return [
  //     {
  //       title: 'Team Members Assigned',
  //       icon: '👥',
  //       assignedItems: selectedLocation.assignedTeamMembers.map((tm) => ({
  //         id: tm.userId,
  //         name: tm.name,
  //         subtitle: tm.role,
  //       })),
  //       availableItems: availableUsers.map((tm) => ({
  //         id: tm.id,
  //         name: `${tm.firstName} ${tm.lastName}`,
  //       })),
  //       selectedIds: selectedUserIds,
  //       onToggleSelection: toggleUserSelection,
  //     },
  //     {
  //       title: 'Services Offered',
  //       icon: '🛠',
  //       assignedItems: selectedLocation.offeredServices.map((svc) => ({
  //         id: svc.serviceId,
  //         name: svc.serviceName,
  //       })),
  //       availableItems: availableServices.map((svc) => ({
  //         id: svc.id,
  //         name: svc.name,
  //       })),
  //       selectedIds: selectedServiceIds,
  //       onToggleSelection: toggleServiceSelection,
  //     },
  //   ];
  // }, [
  //   selectedLocation,
  //   availableUsers,
  //   availableServices,
  //   selectedUserIds,
  //   selectedServiceIds,
  //   toggleUserSelection,
  //   toggleServiceSelection,
  // ]);

  // const detailsTitle = selectedLocation
  //   ? `Managing: ${selectedLocation.locationName}`
  //   : 'Select an item to manage assignments';

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      Hello
      {/* <AssignmentListPanel
        title={`Locations (${locations.length})`}
        items={listItems}
        selectedId={selectedLocation?.locationId ?? null}
        onSelect={(id) => handleSelectLocation(Number(id))}
        isLoading={isLoading}
        emptyMessage="No locations found"
      />

      <AssignmentDetailsPanel
        title={detailsTitle}
        sections={detailsSections}
        onSave={handleSave}
        isSaving={isSaving}
        emptyMessage="Select an item from the list to manage its assignments"
      /> */}
    </div>
  );
}

