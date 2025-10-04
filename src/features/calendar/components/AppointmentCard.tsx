import { type FC, useCallback } from "react";
import type { Appointment } from "../../../shared/types/calendar.ts";
import { MapPin, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { getStatusBadge } from "./utils.tsx";

interface IProps {
    appointment: Appointment
}

export const AppointmentCard: FC<IProps> = ({ appointment }) => {

    const getInfo = useCallback(() => {

        if (appointment.teamMembers.length > 1) {
            return `Team members: ${appointment.teamMembers.length}`
        }

        if (appointment.teamMembers.length  == 1) {
            const teamMember = appointment.teamMembers[0];

            return `${teamMember.firstName} ${teamMember.lastName}`
        }

    }, [appointment])

    return (
        <>
            <Avatar className="h-10 w-10">
                <AvatarImage src={"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"}/>
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                    {appointment.customer.firstName}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    {/* Column 1: Customer info */}
                    <div className="flex-1 min-w-0 space-y-1">
                        {/* Customer name */}
                        <h4 className="font-medium text-sm text-foreground">
                            {`${appointment.customer.firstName} ${appointment.customer.lastName}`}
                        </h4>
                        {/* Service */}
                        <p className="text-xs text-muted-foreground">
                            {appointment.service.name}
                        </p>
                        {/* Location */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3"/>
                            {appointment.location.name}
                        </div>
                        {/* Team Members */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3"/>
                            {getInfo()}
                        </div>
                    </div>

                    {/* Column 2: Status and Time */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-1">
                        {getStatusBadge(appointment.status)}
                        <div className="font-semibold text-sm text-foreground">
                            {/*{appointment.time}*/}
                            TODO
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}