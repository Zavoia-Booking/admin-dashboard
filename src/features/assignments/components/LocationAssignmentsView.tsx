import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";
import { Card, CardContent } from "../../../shared/components/ui/card";
import { Button } from "../../../shared/components/ui/button";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import { LocationSelector } from "../../../shared/components/common/LocationSelector";
import { HeaderTitleSlot } from "../../../shared/components/layouts/HeaderRightSlot";
import {
  AssignmentsSummary,
  type AssignmentsSummaryTarget,
} from "./AssignmentsSummary";
import { LocationServicesSection } from "./common/LocationServicesSection";
import { LocationBundlesSection } from "./common/LocationBundlesSection";
import { LocationTeamMembersSection } from "./common/LocationTeamMembersSection";
import { ManageTeamMemberDrawer } from "./common/ManageTeamMemberDrawer";
import { DashedDivider } from "../../../shared/components/common/DashedDivider";
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
  getLoadErrorSelector,
  getSelectedLocationIdSelector,
  getSelectedLocationFullSelector,
  getStaffServicesSelector,
  getStaffServicesLoadingSelector,
} from "../selectors";
import { ErrorState } from "../../../shared/components/common/ErrorState";
import { scrollAppContentToElement } from "../../../shared/utils/scroll";
import { cn } from "../../../shared/lib/utils";
import {
  getAllLocationsSelector,
  getLocationListErrorSelector,
  getLocationsListLoadedSelector,
} from "../../locations/selectors";
import { listLocationsAction } from "../../locations/actions";
import { selectCurrentUser } from "../../auth/selectors";
import { fetchCurrentUserAction } from "../../auth/actions";
import { getLocationUnassignPreviewApi } from "../../teamMembers/api";
import { openReconciliationAction } from "../../reconciliation/actions";
import type { LocationType } from "../../../shared/types/location";
import type { StaffService } from "../types";

/** Per-feature key, same pattern as the dashboard's and the calendar's, so the
 *  location picked here survives a reload without leaking into other pages. */
const LOCATION_STORAGE_KEY = "zavoia_assignments_selected_location";

function readStoredLocationId(): number | null {
  const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isNaN(parsed) ? null : parsed;
}

