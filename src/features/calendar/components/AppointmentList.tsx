import { type FC, useCallback } from "react";
import { Card, CardContent } from "../../../shared/components/ui/card.tsx";
import type { Appointment, AppointmentSection } from "../../../shared/types/calendar.ts";
import { AppointmentViewMode } from "../types.ts";
import { AppointmentCard } from "./AppointmentCard.tsx";
import { getSectionTitle } from "./utils.tsx";
import { toggleEditFormAction } from "../actions.ts";
import { useDispatch } from "react-redux";

interface IProps {
    viewMode: AppointmentViewMode,
    appointments: Array<Appointment>
}

export const AppointmentList: FC<IProps> = ({ appointments, viewMode }) => {
    const dispatch = useDispatch();

    const appointmentsByDay: Array<AppointmentSection> = appointments.map(() => {
        return {
            date: new Date(),
            appointments: appointments,
        }
    });

    const handleOpenEditForm = useCallback((item: Appointment) => {
        dispatch(toggleEditFormAction({ item, open: true }))
    }, [dispatch])

    return (
        <>
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">
                        Appointments TODO
                    </h3>
                </div>
            </CardContent>
        </Card>
        <div className="space-y-4">
            {appointmentsByDay.map((dayData: AppointmentSection, index) => (
                <div key={index}>
                    {[AppointmentViewMode.MONTH, AppointmentViewMode.WEEK].includes(viewMode) && (
                        <div className="mb-3">
                            <h4 className="text-sm font-semibold text-foreground mb-2">
                                {getSectionTitle(dayData.date, viewMode)}
                                <span className="text-xs text-muted-foreground ml-2">
                                ({dayData.appointments.length} appointments)
                              </span>
                            </h4>
                        </div>
                    )}

                    {dayData.appointments.length === 0 ? (
                        (viewMode === AppointmentViewMode.WEEK  || viewMode === AppointmentViewMode.MONTH ) && (
                            <div className="text-xs text-muted-foreground mb-4 pl-2">
                                No appointments scheduled
                            </div>
                        )
                    ) : (
                        <div className="space-y-3">
                            {dayData.appointments.map((appointment: Appointment, index: number) => (
                                <div
                                    key={appointment.id}
                                    className={`flex items-center gap-3 py-2 cursor-pointer hover:bg-muted/30 rounded-lg transition-colors ${index !== dayData.appointments.length - 1 ? 'border-b border-border' : ''}`}
                                    onClick={() => {
                                        handleOpenEditForm(appointment)
                                    }}
                                >
                                    <AppointmentCard appointment={appointment}/>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
        </>
    )
}