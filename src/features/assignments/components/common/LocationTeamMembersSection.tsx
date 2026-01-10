import { useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Users, Info, Settings2, ChevronRight } from "lucide-react";
import { Button } from "../../../../shared/components/ui/button";
import { Badge } from "../../../../shared/components/ui/badge";
import { Switch } from "../../../../shared/components/ui/switch";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "../../../../shared/components/ui/avatar";
import { getAvatarBgColor } from "../../../setupWizard/components/StepTeam";
import { useIsMobile } from "../../../../shared/hooks/use-mobile";
import { cn } from "../../../../shared/lib/utils";
import type { LocationTeamMember, LocationFullAssignment } from "../../types";
import DashedDivider from "../../../../shared/components/common/DashedDivider";

interface LocationTeamMembersSectionProps {
  locationName: string;
  teamMembers: LocationTeamMember[];
  allTeamMembers: LocationFullAssignment["allTeamMembers"];
  onManageMember: (userId: number) => void;
  onSaveTeamMemberToggle: (userId: number, enabled: boolean) => void;
  enabledMemberIds: number[];
  savingMemberIds?: Set<number>;
  isSaving?: boolean;
}

export function LocationTeamMembersSection({
  teamMembers,
  allTeamMembers,
  onManageMember,
  onSaveTeamMemberToggle,
  enabledMemberIds,
  savingMemberIds = new Set(),
  isSaving = false,
}: LocationTeamMembersSectionProps) {
  const { t } = useTranslation("assignments");
  const isMobile = useIsMobile();

  // Build combined list of all team members with their assignment status
  // Enabled members come from teamMembers (with full stats), others from allTeamMembers
  const allMembersWithStatus = useMemo(() => {
    const assignedMembersMap = new Map(teamMembers.map((m) => [m.userId, m]));

    return allTeamMembers.map((member) => {
      const assignedMember = assignedMembersMap.get(member.userId);
      if (assignedMember) {
        // Member is assigned - use full data
        return assignedMember;
      }
      // Member is not assigned - create placeholder with zero stats
      return {
        userId: member.userId,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        profileImage: member.profileImage,
        role: member.role,
        servicesEnabled: 0,
        overridesCount: 0,
      } as LocationTeamMember;
    });
  }, [allTeamMembers, teamMembers]);

  // Stats
  const assignedCount = enabledMemberIds.length;
  const withCustomRatesCount = useMemo(
    () => teamMembers.filter((m) => m.overridesCount > 0).length,
    [teamMembers]
  );

  // Desktop row for team member management
  const renderDesktopRow = useCallback(
    (member: LocationTeamMember) => {
      const initials =
        `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();
      const isEnabled = enabledMemberIds.includes(member.userId);
      const isAnySaving = savingMemberIds.size > 0 || isSaving;

      return (
        <div
          key={member.userId}
          className={cn(
            "group flex items-center gap-3 px-3 py-3 pt-0 rounded-lg border",
            isEnabled
              ? "border-border bg-white dark:bg-surface hover:border-border-strong hover:bg-info-100 dark:hover:bg-surface-hover cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/60 focus-visible:ring-offset-0"
              : "border-border bg-surface dark:bg-surface hover:border-border-strong opacity-80",
            isAnySaving && "opacity-50 pointer-events-none cursor-not-allowed"
          )}
          onClick={() => {
            if (isEnabled && !isAnySaving) {
              onManageMember(member.userId);
            }
          }}
          onKeyDown={(e) => {
            if (
              isEnabled &&
              !isAnySaving &&
              (e.key === "Enter" || e.key === " ")
            ) {
              e.preventDefault();
              onManageMember(member.userId);
            }
          }}
          tabIndex={isEnabled && !isAnySaving ? 0 : undefined}
          role={isEnabled && !isAnySaving ? "button" : undefined}
          aria-disabled={isAnySaving}
        >
          <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={isEnabled}
              disabled={isAnySaving}
              className={cn(
                "cursor-pointer",
                isAnySaving && "cursor-not-allowed"
              )}
              onCheckedChange={(checked) => {
                if (isAnySaving) {
                  return;
                }
                onSaveTeamMemberToggle(member.userId, checked);
              }}
              aria-label={`${isEnabled ? "Remove" : "Add"} ${
                member.firstName
              } from location`}
              aria-disabled={isAnySaving}
            />
          </div>

          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage
              src={member.profileImage || undefined}
              alt={`${member.firstName} ${member.lastName}`}
            />
            <AvatarFallback
              className="text-sm font-medium"
              style={{ backgroundColor: getAvatarBgColor(member.email) }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
            <div className="flex flex-col min-w-0 flex-1 pt-4">
              <div className="font-medium text-sm text-foreground-1 truncate">
                {member.firstName} {member.lastName}
              </div>
              <div className="text-xs mt-0.5 text-foreground-3 dark:text-foreground-2 truncate">
                {member.email}
              </div>
              {isEnabled && (
                <div className="text-xs mt-2 font-semibold text-foreground-3 dark:text-foreground-2 min-h-[1rem]">
                  {isAnySaving ? (
                    <span className="invisible">
                      {t("page.locationTeamMembers.noServicesAssigned")}
                    </span>
                  ) : member.servicesEnabled > 0 ? (
                    t("page.locationTeamMembers.servicesCount", {
                      count: member.servicesEnabled,
                    })
                  ) : (
                    t("page.locationTeamMembers.noServicesAssigned")
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col items-center justify-center gap-6 shrink-0 group">
              {isEnabled && <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onManageMember(member.userId);
                }}
                className={cn(
                  "h-auto px-3 py-1.5 pt-4 text-xs !min-h-0 h-8 text-foreground-3 dark:text-foreground-2 group-hover:text-foreground-1 hover:bg-info-100 dark:hover:bg-surface-hover",
                  (!isEnabled || isAnySaving) && "opacity-50"
                )}
                disabled={!isEnabled || isAnySaving}
              >
                {t("page.locationTeamMembers.buttons.manageServices")}
                <Settings2 className="h-3 w-3 text-foreground-3 dark:text-foreground-2 group-hover:text-primary" />
              </Button>}
              {isEnabled && member.overridesCount > 0 && (
                <Badge
                  variant="secondary"
                  className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1.5 bg-purple-50 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-800 shrink-0"
                >
                  <div className="h-2 w-2 rounded-full bg-purple-500" />
                  <span className="text-neutral-900 dark:text-foreground-1">
                    {t("page.locationTeamMembers.badge.custom")}
                  </span>
                </Badge>
              )}
            </div>
          </div>
        </div>
      );
    },
    [
      enabledMemberIds,
      savingMemberIds,
      onSaveTeamMemberToggle,
      onManageMember,
      t,
    ]
  );

  // Mobile row for team member management
  const renderMobileRow = useCallback(
    (member: LocationTeamMember) => {
      const initials =
        `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();
      const isEnabled = enabledMemberIds.includes(member.userId);
      const isAnySaving = savingMemberIds.size > 0 || isSaving;

      return (
        <div
          key={member.userId}
          className={cn(
            "group flex flex-col gap-3 px-3 py-4 rounded-lg border",
            isEnabled
              ? "border-border bg-white dark:bg-surface hover:border-border-strong hover:bg-info-100 dark:hover:bg-surface-hover cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/60 focus-visible:ring-offset-0"
              : "border-border bg-surface dark:bg-surface hover:border-border-strong opacity-80",
            isAnySaving && "opacity-50 pointer-events-none cursor-not-allowed"
          )}
          onClick={() => {
            if (isEnabled && !isAnySaving) {
              onManageMember(member.userId);
            }
          }}
          onKeyDown={(e) => {
            if (
              isEnabled &&
              !isAnySaving &&
              (e.key === "Enter" || e.key === " ")
            ) {
              e.preventDefault();
              onManageMember(member.userId);
            }
          }}
          tabIndex={isEnabled && !isAnySaving ? 0 : undefined}
          role={isEnabled && !isAnySaving ? "button" : undefined}
          aria-disabled={isAnySaving}
        >
          {/* Top row: Switch, Avatar, Name/Email */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <Switch
                checked={isEnabled}
                disabled={isAnySaving}
                className={cn(
                  "cursor-pointer",
                  isAnySaving && "cursor-not-allowed"
                )}
                onCheckedChange={(checked) => {
                  if (isAnySaving) {
                    return;
                  }
                  onSaveTeamMemberToggle(member.userId, checked);
                }}
                aria-label={`${isEnabled ? "Remove" : "Add"} ${
                  member.firstName
                } from location`}
                aria-disabled={isAnySaving}
              />
            </div>

            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage
                src={member.profileImage || undefined}
                alt={`${member.firstName} ${member.lastName}`}
              />
              <AvatarFallback
                className="text-sm font-medium"
                style={{ backgroundColor: getAvatarBgColor(member.email) }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col min-w-0 flex-1">
              <div className="font-medium text-sm text-foreground-1 truncate">
                {member.firstName} {member.lastName}
              </div>
              <div className="text-xs mt-0.5 text-foreground-3 dark:text-foreground-2 truncate">
                {member.email}
              </div>
            </div>
          </div>

          {/* Actions: Button and Badge */}
          <div className="flex items-center justify-between gap-3">
            {isEnabled && <Button
              variant="ghost"
              rounded="full"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onManageMember(member.userId);
              }}
                className={cn(
                  "h-fit !px-4 py-1.5 text-xs !min-h-0 text-foreground-1 border border-border-strong flex-1",
                  (!isEnabled || isAnySaving) && "opacity-50"
                )}
                disabled={!isEnabled || isAnySaving}
            >
              {t("page.locationTeamMembers.buttons.manageServices")}
              <ChevronRight className="h-3 w-3 text-primary mt-0.5" />
            </Button>}
          </div>
          {/* Services count */}
          {isEnabled && (
            <div>
              <DashedDivider className="mb-4" marginTop="mt-0" paddingTop="pt-0" />
            <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-foreground-3 dark:text-foreground-2">
              {isAnySaving ? (
                <span className="invisible">
                  {t("page.locationTeamMembers.noServicesAssigned")}
                </span>
              ) : member.servicesEnabled > 0 ? (
                t("page.locationTeamMembers.servicesCount", {
                  count: member.servicesEnabled,
                })
              ) : (
                t("page.locationTeamMembers.noServicesAssigned")
              )}
            </div>
            {isEnabled && member.overridesCount > 0 && (
              <Badge
                variant="secondary"
                className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1.5 bg-purple-50 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-800 shrink-0"
              >
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <span className="text-neutral-900 dark:text-foreground-1">
                  {t("page.locationTeamMembers.badge.custom")}
                </span>
              </Badge>
            )}
            </div>
            </div>
          )}
        </div>
      );
    },
    [
      enabledMemberIds,
      savingMemberIds,
      onSaveTeamMemberToggle,
      onManageMember,
      t,
    ]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-1.5 py-2">
        <h3 className="text-lg font-semibold text-foreground-1">
          {t("page.locationTeamMembers.title")}
        </h3>
        <div className="flex items-start gap-1.5 text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">
          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-foreground-3 dark:text-foreground-2" />
          <span>{t("page.locationTeamMembers.description.helperText")}</span>
        </div>
      </div>

      {/* Dashboard summary */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        {assignedCount > 0 && (
          <Badge
            variant="secondary"
            className="text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 bg-green-50 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800"
          >
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="font-semibold text-neutral-900 dark:text-foreground-1">
              {assignedCount}
            </span>
            <span className="text-neutral-900 dark:text-foreground-1">
              {t("page.locationTeamMembers.stats.assigned")}
            </span>
          </Badge>
        )}
        {withCustomRatesCount > 0 && (
          <Badge
            variant="secondary"
            className="text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 bg-purple-50 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-800"
          >
            <div className="h-2 w-2 rounded-full bg-purple-500" />
            <span className="font-semibold text-neutral-900 dark:text-foreground-1">
              {withCustomRatesCount}
            </span>
            <span className="text-neutral-900 dark:text-foreground-1">
              {t("page.locationTeamMembers.stats.customized")}
            </span>
          </Badge>
        )}
      </div>

      {/* Team members list */}
      {allTeamMembers.length === 0 ? (
        // No team members in the business at all
        <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-border rounded-lg bg-muted/30">
          <div className="flex flex-col items-center justify-center space-y-4 text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                {t(
                  "page.locationTeamMembers.emptyState.noTeamMembersInBusiness"
                )}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t(
                  "page.locationTeamMembers.emptyState.noTeamMembersInBusinessDescription"
                )}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {allMembersWithStatus.map((member) =>
            isMobile ? renderMobileRow(member) : renderDesktopRow(member)
          )}
        </div>
      )}
    </div>
  );
}
