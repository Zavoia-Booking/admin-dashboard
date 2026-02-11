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
            <div className="flex items-center gap-2 h-9">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading locations...</span>
            </div>
        );
    }

    // No locations available
    if (locations.length === 0) {
        return (
            <div className="flex items-center gap-2 h-9">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">No locations available</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <Select
                value={selectedLocationId !== null ? String(selectedLocationId) : ''}
                onValueChange={handleLocationChange}
            >
                <SelectTrigger className="w-auto min-w-[200px] h-9 text-sm font-semibold border-none shadow-none px-0 focus:ring-0">
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
            {isLoadingContext && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            )}
        </div>
    );
};
