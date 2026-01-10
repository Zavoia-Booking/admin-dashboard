import { type FC, useCallback } from "react";
import { ALL } from "../../../shared/constants.ts";
import type { CalendarFilters } from "../types.ts";
import { X } from "lucide-react";
import { Badge } from "../../../shared/components/ui/badge.tsx";
import { findItemByKey } from "./utils.tsx";

interface IProps {
    filters: CalendarFilters
    changeFilters: (filters: CalendarFilters) => void
}

export const BadgeList: FC<IProps>  = ({ filters, changeFilters }) => {
    const locations: any[] = [];
    const teamMembers: any[] = [];

    const canShowFilterBadges = useCallback((): boolean => {
        return !!(
            filters.location !== ALL ||
            filters.teamMember !== ALL ||
            filters.service !== ALL ||
            filters.status !== ALL ||
            filters.clientName ||
            filters.email ||
            filters.phoneNumber
        );
    }, [filters])

    const { location, teamMember, service, status, clientName, email, phoneNumber } = filters

    const setFilters = useCallback((filterKey: string, filterValue: string|number|boolean) => {
        const newFilters = {
            ...filters,
            [filterKey]: filterValue
        }
        changeFilters(newFilters);

    }, [changeFilters, filters])

    const getTeamMemberInfo = useCallback(() => {
        const teamMember = findItemByKey(teamMembers, 'id', filters.teamMember);
        return teamMember ? `Team: ${teamMember.firstName} ${teamMember.lastName}` : filters.teamMember;
    }, [teamMembers, filters])

    return (<>
        {canShowFilterBadges() && (
            <div className="flex flex-wrap gap-2 mb-4">
                {location !== ALL && (
                    <Badge
                        variant="secondary"
                        className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                        onClick={() => setFilters('location', ALL)}
                    >
                        Location: {findItemByKey(locations, 'id', filters.location)?.name || filters.location}
                        <X className="h-4 w-4 ml-1"/>
                    </Badge>
                )}
                {teamMember !== ALL && (
                    <Badge
                        variant="secondary"
                        className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                        onClick={() => setFilters('teamMember', ALL)}
                    >
                        {getTeamMemberInfo()}
                        <X className="h-4 w-4 ml-1"/>
                    </Badge>
                )}
                {service !== ALL && (
                    <Badge
                        variant="secondary"
                        className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                        onClick={() => setFilters('service', ALL)}
                    >
                        Service: {service}
                        <X className="h-4 w-4 ml-1"/>
                    </Badge>
                )}
                {status !== ALL && (
                    <Badge
                        variant="secondary"
                        className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                        onClick={() => setFilters('status', ALL)}
                    >
                        {`Status: ${filters.status}`}
                        <X className="h-4 w-4 ml-1"/>
                    </Badge>
                )}
                {clientName && (
                    <Badge
                        variant="secondary"
                        className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                        onClick={() => setFilters('clientName', '')}
                    >
                        Name: {clientName}
                        <X className="h-4 w-4 ml-1"/>
                    </Badge>
                )}
                {email && (
                    <Badge
                        variant="secondary"
                        className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                        onClick={() => setFilters('email', '')}
                    >
                        Email: {email}
                        <X className="h-4 w-4 ml-1"/>
                    </Badge>
                )}
                {phoneNumber && (
                    <Badge
                        variant="secondary"
                        className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                        onClick={() => setFilters('phoneNumber', '')}
                    >
                        Phone: {phoneNumber}
                        <X className="h-4 w-4 ml-1"/>
                    </Badge>
                )}
            </div>
        )}
    </>)
}
