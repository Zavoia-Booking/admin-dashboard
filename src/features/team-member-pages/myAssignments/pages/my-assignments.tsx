import { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '../../../../shared/components/layouts/app-layout';
import { Card, CardContent } from '../../../../shared/components/ui/card';
import { Skeleton } from '../../../../shared/components/ui/skeleton';
import {
  AssignmentListPanel,
  type ListItem,
} from '../../../assignments/components/common/AssignmentListPanel';
import { DashedDivider } from '../../../../shared/components/common/DashedDivider';
import { MyAssignmentServicesSection } from '../components/MyAssignmentServicesSection';
import { MyAssignmentBundlesSection } from '../components/MyAssignmentBundlesSection';
import { highlightMatches } from '../../../../shared/utils/highlight';
import { cn } from '../../../../shared/lib/utils';
import { selectCurrentUser } from '../../../auth/selectors';
import { getAssignedLocations, getLocationAssignments } from '../api';
import type { AssignedLocation, LocationAssignments } from '../types';

export default function MyAssignmentsPage() {
  const { t } = useTranslation('myAssignments');
  const currentUser = useSelector(selectCurrentUser);
  const businessCurrency = currentUser?.business?.businessCurrency || 'eur';

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(
    null
  );

  // Data fetching state
  const [locations, setLocations] = useState<AssignedLocation[]>([]);
  const [isLocationsLoading, setIsLocationsLoading] = useState(true);
  const [locationAssignments, setLocationAssignments] =
    useState<LocationAssignments | null>(null);
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(false);

  // Fetch assigned locations on mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setIsLocationsLoading(true);
        const data = await getAssignedLocations();
        setLocations(data);

        // Auto-select first location
        if (data.length > 0) {
          setSelectedLocationId(data[0].id);
        }
      } catch (error: any) {
        console.error('Error fetching assigned locations:', error);
        toast.error(error?.message || 'Failed to load assigned locations');
      } finally {
        setIsLocationsLoading(false);
      }
    };
    fetchLocations();
  }, []);

  // Fetch location assignments when a location is selected
  useEffect(() => {
    if (!selectedLocationId) {
      setLocationAssignments(null);
      return;
    }

    const fetchAssignments = async () => {
      try {
        setIsAssignmentsLoading(true);
        const data = await getLocationAssignments(selectedLocationId);
        setLocationAssignments(data);
      } catch (error: any) {
        console.error('Error fetching location assignments:', error);
        toast.error(error?.message || 'Failed to load assignments');
      } finally {
        setIsAssignmentsLoading(false);
      }
    };
    fetchAssignments();
  }, [selectedLocationId]);

  // Filter locations by search
  const filteredLocations = useMemo(() => {
    if (!searchTerm.trim()) return locations;

    const query = searchTerm.trim().toLowerCase();
    const tokens = query.split(/\s+/).filter(Boolean);

    return locations.filter((location: AssignedLocation) => {
      const name = (location.name || '').toLowerCase();
      const address = (location.address || '').toLowerCase();
      return tokens.every(
        (token) => name.includes(token) || address.includes(token)
      );
    });
  }, [locations, searchTerm]);

  // Handlers
  const handleSelectLocation = useCallback(
    (locationId: number) => {
      if (selectedLocationId === locationId) {
        return;
      }
      setSelectedLocationId(locationId);
    },
    [selectedLocationId]
  );

  // Transform locations for list panel
  const listItems: ListItem[] = useMemo(() => {
    return filteredLocations.map((location: AssignedLocation) => ({
      id: location.id,
      title: location.name,
      subtitle: location.address || undefined,
      badges: [],
    }));
  }, [filteredLocations]);

  // Custom render for location items
  const renderLocationItem = useCallback(
    (item: ListItem, isSelected: boolean) => (
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
        {/* Selection indicator */}
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

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="font-semibold text-sm text-foreground-1 truncate">
            {searchTerm ? highlightMatches(item.title, searchTerm) : item.title}
          </div>
          {item.subtitle && (
            <div className="text-xs text-muted-foreground truncate">
              {searchTerm
                ? highlightMatches(item.subtitle, searchTerm)
                : item.subtitle}
            </div>
          )}
        </div>
      </button>
    ),
    [handleSelectLocation, searchTerm]
  );

  // Empty state for locations list
  const emptyStateComponent =
    locations.length === 0 && !isLocationsLoading ? (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="flex flex-col items-center justify-center space-y-4 text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <MapPin className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {t('emptyState.noLocations.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('emptyState.noLocations.description')}
            </p>
          </div>
        </div>
      </div>
    ) : undefined;

  // Loading skeleton for details panel
  const renderDetailsSkeleton = () => (
    <Card className="py-3 cursor-default">
      <CardContent className="px-3 space-y-8">
        {/* Services Section Skeleton */}
        <div className="space-y-4">
          <div className="space-y-1.5 py-2">
            <Skeleton className="h-6 w-64" />
            <div className="flex items-start gap-1.5">
              <Skeleton className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 rounded" />
              <Skeleton className="h-3.5 w-80" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-28 rounded-full" />
            </div>
          </div>

          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-white dark:bg-surface p-3 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-32 flex-1" />
                  <Skeleton className="h-5 w-20 rounded-full flex-shrink-0" />
                  <Skeleton className="h-5 w-16 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-border mt-2 pt-2" />

        {/* Bundles Section Skeleton */}
        <div className="space-y-4">
          <div className="space-y-1.5 py-2">
            <Skeleton className="h-6 w-64" />
            <div className="flex items-start gap-1.5">
              <Skeleton className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 rounded" />
              <Skeleton className="h-3.5 w-80" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
          </div>

          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-white dark:bg-surface p-3"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-32 flex-1" />
                  <Skeleton className="h-5 w-16 rounded-full flex-shrink-0" />
                  <Skeleton className="h-5 w-16 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Empty state for details panel
  const renderEmptyDetails = () => (
    <Card className="col-span-8 md:col-span-8 py-3 cursor-default">
      <CardContent className="px-3">
        <div className="flex flex-col items-center justify-start md:py-8 text-center gap-6 md:min-h-[400px]">
          <div className="relative w-full max-w-md h-28 md:h-44 text-left mb-14">
            <div className="absolute inset-0 -top-4 -bottom-4 bg-gradient-to-b from-primary/5 dark:from-primary/10 via-transparent to-transparent blur-2xl opacity-50 dark:opacity-40" />
            <div className="absolute inset-x-10 top-2 md:h-28 h-20 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-border shadow-lg opacity-70 rotate-[-14deg] blur-[0.5px]" />
            <div className="absolute inset-x-6 top-10 md:h-30 h-25 rounded-2xl bg-neutral-50 dark:bg-neutral-900/70 border border-border shadow-xl opacity-85 rotate-[10deg] blur-[0.5px]" />
            <div className="absolute inset-x-2 top-6 h-25 md:h-32 rounded-2xl bg-surface dark:bg-neutral-900 border border-border dark:border-border-surface shadow-xl overflow-hidden">
              <div className="h-full w-full px-4 py-2 flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-40 rounded bg-neutral-300 dark:bg-neutral-800" />
                  <div className="flex items-start gap-1.5">
                    <div className="h-3 w-3 rounded bg-neutral-300/80 dark:bg-neutral-800/80 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <div className="h-2.5 w-full rounded bg-neutral-300/70 dark:bg-neutral-800/70" />
                      <div className="h-2.5 w-2/3 rounded bg-neutral-300/60 dark:bg-neutral-800/60" />
                    </div>
                  </div>
                </div>
                <div className="h-px bg-border dark:bg-border-surface" />
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <div className="h-3.5 w-3.5 rounded-full bg-neutral-300/90 dark:bg-neutral-800/90 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-3 w-28 rounded bg-neutral-300/90 dark:bg-neutral-800/90" />
                    </div>
                    <div className="h-3.5 w-12 rounded bg-neutral-300/80 dark:bg-neutral-800/80" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 max-w-xl px-4">
            <h3 className="text-lg font-semibold text-foreground-1">
              {t('emptyState.selectLocation.title')}
            </h3>
            <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
              {t('emptyState.selectLocation.description')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="mb-4 w-full border-b border-border-strong hidden md:block">
          <h1 className="px-4 pb-3 text-sm font-medium text-foreground md:text-2xl">
            {t('pageTitle')}
          </h1>
        </div>

        {/* Main Content */}
        <div className="flex flex-col md:flex-row gap-2 w-full">
          {/* Left list panel */}
          <div className="w-full md:w-[32%] min-w-0">
            <AssignmentListPanel
              title={t('locationsPanel.title', {
                count: filteredLocations.length,
                ofTotal: searchTerm
                  ? t('locationsPanel.ofTotal', {
                      total: locations.length,
                    })
                  : '',
              })}
              items={listItems}
              selectedId={selectedLocationId ?? null}
              onSelect={(id) => handleSelectLocation(Number(id))}
              isLoading={isLocationsLoading}
              emptyMessage={
                searchTerm
                  ? t('emptyState.noLocationsMatchSearch')
                  : t('emptyState.noLocations.title')
              }
              emptyStateComponent={emptyStateComponent}
              renderItem={renderLocationItem}
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder={t('locationsPanel.searchPlaceholder')}
              showSearch
            />
          </div>

          {/* Right details panel */}
          <div className="w-full md:flex-1 min-w-0">
            {isAssignmentsLoading ? (
              renderDetailsSkeleton()
            ) : !locationAssignments ? (
              renderEmptyDetails()
            ) : (
              <Card className="py-3 cursor-default">
                <CardContent className="px-3 space-y-8">
                  {/* Services Section */}
                  <MyAssignmentServicesSection
                    services={locationAssignments.services}
                    currency={businessCurrency}
                  />

                  <DashedDivider
                    className="mb-1 md:mb-4"
                    marginTop="mt-2"
                    paddingTop="pt-2"
                  />

                  {/* Bundles Section */}
                  <MyAssignmentBundlesSection
                    bundles={locationAssignments.bundles}
                    currency={businessCurrency}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
