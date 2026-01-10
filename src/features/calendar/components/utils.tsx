import type { ReactElement } from "react";
import { Badge } from "../../../shared/components/ui/badge.tsx";
import { AppointmentViewMode } from "../types.ts";

export const getStatusBadge = (status: string): ReactElement => {
    switch (status) {
        case 'completed':
            return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400">Completed</Badge>;
        case 'no-show':
            return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400">No Show</Badge>;
        case 'pending':
            return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400">Pending</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
};

export const getSectionTitle = (date:Date, viewMode:AppointmentViewMode) => {
    return date.toLocaleDateString('en-US', {
        weekday: viewMode === AppointmentViewMode.WEEK  ? 'long' : 'short',
        month: 'short',
        day: 'numeric'
    });
}

export const findItemByKey = (list: Array<any>, key: string, value: string|number) => {
    return list.find(item => {
        return `${item[key]}` === `${value}`}
    )
}