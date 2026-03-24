import { type FC, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MapPin, Loader2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../../shared/components/ui/select.tsx";
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
export const LocationSelector: FC = () => {
    const dispatch = useDispatch();
    const locations: Array<LocationType> = useSelector(getAllLocationsSelector);
    const isLoadingLocations = useSelector(getLocationLoadingSelector);
    const selectedLocationId = useSelector(getSelectedLocationId);
    const isLoadingContext = useSelector(getLocationContextLoading);

    // Auto-select on mount (or when locations load)
    useEffect(() => {
        if (locations.length === 0 || selectedLocationId !== null) return;

        // Try to restore from localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const storedId = parseInt(stored, 10);
            const exists = locations.some((l) => l.id === storedId);
            if (exists) {
                dispatch(setSelectedLocationAction(storedId));
                return;
            }
        }

        // Fallback: select the first location and persist
        localStorage.setItem(STORAGE_KEY, String(locations[0].id));
        dispatch(setSelectedLocationAction(locations[0].id));
    }, [locations, selectedLocationId, dispatch]);

    const handleLocationChange = useCallback((value: string) => {
        const id = parseInt(value, 10);
        if (isNaN(id)) return;

        localStorage.setItem(STORAGE_KEY, String(id));
        dispatch(setSelectedLocationAction(id));
    }, [dispatch]);

    // Loading state while locations are fetching
    if (isLoadingLocations) {
        return (
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 dark:bg-primary/25">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
                <div className="min-w-0 flex-1 space-y-1 pt-0.5">
                    <span className="text-sm text-muted-foreground">Loading locations...</span>
                </div>
            </div>
        );
    }

    // No locations available
    if (locations.length === 0) {
        return (
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-semibold text-foreground-1">No locations</p>
                    <p className="text-xs text-muted-foreground">Location</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <MapPin className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1.5">
                    <Select
                        value={selectedLocationId !== null ? String(selectedLocationId) : ""}
                        onValueChange={handleLocationChange}
                    >
                        <SelectTrigger className="h-auto min-h-0 w-full min-w-0 flex-1 border-0 bg-transparent p-0 text-base font-semibold text-foreground-1 shadow-none focus:ring-0 [&>svg]:ml-0.5 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0 [&>svg]:text-foreground-2">
                            <SelectValue placeholder="Select a location" />
                        </SelectTrigger>
                        <SelectContent>
                            {locations.map((location) => (
                                <SelectItem key={location.id} value={String(location.id)}>
                                    {location.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {isLoadingContext ? (
                        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
                    ) : null}
                </div>
                <p className="text-xs text-muted-foreground">Location</p>
            </div>
        </div>
    );
};
