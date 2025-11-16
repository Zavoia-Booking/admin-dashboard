// import { useEffect, useMemo, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { AssignmentListPanel, type ListItem } from '../common/AssignmentListPanel';
// import { AssignmentDetailsPanel } from '../common/AssignmentDetailsPanel';
// import {
//   selectServiceAction,
//   assignTeamMembersToServiceAction,
//   assignLocationsToServiceAction,
// } from '../../actions';
// import {
//   getIsLoadingSelector,
//   getIsSavingSelector,
//   getSelectedServiceSelector,
// } from '../../selectors';
// import { getAllLocationsSelector } from '../../../locations/selectors';

// export function ServicesAssignments() {
//   const dispatch = useDispatch();
  
//   // State selectors
//   const isLoading = useSelector(getIsLoadingSelector);
//   const isSaving = useSelector(getIsSavingSelector);
//   const selectedService = useSelector(getSelectedServiceSelector);
  
//   // Lookup data
//   const allLocations = useSelector(getAllLocationsSelector);
  
//   // Local state for multi-select
//   const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
//   const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([]);

//   // Sync local state when selected service changes
//   useEffect(() => {
//     if (selectedService) {
//       setSelectedUserIds(selectedService.assignedTeamMembers.map(tm => tm.userId));
//       setSelectedLocationIds(selectedService.availableLocations.map(l => l.locationId));
//     }
//   }, [selectedService]);

//   // Handlers
//   const handleSelectService = (serviceId: number) => {
//     dispatch(selectServiceAction(serviceId));
//   };

//   const handleSave = () => {
//     if (!selectedService) return;
    
//     dispatch(assignTeamMembersToServiceAction.request({
//       serviceId: selectedService.serviceId,
//       userIds: selectedUserIds
//     }));
    
//     dispatch(assignLocationsToServiceAction.request({
//       serviceId: selectedService.serviceId,
//       locationIds: selectedLocationIds
//     }));
//   };

//   const toggleUserSelection = (userId: number) => {
//     setSelectedUserIds(prev => 
//       prev.includes(userId)
//         ? prev.filter(id => id !== userId)
//         : [...prev, userId]
//     );
//   };

//   const toggleLocationSelection = (locationId: number) => {
//     setSelectedLocationIds(prev => 
//       prev.includes(locationId)
//         ? prev.filter(id => id !== locationId)
//         : [...prev, locationId]
//     );
//   };

//   // Get available options (not already assigned)
//   const availableUsers = useMemo(() => {
//     if (selectedService) {
//       const assignedIds = selectedService.assignedTeamMembers.map(tm => tm.userId);
//       return teamMembers.filter(tm => !assignedIds.includes(tm.id));
//     }
//     return teamMembers;
//   }, [selectedService, teamMembers]);

//   const availableLocations = useMemo(() => {
//     if (selectedService) {
//       const assignedIds = selectedService.availableLocations.map(l => l.locationId);
//       return allLocations.filter(l => !assignedIds.includes(l.id));
//     }
//     return allLocations;
//   }, [selectedService, allLocations]);

//   // Transform data for list panel
//   const listItems: ListItem[] = useMemo(() => {
//     return services.map((svc) => ({
//       id: svc.serviceId,
//       title: svc.serviceName,
//       subtitle: `$${svc.price} • ${svc.duration} min`,
//       badges: [
//         { label: 'team members', value: svc.assignedTeamMembers.length },
//         { label: 'locations', value: svc.availableLocations.length },
//       ],
//     }));
//   }, [services]);

//   // Transform data for details panel
//   const detailsSections = useMemo(() => {
//     if (!selectedService) return [];
    
//     return [
//       {
//         title: 'Assigned Team Members',
//         icon: '👥',
//         assignedItems: selectedService.assignedTeamMembers.map((tm) => ({
//           id: tm.userId,
//           name: tm.name,
//           subtitle: tm.email,
//         })),
//         availableItems: availableUsers.map((tm) => ({
//           id: tm.id,
//           name: `${tm.firstName} ${tm.lastName}`,
//         })),
//         selectedIds: selectedUserIds,
//         onToggleSelection: toggleUserSelection,
//       },
//       {
//         title: 'Available Locations',
//         icon: '📍',
//         assignedItems: selectedService.availableLocations.map((loc) => ({
//           id: loc.locationId,
//           name: loc.locationName,
//         })),
//         availableItems: availableLocations.map((loc) => ({
//           id: loc.id,
//           name: loc.name,
//         })),
//         selectedIds: selectedLocationIds,
//         onToggleSelection: toggleLocationSelection,
//       },
//     ];
//   }, [
//     selectedService,
//     availableUsers,
//     availableLocations,
//     selectedUserIds,
//     selectedLocationIds,
//     toggleUserSelection,
//     toggleLocationSelection,
//   ]);

//   const detailsTitle = selectedService
//     ? `Managing: ${selectedService.serviceName}`
//     : 'Select an item to manage assignments';

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
//       <AssignmentListPanel
//         title={`Services (${services.length})`}
//         items={listItems}
//         selectedId={selectedService?.serviceId ?? null}
//         onSelect={(id) => handleSelectService(Number(id))}
//         isLoading={isLoading}
//         emptyMessage="No services found"
//       />

//       <AssignmentDetailsPanel
//         title={detailsTitle}
//         sections={detailsSections}
//         onSave={handleSave}
//         isSaving={isSaving}
//         emptyMessage="Select an item from the list to manage its assignments"
//       />
//     </div>
//   );
// }

