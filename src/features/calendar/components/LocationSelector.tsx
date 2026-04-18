import { type FC, useEffect, useCallback, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Check, ChevronDown, Loader2, MapPin } from "lucide-react";
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
} from "../../../shared/components/ui/command.tsx";
import { cn } from "../../../shared/lib/utils.ts";
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
    /** Override border-radius class for the closed state button. */
    closedClassName?: string;
    /** Mobile mode — uses border-strong always, no hover states. */
    mobile?: boolean;
}

export const LocationSelector: FC<LocationSelectorProps> = ({ closedClassName, mobile }) => {
    const { t } = useTranslation('calendar');
    const dispatch = useDispatch();
    const locations: Array<LocationType> = useSelector(getAllLocationsSelector);
    const isLoadingLocations = useSelector(getLocationLoadingSelector);
    const selectedLocationId = useSelector(getSelectedLocationId);
    const isLoadingContext = useSelector(getLocationContextLoading);

    const [open, setOpen] = useState(false);
    const [listMounted, setListMounted] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    // Auto-select on mount (or when locations load)
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

    // Mount/unmount list with animation delay on close
    useEffect(() => {
        if (open) {
            setListMounted(true);
            return;
        }
        const timer = window.setTimeout(() => setListMounted(false), 250);
        return () => window.clearTimeout(timer);
    }, [open]);

    // Close on outside click — capture phase so we can also swallow the tap
    // that would otherwise bubble into whatever is under the dropdown.
    useEffect(() => {
        if (!open) return;
        const onDocClickCapture = (e: MouseEvent) => {
            const target = e.target as Node | null;
            if (!target) return;
            if (rootRef.current?.contains(target)) return;
            e.stopPropagation();
            e.preventDefault();
            setOpen(false);
        };
        document.addEventListener("click", onDocClickCapture, true);
        return () => document.removeEventListener("click", onDocClickCapture, true);
    }, [open]);

    const handleSelect = useCallback((id: number) => {
        setOpen(false);
        // Re-selecting the current location would re-run the saga cascade
        // (context → summary/day/week). We already have that data — skip.
        if (id === selectedLocationId) return;
        localStorage.setItem(STORAGE_KEY, String(id));
        dispatch(setSelectedLocationAction(id));
    }, [dispatch, selectedLocationId]);

    const selectedLocation = locations.find((l) => l.id === selectedLocationId);
    const showListContainer = listMounted && !isLoadingLocations && locations.length > 0;
    const lastIdx = locations.length - 1;

    if (isLoadingLocations) {
        return (
            <div className="flex h-11 items-center gap-2 rounded-full border border-border bg-surface px-4">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">Loading locations…</span>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (locations.length === 0) {
        return (
            <div className="flex h-11 items-center gap-2 rounded-full border border-border bg-surface px-4">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">No locations</span>
            </div>
        );
    }

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-haspopup="listbox"
                className={cn(
                    "group relative flex h-11 w-full min-w-0 items-center justify-between gap-2 bg-surface px-4 text-left text-base font-normal text-foreground-1 transition-colors dark:bg-neutral-900",
                    "cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    showListContainer
                        ? "!rounded-b-none !rounded-t-[22px] border-x border-t border-b border-border-strong shadow-none dark:border-border-strong"
                        : cn(
                            mobile
                                ? "border border-border-strong dark:border-border-strong"
                                : "border border-border hover:border-border-strong dark:border-border dark:hover:border-border-strong",
                            closedClassName ?? "!rounded-full",
                        ),
                )}
            >
                <MapPin className={cn("h-4 w-4 shrink-0 transition-colors", showListContainer ? "text-primary" : "text-muted-foreground group-hover:text-primary")} aria-hidden />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground-1">
                    {selectedLocation?.name ?? t("page.common.selectLocation")}
                </span>
                {isLoadingContext ? (
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" aria-hidden />
                ) : (
                    <ChevronDown
                        className={cn("h-4 w-4 shrink-0 text-foreground-3 transition-transform", open && "rotate-180")}
                        aria-hidden
                    />
                )}
            </button>

            {showListContainer ? (
                <div
                    data-state={open ? "open" : "closed"}
                    className={cn(
                        "add-appointment-popover-expand absolute left-0 right-0 top-full z-[85] -mt-px box-border max-h-[min(320px,50vh)] w-full overflow-hidden rounded-b-[22px] rounded-t-none border border-t-0 border-border-strong bg-surface p-0 shadow-md dark:border-border-strong dark:bg-neutral-900",
                    )}
                >
                    <Command shouldFilter={false} className="w-full min-w-0 max-w-full">
                        <CommandList className="max-h-[min(260px,40vh)] w-full min-w-0 max-w-full overflow-x-hidden overflow-y-auto">
                            <CommandGroup heading={t("page.common.location")}>
                                {locations.map((location, index) => {
                                    const isSelected = location.id === selectedLocationId;
                                    return (
                                        <CommandItem
                                            key={location.id}
                                            value={`loc-${location.id}`}
                                            onSelect={() => handleSelect(location.id)}
                                            className={cn(
                                                "flex cursor-pointer items-center gap-2 p-3",
                                                isSelected && "bg-muted/50",
                                                index === lastIdx && "rounded-b-[18px]",
                                                mobile && "data-[selected=true]:bg-transparent",
                                            )}
                                        >
                                            <span className="flex h-4 w-5 shrink-0 items-center justify-center" aria-hidden>
                                                {isSelected ? (
                                                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" strokeWidth={2.75} />
                                                ) : null}
                                            </span>
                                            <span className="min-w-0 flex-1 text-sm font-medium text-foreground-1">
                                                {location.name}
                                            </span>
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </div>
            ) : null}
        </div>
    );
};
