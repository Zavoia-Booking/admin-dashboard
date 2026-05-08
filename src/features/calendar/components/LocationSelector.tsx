import { type FC, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { LocationSelector as SharedLocationSelector } from "../../../shared/components/common/LocationSelector.tsx";
import { getAllLocationsSelector, getLocationLoadingSelector } from "../../locations/selectors.ts";
import { getSelectedLocationId, getLocationContextLoading } from "../selectors.ts";
import { setSelectedLocationAction } from "../actions.ts";
import type { LocationType } from "../../../shared/types/location.ts";

const STORAGE_KEY = "zavoia_calendar_selected_location";

/**
 * Persistent location selector for the calendar.
 *
 * Behavior:
 * 1. On mount, restores the last-selected location from localStorage.
 * 2. If no stored selection (or stored ID no longer valid), auto-selects the first location.
 * 3. On change, persists to localStorage and dispatches setSelectedLocationAction
 *    which triggers the saga cascade (context → summary → day data).
 */
interface LocationSelectorProps {
    closedClassName?: string;
    mobile?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export const LocationSelector: FC<LocationSelectorProps> = ({ closedClassName, mobile, onOpenChange }) => {
    const { t } = useTranslation('calendar');
    const dispatch = useDispatch();
    const locations: Array<LocationType> = useSelector(getAllLocationsSelector);
    const isLoadingLocations = useSelector(getLocationLoadingSelector);
    const selectedLocationId = useSelector(getSelectedLocationId);
    const isLoadingContext = useSelector(getLocationContextLoading);

    useEffect(() => {
        if (locations.length === 0 || selectedLocationId !== null) return;

        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const storedId = parseInt(stored, 10);
            const exists = locations.some((l) => l.id === storedId);
            if (exists) {
                dispatch(setSelectedLocationAction(storedId));
                return;
            }
        }

        localStorage.setItem(STORAGE_KEY, String(locations[0].id));
        dispatch(setSelectedLocationAction(locations[0].id));
    }, [locations, selectedLocationId, dispatch]);

    const handleSelect = useCallback((id: number) => {
        localStorage.setItem(STORAGE_KEY, String(id));
        dispatch(setSelectedLocationAction(id));
    }, [dispatch]);

    return (
        <SharedLocationSelector
            locations={locations}
            selectedLocationId={selectedLocationId}
            onSelect={handleSelect}
            isLoading={isLoadingLocations}
            isLoadingContext={isLoadingContext}
            placeholder={t("page.common.selectLocation")}
            groupHeading={t("page.common.location")}
            closedClassName={closedClassName}
            mobile={mobile}
            onOpenChange={onOpenChange}
        />
    );
};
