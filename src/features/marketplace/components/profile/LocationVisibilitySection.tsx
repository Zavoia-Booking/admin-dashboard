import React from "react";
import { ArrowUpRight, ChevronRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../../../../shared/components/ui/button";
import { Badge } from "../../../../shared/components/ui/badge";
import { Switch } from "../../../../shared/components/ui/switch";
import { cn } from "../../../../shared/lib/utils";
import type { LocationWithAssignments } from "../../types";
import { useTranslation, Trans } from "react-i18next";
import { updateLocationMarketplaceFlagsAction } from "../../actions";
import { selectUpdatingLocationFlags } from "../../selectors";

interface LocationVisibilitySectionProps {
  locations: LocationWithAssignments[];
}

export const LocationVisibilitySection: React.FC<LocationVisibilitySectionProps> = ({
  locations,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation("marketplace");
  const updatingIds = useSelector(selectUpdatingLocationFlags);

  const handleManageAssignments = (locationId: number) => {
    navigate(`/assignments?locationId=${locationId}`);
  };

  const handleTogglePublic = (locationId: number, isPublic: boolean) => {
    dispatch(updateLocationMarketplaceFlagsAction.request({ locationId, isPublic }));
  };

  const handleToggleBooking = (locationId: number, allowOnlineBooking: boolean) => {
    dispatch(
      updateLocationMarketplaceFlagsAction.request({ locationId, allowOnlineBooking }),
    );
  };

  const AssignmentsLink = ({ children }: { children?: React.ReactNode }) => (
    <span
      onClick={() => navigate("/assignments")}
      data-navigate-to="/assignments"
      className="inline-flex items-center gap-0.5 cursor-pointer font-semibold text-foreground-1 hover:text-primary dark:hover:text-primary"
    >
      {children}
      <ArrowUpRight className="h-4 w-4 text-primary" aria-hidden="true" />
    </span>
  );

  if (locations.length === 0) {
    return (
      <div className="p-8 text-center border-2 border-dashed border-border rounded-2xl bg-muted/5">
        <p className="text-sm text-muted-foreground font-medium">
          {t("locationVisibility.noLocations")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 px-1">
        <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
          <Trans
            t={t}
            i18nKey="locationVisibility.description"
            components={{ assignmentsLink: <AssignmentsLink /> }}
          />
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {locations.map((location) => {
          const serviceCount = location.services?.length || 0;
          const bundleCount = location.bundles?.length || 0;
          const teamMemberCount = location.teamMembers?.length || 0;
          const isUpdating = updatingIds.includes(location.id);

          return (
            <div
              key={location.id}
              data-location-id={location.id}
              className="group relative rounded-2xl p-4 border border-border bg-white dark:bg-surface hover:border-border-strong hover:shadow-md overflow-hidden"
            >
              {/* Top Section: Identity */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <h3 className="text-base font-medium mb-1 text-foreground-1 truncate tracking-tight capitalize">
                      {location.name}
                    </h3>
                    <p className="text-xs text-foreground-3 dark:text-foreground-2 truncate">
                      {location.address}
                    </p>
                  </div>

                  {/* Mobile: Both buttons in a row with active styling */}
                  <div className="flex md:hidden items-center gap-2">
                    <Button
                      variant="ghost"
                      rounded="full"
                      size="sm"
                      data-navigate-to={`/locations?locationId=${location.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/locations?locationId=${location.id}`);
                      }}
                      className={cn(
                        "shrink-0 !min-h-0 h-7 !px-3 border border-border flex items-center gap-1 w-fit",
                        "border-border-strong text-primary bg-info-100/20 dark:bg-muted-foreground/10 dark:text-primary",
                      )}
                    >
                      <span className="text-xs text-foreground-1">
                        {t("locationVisibility.editLocation")}
                      </span>
                      <ChevronRight className="h-3 w-3 pt-0.5 translate-x-0.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      rounded="full"
                      size="sm"
                      data-navigate-to={`/assignments?locationId=${location.id}`}
                      onClick={() => handleManageAssignments(location.id)}
                      className={cn(
                        "shrink-0 !min-h-0 h-7 !px-3 border border-border flex items-center gap-1 w-fit",
                        "border-border-strong text-primary bg-info-100/20 dark:bg-muted-foreground/10 dark:text-primary",
                      )}
                    >
                      <span className="text-xs text-foreground-1">
                        {t("locationVisibility.manageAssignments")}
                      </span>
                      <ChevronRight className="h-3 w-3 pt-0.5 translate-x-0.5" />
                    </Button>
                  </div>

                  {/* Desktop: Edit location button with hover styling */}
                  <Button
                    variant="ghost"
                    rounded="full"
                    size="sm"
                    data-navigate-to={`/locations?locationId=${location.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/locations?locationId=${location.id}`);
                    }}
                    className="hidden md:flex shrink-0 !min-h-0 h-7 !px-3 border border-border group-hover:border-border-strong text-foreground-3 dark:text-foreground-2 hover:text-primary dark:hover:text-primary dark:group-hover:text-primary group-hover:text-primary group-hover:bg-info-100/20 dark:hover:bg-muted-foreground/10 dark:group-hover:bg-muted-foreground/10 items-center gap-1 w-fit"
                  >
                    <span className="text-xs text-foreground-3 group-hover:text-foreground-1">
                      {t("locationVisibility.editLocation")}
                    </span>
                    <ChevronRight className="h-3 w-3 pt-0.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
                  </Button>
                </div>

                {/* Desktop: Manage assignments button (separate column) */}
                <div className="hidden md:flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    rounded="full"
                    size="sm"
                    data-navigate-to={`/assignments?locationId=${location.id}`}
                    onClick={() => handleManageAssignments(location.id)}
                    className="shrink-0 !min-h-0 h-7 !px-5 !py-4 border border-border group-hover:border-border-strong text-foreground-3 dark:text-foreground-2 hover:text-primary dark:hover:text-primary dark:group-hover:text-primary group-hover:text-primary group-hover:bg-info-100/20 dark:hover:bg-muted-foreground/10 dark:group-hover:bg-muted-foreground/10 flex items-center gap-1"
                  >
                    <span className="text-xs text-foreground-3 group-hover:text-foreground-1">
                      {t("locationVisibility.manageAssignments")}
                    </span>
                    <ChevronRight className="h-3 w-3 pt-0.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
                  </Button>
                </div>
              </div>

              {/* Toggles: Listing is Public + Online Appointments */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-border">
                <div className="flex items-start justify-between gap-4 rounded-xl p-3 bg-muted/20 dark:bg-muted/10 border border-border">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground-1">
                        {t("locationVisibility.isPublic")}
                      </span>
                      {isUpdating && (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-xs text-foreground-3 dark:text-foreground-2 mt-0.5">
                      {t("locationVisibility.isPublicDescription")}
                    </p>
                  </div>
                  <Switch
                    checked={location.isPublic}
                    onCheckedChange={(checked) => handleTogglePublic(location.id, checked)}
                    disabled={isUpdating}
                  />
                </div>

                <div className="flex items-start justify-between gap-4 rounded-xl p-3 bg-muted/20 dark:bg-muted/10 border border-border">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground-1">
                        {t("locationVisibility.allowOnlineBooking")}
                      </span>
                      {isUpdating && (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-xs text-foreground-3 dark:text-foreground-2 mt-0.5">
                      {t("locationVisibility.allowOnlineBookingDescription")}
                    </p>
                  </div>
                  <Switch
                    checked={location.allowOnlineBooking}
                    onCheckedChange={(checked) => handleToggleBooking(location.id, checked)}
                    disabled={isUpdating}
                  />
                </div>
              </div>

              {/* Bottom Section: Stats / Capabilities */}
              <div className="flex flex-wrap items-center gap-2 pt-4">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 border",
                    serviceCount > 0
                      ? "bg-green-50 border-green-200 hover:bg-green-100"
                      : "bg-muted/30 border-border text-foreground-3",
                  )}
                >
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      serviceCount > 0 ? "bg-green-500" : "bg-neutral-400",
                    )}
                  />
                  {serviceCount > 0 ? (
                    <>
                      <span className="font-semibold text-neutral-900">{serviceCount}</span>
                      <span className="text-neutral-900">
                        {t("locationVisibility.service", { count: serviceCount })}
                      </span>
                    </>
                  ) : (
                    <span>{t("locationVisibility.noServices")}</span>
                  )}
                </Badge>

                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 border",
                    bundleCount > 0
                      ? "bg-amber-50 border-amber-200 hover:bg-amber-100"
                      : "bg-muted/30 border-border text-foreground-3",
                  )}
                >
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      bundleCount > 0 ? "bg-amber-500" : "bg-neutral-400",
                    )}
                  />
                  {bundleCount > 0 ? (
                    <>
                      <span className="font-semibold text-neutral-900">{bundleCount}</span>
                      <span className="text-neutral-900">
                        {t("locationVisibility.bundle", { count: bundleCount })}
                      </span>
                    </>
                  ) : (
                    <span>{t("locationVisibility.noBundles")}</span>
                  )}
                </Badge>

                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 border transition-colors",
                    teamMemberCount > 0
                      ? "bg-purple-50 border-purple-200 hover:bg-purple-100"
                      : "bg-muted/30 border-border text-foreground-3",
                  )}
                >
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      teamMemberCount > 0 ? "bg-purple-500" : "bg-neutral-400",
                    )}
                  />
                  {teamMemberCount > 0 ? (
                    <>
                      <span className="font-semibold text-neutral-900">{teamMemberCount}</span>
                      <span className="text-neutral-900">
                        {t("locationVisibility.teamMember", { count: teamMemberCount })}
                      </span>
                    </>
                  ) : (
                    <span>{t("locationVisibility.noTeamMembers")}</span>
                  )}
                </Badge>

                {location.isRemote && (
                  <Badge
                    variant="secondary"
                    className="text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 bg-blue-50 border-blue-200 hover:bg-blue-100"
                  >
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="text-neutral-900">
                      {t("locationVisibility.remoteAvailable")}
                    </span>
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LocationVisibilitySection;
