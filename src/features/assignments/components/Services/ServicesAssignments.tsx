import { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import {
  AssignmentDetailsPanel,
  type AssignmentSection,
} from "../common/AssignmentDetailsPanel";
import { Users, MapPin, Info } from "lucide-react";
import { Button } from "../../../../shared/components/ui/button";
import { DashedDivider } from "../../../../shared/components/common/DashedDivider";
import { ManageServicesSheet } from "../../../../shared/components/common/ManageServicesSheet/ManageServicesSheet";
import {
  selectServiceAction,
  fetchServiceAssignmentByIdAction,
  updateServiceAssignmentsAction,
} from "../../actions";
import {
  getIsLoadingSelector,
  getIsSavingSelector,
  getSelectedServiceSelector,
} from "../../selectors";
import { getServicesAction } from "../../../services/actions";
import { getServicesListSelector } from "../../../services/selectors";
import type { Service } from "../../../../shared/types/service";

export function ServicesAssignments() {
  const { t } = useTranslation("assignments");
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  // State selectors
  const isLoading = useSelector(getIsLoadingSelector);
  const isSaving = useSelector(getIsSavingSelector);
  const selectedService = useSelector(getSelectedServiceSelector);
  const allServices = useSelector(getServicesListSelector);

  // Local state for assignments
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([]);

  // Track initial state to detect changes
  const [initialUserIds, setInitialUserIds] = useState<number[]>([]);
  const [initialLocationIds, setInitialLocationIds] = useState<number[]>([]);

  // Track if we've already auto-selected from URL
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  // State for service selection sheet
  const [isSelectServiceSheetOpen, setIsSelectServiceSheetOpen] =
    useState(false);

  useEffect(() => {
    dispatch(getServicesAction.request());
  }, [dispatch]);

  // Auto-select service from URL parameter
  useEffect(() => {
    const serviceIdFromUrl = searchParams.get("serviceId");
    if (serviceIdFromUrl && !hasAutoSelected && allServices.length > 0) {
      const serviceId = parseInt(serviceIdFromUrl, 10);
      const serviceExists = allServices.some(
        (s: Service) => s.id === serviceId
      );
      if (serviceExists && !isNaN(serviceId)) {
        dispatch(selectServiceAction(serviceId));
        dispatch(fetchServiceAssignmentByIdAction.request(serviceId));
        setHasAutoSelected(true);
      }
    }
  }, [searchParams, allServices, hasAutoSelected, dispatch]);

  // Sync local state when selected service changes
  useEffect(() => {
    if (selectedService) {
      const userIds =
        selectedService.assignedTeamMembers?.map((tm: any) => tm.userId) || [];
      const locationIds =
        selectedService.assignedLocations?.map((l: any) => l.locationId) || [];

      setSelectedUserIds(userIds);
      setSelectedLocationIds(locationIds);

      // Store initial state for change detection
      setInitialUserIds(userIds);
      setInitialLocationIds(locationIds);
    } else {
      setSelectedUserIds([]);
      setSelectedLocationIds([]);
      setInitialUserIds([]);
      setInitialLocationIds([]);
    }
  }, [selectedService]);

  // Detect if there are changes
  const hasChanges = useMemo(() => {
    const userIdsChanged =
      selectedUserIds.length !== initialUserIds.length ||
      selectedUserIds.some((id) => !initialUserIds.includes(id)) ||
      initialUserIds.some((id) => !selectedUserIds.includes(id));

    const locationIdsChanged =
      selectedLocationIds.length !== initialLocationIds.length ||
      selectedLocationIds.some((id) => !initialLocationIds.includes(id)) ||
      initialLocationIds.some((id) => !selectedLocationIds.includes(id));

    return userIdsChanged || locationIdsChanged;
  }, [
    selectedUserIds,
    selectedLocationIds,
    initialUserIds,
    initialLocationIds,
  ]);

  // Handlers
  const handleSelectService = (serviceId: number) => {
    dispatch(selectServiceAction(serviceId));
    dispatch(fetchServiceAssignmentByIdAction.request(serviceId));
  };

  const handleSave = () => {
    if (!selectedService) return;

    dispatch(
      updateServiceAssignmentsAction.request({
        serviceId: selectedService.id,
        teamMemberIds: selectedUserIds,
        locationIds: selectedLocationIds,
      })
    );
  };

  // Handlers for toggling selections
  const toggleUserSelection = useCallback((userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }, []);

  const toggleLocationSelection = useCallback((locationId: number) => {
    setSelectedLocationIds((prev) =>
      prev.includes(locationId)
        ? prev.filter((id) => id !== locationId)
        : [...prev, locationId]
    );
  }, []);

  // Transform services for ManageServicesSheet (needs to match the Service type from ManageServicesSheet)
  const servicesForSheet = useMemo(() => {
    return allServices.map((svc: Service) => ({
      id: svc.id,
      name: svc.name,
      price: svc.price,
      duration: svc.duration,
      createdAt: svc.createdAt,
      updatedAt: svc.updatedAt,
      category: svc.category,
    }));
  }, [allServices]);

  // Transform data for details panel
  const detailsSections: AssignmentSection[] = useMemo(() => {
    if (!selectedService) return [];

    // Use allTeamMembers and allLocations from the selected service API response
    const allTeamMembersList = (selectedService.allTeamMembers || []).map(
      (tm: any) => ({
        id: tm.userId,
        name: `${tm.firstName} ${tm.lastName}`,
        subtitle: tm.email,
      })
    );

    // Get all locations available
    const allLocationsList = (selectedService.allLocations || []).map(
      (l: any) => ({
        id: l.locationId,
        name: l.locationName,
        address: l.address,
      })
    );

    // Assigned team members
    const assignedTeamMembers = selectedUserIds
      .map((id) => {
        const existing = (selectedService.assignedTeamMembers || []).find(
          (tm: any) => tm.userId === id
        );
        if (existing) {
          return {
            id: existing.userId,
            name: `${existing.firstName} ${existing.lastName}`,
            subtitle: existing.email,
          };
        }
        const teamMember = allTeamMembersList.find((tm: any) => tm.id === id);
        return teamMember
          ? {
              id: teamMember.id,
              name: teamMember.name,
              subtitle: teamMember.subtitle,
            }
          : null;
      })
      .filter(Boolean) as Array<{
      id: number;
      name: string;
      subtitle?: string;
    }>;

    // Assigned locations
    const assignedLocations = selectedLocationIds
      .map((id) => {
        const existing = (selectedService.assignedLocations || []).find(
          (l: any) => l.locationId === id
        );
        if (existing) {
          return {
            id: existing.locationId,
            name: existing.locationName,
            subtitle: existing.address,
          };
        }
        const location = allLocationsList.find((l: any) => l.id === id);
        return location
          ? { id: location.id, name: location.name, subtitle: location.address }
          : null;
      })
      .filter(Boolean) as Array<{
      id: number;
      name: string;
      subtitle?: string;
    }>;

    const serviceName = selectedService.name || "";
    const teamMembersCount = selectedUserIds.length;
    const locationsCount = selectedLocationIds.length;

    // Team members section
    const teamMembersTitle = t("page.servicesAssignments.sections.teamMembersTitle");
    const teamMembersSubHelper = teamMembersCount > 0
      ? t(
          teamMembersCount === 1
            ? "page.servicesAssignments.sections.teamMembersSubHelperOne"
            : "page.servicesAssignments.sections.teamMembersSubHelperOther",
          { count: teamMembersCount }
        )
      : null;
    const teamMembersDescription = teamMembersCount === 0
      ? t("page.servicesAssignments.sections.teamMembersEmptyHelper", { serviceName })
      : null;

    // Locations section
    const locationsTitle = t("page.servicesAssignments.sections.locationsTitle");
    const locationsSubHelper = locationsCount > 0
      ? t(
          locationsCount === 1
            ? "page.servicesAssignments.sections.locationsSubHelperOne"
            : "page.servicesAssignments.sections.locationsSubHelperOther",
          { count: locationsCount }
        )
      : null;
    const locationsDescription = locationsCount === 0
      ? t("page.servicesAssignments.sections.locationsEmptyHelper", { serviceName })
      : null;

    return [
      {
        title: teamMembersTitle,
        description: teamMembersDescription,
        summaryLine: teamMembersSubHelper,
        icon: Users,
        assignedItems: assignedTeamMembers,
        availableItems: allTeamMembersList,
        selectedIds: selectedUserIds,
        onToggleSelection: toggleUserSelection,
        serviceName: serviceName,
      },
      {
        title: locationsTitle,
        description: locationsDescription,
        summaryLine: locationsSubHelper,
        icon: MapPin,
        assignedItems: assignedLocations,
        availableItems: allLocationsList,
        selectedIds: selectedLocationIds,
        onToggleSelection: toggleLocationSelection,
        serviceName: serviceName,
      },
    ];
  }, [
    selectedService,
    selectedUserIds,
    selectedLocationIds,
    toggleUserSelection,
    toggleLocationSelection,
    t,
  ]);

  const topContent = (
    <div className="space-y-4 ">
      <div className="flex flex-col md:flex-row gap-6 items-center px-3 pt-2">
        {/* Title */}
        <div className="space-y-1.5 flex-2">
          <h2 className="text-lg font-semibold text-foreground-1">
            {t("page.servicesAssignments.header.title")}
          </h2>
          <div className="flex items-start gap-1.5 text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">
            <Info className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
            <span>
              {selectedService ? (
                <>
                  {t(
                    "page.servicesAssignments.header.description.controlService"
                  )}{" "}
                  <span className="font-semibold text-foreground-1">
                    {selectedService.name}
                  </span>.
                </>
              ) : (
                t(
                  "page.servicesAssignments.header.description.selectServiceToManage"
                )
              )}
            </span>
          </div>
        </div>

      <div className="flex-1 flex justify-start md:justify-end w-full">
         {/* Service selection button */}
         <Button
          variant="outline"
          rounded="full"
          onClick={() => setIsSelectServiceSheetOpen(true)}
          className="w-44 border-border-strong text-foreground-1 justify-between"
        >
          <div className="flex items-center gap-2 pl-3 min-w-0 flex-1">
            <span className="truncate">
               {t("page.servicesAssignments.selectService.button")}
            </span>
          </div>
          <div className="mr-1 flex-shrink-0 relative">
            <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
            <div className="absolute inset-0 h-3 w-3 rounded-full bg-primary animate-ping opacity-75 duration-2000" />
          </div>
        </Button>
      </div>
      </div>

      {/* Divider */}
      <DashedDivider marginTop="mt-0" paddingTop="pt-4" />
    </div>
  );

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Service selection sheet */}
      <ManageServicesSheet
        isOpen={isSelectServiceSheetOpen}
        onClose={() => setIsSelectServiceSheetOpen(false)}
        allServices={servicesForSheet}
        initialSelectedIds={selectedService?.id ? [selectedService.id] : []}
        mode="single"
        onSelect={handleSelectService}
        title={t("page.servicesAssignments.selectService.title")}
      />

      {/* Details panel: takes full width */}
      <div className="w-full">
        <AssignmentDetailsPanel
          sections={detailsSections}
          onSave={handleSave}
          isSaving={isSaving}
          isLoading={isLoading}
          hasChanges={hasChanges}
          saveLabel={t("page.servicesAssignments.buttons.save")}
          emptyStateMessage={
            allServices.length === 0
              ? t("page.servicesAssignments.emptyState.noServicesYetDescription")
              : t("page.servicesAssignments.emptyState.selectServiceDescription")
          }
          emptyStateTitle={
            allServices.length === 0
              ? t("page.servicesAssignments.emptyState.noServicesYet")
              : t("page.servicesAssignments.emptyState.selectServiceTitle")
          }
          topContent={topContent}
        />
      </div>
    </div>
  );
}
