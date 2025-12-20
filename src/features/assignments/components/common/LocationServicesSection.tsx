import { useState, useMemo, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Settings2, Info, ChevronDown, Briefcase, Plus } from "lucide-react";
import { Button } from "../../../../shared/components/ui/button";
import { Badge } from "../../../../shared/components/ui/badge";
import { ManageServicesSheet } from "../../../../shared/components/common/ManageServicesSheet/ManageServicesSheet";
import { LocationServiceRow } from "./LocationServiceRow";
import type { LocationService, LocationFullAssignment } from "../../types";

interface LocationServicesSectionProps {
  locationName: string;
  services: LocationService[];
  allServices: LocationFullAssignment["allServices"];
  onSaveServiceOverride: (
    serviceId: number,
    customPrice: number | null,
    customDuration: number | null
  ) => void;
  onSaveServices: (serviceIds: number[]) => void;
  currency?: string;
  locationId?: number;
  onSaveStart?: () => void;
}

const MAX_VISIBLE_SERVICES = 5;

export function LocationServicesSection({
  locationName,
  services,
  allServices,
  onSaveServiceOverride,
  onSaveServices,
  currency = "USD",
  locationId,
  onSaveStart,
}: LocationServicesSectionProps) {
  const { t } = useTranslation("assignments");
  const [isManageSheetOpen, setIsManageSheetOpen] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);
  const collapsibleRef = useRef<HTMLDivElement>(null);

  // Services from backend are already filtered to only assigned ones
  const assignedServices = services;

  // Get enabled service IDs for the ManageServicesSheet
  const enabledServiceIds = useMemo(
    () => assignedServices.map((s) => s.serviceId),
    [assignedServices]
  );

  // Transform services for ManageServicesSheet
  const servicesForSheet = useMemo(() => {
    return allServices.map((s) => ({
      id: s.serviceId,
      name: s.serviceName,
      price: s.displayPrice,
      duration: s.duration,
      category: s.category,
    }));
  }, [allServices]);

  // Handle saving services directly to backend
  const handleSaveServices = (selectedIds: number[]) => {
    onSaveServices(selectedIds);
  };

  // Stats
  const enabledCount = assignedServices.length;
  const withOverridesCount = assignedServices.filter(
    (s) => s.customPrice !== null || s.customDuration !== null
  ).length;

  // Collapsible logic - based on assigned services only
  const hasMoreServices = assignedServices.length > MAX_VISIBLE_SERVICES;
  const visibleServices = assignedServices.slice(0, MAX_VISIBLE_SERVICES);
  const hiddenServices = assignedServices.slice(MAX_VISIBLE_SERVICES);

  // Measure height for animation
  useEffect(() => {
    const el = collapsibleRef.current;
    if (!el || !hasMoreServices) return;
    const fullHeight = Array.from(el.children).reduce(
      (acc, child) => acc + (child as HTMLElement).offsetHeight,
      0
    );
    el.style.setProperty("--radix-collapsible-content-height", `${fullHeight}px`);
  }, [assignedServices, hasMoreServices]);

  return (
    <div className="space-y-4 mb-0 md:mb-4">
      {/* Header */}
      <div className="space-y-1.5 py-2">
        <h3 className="text-lg font-semibold text-foreground-1">
          {t("page.locationServices.title")}
        </h3>
        <div className="flex items-start gap-1.5 text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">
          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-foreground-3 dark:text-foreground-2" />
          <span>
            {t("page.locationServices.description.controlServices")}
          </span>
        </div>
      </div>

      {/* Dashboard summary and Manage Services button */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        {/* Stats - aligned to the left */}
        <div className="flex items-center gap-2 flex-wrap">
          {enabledCount > 0 && (
            <Badge
              variant="secondary"
              className="text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 bg-green-50 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800"
            >
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="font-semibold text-neutral-900 dark:text-foreground-1">{enabledCount}</span>
              <span className="text-neutral-900 dark:text-foreground-1">{t("page.locationServices.stats.active")}</span>
            </Badge>
          )}
          {withOverridesCount > 0 && (
            <Badge
              variant="secondary"
              className="text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 bg-purple-50 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-800"
            >
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="font-semibold text-neutral-900 dark:text-foreground-1">{withOverridesCount}</span>
              <span className="text-neutral-900 dark:text-foreground-1">{t("page.locationServices.stats.customized")}</span>
            </Badge>
          )}
        </div>

        {/* Button - aligned to the right */}
        <div className="flex-shrink-0 md:ml-auto">
          <Button
            variant="outline"
            rounded="full"
            onClick={() => setIsManageSheetOpen(true)}
            className="!px-6 w-full md:w-auto border-border-strong text-foreground-1 group"
          >
            <Plus className="h-3 w-3 text-primary transition-transform duration-400 ease-out group-hover:scale-140" />
            <span>{t("page.locationServices.buttons.manageServices")}</span>
          </Button>
        </div>
      </div>

      {/* ManageServicesSheet */}
      <ManageServicesSheet
        isOpen={isManageSheetOpen}
        onClose={() => setIsManageSheetOpen(false)}
        teamMemberName={locationName}
        allServices={servicesForSheet}
        initialSelectedIds={enabledServiceIds}
        onSave={handleSaveServices}
        title={t("page.locationServices.sheet.title", { locationName })}
        subtitle={t("page.locationServices.sheet.subtitle")}
        titleLocationName={locationName}
        expandAllCategories={true}
      />

      {/* Services list - only assigned services */}
      {assignedServices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-border rounded-lg bg-muted/30">
          <div className="flex flex-col items-center justify-center space-y-4 text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                {t("page.locationServices.emptyState.title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("page.locationServices.emptyState.description")}
              </p>
            </div>
            <Button
              variant="outline"
              rounded="full"
              onClick={() => setIsManageSheetOpen(true)}
              className="mt-2"
            >
              <Settings2 className="h-4 w-4 mr-2" />
              {t("page.locationServices.buttons.addServices")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleServices.map((service) => (
            <LocationServiceRow
              key={service.serviceId}
              service={service}
              onSaveOverride={onSaveServiceOverride}
              currency={currency}
              locationName={locationName}
              locationId={locationId}
              onSaveStart={onSaveStart}
            />
          ))}

          {hasMoreServices && (
            <>
              <div
                ref={collapsibleRef}
                data-slot="collapsible-content"
                data-state={showAllServices ? "open" : "closed"}
                className={`space-y-2 overflow-hidden ${
                  showAllServices ? "h-auto" : "h-0"
                }`}
              >
                {hiddenServices.map((service) => (
                  <LocationServiceRow
                    key={service.serviceId}
                    service={service}
                    onSaveOverride={onSaveServiceOverride}
                    currency={currency}
                    locationName={locationName}
                    locationId={locationId}
                    onSaveStart={onSaveStart}
                  />
                ))}
              </div>

              <div className="flex justify-center pt-2">
                <Button
                  type="button"
                  variant="outline"
                  rounded="full"
                  onClick={() => setShowAllServices(!showAllServices)}
                  className="group h-auto px-4 py-1.5 gap-1.5 border-border w-[60%] md:w-1/3 dark:bg-surface dark:border-border dark:hover:border-border-strong dark:group-hover:text-primary dark:text-foreground-1 dark:hover:bg-surface"
                >
                  <span>
                    {showAllServices
                      ? t("page.locationServices.buttons.showLess")
                      : t("page.locationServices.buttons.showMore", {
                          count: assignedServices.length - MAX_VISIBLE_SERVICES,
                        })}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 mt-0.5 text-foreground-3 dark:text-foreground-1 group-hover:text-foreground-1 transition-transform ${
                      showAllServices ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
