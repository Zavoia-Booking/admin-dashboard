import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";
import { Card, CardContent } from "../../../shared/components/ui/card";
import { Button } from "../../../shared/components/ui/button";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import {
  AssignmentListPanel,
  type ListItem,
} from "./common/AssignmentListPanel";
import { LocationServicesSection } from "./common/LocationServicesSection";
import { LocationBundlesSection } from "./common/LocationBundlesSection";
import { LocationTeamMembersSection } from "./common/LocationTeamMembersSection";
import { ManageTeamMemberDrawer } from "./common/ManageTeamMemberDrawer";
import { DashedDivider } from "../../../shared/components/common/DashedDivider";
import { highlightMatches } from "../../../shared/utils/highlight";
import { cn } from "../../../shared/lib/utils";
import {
  selectLocationAction,
  fetchLocationFullAssignmentAction,
  updateLocationServicesAction,
  updateLocationBundlesAction,
  updateStaffServicesAction,
  fetchStaffServicesAtLocationAction,
  updateLocationAssignmentsAction,
} from "../actions";
import {
  getIsLoadingSelector,
  getIsSavingSelector,
  getSelectedLocationIdSelector,
  getSelectedLocationFullSelector,
  getStaffServicesSelector,
  getStaffServicesLoadingSelector,
} from "../selectors";
import {
  getAllLocationsSelector,
  getLocationLoadingSelector,
} from "../../locations/selectors";
import { listLocationsAction } from "../../locations/actions";
import { selectCurrentUser } from "../../auth/selectors";
import { fetchCurrentUserAction } from "../../auth/actions";
import type { LocationType } from "../../../shared/types/location";
import type { StaffService } from "../types";

