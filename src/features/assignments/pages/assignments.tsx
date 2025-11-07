import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Input } from '../../../shared/components/ui/input';
import { Badge } from '../../../shared/components/ui/badge';
import { Spinner } from '../../../shared/components/ui/spinner';
import { Users, Wrench, MapPin, Search, X } from 'lucide-react';
import {
  setPerspectiveAction,
  setSearchQueryAction,
  fetchTeamMemberAssignmentsAction,
  selectTeamMemberAction,
  selectServiceAction,
  selectLocationAction,
  assignServicesToTeamMemberAction,
  assignLocationsToTeamMemberAction,
  assignTeamMembersToServiceAction,
  assignLocationsToServiceAction,
  assignTeamMembersToLocationAction,
  assignServicesToLocationAction,
} from '../actions';
import {
  getActivePerspectiveSelector,
  getSearchQuerySelector,
  getIsLoadingSelector,
  getIsSavingSelector,
  getFilteredTeamMembersSelector,
  getFilteredServicesSelector,
  getFilteredLocationsSelector,
  getSelectedTeamMemberSelector,
  getSelectedServiceSelector,
  getSelectedLocationSelector,
} from '../selectors';
import type { AssignmentPerspective } from '../types';
import { getServicesListSelector } from '../../services/selectors';
import { getServicesAction } from '../../services/actions';
import { listLocationsAction } from '../../locations/actions';
import { getAllLocationsSelector } from '../../locations/selectors';
import type { Service } from '../../../shared/types/service';
import type { LocationType } from '../../../shared/types/location';

