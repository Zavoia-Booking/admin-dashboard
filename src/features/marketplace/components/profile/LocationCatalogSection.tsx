import React from "react";
import {
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../../shared/components/ui/button";
import { Badge } from "../../../../shared/components/ui/badge";
import { SectionDivider } from "../../../../shared/components/common/SectionDivider";
import { cn } from "../../../../shared/lib/utils";
import type { LocationWithAssignments } from "../../types";
import { useTranslation, Trans } from "react-i18next";

interface LocationCatalogSectionProps {
  locations: LocationWithAssignments[];
}

export const LocationCatalogSection: React.FC<LocationCatalogSectionProps> = ({
  locations,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation("marketplace");

  const handleManageAssignments = (locationId: number) => {
    navigate(`/assignments?locationId=${locationId}`);
  };

  const AssignmentsLink = ({ children }: { children?: React.ReactNode }) => (
    <span
      onClick={() => navigate("/assignments")}
      className="inline-flex items-center gap-0.5 cursor-pointer font-semibold text-foreground-1 dark:text-foreground-1 hover:text-primary dark:hover:text-primary"
    >
      {children}
      <ArrowUpRight className="h-4 w-4 text-primary" aria-hidden="true" />
    </span>
  );

  if (locations.length === 0) {
    return (
      <div className="space-y-6">
        <SectionDivider
          title={t("locationCatalog.title")}
          className="uppercase tracking-wider text-foreground-2"
        />
        <div className="p-8 text-center border-2 border-dashed border-border rounded-2xl bg-muted/5">
          <p className="text-sm text-muted-foreground font-medium">
            {t("locationCatalog.noLocations")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-0">
      <SectionDivider
        title={t("locationCatalog.title")}
        className="uppercase tracking-wider text-foreground-2"
      />

      <div className="space-y-1.5 px-1">
        <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
          <Trans
            t={t}
            i18nKey="locationCatalog.description"
            components={{
              assignmentsLink: <AssignmentsLink />,
            }}
          />
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {locations.map((location) => {
          const serviceCount = location.services?.length || 0;
          const teamMemberCount = location.teamMembers?.length || 0;

          return (
            <div
              key={location.id}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/locations?locationId=${location.id}`);
                      }}
                      className={cn(
                        "shrink-0 !min-h-0 h-7 !px-3 border border-border flex items-center gap-1 w-fit",
                        // Desktop hover styles visible by default on mobile
                        "border-border-strong text-primary bg-info-100/20 dark:bg-muted-foreground/10 dark:text-primary"
                      )}
                    >
                      <span className="text-xs text-foreground-1">
                        {t("locationCatalog.editLocation")}
                      </span>
                      <ChevronRight className="h-3 w-3 pt-0.5 translate-x-0.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      rounded="full"
                      size="sm"
                      onClick={() => handleManageAssignments(location.id)}
                      className={cn(
                        "shrink-0 !min-h-0 h-7 !px-3 border border-border flex items-center gap-1 w-fit",
                        // Desktop hover styles visible by default on mobile
                        "border-border-strong text-primary bg-info-100/20 dark:bg-muted-foreground/10 dark:text-primary"
                      )}
                    >
                      <span className="text-xs text-foreground-1">
                        {t("locationCatalog.manageAssignments")}
                      </span>
                      <ChevronRight className="h-3 w-3 pt-0.5 translate-x-0.5" />
                    </Button>
                  </div>

                  {/* Desktop: Edit location button with hover styling */}
                  <Button
                    variant="ghost"
                    rounded="full"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/locations?locationId=${location.id}`);
                    }}
                    className="hidden md:flex shrink-0 !min-h-0 h-7 !px-3 border border-border group-hover:border-border-strong text-foreground-3 dark:text-foreground-2 hover:text-primary dark:hover:text-primary dark:group-hover:text-primary group-hover:text-primary group-hover:bg-info-100/20 dark:hover:bg-muted-foreground/10 dark:group-hover:bg-muted-foreground/10 items-center gap-1 w-fit"
                  >
                    <span className="text-xs text-foreground-3 group-hover:text-foreground-1">
                      {t("locationCatalog.editLocation")}
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
                    onClick={() => handleManageAssignments(location.id)}
                    className="shrink-0 !min-h-0 h-7 !px-5 !py-4 border border-border group-hover:border-border-strong text-foreground-3 dark:text-foreground-2 hover:text-primary dark:hover:text-primary dark:group-hover:text-primary group-hover:text-primary group-hover:bg-info-100/20 dark:hover:bg-muted-foreground/10 dark:group-hover:bg-muted-foreground/10 flex items-center gap-1"
                  >
                    <span className="text-xs text-foreground-3 group-hover:text-foreground-1">
                      {t("locationCatalog.manageAssignments")}
                    </span>
                    <ChevronRight className="h-3 w-3 pt-0.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
                  </Button>
                </div>
              </div>

              {/* Bottom Section: Stats / Capabilities */}
              <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 border",
                    serviceCount > 0
                      ? "bg-green-50 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800"
                      : "bg-muted/30 dark:bg-muted/20 border-border text-foreground-3"
                  )}
                >
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      serviceCount > 0 ? "bg-green-500" : "bg-neutral-400"
                    )}
                  />
                  {serviceCount > 0 ? (
                    <>
                      <span className="font-semibold text-neutral-900 dark:text-foreground-1">
                        {serviceCount}
                      </span>
                      <span className="text-neutral-900 dark:text-foreground-1">
                        {t("locationCatalog.service", { count: serviceCount })}
                      </span>
                    </>
                  ) : (
                    <span>{t("locationCatalog.noServices")}</span>
                  )}
                </Badge>

                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 border transition-colors",
                    teamMemberCount > 0
                      ? "bg-purple-50 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-800"
                      : "bg-muted/30 dark:bg-muted/20 border-border text-foreground-3"
                  )}
                >
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      teamMemberCount > 0 ? "bg-purple-500" : "bg-neutral-400"
                    )}
                  />
                  {teamMemberCount > 0 ? (
                    <>
                      <span className="font-semibold text-neutral-900 dark:text-foreground-1">
                        {teamMemberCount}
                      </span>
                      <span className="text-neutral-900 dark:text-foreground-1">
                        {t("locationCatalog.teamMember", { count: teamMemberCount })}
                      </span>
                    </>
                  ) : (
                    <span>{t("locationCatalog.noTeamMembers")}</span>
                  )}
                </Badge>

                {location.isRemote && (
                  <Badge
                    variant="secondary"
                    className="text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 bg-blue-50 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800"
                  >
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="text-neutral-900 dark:text-foreground-1">
                      {t("locationCatalog.remoteAvailable")}
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

export default LocationCatalogSection;
