import { type FC, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LocationSelector } from "./LocationSelector.tsx";
import { MiniMonthCalendar } from "./MiniMonthCalendar.tsx";
import { getLocationStaff, getStaffFilter } from "../selectors.ts";
import { setStaffFilter } from "../actions.ts";
import type { CalendarStaffMember } from "../../../shared/types/calendar.ts";
import { User } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Staff Filter List
// ─────────────────────────────────────────────────────────────

const StaffFilterList: FC = () => {
    const dispatch = useDispatch();
    const staff: CalendarStaffMember[] = useSelector(getLocationStaff);
    const staffFilter: number[] = useSelector(getStaffFilter);

    // Empty filter means "show all"
    const allSelected = staffFilter.length === 0;

    const handleToggleAll = useCallback(() => {
        dispatch(setStaffFilter([])); // empty = show all
    }, [dispatch]);

    const handleToggleStaff = useCallback((staffId: number) => {
        if (allSelected) {
            // Switching from "all" to "only this one" — select all except clicked to deselect
            // Actually, toggling from "all" to individual: select all IDs except this one
            const allIds = staff.map(s => s.id).filter(id => id !== staffId);
            dispatch(setStaffFilter(allIds));
        } else {
            const isCurrentlySelected = staffFilter.includes(staffId);
            if (isCurrentlySelected) {
                const next = staffFilter.filter(id => id !== staffId);
                // If removing the last one, revert to "all"
                dispatch(setStaffFilter(next.length === 0 ? [] : next));
            } else {
                const next = [...staffFilter, staffId];
                // If selecting all, simplify to "all" (empty array)
                if (next.length === staff.length) {
                    dispatch(setStaffFilter([]));
                } else {
                    dispatch(setStaffFilter(next));
                }
            }
        }
    }, [dispatch, staff, staffFilter, allSelected]);

    if (staff.length === 0) {
        return (
            <div className="text-xs text-muted-foreground py-2">
                No staff assigned to this location.
            </div>
        );
    }

    return (
        <div className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Staff
            </div>

            {/* All Staff toggle */}
            <label className="flex items-center gap-2 px-1.5 py-1.5 rounded-md cursor-pointer hover:bg-sidebar-accent transition-colors">
                <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleToggleAll}
                    className="h-3.5 w-3.5 rounded border-sidebar-border accent-primary"
                />
                <span className="text-sm font-medium">All Staff</span>
            </label>

            {/* Individual staff toggles */}
            {staff.map((member) => {
                const isChecked = allSelected || staffFilter.includes(member.id);
                return (
                    <label
                        key={member.id}
                        className="flex items-center gap-2 px-1.5 py-1.5 rounded-md cursor-pointer hover:bg-sidebar-accent transition-colors"
                    >
                        <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleStaff(member.id)}
                            className="h-3.5 w-3.5 rounded border-sidebar-border accent-primary"
                        />
                        {member.profileImage ? (
                            <img
                                src={member.profileImage}
                                alt=""
                                className="h-5 w-5 rounded-full object-cover flex-shrink-0"
                            />
                        ) : (
                            <div className="h-5 w-5 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0">
                                <User className="h-3 w-3 text-muted-foreground" />
                            </div>
                        )}
                        <span className="text-sm truncate">{member.firstName} {member.lastName}</span>
                    </label>
                );
            })}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// CalendarSidebar
// ─────────────────────────────────────────────────────────────

/**
 * CalendarSidebar — dark-themed left sidebar.
 * Contains location selector, mini month calendar, and staff filter list.
 * Wrapped in `dark` class to force dark appearance.
 */
export const CalendarSidebar: FC = () => {
    return (
        <aside className="dark w-72 h-full flex-shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col hidden md:flex">
            {/* Location selector */}
            <div className="p-3 border-b border-sidebar-border">
                <LocationSelector />
            </div>

            {/* Mini month calendar */}
            <div className="p-3 border-b border-sidebar-border">
                <MiniMonthCalendar />
            </div>

            {/* Staff filter list */}
            <div className="flex-1 p-3 overflow-y-auto">
                <StaffFilterList />
            </div>
        </aside>
    );
};
