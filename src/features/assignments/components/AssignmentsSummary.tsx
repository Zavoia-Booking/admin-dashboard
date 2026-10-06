import { useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  SetupSummaryPanel,
  type SetupSummaryItem,
} from "../../../shared/components/common/SetupSummaryPanel";
import type { LocationType } from "../../../shared/types/location";
import type { LocationFullAssignment } from "../types";
import type { LocationSettingsAttentionTarget } from "../../marketplace/utils/locationSettingsAttention";

/** Which section a summary row sends the reader to. */
export type AssignmentsSummaryTarget = "services" | "bundles" | "teamMembers";

interface AssignmentsSummaryProps {
  location: LocationFullAssignment;
  /** Scrolls to the owning section and pulses it. */
  onResolve: (target: AssignmentsSummaryTarget) => void;
  marketplaceLocation?: Pick<
    LocationType,
    "id" | "name" | "isPublic" | "allowOnlineBooking"
  > | null;
  onManageMarketplace?: (target: LocationSettingsAttentionTarget) => void;
}

interface SummaryItem {
  key: string;
  ok: boolean;
  label: string;
  target: AssignmentsSummaryTarget;
}

interface SummaryHint {
  key: string;
  label: string;
  target: AssignmentsSummaryTarget;
}

/**
 * Summarizes the selected location's setup using the loaded payload. Each
 * issue type gets one counted row and a scroll action to its owning section.
 */
