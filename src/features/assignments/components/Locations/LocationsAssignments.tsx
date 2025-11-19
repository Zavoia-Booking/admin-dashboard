import { useEffect, useMemo, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { AssignmentListPanel, type ListItem } from '../common/AssignmentListPanel';
import { AssignmentDetailsPanel } from '../common/AssignmentDetailsPanel';
import { Pill } from '../../../../shared/components/ui/pill';
import { Button } from '../../../../shared/components/ui/button';
import {
  selectLocationAction,
  fetchLocationAssignmentByIdAction,
  updateLocationAssignmentsAction,
} from '../../actions';
import {
  getIsLoadingSelector,
  getIsSavingSelector,
  getSelectedLocationIdSelector,
  getSelectedLocationSelector,
} from '../../selectors';
import { getAllLocationsSelector } from '../../../locations/selectors';
import { listLocationsAction } from '../../../locations/actions';

export function LocationsAssignments() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // State selectors
  const isLoading = useSelector(getIsLoadingSelector);
  const isSaving = useSelector(getIsSavingSelector);
  const allLocations = useSelector(getAllLocationsSelector);
  const selectedLocationId = useSelector(getSelectedLocationIdSelector);
  const selectedLocation = useSelector(getSelectedLocationSelector);
  
  // Local state for multi-select
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  
  // Track initial state to detect changes
  const [initialUserIds, setInitialUserIds] = useState<number[]>([]);
  const [initialServiceIds, setInitialServiceIds] = useState<number[]>([]);

  // Load locations list on mount
  useEffect(() => {
    dispatch(listLocationsAction.request());
  }, [dispatch]);

  // Sync local state when selected location changes
  useEffect(() => {
    if (selectedLocation) {
      const userIds = selectedLocation.assignedTeamMembers?.map((tm: any) => tm.userId) || [];
      const serviceIds = selectedLocation.assignedServices?.map((s: any) => s.serviceId) || [];
      
      setSelectedUserIds(userIds);
      setSelectedServiceIds(serviceIds);
      
      // Store initial state for change detection
      setInitialUserIds(userIds);
      setInitialServiceIds(serviceIds);
    } else {
      setSelectedUserIds([]);
      setSelectedServiceIds([]);
      setInitialUserIds([]);
      setInitialServiceIds([]);
    }
  }, [selectedLocation]);
  
  // Detect if there are changes
  const hasChanges = useMemo(() => {
    const userIdsChanged = 
      selectedUserIds.length !== initialUserIds.length ||
      selectedUserIds.some(id => !initialUserIds.includes(id)) ||
      initialUserIds.some(id => !selectedUserIds.includes(id));
    
    const serviceIdsChanged = 
      selectedServiceIds.length !== initialServiceIds.length ||
      selectedServiceIds.some(id => !initialServiceIds.includes(id)) ||
      initialServiceIds.some(id => !selectedServiceIds.includes(id));
    
    return userIdsChanged || serviceIdsChanged;
  }, [selectedUserIds, selectedServiceIds, initialUserIds, initialServiceIds]);

  // Handlers
  const handleSelectLocation = useCallback((locationId: number) => {
    dispatch(selectLocationAction(locationId));
    dispatch(fetchLocationAssignmentByIdAction.request(locationId));
  }, [dispatch]);

  const handleSave = useCallback(() => {
    if (!selectedLocation) return;
   
    dispatch(updateLocationAssignmentsAction.request({
      locationId: selectedLocation.id,
      teamMemberIds: selectedUserIds,
      serviceIds: selectedServiceIds
    }));
  }, [selectedLocation, selectedUserIds, selectedServiceIds, dispatch]);

  const toggleUserSelection = useCallback((userId: number) => {
    setSelectedUserIds(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  }, []);

  const toggleServiceSelection = useCallback((serviceId: number) => {
    setSelectedServiceIds(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  }, []);

  // Render location item in list
  const renderLocationItem = useCallback((location: typeof allLocations[0]) => {
    return (
      <Pill
        selected={selectedLocationId === location.id}
        icon={MapPin}
        className="w-full justify-start text-left transition-none active:scale-100"
        onClick={() => handleSelectLocation(location.id)}
      >
        <div className="flex flex-col items-start">
          <div className="font-medium">{location.name}</div>
          {location.address && (
            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {location.address}
            </div>
          )}
        </div>
      </Pill>
    );
  }, [selectedLocationId, handleSelectLocation]);

  // Transform data for list panel
  const listItems: ListItem[] = useMemo(() => {
    return allLocations.map((loc) => ({
      id: loc.id,
      title: loc.name,
      subtitle: loc.address,
    }));
  }, [allLocations]);

  // Transform data for details panel
  const detailsSections = useMemo(() => {
    if (!selectedLocation) return [];
   
    // Map services to the expected format { id, name }
    const allServicesList = (selectedLocation.allServices || []).map((s: any) => ({
      id: s.serviceId,
      name: s.serviceName,
    }));
    
    // Map team members to the expected format { id, name, email }
    const allTeamMembersList = (selectedLocation.allTeamMembers || []).map((tm: any) => ({
      id: tm.userId,
      name: `${tm.firstName} ${tm.lastName}`,
      email: tm.email,
    }));
   
    return [
      {
        title: 'Services',
        type: 'services' as const,
        allItems: allServicesList,
        assignedItemIds: selectedLocation.assignedServices?.map((s: any) => s.serviceId) || [],
        selectedIds: selectedServiceIds,
        onToggle: toggleServiceSelection,
      },
      {
        title: 'Team Members',
        type: 'team_members' as const,
        allItems: allTeamMembersList,
        assignedItemIds: selectedLocation.assignedTeamMembers?.map((tm: any) => tm.userId) || [],
        selectedIds: selectedUserIds,
        onToggle: toggleUserSelection,
      },
    ];
  }, [
    selectedLocation,
    selectedUserIds,
    selectedServiceIds,
    toggleUserSelection,
    toggleServiceSelection,
  ]);

  // Empty state component for the list panel
  const emptyStateComponent = allLocations.length === 0 ? (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="flex flex-col items-center justify-center space-y-4 text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <MapPin className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            No locations available
          </h3>
          <p className="text-sm text-muted-foreground">
            You need to create locations before you can manage assignments. Get started by creating your first location.
          </p>
        </div>
        <Button
          onClick={() => navigate('/locations')}
          className="mt-2"
        >
          Go to Locations
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  ) : undefined;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      <AssignmentListPanel
        title={`Locations (${allLocations.length})`}
        items={listItems}
        selectedId={selectedLocationId ?? null}
        onSelect={(id) => handleSelectLocation(Number(id))}
        isLoading={isLoading}
        emptyMessage="No locations found"
        emptyStateComponent={emptyStateComponent}
        renderItem={(item) => {
          const location = allLocations.find(loc => loc.id === item.id);
          return location ? renderLocationItem(location) : null;
        }}
      />

      <AssignmentDetailsPanel
        sections={detailsSections}
        onSave={handleSave}
        isSaving={isSaving}
        hasChanges={hasChanges}
        emptyStateMessage="Choose a location from the list to view and manage its assignments"
      />
    </div>
  );
}

