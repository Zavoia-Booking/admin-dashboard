import { useEffect, useMemo, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { AssignmentListPanel, type ListItem } from '../common/AssignmentListPanel';
import { AssignmentDetailsPanel, type AssignmentSection } from '../common/AssignmentDetailsPanel';
import { highlightMatches } from '../../../../shared/utils/highlight';
import { cn } from '../../../../shared/lib/utils';
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
import { getAllLocationsSelector, getLocationLoadingSelector } from '../../../locations/selectors';
import { listLocationsAction } from '../../../locations/actions';
import { selectCurrentUser } from '../../../auth/selectors';
import type { LocationType } from '../../../../shared/types/location';

export function LocationsAssignments() {
  const { t } = useTranslation('assignments');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // State selectors
  const isLoading = useSelector(getIsLoadingSelector);
  const isSaving = useSelector(getIsSavingSelector);
  const allLocations = useSelector(getAllLocationsSelector);
  const isLocationsLoading = useSelector(getLocationLoadingSelector);
  const selectedLocationId = useSelector(getSelectedLocationIdSelector);
  const selectedLocation = useSelector(getSelectedLocationSelector);
  const currentUser = useSelector(selectCurrentUser);
  const businessCurrency = currentUser?.business?.businessCurrency || 'eur';
  
  // Local state for multi-select
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  
  // Track initial state to detect changes
  const [initialUserIds, setInitialUserIds] = useState<number[]>([]);
  const [initialServiceIds, setInitialServiceIds] = useState<number[]>([]);
  
  // Track if we've already auto-selected from URL
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  // Search/filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Filter and search locations
  const filteredLocations = useMemo(() => {
    if (!searchTerm.trim()) return allLocations;
    
    const query = searchTerm.trim().toLowerCase();
    const tokens = query.split(/\s+/).filter(Boolean);
    
    return allLocations.filter((location: LocationType) => {
      const name = (location.name || '').toLowerCase();
      const address = (location.address || '').toLowerCase();
      const email = (location.email || '').toLowerCase();
      
      return tokens.every(token => 
        name.includes(token) || address.includes(token) || email.includes(token)
      );
    });
  }, [allLocations, searchTerm]);

  // Load locations list on mount
  useEffect(() => {
    dispatch(listLocationsAction.request());
  }, [dispatch]);

  // Auto-select location from URL parameter
  useEffect(() => {
    const locationIdFromUrl = searchParams.get('locationId');
    if (locationIdFromUrl && !hasAutoSelected && allLocations.length > 0) {
      const locationId = parseInt(locationIdFromUrl, 10);
      const locationExists = allLocations.some((l: LocationType) => l.id === locationId);
      if (locationExists && !isNaN(locationId)) {
        dispatch(selectLocationAction(locationId));
        dispatch(fetchLocationAssignmentByIdAction.request(locationId));
        setHasAutoSelected(true);
      }
    }
  }, [searchParams, allLocations, hasAutoSelected, dispatch]);

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

  // Get assignment counts for each location
  const getAssignmentCounts = useCallback((locationId: number) => {
    // Try to get from selectedLocation if it's the current one
    if (selectedLocation && selectedLocation.id === locationId) {
      return {
        services: selectedLocation.assignedServices?.length || 0,
        teamMembers: selectedLocation.assignedTeamMembers?.length || 0,
      };
    }
    
    // Fallback: we don't have counts in LocationType, so return 0
    return {
      services: 0,
      teamMembers: 0,
    };
  }, [selectedLocation]);

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

  // Handle apply services from ManageServicesSheet
  const handleApplyServices = useCallback((serviceIds: number[]) => {
    setSelectedServiceIds(serviceIds);
  }, []);

  // Transform locations into list items with badges
  const listItems: ListItem[] = useMemo(() => {
    return filteredLocations.map((location: LocationType) => {
      const counts = getAssignmentCounts(location.id);
      const badges: Array<{ label: string; value: number }> = [];
      
      if (counts.services > 0) {
        badges.push({ label: counts.services === 1 ? 'Service' : 'Services', value: counts.services });
      }
      if (counts.teamMembers > 0) {
        badges.push({ label: counts.teamMembers === 1 ? 'Member' : 'Members', value: counts.teamMembers });
      }
      
      return {
        id: location.id,
        title: location.name,
        subtitle: location.address,
        badges,
      };
    });
  }, [filteredLocations, getAssignmentCounts]);

  // Custom render function for location items
  const renderLocationItem = useCallback((item: ListItem, isSelected: boolean) => {
    const location = filteredLocations.find((l: LocationType) => l.id === item.id);
    if (!location) return null;

    return (
      <button
        onClick={() => handleSelectLocation(Number(item.id))}
        className={cn(
          'group relative cursor-pointer flex items-start gap-3 w-full px-2 py-3 pr-4 rounded-lg border text-left',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/60 focus-visible:ring-offset-0',
          isSelected
            ? 'border-border-strong bg-white dark:bg-surface shadow-xs'
            : 'border-border bg-white dark:bg-surface hover:border-border-strong hover:bg-surface-hover active:scale-[0.99]'
        )}
      >
        {/* Left-side circular indicator */}
        <div className="flex-shrink-0 mt-2.5">
          <div
            className={cn(
              'h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center',
              isSelected
                ? 'border-primary bg-primary'
                : 'border-border-strong group-hover:border-primary'
            )}
          >
            {isSelected && (
              <svg
                className="h-3.5 w-3.5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {/* Title */}
          <div className="font-semibold text-sm text-foreground-1 truncate">
            {searchTerm ? highlightMatches(item.title, searchTerm) : item.title}
          </div>

          {/* Subtitle (Address) */}
          {item.subtitle && (
            <div className="text-xs text-muted-foreground truncate">
              {searchTerm ? highlightMatches(item.subtitle, searchTerm) : item.subtitle}
            </div>
          )}
        </div>
      </button>
    );
  }, [filteredLocations, selectedLocationId, handleSelectLocation, searchTerm]);

  // Transform data for details panel
  const detailsSections: AssignmentSection[] = useMemo(() => {
    if (!selectedLocation) return [];
   
    // Use services from API response (selectedLocation.allServices)
    const allServicesList = (selectedLocation.allServices || []).map((s: any) => ({
      id: s.serviceId,
      name: s.serviceName,
      price: s.displayPrice || s.price,
      price_amount_minor: s.price_amount_minor || (s.displayPrice ? Math.round(s.displayPrice * 100) : undefined),
      duration: s.duration,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      category: s.category || null,
    }));
    
    const allTeamMembersList = (selectedLocation.allTeamMembers || []).map((tm: any) => ({
      id: tm.userId,
      name: `${tm.firstName} ${tm.lastName}`,
      email: tm.email,
    }));

    const locationName = selectedLocation.name;
    const servicesCount = selectedServiceIds.length;
    const teamMembersCount = selectedUserIds.length;

    const assignedServicesData = selectedServiceIds
      .map(id => {
        const service = allServicesList.find(s => Number(s.id) === id);
        if (!service) return null;
        return {
          serviceId: Number(service.id),
          serviceName: service.name,
          customPrice: null,
          customDuration: null,
          defaultPrice: service.price_amount_minor,
          defaultDisplayPrice: service.price,
          defaultDuration: service.duration,
          category: service.category || null,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // Services section description
    const servicesSummaryLine = servicesCount === 0 ? (
      <div>
        <span className="font-semibold text-foreground-1">{locationName}</span>{' '}
        {t('page.locationsAssignments.sections.services.description.notAssigned')}
      </div>
    ) : (
      <div>
        <span className="font-semibold text-foreground-1">{locationName}</span>{' '}
        {t('page.locationsAssignments.sections.services.description.assignedPrefix')}{' '}
        <span className="font-semibold text-foreground-1">
          {servicesCount}{' '}
          {t(
            servicesCount === 1
              ? 'page.locationsAssignments.sections.services.serviceOne'
              : 'page.locationsAssignments.sections.services.serviceOther'
          )}
        </span>
        {t('page.locationsAssignments.sections.services.description.assignedSuffix')}
      </div>
    );

    const servicesDescription = servicesCount === 0 ? (
      <div className="mt-1">
        {t('page.locationsAssignments.sections.services.description.notAssignedHelper')}
      </div>
    ) : (
      <div className="mt-1">
        {t('page.locationsAssignments.sections.services.description.assignedHelper')}
      </div>
    );

    // Team members section description
    const teamMembersSummaryLine = teamMembersCount === 0 ? (
      <div>
        <span className="font-semibold text-foreground-1">{locationName}</span>{' '}
        {t('page.locationsAssignments.sections.teamMembers.description.notAssigned')}
      </div>
    ) : (
      <div>
        <span className="font-semibold text-foreground-1">{locationName}</span>{' '}
        {t('page.locationsAssignments.sections.teamMembers.description.assignedPrefix')}{' '}
        <span className="font-semibold text-foreground-1">
          {teamMembersCount}{' '}
          {t(
            teamMembersCount === 1
              ? 'page.locationsAssignments.sections.teamMembers.teamMemberOne'
              : 'page.locationsAssignments.sections.teamMembers.teamMemberOther'
          )}
        </span>
        {t('page.locationsAssignments.sections.teamMembers.description.assignedSuffix')}
      </div>
    );

    const teamMembersDescription = teamMembersCount === 0 ? (
      <div className="mt-1">
        {t('page.locationsAssignments.sections.teamMembers.description.notAssignedHelper')}
      </div>
    ) : (
      <div className="mt-1">
        {t('page.locationsAssignments.sections.teamMembers.description.assignedHelper')}
      </div>
    );
   
    return [
      {
        title: t('page.locationsAssignments.sections.services.title'),
        description: servicesDescription,
        summaryLine: servicesSummaryLine,
        type: 'services' as const,
        availableItems: allServicesList, // All services for ManageServicesSheet
        assignedItems: assignedServicesData.map(s => ({
          id: s.serviceId,
          name: s.serviceName,
        })),
        assignedServices: assignedServicesData,
        selectedIds: selectedServiceIds,
        onToggle: toggleServiceSelection,
        teamMemberName: locationName, // Use teamMemberName prop for compatibility with AssignmentDetailsPanel
        onApplyServices: handleApplyServices,
        currency: businessCurrency,
      },
      {
        title: t('page.locationsAssignments.sections.teamMembers.title'),
        description: teamMembersDescription,
        summaryLine: teamMembersSummaryLine,
        type: 'team_members' as const,
        allItems: allTeamMembersList,
        assignedItemIds: selectedLocation.assignedTeamMembers?.map((tm: any) => tm.userId) || [],
        selectedIds: selectedUserIds,
        onToggle: toggleUserSelection,
      },
    ];
  }, [selectedLocation, selectedUserIds, selectedServiceIds, toggleUserSelection, toggleServiceSelection, handleApplyServices, businessCurrency, t]);

  // Empty state component for the list panel
  const emptyStateComponent = allLocations.length === 0 ? (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="flex flex-col items-center justify-center space-y-4 text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <MapPin className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            {t('page.locationsAssignments.emptyState.noLocationsAvailable')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('page.locationsAssignments.emptyState.noLocationsAvailableDescription')}
          </p>
        </div>
        <button
          onClick={() => navigate('/locations')}
          className="mt-2 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          {t('page.locationsAssignments.emptyState.goToLocations')}
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  ) : undefined;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      <AssignmentListPanel
        title={t('page.locationsAssignments.titleWithCount', {
          count: filteredLocations.length,
          ofTotal: searchTerm ? t('page.locationsAssignments.titleOfTotal', { total: allLocations.length }) : ''
        })}
        items={listItems}
        selectedId={selectedLocationId ?? null}
        onSelect={(id) => handleSelectLocation(Number(id))}
        isLoading={isLocationsLoading}
        emptyMessage={searchTerm ? t('page.locationsAssignments.emptyState.noLocationsMatchSearch') : t('page.locationsAssignments.emptyState.noLocations')}
        emptyStateComponent={emptyStateComponent}
        renderItem={renderLocationItem}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('page.locationsAssignments.searchPlaceholder')}
        showSearch={true}
      />

      <AssignmentDetailsPanel
        sections={detailsSections}
        onSave={handleSave}
        isSaving={isSaving}
        isLoading={isLoading}
        hasChanges={hasChanges}
        emptyStateMessage={t('page.locationsAssignments.emptyState.noLocationSelected')}
      />
    </div>
  );
}