export function AssignmentsSummary({
  location,
  onResolve,
  marketplaceLocation,
  onManageMarketplace,
}: AssignmentsSummaryProps) {
  const { t } = useTranslation("assignments");
  const { t: tMarketplace } = useTranslation("marketplace");

  const items = useMemo<SummaryItem[]>(() => {
    const services = location.services ?? [];
    const bundles = location.bundles ?? [];
    const teamMembers = location.teamMembers ?? [];

    const servicesWithoutStaff = services.filter((s) => s.staffCount === 0);
    const staffWithoutServices = teamMembers.filter(
      (m) => m.servicesEnabled === 0,
    );
    // Check that every service included in a selected bundle is offered here.
    const enabledServiceIds = new Set(services.map((s) => s.serviceId));
    const bundlesWithMissingServices = bundles.filter((b) =>
      (b.serviceIds ?? []).some((id) => !enabledServiceIds.has(id)),
    );

    const list: SummaryItem[] = [
      {
        key: "servicesEnabled",
        ok: services.length > 0,
        target: "services",
        label: t(
          services.length > 0
            ? "page.summary.items.servicesEnabled.done"
            : "page.summary.items.servicesEnabled.pending",
        ),
      },
      {
        key: "teamAssigned",
        ok: teamMembers.length > 0,
        target: "teamMembers",
        label: t(
          teamMembers.length > 0
            ? "page.summary.items.teamAssigned.done"
            : "page.summary.items.teamAssigned.pending",
        ),
      },
    ];

    // Set up both sides before reporting missing service-to-member assignments.
    if (services.length > 0 && teamMembers.length > 0) {
      const noServiceAssignments =
        servicesWithoutStaff.length === services.length &&
        staffWithoutServices.length === teamMembers.length;

      if (noServiceAssignments) {
        list.push({
          key: "serviceAssignmentsMissing",
          ok: false,
          target: "teamMembers",
          label: t("page.summary.items.serviceAssignmentsMissing"),
        });
      } else {
        list.push({
          key: "servicesWithoutStaff",
          ok: servicesWithoutStaff.length === 0,
          target: "teamMembers",
          label: t(
            servicesWithoutStaff.length === 0
              ? "page.summary.items.servicesWithoutStaff.done"
              : "page.summary.items.servicesWithoutStaff.pending",
            { count: servicesWithoutStaff.length },
          ),
        });
        list.push({
          key: "staffWithoutServices",
          ok: staffWithoutServices.length === 0,
          target: "teamMembers",
          label: t(
            staffWithoutServices.length === 0
              ? "page.summary.items.staffWithoutServices.done"
              : "page.summary.items.staffWithoutServices.pending",
            { count: staffWithoutServices.length },
          ),
        });
      }
    }

    if (bundles.length > 0 && services.length > 0) {
      list.push({
        key: "bundlesUnbookable",
        ok: bundlesWithMissingServices.length === 0,
        target: "bundles",
        label: t(
          bundlesWithMissingServices.length === 0
            ? "page.summary.items.bundlesUnbookable.done"
            : "page.summary.items.bundlesUnbookable.pending",
          { count: bundlesWithMissingServices.length },
        ),
      });
    }

    return list;
  }, [location, t]);

  /* Not blockers — "you have more to work with than this location uses". A
   * business that deliberately splits staff across locations is not broken, so
   * these never turn the card amber or count toward the progress. They are
   * rendered outside the disclosure precisely because the card collapses once
   * the blockers are cleared, and this is the state where the reader most needs
   * to be told what is still sitting on the bench. */
  const hints = useMemo<SummaryHint[]>(() => {
    const assignedMemberIds = new Set(
      (location.teamMembers ?? []).map((m) => m.userId),
    );
    const membersElsewhere = (location.allTeamMembers ?? []).filter(
      (m) => !assignedMemberIds.has(m.userId),
    ).length;

    const enabledServiceIds = new Set(
      (location.services ?? []).map((s) => s.serviceId),
    );
    const servicesElsewhere = (location.allServices ?? []).filter(
      (s) => !enabledServiceIds.has(s.serviceId),
    ).length;

    const enabledBundleIds = new Set(
      (location.bundles ?? []).map((b) => b.bundleId),
    );
    const bundlesElsewhere = (location.allBundles ?? []).filter(
      (b) => !enabledBundleIds.has(b.bundleId),
    ).length;

    const list: SummaryHint[] = [];
    if (membersElsewhere > 0 && assignedMemberIds.size > 0) {
      list.push({
        key: "membersNotHere",
        target: "teamMembers",
        label: t("page.summary.hints.membersNotHere", {
          count: membersElsewhere,
        }),
      });
    }
    if (servicesElsewhere > 0 && enabledServiceIds.size > 0) {
      list.push({
        key: "servicesNotHere",
        target: "services",
        label: t("page.summary.hints.servicesNotHere", {
          count: servicesElsewhere,
        }),
      });
    }
    if (bundlesElsewhere > 0) {
      list.push({
        key: "bundlesNotHere",
        target: "bundles",
        label: t("page.summary.hints.bundlesNotHere", {
          count: bundlesElsewhere,
        }),
      });
    }
    return list;
  }, [location, t]);

  const summaryItems: SetupSummaryItem[] = items.map((item) => ({
    key: item.key,
    ok: item.ok,
    label: item.label,
    onResolve: () => onResolve(item.target),
  }));

  if (marketplaceLocation?.isPublic === false) {
    summaryItems.push({
      key: "marketplaceLocationHidden",
      ok: false,
      label: (
        <Trans
          ns="marketplace"
          i18nKey="statusStrip.locationHidden"
          values={{ name: marketplaceLocation.name }}
          components={{ strong: <strong className="font-bold" /> }}
        />
      ),
      actionLabel: tMarketplace("statusStrip.manageVisibility"),
      stackActionOnMobile: true,
      onResolve: onManageMarketplace
        ? () => onManageMarketplace("visibility")
        : undefined,
    });
  }

  if (marketplaceLocation?.allowOnlineBooking === false) {
    summaryItems.push({
      key: "marketplaceOnlineBookingOff",
      ok: false,
      label: (
        <Trans
          ns="marketplace"
          i18nKey="statusStrip.onlineBookingOff"
          values={{ name: marketplaceLocation.name }}
          components={{ strong: <strong className="font-bold" /> }}
        />
      ),
      actionLabel: tMarketplace("statusStrip.manageBooking"),
      stackActionOnMobile: true,
      onResolve: onManageMarketplace
        ? () => onManageMarketplace("booking")
        : undefined,
    });
  }

  return (
    <SetupSummaryPanel
      items={summaryItems}
      hintsTone="normal"
      hints={hints.map((hint) => ({
        key: hint.key,
        label: hint.label,
        onResolve: () => onResolve(hint.target),
      }))}
      readyLabel={t("page.summary.readyLabel")}
      attentionLabel={t("page.summary.attentionLabel")}
      groupLabel={t("page.summary.groupLabel")}
      resolveLabel={t("page.summary.resolve")}
      viewLabel={t("page.summary.view")}
      progressLabel={(done, total) =>
        t("page.summary.progressDone", { done, total })
      }
    />
  );
}

export default AssignmentsSummary;
