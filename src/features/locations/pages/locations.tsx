import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { listLocationsAction } from '../actions';
import { selectCurrentUser } from '../../auth/selectors';
import { Plus, MapPin, Phone, Mail, Edit, Users, Briefcase } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import BusinessSetupGate from '../../../shared/components/guards/BusinessSetupGate';
import AddLocationSlider from '../components/AddLocationSlider';
import EditLocationSlider from '../components/EditLocationSlider';
import { LocationFilters } from '../components/LocationFilters';
import type { LocationType } from '../../../shared/types/location';
import { getAllLocationsSelector, getLocationLoadingSelector } from '../selectors';
import { AccessGuard } from '../../../shared/components/guards/AccessGuard';
import { ItemCard, type ItemCardMetadata, type ItemCardBadge } from '../../../shared/components/common/ItemCard';
import { highlightMatches as highlight } from '../../../shared/utils/highlight';
import LocationsListSkeleton from '../components/LocationsListSkeleton';
import { EmptyState } from '../../../shared/components/common/EmptyState';


export default function LocationsPage() {
  const dispatch = useDispatch();
  const text = useTranslation("locations").t;

  const allLocations: LocationType[] = useSelector(getAllLocationsSelector);
  const isLocationsLoading = useSelector(getLocationLoadingSelector);
  const user = useSelector(selectCurrentUser);

  const [isCreateSliderOpen, setIsCreateSliderOpen] = useState(false);
  const [isEditSliderOpen, setIsEditSliderOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.businessId) {
      dispatch(listLocationsAction.request());

    }
  }, [dispatch, user]);

  const openEditSlider = (location: LocationType) => {
    setEditingLocation(location);
    setIsEditSliderOpen(true);
  };

  // Highlight helper using shared utility
  const highlightMatches = (text: string) => {
    return highlight(text, searchTerm);
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
            {/* Page Header */}
            <div className="mb-4 w-full border-b border-border-strong hidden md:block">
              <h1 className="px-4 pb-3 text-sm font-medium text-foreground md:text-2xl">
                {text("page.title")}
              </h1>
            </div>

            {/* While locations are loading, show full-page skeleton (including filters) */}
            {isLocationsLoading ? (
              <LocationsListSkeleton />
            ) : (
              <>
                {/* Location Filters */}
                <LocationFilters
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  onAddClick={() => setIsCreateSliderOpen(true)}
                />
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
                    title={highlightMatches(location.name)}
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
                  <EmptyState
                    title={searchTerm 
                      ? text("page.emptyState.noResults")
                      : text("page.emptyState.noLocations")}
                    description={searchTerm
                      ? text("page.emptyState.noResultsDescription")
                      : text("page.emptyState.noLocationsDescription")}
                    icon={MapPin}
                    actionButton={!searchTerm ? {
                      label: text("page.actions.addLocation"),
                      onClick: () => setIsCreateSliderOpen(true),
                      icon: Plus,
                    } : undefined}
                  />
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
              </>
            )}
          </div>
        </AccessGuard>
      </BusinessSetupGate>
    </AppLayout>
  );
}
