import { type FC, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LocationSelector as SharedLocationSelector } from "../../../shared/components/common/LocationSelector.tsx";
import type { LocationWithAssignments } from "../types.ts";
import type { LocationType } from "../../../shared/types/location.ts";

const STORAGE_KEY = "zavoia_marketplace_portfolio_selected_location";

interface PortfolioLocationSelectorProps {
  locations: LocationWithAssignments[];
  selectedLocationId: number | null;
  onSelect: (id: number) => void;
  closedClassName?: string;
  mobile?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Persistent per-location selector for the marketplace Portfolio tab.
 * Mirrors the Calendar location selector: restores last selection from localStorage,
 * auto-selects the first location on first load, persists subsequent changes.
 */
export const PortfolioLocationSelector: FC<PortfolioLocationSelectorProps> = ({
  locations,
  selectedLocationId,
  onSelect,
  closedClassName,
  mobile,
  onOpenChange,
}) => {
  const { t } = useTranslation("calendar");

  useEffect(() => {
    if (locations.length === 0 || selectedLocationId !== null) return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const storedId = parseInt(stored, 10);
      if (locations.some((l) => l.id === storedId)) {
        onSelect(storedId);
        return;
      }
    }

    localStorage.setItem(STORAGE_KEY, String(locations[0].id));
    onSelect(locations[0].id);
  }, [locations, selectedLocationId, onSelect]);

  const handleSelect = useCallback(
    (id: number) => {
      localStorage.setItem(STORAGE_KEY, String(id));
      onSelect(id);
    },
    [onSelect],
  );

  return (
    <SharedLocationSelector
      locations={locations as unknown as Array<LocationType>}
      selectedLocationId={selectedLocationId}
      onSelect={handleSelect}
      placeholder={t("page.common.selectLocation")}
      groupHeading={t("page.common.location")}
      closedClassName={closedClassName}
      mobile={mobile}
      onOpenChange={onOpenChange}
    />
  );
};
