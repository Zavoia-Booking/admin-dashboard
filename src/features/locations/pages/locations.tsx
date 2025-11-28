import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { listLocationsAction } from '../actions';
import { selectCurrentUser } from '../../auth/selectors';
import { Plus, MapPin, Phone, Mail, Search, Filter, X, Edit, Users, Briefcase } from "lucide-react";
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import BusinessSetupGate from '../../../shared/components/guards/BusinessSetupGate';
import { Badge } from "../../../shared/components/ui/badge";
import AddLocationSlider from '../components/AddLocationSlider';
import EditLocationSlider from '../components/EditLocationSlider';
import { FilterPanel } from '../../../shared/components/common/FilterPanel';
import type { LocationType } from '../../../shared/types/location';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { getAllLocationsSelector } from '../selectors';
import { AccessGuard } from '../../../shared/components/guards/AccessGuard';
import { ItemCard, type ItemCardMetadata, type ItemCardBadge } from '../../../shared/components/common/ItemCard';


export default function LocationsPage() {
  const dispatch = useDispatch();

  const allLocations: LocationType[] = useSelector(getAllLocationsSelector);
  const user = useSelector(selectCurrentUser);

  const [isCreateSliderOpen, setIsCreateSliderOpen] = useState(false);
  const [isEditSliderOpen, setIsEditSliderOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Local filter state (used in filter card only)
  const [localStatusFilter, setLocalStatusFilter] = useState(statusFilter);

  useEffect(() => {
    if (user?.businessId) {
      dispatch(listLocationsAction.request());

    }
  }, [dispatch, user]);

  useEffect(() => {
    if (showFilters) {
      setLocalStatusFilter(statusFilter);
    }
  }, [showFilters, statusFilter]);

  // Calculate number of active filters
  const activeFiltersCount = [
    !!searchTerm,
    statusFilter !== 'all'
  ].filter(Boolean).length;

  const openEditSlider = (location: LocationType) => {
    setEditingLocation(location);
    setIsEditSliderOpen(true);
  };

  // Filter locations based on search and status
  const filteredLocations = allLocations.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <AppLayout>
      <BusinessSetupGate>
        <AccessGuard>
          <div className="space-y-6">
            {/* Top Controls: Search, Filter, Add */}
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Input
                  placeholder="Search location..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="h-11 text-base pr-12 pl-4 rounded-lg border border-input bg-white"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
              <button
                className={`
              relative flex items-center justify-center h-9 w-9 rounded-md border border-input transition-all duration-200 ease-out
              ${showFilters
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-white text-muted-foreground hover:text-foreground hover:bg-muted/50'}
            `}
                onClick={() => setShowFilters(v => !v)}
                aria-label="Show filters"
              >
                <Filter className={`h-5 w-5 ${showFilters ? 'text-primary-foreground' : ''}`} />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] flex items-center justify-center shadow">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
              <Button
                className="h-11 px-4 rounded-lg bg-black hover:bg-gray-800 flex items-center gap-2"
                onClick={() => setIsCreateSliderOpen(true)}
              >
                <Plus className="h-5 w-5" />
                <span className="font-semibold">Add New</span>
              </Button>
            </div>

            {/* Filter Panel (dropdown style) */}
            {showFilters && (
              <FilterPanel
                open={showFilters}
                onOpenChange={setShowFilters}
                fields={[
                  {
                    type: 'select',
                    key: 'status',
                    label: 'Status',
                    value: localStatusFilter,
                    options: [
                      { value: 'all', label: 'All statuses' },
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' },
                    ],
                    searchable: true,
                  },
                  {
                    type: 'text',
                    key: 'search',
                    label: 'Search',
                    value: searchTerm,
                    placeholder: 'Search locations...'
                  },
                ]}
                onApply={values => {
                  setStatusFilter(values.status);
                  setSearchTerm(values.search);
                  setShowFilters(false);
                }}
                onClear={() => {
                  setStatusFilter('all');
                  setSearchTerm('');
                }}
              />
            )}
            {/* Active Filter Badges - Always show when there are active filters */}
            {(searchTerm || statusFilter !== 'all') && (
              <div className="flex flex-wrap gap-2 mb-2">
                {searchTerm && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                    onClick={() => setSearchTerm('')}
                  >
                    {`Search: "{searchTerm}"`}
                    <X className="h-4 w-4 ml-1" />
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                    onClick={() => setStatusFilter('all')}
                  >
                    Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                    <X className="h-4 w-4 ml-1" />
                  </Badge>
                )}
              </div>
            )}
            {/* Locations Grid */}
            <div className="grid grid-cols-1 gap-2">
              {filteredLocations.map((location) => {
                // Build metadata array (address, phone, email)
                const metadata: ItemCardMetadata[] = [
                  {
                    icon: MapPin,
                    label: "address",
                    value: location.address,
                  },
                  {
                    icon: Phone,
                    label: "phone",
                    value: location.phone,
                  },
                  {
                    icon: Mail,
                    label: "email",
                    value: location.email,
                  },
                ];

                // Build badges array (services and team members)
                const badges: ItemCardBadge[] = [];
                
                const servicesCount = location.servicesCount ?? 0;
                if (servicesCount > 0) {
                  badges.push({
                    label: servicesCount === 1 ? "Service" : "Services",
                    count: servicesCount,
                    icon: Briefcase,
                  });
                }

                const teamMembersCount = location.teamMembersCount ?? 0;
                if (teamMembersCount > 0) {
                  badges.push({
                    label: teamMembersCount === 1 ? "Team Member" : "Team Members",
                    count: teamMembersCount,
                    icon: Users,
                  });
                }

                return (
                  <ItemCard
                    key={location.id}
                    title={location.name}
                    customContent={<div className="text-foreground-2 line-clamp-2 mt-1">{location.description}</div>}
                    badges={badges}
                    metadata={metadata}
                    actions={[
                      {
                        icon: Edit,
                        label: "Edit Location",
                        onClick: (e) => {
                          e.stopPropagation();
                          openEditSlider(location);
                        },
                      },
                    ]}
                    onClick={() => openEditSlider(location)}
                    className="w-full"
                  />
                );
              })}
            </div>

            {/* Empty State */}
            {filteredLocations.length === 0 && (
              (searchTerm || statusFilter !== 'all') ? (
                <div className="rounded-lg border bg-white p-8 text-center">
                  <div className="mb-4 text-gray-500">No locations found matching your filters.</div>
                  <Button variant="outline" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}>
                    Clear filters
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border bg-white p-8 text-center">
                  <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
                  <p className="text-gray-500 mb-4">Get started by adding your first location.</p>
                  <Button onClick={() => setIsCreateSliderOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Location
                  </Button>
                </div>
              )
            )}

            {/* Add Location Slider */}
            <AddLocationSlider
              isOpen={isCreateSliderOpen}
              onClose={() => setIsCreateSliderOpen(false)}
            />

            {/* Edit Location Slider */}
            <EditLocationSlider
              isOpen={isEditSliderOpen}
              onClose={() => setIsEditSliderOpen(false)}
              location={editingLocation}
            />
          </div>
        </AccessGuard>
      </BusinessSetupGate>
    </AppLayout>
  );
}