export function LocationAssignmentsView() {
  const { t } = useTranslation("assignments");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const teamMembersSectionRef = useRef<HTMLDivElement>(null);

  // Selectors
  const isLoading = useSelector(getIsLoadingSelector);
  const isSaving = useSelector(getIsSavingSelector);
  const allLocations = useSelector(getAllLocationsSelector);
  const isLocationsLoading = useSelector(getLocationLoadingSelector);
  const selectedLocationId = useSelector(getSelectedLocationIdSelector);
  const selectedLocation = useSelector(getSelectedLocationFullSelector);
  const staffServices = useSelector(getStaffServicesSelector);
  const isStaffServicesLoading = useSelector(getStaffServicesLoadingSelector);
  const currentUser = useSelector(selectCurrentUser);
  const businessCurrency = currentUser?.business?.businessCurrency || "eur";

  // Track navigation to reset auto-selection state
  const lastLocationKeyRef = useRef<string | null>(null);
  const lastLocationIdFromUrlRef = useRef<string | null>(null);

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [hasAutoSelected, setHasAutoSelected] = useState(false);
  const [managingMemberId, setManagingMemberId] = useState<number | null>(null);
  const [saveOperation, setSaveOperation] = useState<
    "staff" | "services" | "teamMembers" | null
  >(null);
  const [forceLoading, setForceLoading] = useState(false);
  const [savingTeamMemberIds, setSavingTeamMemberIds] = useState<Set<number>>(
    new Set(),
  );
  // Track teamMembers state when saving starts - only clear when it changes from this
  const teamMembersWhenSavingStartedRef = useRef<number[] | null>(null);

  // Filter locations by search
  const filteredLocations = useMemo(() => {
    if (!searchTerm.trim()) return allLocations;

    const query = searchTerm.trim().toLowerCase();
    const tokens = query.split(/\s+/).filter(Boolean);

    return allLocations.filter((location: LocationType) => {
      const name = (location.name || "").toLowerCase();
      const address = (location.address || "").toLowerCase();
      return tokens.every(
        (token) => name.includes(token) || address.includes(token),
      );
    });
  }, [allLocations, searchTerm]);

  // Load locations on mount
  useEffect(() => {
    dispatch(listLocationsAction.request());
  }, [dispatch]);

  // Reset hasAutoSelected when navigating to the page or when locationId in URL changes
  useEffect(() => {
    const locationIdFromUrl = searchParams.get("locationId");
    const currentLocationKey = location.key;
    const locationIdChanged =
      locationIdFromUrl !== lastLocationIdFromUrlRef.current;
    const navigationChanged = currentLocationKey !== lastLocationKeyRef.current;

    if (navigationChanged || locationIdChanged) {
      // Reset auto-selection state when navigating to page or URL locationId changes
      setHasAutoSelected(false);
      lastLocationKeyRef.current = currentLocationKey;
      lastLocationIdFromUrlRef.current = locationIdFromUrl;
    }
  }, [location.key, searchParams]);

  // Auto-select location from URL
  useEffect(() => {
    const locationIdFromUrl = searchParams.get("locationId");
    if (locationIdFromUrl && !hasAutoSelected && allLocations.length > 0) {
      const locationId = parseInt(locationIdFromUrl, 10);
      const locationExists = allLocations.some(
        (l: LocationType) => l.id === locationId,
      );
      if (locationExists && !isNaN(locationId)) {
        // Only auto-select if the current selection doesn't match
        // This ensures we respect URL locationId even if something else was selected
        if (selectedLocationId !== locationId) {
          // Use a small delay to ensure this runs after any clearing from AssignmentsPage
          const timeoutId = setTimeout(() => {
            dispatch(selectLocationAction(locationId));
            dispatch(fetchLocationFullAssignmentAction.request({ locationId }));
            setHasAutoSelected(true);
          }, 0);
          return () => clearTimeout(timeoutId);
        } else {
          // Already selected correctly, just mark as auto-selected to prevent re-running
          setHasAutoSelected(true);
        }
      }
    }
  }, [
    searchParams,
    allLocations,
    hasAutoSelected,
    selectedLocationId,
    dispatch,
  ]);

  // Auto-select first location when page loads (if no locationId in URL and no selection)
  useEffect(() => {
    const locationIdFromUrl = searchParams.get("locationId");
    if (
      !locationIdFromUrl &&
      !hasAutoSelected &&
      !isLocationsLoading &&
      allLocations.length > 0 &&
      selectedLocationId === null
    ) {
      // Use a small delay to ensure this runs after any clearing from AssignmentsPage
      const timeoutId = setTimeout(() => {
        const firstLocation = allLocations[0];
        if (firstLocation) {
          dispatch(selectLocationAction(firstLocation.id));
          dispatch(
            fetchLocationFullAssignmentAction.request({
              locationId: firstLocation.id,
            }),
          );
          setHasAutoSelected(true);
        }
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [
    searchParams,
    allLocations,
    hasAutoSelected,
    isLocationsLoading,
    selectedLocationId,
    dispatch,
  ]);

  // Consolidated save completion handler
  useEffect(() => {
    if (saveOperation && !isSaving) {
      // Only "staff" needs cleanup - others are handled elsewhere
      if (saveOperation === "staff") {
        setManagingMemberId(null);
      }
      setSaveOperation(null);
      setForceLoading(false);
    }
  }, [saveOperation, isSaving, selectedLocation, selectedLocationId, dispatch]);

  // Clear savingTeamMemberIds when /full call completes after team member toggle
  // Wait for both: save operation to complete AND teamMembers to change from when saving started
  useEffect(() => {
    if (
      selectedLocation &&
      savingTeamMemberIds.size > 0 &&
      teamMembersWhenSavingStartedRef.current !== null
    ) {
      const currentMemberIds = selectedLocation.teamMembers
        .map((m) => m.userId)
        .sort();
      const membersWhenStarted = teamMembersWhenSavingStartedRef.current;

      const saveOperationDone = saveOperation !== "teamMembers";
      const teamMembersChanged =
        JSON.stringify(currentMemberIds) !== JSON.stringify(membersWhenStarted);

      if (saveOperationDone && teamMembersChanged) {
        // Both calls have completed - clear saving state
        setSavingTeamMemberIds(new Set());
        teamMembersWhenSavingStartedRef.current = null;
      }
    } else if (!selectedLocation) {
      teamMembersWhenSavingStartedRef.current = null;
    }
  }, [selectedLocation, savingTeamMemberIds.size, saveOperation]);

  // Clear forceLoading when location fetch completes (even if no saveOperation was set)
  useEffect(() => {
    if (!isLoading && forceLoading && !saveOperation) {
      setForceLoading(false);
    }
  }, [isLoading, forceLoading, saveOperation]);

  // Handlers
  const handleSelectLocation = useCallback(
    (locationId: number) => {
      // Prevent selecting the same location that's already selected (avoids unnecessary backend calls)
      if (selectedLocationId === locationId) {
        return;
      }
      dispatch(selectLocationAction(locationId));
      // Refetch user data to get updated currency
      dispatch(fetchCurrentUserAction.request());
      dispatch(fetchLocationFullAssignmentAction.request({ locationId }));
    },
    [dispatch, selectedLocationId],
  );

  // Save single service override to backend
  const handleSaveServiceOverride = useCallback(
    (
      serviceId: number,
      customPrice: number | null,
      customDuration: number | null,
    ) => {
      if (!selectedLocationId || !selectedLocation) return;

      // Show skeleton immediately
      setForceLoading(true);
      setSaveOperation("services");

      // Build payload with all current services, updating the one being changed
      const servicesPayload = selectedLocation.services.map((s) => ({
        serviceId: s.serviceId,
        isEnabled: true,
        customPrice: s.serviceId === serviceId ? customPrice : s.customPrice,
        customDuration:
          s.serviceId === serviceId ? customDuration : s.customDuration,
      }));

      dispatch(
        updateLocationServicesAction.request({
          locationId: selectedLocationId,
          services: servicesPayload,
        }),
      );
    },
    [dispatch, selectedLocationId, selectedLocation],
  );

  // Save services list directly to backend
  const handleSaveLocationServices = useCallback(
    (serviceIds: number[]) => {
      if (!selectedLocationId || !selectedLocation) return;

      // Show skeleton immediately
      setForceLoading(true);
      setSaveOperation("services");

      // Build services payload
      const enabledSet = new Set(serviceIds);

      const enabledServices = serviceIds.map((id) => {
        // Check if we have existing service data (for preserving overrides)
        const existingService = selectedLocation.services.find(
          (s) => s.serviceId === id,
        );
        return {
          serviceId: id,
          isEnabled: true,
          customPrice: existingService?.customPrice ?? null,
          customDuration: existingService?.customDuration ?? null,
        };
      });

      // Disable services that were removed
      const disabledServices = selectedLocation.services
        .filter((s) => !enabledSet.has(s.serviceId))
        .map((s) => ({
          serviceId: s.serviceId,
          isEnabled: false,
          customPrice: null,
          customDuration: null,
        }));

      dispatch(
        updateLocationServicesAction.request({
          locationId: selectedLocationId,
          services: [...enabledServices, ...disabledServices],
        }),
      );
    },
    [dispatch, selectedLocationId, selectedLocation],
  );

  // Save bundles list directly to backend
  const handleSaveLocationBundles = useCallback(
    (bundleIds: number[]) => {
      if (!selectedLocationId || !selectedLocation) return;

      // Show skeleton immediately
      setForceLoading(true);
      setSaveOperation("services"); // Use same operation type for now

      // Build bundles payload
      const enabledSet = new Set(bundleIds);

      const enabledBundles = bundleIds.map((id) => ({
        bundleId: id,
        isEnabled: true,
      }));

      // Disable bundles that were removed
      const disabledBundles = (selectedLocation.bundles || [])
        .filter((b) => !enabledSet.has(b.bundleId))
        .map((b) => ({
          bundleId: b.bundleId,
          isEnabled: false,
        }));

      dispatch(
        updateLocationBundlesAction.request({
          locationId: selectedLocationId,
          bundles: [...enabledBundles, ...disabledBundles],
        }),
      );
    },
    [dispatch, selectedLocationId, selectedLocation],
  );

  // Save team member toggle directly to backend
  const handleSaveTeamMemberToggle = useCallback(
    (userId: number, enabled: boolean) => {
      if (!selectedLocationId || !selectedLocation) return;

      // If any switch is already saving, ignore (all switches are disabled in UI)
      // Check both state and saveOperation to catch rapid clicks
      if (savingTeamMemberIds.size > 0 || saveOperation === "teamMembers") {
        return;
      }

      // Calculate new member IDs from current Redux state
      const currentMemberIds = selectedLocation.teamMembers.map(
        (m) => m.userId,
      );
      const newMemberIds = enabled
        ? [...currentMemberIds, userId]
        : currentMemberIds.filter((id) => id !== userId);

      // Mark this userId as saving and set operation
      setSavingTeamMemberIds((prev) => {
        const newSet = new Set(prev).add(userId);
        // Track the current teamMembers state when saving starts
        if (newSet.size === 1) {
          // First member being saved - capture the current state
          teamMembersWhenSavingStartedRef.current = selectedLocation.teamMembers
            .map((m) => m.userId)
            .sort();
        }
        return newSet;
      });
      setSaveOperation("teamMembers");

      // Use unified endpoint
      dispatch(
        updateLocationAssignmentsAction.request({
          locationId: selectedLocationId,
          userIds: newMemberIds,
          teamMemberToggle: {
            userId,
            enabled,
          },
        }),
      );
    },
    [
      dispatch,
      selectedLocationId,
      selectedLocation,
      savingTeamMemberIds,
      saveOperation,
    ],
  );

  const handleManageMember = useCallback(
    (userId: number) => {
      if (!selectedLocationId) return;
      dispatch(
        fetchStaffServicesAtLocationAction.request({
          locationId: selectedLocationId,
          userId,
        }),
      );
      setManagingMemberId(userId);
    },
    [dispatch, selectedLocationId],
  );

  const handleSaveStaffServices = useCallback(
    (services: StaffService[]) => {
      if (!selectedLocationId || !managingMemberId) return;

      // Mark that we're saving staff services - drawer will close when save completes
      setSaveOperation("staff");

      dispatch(
        updateStaffServicesAction.request({
          locationId: selectedLocationId,
          userId: managingMemberId,
          services: services.map((s) => ({
            serviceId: s.serviceId,
            canPerform: s.canPerform,
            customPrice: s.customPrice,
            customDuration: s.customDuration,
          })),
        }),
      );
      // Note: Drawer closes via useEffect when isSaving becomes false
    },
    [dispatch, selectedLocationId, managingMemberId],
  );

  // Handler for when staff overrides modal starts saving - show skeleton immediately
  const handleOverridesSaveStart = useCallback(() => {
    setForceLoading(true);
  }, []);

  // Get managing member info
  const managingMember = useMemo(() => {
    if (!managingMemberId || !selectedLocation) return null;
    return selectedLocation.teamMembers.find(
      (m) => m.userId === managingMemberId,
    );
  }, [managingMemberId, selectedLocation]);

  // Transform locations for list panel
  const listItems: ListItem[] = useMemo(() => {
    return filteredLocations.map((location: LocationType) => ({
      id: location.id,
      title: location.name,
      subtitle: location.address,
      badges: [],
    }));
  }, [filteredLocations]);

  // Custom render for location items
  const renderLocationItem = useCallback(
    (item: ListItem, isSelected: boolean) => (
      <button
        onClick={() => handleSelectLocation(Number(item.id))}
        className={cn(
          "group relative cursor-pointer flex items-start gap-3 w-full px-2 py-3 pr-4 rounded-lg border text-left",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/60 focus-visible:ring-offset-0",
          isSelected
            ? "border-border-strong bg-white dark:bg-surface shadow-xs"
            : "border-border bg-white dark:bg-surface hover:border-border-strong hover:bg-surface-hover active:scale-[0.99]",
        )}
      >
        {/* Selection indicator */}
        <div className="flex-shrink-0 mt-2.5">
          <div
            className={cn(
              "h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center",
              isSelected
                ? "border-primary bg-primary"
                : "border-border-strong group-hover:border-primary",
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
    [handleSelectLocation, searchTerm],
  );

  // Empty state for locations list
  const emptyStateComponent =
    allLocations.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="flex flex-col items-center justify-center space-y-4 text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <MapPin className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {t("page.assignments.emptyState.noLocationsAvailable")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("page.assignments.emptyState.noLocationsAvailableDescription")}
            </p>
          </div>
          <Button onClick={() => navigate("/locations")} className="mt-2">
            {t("page.assignments.emptyState.goToLocations")}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    ) : undefined;

  // Loading skeleton for details panel - matches actual layout structure
  const renderDetailsSkeleton = () => (
    <Card className="py-3 cursor-default">
      <CardContent className="px-3 space-y-8">
        {/* Services Section Skeleton */}
        <div className="space-y-4">
          {/* Services Header */}
          <div className="space-y-1.5 py-2">
            <Skeleton className="h-6 w-64" />
            <div className="flex items-start gap-1.5">
              <Skeleton className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 rounded" />
              <Skeleton className="h-3.5 w-80" />
            </div>
          </div>

          {/* Services Stats and Button */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-28 rounded-full" />
            </div>
            <div className="flex-shrink-0 md:ml-auto">
              <Skeleton className="h-9 w-40 rounded-full" />
            </div>
          </div>

          {/* Services List */}
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-white dark:bg-surface p-3 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-9 rounded-full flex-shrink-0" />
                  <Skeleton className="h-5 w-32 flex-1" />
                  <Skeleton className="h-5 w-20 rounded-full flex-shrink-0" />
                  <Skeleton className="h-7 w-7 rounded flex-shrink-0" />
                </div>
                <div className="grid grid-cols-2 gap-3 pl-12">
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-border mt-2 pt-2" />

        {/* Bundles Section Skeleton */}
        <div className="space-y-4">
          {/* Bundles Header */}
          <div className="space-y-1.5 py-2">
            <Skeleton className="h-6 w-64" />
            <div className="flex items-start gap-1.5">
              <Skeleton className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 rounded" />
              <Skeleton className="h-3.5 w-80" />
            </div>
          </div>

          {/* Bundles Stats and Button */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
            <div className="flex-shrink-0 md:ml-auto">
              <Skeleton className="h-9 w-40 rounded-full" />
            </div>
          </div>

          {/* Bundles List */}
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-white dark:bg-surface p-3"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-32 flex-1" />
                  <Skeleton className="h-5 w-16 rounded-full flex-shrink-0" />
                  <Skeleton className="h-4 w-20 flex-shrink-0" />
                  <Skeleton className="h-5 w-16 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-border mt-2 pt-2" />

        {/* Team Members Section Skeleton */}
        <div className="space-y-4">
          {/* Team Members Header */}
          <div className="space-y-1.5 py-2">
            <Skeleton className="h-6 w-72" />
            <div className="flex items-start gap-1.5">
              <Skeleton className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 rounded" />
              <Skeleton className="h-3.5 w-96" />
            </div>
          </div>

          {/* Team Members Stats */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-28 rounded-full" />
          </div>

          {/* Team Members List */}
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="group flex items-center gap-3 px-3 py-3 pt-0 rounded-lg border border-border bg-white dark:bg-surface"
              >
                <Skeleton className="h-5 w-9 rounded-full flex-shrink-0" />
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                  <div className="flex flex-col min-w-0 flex-1 pt-4 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-3 w-24 mt-2" />
                  </div>
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
              {t("page.assignments.emptyState.selectLocationTitle")}
            </h3>
            <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
              {t("page.assignments.emptyState.selectLocationDescription")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col md:flex-row gap-2 w-full">
      {/* Left list panel */}
      <div className="w-full md:w-[32%] min-w-0">
        <AssignmentListPanel
          title={t("page.assignments.titleWithCount", {
            count: filteredLocations.length,
            ofTotal: searchTerm
              ? t("page.assignments.titleOfTotal", {
                  total: allLocations.length,
                })
              : "",
          })}
          items={listItems}
          selectedId={selectedLocationId ?? null}
          onSelect={(id) => handleSelectLocation(Number(id))}
          isLoading={isLocationsLoading}
          emptyMessage={
            searchTerm
              ? t("page.assignments.emptyState.noLocationsMatchSearch")
              : t("page.assignments.emptyState.noLocations")
          }
          emptyStateComponent={emptyStateComponent}
          renderItem={renderLocationItem}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder={t("page.assignments.searchPlaceholder")}
          showSearch
        />
      </div>

      {/* Right details panel */}
      <div className="w-full md:flex-1 min-w-0">
        {(isLoading || forceLoading) && saveOperation !== "teamMembers" ? (
          renderDetailsSkeleton()
        ) : !selectedLocation ? (
          renderEmptyDetails()
        ) : (
          <Card className="py-3 cursor-default">
            <CardContent className="px-3 space-y-8">
              {/* Services Section */}
              <LocationServicesSection
                locationName={selectedLocation.name}
                services={selectedLocation.services}
                allServices={selectedLocation.allServices}
                onSaveServiceOverride={handleSaveServiceOverride}
                onSaveServices={handleSaveLocationServices}
                currency={businessCurrency}
                locationId={selectedLocationId || undefined}
                onSaveStart={handleOverridesSaveStart}
              />

              <DashedDivider
                className="mb-1 md:mb-4"
                marginTop="mt-2"
                paddingTop="pt-2"
              />

              {/* Bundles Section */}
              <LocationBundlesSection
                locationName={selectedLocation.name}
                bundles={selectedLocation.bundles || []}
                allBundles={selectedLocation.allBundles || []}
                onSaveBundles={handleSaveLocationBundles}
                currency={businessCurrency}
                locationId={selectedLocationId || undefined}
              />

              <DashedDivider
                className="mb-1 md:mb-4"
                marginTop="mt-2"
                paddingTop="pt-2"
              />

              {/* Team Members Section */}
              <div ref={teamMembersSectionRef}>
                <LocationTeamMembersSection
                  locationName={selectedLocation.name}
                  teamMembers={selectedLocation.teamMembers}
                  allTeamMembers={selectedLocation.allTeamMembers}
                  onManageMember={handleManageMember}
                  onSaveTeamMemberToggle={handleSaveTeamMemberToggle}
                  enabledMemberIds={selectedLocation.teamMembers.map(
                    (m) => m.userId,
                  )}
                  savingMemberIds={savingTeamMemberIds}
                  isSaving={saveOperation === "teamMembers" && isSaving}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Manage Team Member Drawer */}
      <ManageTeamMemberDrawer
        isOpen={managingMemberId !== null}
        onClose={() => setManagingMemberId(null)}
        teamMember={
          managingMember
            ? {
                userId: managingMember.userId,
                firstName: managingMember.firstName,
                lastName: managingMember.lastName,
                email: managingMember.email,
                profileImage: managingMember.profileImage,
              }
            : null
        }
        locationName={selectedLocation?.name || ""}
        services={staffServices || []}
        localLocationServices={selectedLocation?.services || []}
        onSave={handleSaveStaffServices}
        currency={businessCurrency}
        isSaving={isSaving}
        isLoading={isStaffServicesLoading}
      />
    </div>
  );
}