export function LocationAssignmentsView() {
  const { t } = useTranslation("assignments");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const servicesSectionRef = useRef<HTMLDivElement>(null);
  const bundlesSectionRef = useRef<HTMLDivElement>(null);
  const teamMembersSectionRef = useRef<HTMLDivElement>(null);

  // Selectors
  const isLoading = useSelector(getIsLoadingSelector);
  const loadError = useSelector(getLoadErrorSelector);
  const isSaving = useSelector(getIsSavingSelector);
  const allLocations = useSelector(getAllLocationsSelector);
  const locationsLoaded = useSelector(getLocationsListLoadedSelector);
  const locationsListError = useSelector(getLocationListErrorSelector);
  const selectedLocationId = useSelector(getSelectedLocationIdSelector);
  const selectedLocation = useSelector(getSelectedLocationFullSelector);
  const staffServices = useSelector(getStaffServicesSelector);
  const isStaffServicesLoading = useSelector(getStaffServicesLoadingSelector);
  const currentUser = useSelector(selectCurrentUser);
  const businessCurrency = currentUser?.business?.businessCurrency || "eur";

  // Local state
  const [managingMemberId, setManagingMemberId] = useState<number | null>(null);
  const [saveOperation, setSaveOperation] = useState<
    "staff" | "services" | "teamMembers" | null
  >(null);
  const [forceLoading, setForceLoading] = useState(false);
  const [savingTeamMemberIds, setSavingTeamMemberIds] = useState<Set<number>>(
    new Set(),
  );
  // Section the summary last pointed at — rings it briefly once the scroll lands.
  const [attentionSection, setAttentionSection] =
    useState<AssignmentsSummaryTarget | null>(null);
  const attentionTimersRef = useRef<number[]>([]);
  // Track teamMembers state when saving starts - only clear when it changes from this
  const teamMembersWhenSavingStartedRef = useRef<number[] | null>(null);
  // The location whose /full payload has already been asked for. Guards the
  // resolver below from re-firing on every unrelated store update.
  const requestedLocationIdRef = useRef<number | null>(null);

  // Load locations on mount
  useEffect(() => {
    dispatch(listLocationsAction.request());
  }, [dispatch]);

  // /assignments?locationId=… is an entry alias only: adopt it, then strip it
  // from the URL so a later switch can't be dragged back to the stale id.
  useEffect(() => {
    const raw = searchParams.get("locationId");
    if (!raw) return;
    const id = parseInt(raw, 10);
    if (!Number.isNaN(id)) {
      localStorage.setItem(LOCATION_STORAGE_KEY, String(id));
      dispatch(selectLocationAction(id));
    }
    navigate("/assignments", { replace: true });
  }, [searchParams, navigate, dispatch]);

  // The one place that decides which location is shown and the one place that
  // asks for its data. Selecting and fetching in the same pass is what keeps
  // the first paint to a single skeleton instead of empty → skeleton → empty →
  // skeleton → data.
  useEffect(() => {
    // Let the alias effect above clear the param first, otherwise it would win
    // the selection back on the next pass.
    if (searchParams.get("locationId")) return;
    if (!locationsLoaded || allLocations.length === 0) return;

    const exists = (id: number | null): id is number =>
      id !== null && allLocations.some((l: LocationType) => l.id === id);

    const stored = readStoredLocationId();
    const target = exists(selectedLocationId)
      ? selectedLocationId
      : exists(stored)
        ? stored
        : allLocations[0].id;

    if (requestedLocationIdRef.current === target) return;
    requestedLocationIdRef.current = target;

    localStorage.setItem(LOCATION_STORAGE_KEY, String(target));
    if (target !== selectedLocationId) {
      dispatch(selectLocationAction(target));
    }

    // Coming back with this location's payload still in the store: refresh it
    // quietly so the content never blinks back to a skeleton.
    dispatch(
      fetchLocationFullAssignmentAction.request({
        locationId: target,
        skipLoading: selectedLocation?.id === target,
      }),
    );
  }, [
    searchParams,
    locationsLoaded,
    allLocations,
    selectedLocationId,
    selectedLocation,
    dispatch,
  ]);

  // One gate for the whole first paint: the details stay a skeleton until the
  // location list is known AND the selected location's payload has landed.
  const hasLocations = allLocations.length > 0;
  const detailsMatchSelection =
    selectedLocation !== null && selectedLocation.id === selectedLocationId;
  const isBootstrapping =
    !locationsLoaded ||
    (hasLocations &&
      !loadError &&
      // A team-member toggle refreshes in place; it must never fall back to a
      // skeleton (that is what scrolls the list out from under the switch).
      saveOperation !== "teamMembers" &&
      (selectedLocationId === null || isLoading || !detailsMatchSelection));

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
      // Claim the fetch here so the resolver effect doesn't fire a second one.
      requestedLocationIdRef.current = locationId;
      localStorage.setItem(LOCATION_STORAGE_KEY, String(locationId));
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
    async (userId: number, enabled: boolean) => {
      if (!selectedLocationId || !selectedLocation) return;

      // If any switch is already saving, ignore (all switches are disabled in UI)
      // Check both state and saveOperation to catch rapid clicks
      if (savingTeamMemberIds.size > 0 || saveOperation === "teamMembers") {
        return;
      }

      // Unassign path: check whether the member has appointments at this location.
      // If yes → open the reconciliation modal in unassign_from_location mode and
      // bail out of the direct toggle. If no → proceed with the existing fast path.
      if (!enabled) {
        try {
          const preview = await getLocationUnassignPreviewApi(userId, selectedLocationId);
          if (preview.appointments && preview.appointments.length > 0) {
            dispatch(
              openReconciliationAction({
                mode: 'unassign_from_location',
                userId,
                locationId: selectedLocationId,
              }),
            );
            return;
          }
        } catch {
          // Preview failed → fall through to legacy fast path.
        }
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

  // No locations at all: the picker has nothing to offer, so the page says so
  // once, full width, and points at where locations are created.
  const renderNoLocations = () => (
    <Card className="py-3 cursor-default">
      <CardContent className="px-3">
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
      </CardContent>
    </Card>
  );

  /* Summary → section: scroll the content pane (not the window — see
   * shared/utils/scroll) to the owning section, then ring it. The ring waits
   * for the smooth scroll to land, otherwise it plays off screen. */
  const focusSection = useCallback((target: AssignmentsSummaryTarget) => {
    const el = {
      services: servicesSectionRef,
      bundles: bundlesSectionRef,
      teamMembers: teamMembersSectionRef,
    }[target].current;
    if (!el) return;

    attentionTimersRef.current.forEach(window.clearTimeout);
    attentionTimersRef.current = [];
    setAttentionSection(null);

    requestAnimationFrame(() => {
      scrollAppContentToElement(el, { block: "start", offset: 12 });
    });
    attentionTimersRef.current.push(
      window.setTimeout(() => setAttentionSection(target), 400),
      window.setTimeout(() => setAttentionSection(null), 2200),
    );
  }, []);

  useEffect(
    () => () => {
      attentionTimersRef.current.forEach(window.clearTimeout);
    },
    [],
  );

  const attentionClass = (target: AssignmentsSummaryTarget) =>
    cn(
      "rounded-2xl transition-shadow duration-300 ease-out",
      attentionSection === target &&
        "ring-2 ring-primary/45 ring-offset-4 ring-offset-background",
    );

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

  // The picker: one control, two hosts. The breadcrumb header only exists below
  // md, so projecting into it unconditionally is free on desktop and — unlike a
  // useIsMobile branch — costs no first-paint flicker on phones.
  const locationSelectorNode = !locationsLoaded ? (
    <Skeleton className="h-11 w-full rounded-full" />
  ) : (
    <LocationSelector
      locations={allLocations}
      selectedLocationId={selectedLocationId}
      onSelect={handleSelectLocation}
    />
  );

  if (locationsListError && allLocations.length === 0 && locationsLoaded) {
    return (
      <ErrorState
        variant="page"
        body={locationsListError}
        onRetry={() => dispatch(listLocationsAction.request())}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Mobile: sits in the app header, on the notification bell's row. */}
      <HeaderTitleSlot>{locationSelectorNode}</HeaderTitleSlot>

      {/* Desktop: same control at the top of the page, as on the dashboard. */}
      <div className="hidden md:block md:w-[280px]">{locationSelectorNode}</div>

      <div className="w-full min-w-0">
        {isBootstrapping ||
        ((isLoading || forceLoading) && saveOperation !== "teamMembers") ? (
          renderDetailsSkeleton()
        ) : !hasLocations ? (
          renderNoLocations()
        ) : loadError && selectedLocationId && !detailsMatchSelection ? (
          <Card className="py-3 cursor-default">
            <CardContent className="px-3">
              <ErrorState
                variant="pane"
                body={loadError}
                onRetry={() =>
                  dispatch(fetchLocationFullAssignmentAction.request({ locationId: selectedLocationId }))
                }
              />
            </CardContent>
          </Card>
        ) : !selectedLocation ? (
          renderDetailsSkeleton()
        ) : (
          <>
          {/* First thing on the page: what still blocks bookings here. */}
          <div className="mb-4">
            <AssignmentsSummary
              location={selectedLocation}
              onResolve={focusSection}
            />
          </div>

          <Card className="py-3 cursor-default">
            <CardContent className="px-3 space-y-8">
              {/* Services Section */}
              <div ref={servicesSectionRef} className={attentionClass("services")}>
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
              </div>

              <DashedDivider
                className="mb-1 md:mb-4"
                marginTop="mt-2"
                paddingTop="pt-2"
              />

              {/* Bundles Section */}
              <div ref={bundlesSectionRef} className={attentionClass("bundles")}>
              <LocationBundlesSection
                locationName={selectedLocation.name}
                bundles={selectedLocation.bundles || []}
                allBundles={selectedLocation.allBundles || []}
                onSaveBundles={handleSaveLocationBundles}
                currency={businessCurrency}
                locationId={selectedLocationId || undefined}
              />
              </div>

              <DashedDivider
                className="mb-1 md:mb-4"
                marginTop="mt-2"
                paddingTop="pt-2"
              />

              {/* Team Members Section */}
              <div
                ref={teamMembersSectionRef}
                className={attentionClass("teamMembers")}
              >
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
          </>
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