export default function AssignmentsPage() {
  const dispatch = useDispatch();
  
  // State selectors
  const activePerspective = useSelector(getActivePerspectiveSelector);
  const searchQuery = useSelector(getSearchQuerySelector);
  const isLoading = useSelector(getIsLoadingSelector);
  const isSaving = useSelector(getIsSavingSelector);
  
  // Data selectors
  const teamMembers = useSelector(getFilteredTeamMembersSelector);
  const services = useSelector(getFilteredServicesSelector);
  const locations = useSelector(getFilteredLocationsSelector);
  
  // Selected items
  const selectedTeamMember = useSelector(getSelectedTeamMemberSelector);
  const selectedService = useSelector(getSelectedServiceSelector);
  const selectedLocation = useSelector(getSelectedLocationSelector);
  
  // Lookup data
  const allServices: Service[] = useSelector(getServicesListSelector);
  const allLocations: LocationType[] = useSelector(getAllLocationsSelector);
  
  // Local state for multi-select
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  // Load initial data
  useEffect(() => {
    dispatch(getServicesAction.request());
    dispatch(listLocationsAction.request());
    dispatch(fetchTeamMemberAssignmentsAction.request());
  }, [dispatch]);

  // Sync local state when selected team member changes
  useEffect(() => {
    if (selectedTeamMember) {
      setSelectedServiceIds(selectedTeamMember.assignedServices.map(s => s.serviceId));
      setSelectedLocationIds(selectedTeamMember.assignedLocations.map(l => l.locationId));
    }
  }, [selectedTeamMember]);

  // Sync local state when selected service changes
  useEffect(() => {
    if (selectedService) {
      setSelectedUserIds(selectedService.assignedTeamMembers.map(tm => tm.userId));
      setSelectedLocationIds(selectedService.availableLocations.map(l => l.locationId));
    }
  }, [selectedService]);

  // Sync local state when selected location changes
  useEffect(() => {
    if (selectedLocation) {
      setSelectedUserIds(selectedLocation.assignedTeamMembers.map(tm => tm.userId));
      setSelectedServiceIds(selectedLocation.offeredServices.map(s => s.serviceId));
    }
  }, [selectedLocation]);

  // When perspective changes
  const handlePerspectiveChange = (perspective: AssignmentPerspective) => {
    dispatch(setPerspectiveAction(perspective));
  };

  // Search
  const handleSearchChange = (value: string) => {
    dispatch(setSearchQueryAction(value));
  };

  // Clear search
  const handleClearSearch = () => {
    dispatch(setSearchQueryAction(''));
  };

  // Team Members perspective handlers
  const handleSelectTeamMember = (userId: number) => {
    dispatch(selectTeamMemberAction(userId));
  };

  const handleSaveTeamMemberAssignments = () => {
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

  // Services perspective handlers
  const handleSelectService = (serviceId: number) => {
    dispatch(selectServiceAction(serviceId));
  };

  const handleSaveServiceAssignments = () => {
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

  // Locations perspective handlers
  const handleSelectLocation = (locationId: number) => {
    dispatch(selectLocationAction(locationId));
  };

  const handleSaveLocationAssignments = () => {
    if (!selectedLocation) return;
    
    dispatch(assignTeamMembersToLocationAction.request({
      locationId: selectedLocation.locationId,
      userIds: selectedUserIds
    }));
    
    dispatch(assignServicesToLocationAction.request({
      locationId: selectedLocation.locationId,
      serviceIds: selectedServiceIds
    }));
  };

  // Multi-select handlers
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

  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Get available options (not already assigned)
  const availableServices = useMemo(() => {
    if (activePerspective === 'team_members' && selectedTeamMember) {
      const assignedIds = selectedTeamMember.assignedServices.map(s => s.serviceId);
      return allServices.filter(s => !assignedIds.includes(s.id));
    }
    if (activePerspective === 'locations' && selectedLocation) {
      const assignedIds = selectedLocation.offeredServices.map(s => s.serviceId);
      return allServices.filter(s => !assignedIds.includes(s.id));
    }
    return allServices;
  }, [activePerspective, selectedTeamMember, selectedLocation, allServices]);

  const availableLocations = useMemo(() => {
    if (activePerspective === 'team_members' && selectedTeamMember) {
      const assignedIds = selectedTeamMember.assignedLocations.map(l => l.locationId);
      return allLocations.filter(l => !assignedIds.includes(l.id));
    }
    if (activePerspective === 'services' && selectedService) {
      const assignedIds = selectedService.availableLocations.map(l => l.locationId);
      return allLocations.filter(l => !assignedIds.includes(l.id));
    }
    return allLocations;
  }, [activePerspective, selectedTeamMember, selectedService, allLocations]);

  const availableUsers = useMemo(() => {
    if (activePerspective === 'services' && selectedService) {
      const assignedIds = selectedService.assignedTeamMembers.map(tm => tm.userId);
      return teamMembers.filter(tm => !assignedIds.includes(tm.id));
    }
    if (activePerspective === 'locations' && selectedLocation) {
      const assignedIds = selectedLocation.assignedTeamMembers.map(tm => tm.userId);
      return teamMembers.filter(tm => !assignedIds.includes(tm.id));
    }
    return teamMembers;
  }, [activePerspective, selectedService, selectedLocation, teamMembers]);

  return (
    <AppLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Assignments</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => handlePerspectiveChange('team_members')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activePerspective === 'team_members'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-4 w-4" />
            Team Members
          </button>
          <button
            onClick={() => handlePerspectiveChange('services')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activePerspective === 'services'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Wrench className="h-4 w-4" />
            Services
          </button>
          <button
            onClick={() => handlePerspectiveChange('locations')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activePerspective === 'locations'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <MapPin className="h-4 w-4" />
            Locations
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${activePerspective.replace('_', ' ')}...`}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-4">
          {/* Left Panel - List */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle className="text-lg">
                {activePerspective === 'team_members' && `Team Members (${teamMembers.length})`}
                {activePerspective === 'services' && `Services (${services.length})`}
                {activePerspective === 'locations' && `Locations (${locations.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {/* Team Members List */}
                  {activePerspective === 'team_members' && teamMembers.map((tm) => (
                    <button
                      key={tm.id}
                      onClick={() => handleSelectTeamMember(tm.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedTeamMember?.id === tm.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium">{tm.firstName} {tm.lastName}</div>
                      <div className="text-sm text-muted-foreground">{tm.email}</div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary">{tm.assignedServices.length} services</Badge>
                        <Badge variant="secondary">{tm.assignedLocations.length} locations</Badge>
                      </div>
                    </button>
                  ))}

                  {/* Services List */}
                  {activePerspective === 'services' && services.map((svc) => (
                    <button
                      key={svc.serviceId}
                      onClick={() => handleSelectService(svc.serviceId)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedService?.serviceId === svc.serviceId
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium">{svc.serviceName}</div>
                      <div className="text-sm text-muted-foreground">
                        ${svc.price} • {svc.duration} min
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary">{svc.assignedTeamMembers.length} team members</Badge>
                        <Badge variant="secondary">{svc.availableLocations.length} locations</Badge>
                      </div>
                    </button>
                  ))}

                  {/* Locations List */}
                  {activePerspective === 'locations' && locations.map((loc) => (
                    <button
                      key={loc.locationId}
                      onClick={() => handleSelectLocation(loc.locationId)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedLocation?.locationId === loc.locationId
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium">{loc.locationName}</div>
                      <div className="text-sm text-muted-foreground">{loc.address}</div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary">{loc.assignedTeamMembers.length} team members</Badge>
                        <Badge variant="secondary">{loc.offeredServices.length} services</Badge>
                      </div>
                    </button>
                  ))}

                  {/* Empty State */}
                  {activePerspective === 'team_members' && teamMembers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No team members found
                    </div>
                  )}
                  {activePerspective === 'services' && services.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No services found
                    </div>
                  )}
                  {activePerspective === 'locations' && locations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No locations found
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Panel - Assignment Controls */}
          <Card className="col-span-8">
            <CardHeader>
              <CardTitle className="text-lg">
                {!selectedTeamMember && !selectedService && !selectedLocation && 'Select an item to manage assignments'}
                {selectedTeamMember && `Managing: ${selectedTeamMember.firstName} ${selectedTeamMember.lastName}`}
                {selectedService && `Managing: ${selectedService.serviceName}`}
                {selectedLocation && `Managing: ${selectedLocation.locationName}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Team Member Assignment Panel */}
              {selectedTeamMember && (
                <div className="space-y-6">
                  {/* Assigned Services */}
                  <div>
                    <h3 className="font-medium mb-3">📌 Assigned Services</h3>
                    <div className="space-y-2">
                      {selectedTeamMember.assignedServices.map((svc) => (
                        <div key={svc.serviceId} className="flex items-center justify-between p-2 border rounded">
                          <span>{svc.serviceName}</span>
                          <button
                            onClick={() => toggleServiceSelection(svc.serviceId)}
                            className="text-destructive hover:underline text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3">
                      <select
                        onChange={(e) => toggleServiceSelection(Number(e.target.value))}
                        className="w-full border rounded px-3 py-2"
                        value=""
                      >
                        <option value="">+ Add Service</option>
                        {availableServices.map((svc) => (
                          <option key={svc.id} value={svc.id}>
                            {svc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Assigned Locations */}
                  <div>
                    <h3 className="font-medium mb-3">📍 Assigned Locations</h3>
                    <div className="space-y-2">
                      {selectedTeamMember.assignedLocations.map((loc) => (
                        <div key={loc.locationId} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <div>{loc.locationName}</div>
                            <div className="text-sm text-muted-foreground">{loc.address}</div>
                          </div>
                          <button
                            onClick={() => toggleLocationSelection(loc.locationId)}
                            className="text-destructive hover:underline text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3">
                      <select
                        onChange={(e) => toggleLocationSelection(Number(e.target.value))}
                        className="w-full border rounded px-3 py-2"
                        value=""
                      >
                        <option value="">+ Add Location</option>
                        {availableLocations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Save Button */}
                  <Button
                    onClick={handleSaveTeamMemberAssignments}
                    disabled={isSaving}
                    className="w-full"
                  >
                    {isSaving ? <Spinner size="sm" /> : 'Save Changes'}
                  </Button>
                </div>
              )}

              {/* Service Assignment Panel */}
              {selectedService && (
                <div className="space-y-6">
                  {/* Assigned Team Members */}
                  <div>
                    <h3 className="font-medium mb-3">👥 Assigned Team Members</h3>
                    <div className="space-y-2">
                      {selectedService.assignedTeamMembers.map((tm) => (
                        <div key={tm.userId} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <div>{tm.name}</div>
                            <div className="text-sm text-muted-foreground">{tm.email}</div>
                          </div>
                          <button
                            onClick={() => toggleUserSelection(tm.userId)}
                            className="text-destructive hover:underline text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3">
                      <select
                        onChange={(e) => toggleUserSelection(Number(e.target.value))}
                        className="w-full border rounded px-3 py-2"
                        value=""
                      >
                        <option value="">+ Add Team Member</option>
                        {availableUsers.map((tm) => (
                          <option key={tm.id} value={tm.id}>
                            {tm.firstName} {tm.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Available Locations */}
                  <div>
                    <h3 className="font-medium mb-3">📍 Available Locations</h3>
                    <div className="space-y-2">
                      {selectedService.availableLocations.map((loc) => (
                        <div key={loc.locationId} className="flex items-center justify-between p-2 border rounded">
                          <span>{loc.locationName}</span>
                          <button
                            onClick={() => toggleLocationSelection(loc.locationId)}
                            className="text-destructive hover:underline text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3">
                      <select
                        onChange={(e) => toggleLocationSelection(Number(e.target.value))}
                        className="w-full border rounded px-3 py-2"
                        value=""
                      >
                        <option value="">+ Add Location</option>
                        {availableLocations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Save Button */}
                  <Button
                    onClick={handleSaveServiceAssignments}
                    disabled={isSaving}
                    className="w-full"
                  >
                    {isSaving ? <Spinner size="sm" /> : 'Save Changes'}
                  </Button>
                </div>
              )}

              {/* Location Assignment Panel */}
              {selectedLocation && (
                <div className="space-y-6">
                  {/* Assigned Team Members */}
                  <div>
                    <h3 className="font-medium mb-3">👥 Team Members Assigned</h3>
                    <div className="space-y-2">
                      {selectedLocation.assignedTeamMembers.map((tm) => (
                        <div key={tm.userId} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <div>{tm.name}</div>
                            <div className="text-sm text-muted-foreground">{tm.role}</div>
                          </div>
                          <button
                            onClick={() => toggleUserSelection(tm.userId)}
                            className="text-destructive hover:underline text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3">
                      <select
                        onChange={(e) => toggleUserSelection(Number(e.target.value))}
                        className="w-full border rounded px-3 py-2"
                        value=""
                      >
                        <option value="">+ Add Team Member</option>
                        {availableUsers.map((tm) => (
                          <option key={tm.id} value={tm.id}>
                            {tm.firstName} {tm.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Offered Services */}
                  <div>
                    <h3 className="font-medium mb-3">🛠 Services Offered</h3>
                    <div className="space-y-2">
                      {selectedLocation.offeredServices.map((svc) => (
                        <div key={svc.serviceId} className="flex items-center justify-between p-2 border rounded">
                          <span>{svc.serviceName}</span>
                          <button
                            onClick={() => toggleServiceSelection(svc.serviceId)}
                            className="text-destructive hover:underline text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3">
                      <select
                        onChange={(e) => toggleServiceSelection(Number(e.target.value))}
                        className="w-full border rounded px-3 py-2"
                        value=""
                      >
                        <option value="">+ Add Service</option>
                        {availableServices.map((svc) => (
                          <option key={svc.id} value={svc.id}>
                            {svc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Save Button */}
                  <Button
                    onClick={handleSaveLocationAssignments}
                    disabled={isSaving}
                    className="w-full"
                  >
                    {isSaving ? <Spinner size="sm" /> : 'Save Changes'}
                  </Button>
                </div>
              )}

              {/* Empty State */}
              {!selectedTeamMember && !selectedService && !selectedLocation && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <p>Select an item from the list to manage its assignments</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
