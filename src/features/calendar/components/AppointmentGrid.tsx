import { type FC, useCallback } from "react";
import { Card, CardContent } from "../../../shared/components/ui/card.tsx";
import { dayNames, getWeekEnd, getWeekStart } from "../utils.ts";
import { AppointmentViewMode } from "../types.ts";
import type { Appointment } from "../../../shared/types/calendar.ts";
import { useDispatch } from "react-redux";
import { toggleEditFormAction } from "../actions.ts";

interface IProps {
    viewMode: AppointmentViewMode,
    selectedDate: Date,
    appointments: Array<Appointment>,
}

export const AppointmentGrid: FC<IProps> = ({ viewMode, selectedDate, appointments }) => {
    const dispatch = useDispatch();

    const handleShowInfo = (event: any) => {
        if ((event.target as Element).classList.contains('timeline-slot')) {
            // TODO
            // setSelectedDate(slotTime);
            // setShowAddAppointment(true);
        }
    }

    const handleOpenEditForm = useCallback((appointment: Appointment) => {
        dispatch(toggleEditFormAction({ item: appointment, open: true }))
    },[dispatch])

    return (
        <>
        {/* Grid View - Custom Day Timeline */}
        {viewMode === AppointmentViewMode.DAY && (
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">
                            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </h3>
                    </div>
                    <div className="flex">
                        {/* Time slots */}
                        <div className="flex flex-col items-end pr-4 select-none" style={{ minWidth: 48 }}>
                            {Array.from({ length: 13 }, (_, i) => 7 + i).map(hour => (
                                <div key={hour} className="h-16 text-xs text-muted-foreground flex items-start justify-end" style={{ height: 64 }}>
                                    {hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                                </div>
                            ))}
                        </div>
                        {/* Timeline slots */}
                        <div className="flex-1 relative">
                            {Array.from({ length: 13 }, (_, i) => 7 + i).map(hour => {
                                const slotTime = new Date(selectedDate);
                                slotTime.setHours(hour, 0, 0, 0);
                                // Find appointments that start in this hour
                                const slotAppointments = appointments.filter(() => {
                                    return -1;
                                    // return (
                                    //     a.scheduledAt.toISOString() === selectedDate.toDateString() &&
                                    //     timeToMinutes(a.scheduledAt.toISOString()) >= hour * 60 &&
                                    //     timeToMinutes(a.scheduledAt.toISOString()) < (hour + 1) * 60
                                    // );
                                });

                                return (
                                    <div
                                        key={hour}
                                        className="border-b border-border h-16 relative group cursor-pointer hover:bg-muted/20"
                                        style={{ height: 64 }}
                                        onClick={(event) => handleShowInfo(event)}
                                    >
                                         {/*Appointments in this slot*/}
                                        {slotAppointments.map((appointment: Appointment) => {
                                            // Calculate block height based on duration (default 1 slot = 1 hour)
                                            //TODO FIX THIS
                                            // const [startHour, startMin] = appointment.time.split(/:| /)[0].split(':').map(Number);

                                            const [startHour, startMin] = [10, 15]
                                            const [endHour, endMin] = (() => {
                                                // Try to parse end time from service string or use +1 hour fallback
                                                const match = appointment.service.name.match(/\((\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
                                                if (match) return [parseInt(match[3]), parseInt(match[4])];
                                                // fallback: 1 hour duration
                                                return [startHour + 1, startMin];
                                            })();
                                            const duration = ((endHour * 60 + endMin) - (startHour * 60 + startMin)) || 60;
                                            const blockHeight = Math.max(48, (duration / 60) * 64); // min 48px
                                            return (
                                                <div
                                                    key={appointment.id}
                                                    draggable
                                                    onDragStart={e => {
                                                        e.dataTransfer.setData('text/plain', appointment.id.toString());
                                                        e.currentTarget.classList.add('opacity-50');
                                                    }}
                                                    onDragEnd={e => {
                                                        e.currentTarget.classList.remove('opacity-50');
                                                    }}
                                                    className={`
                                                    absolute left-2 right-2 top-1 z-10 rounded-lg shadow-md 
                                                    px-4 py-2 cursor-move flex flex-col justify-center
                                                    ${appointment.status === 'completed' ? 'bg-green-500 text-white' :
                                                        appointment.status === 'no-show' ? 'bg-red-400 text-white' :
                                                            'bg-orange-400 text-white'}
                                                    hover:brightness-110 transition-all`}
                                                    style={{ height: blockHeight, top: 4 }}
                                                    onClick={() => {handleOpenEditForm(appointment)}}
                                                >
                                                    <div className="font-semibold text-xs truncate">{appointment.service.name}</div>
                                                    <div className="text-xs opacity-90 truncate">{appointment.customer.firstName}</div>
                                                    <div className="text-xs opacity-70">{JSON.stringify(appointment.scheduledAt)}</div>
                                                </div>
                                            );
                                        })}
                                         {/*Empty slot overlay for add*/}
                                        {slotAppointments.length === 0 && (
                                            <div
                                                className="timeline-slot absolute inset-0 flex
                                                items-center justify-center text-xs
                                                text-muted-foreground/40 opacity-0
                                                group-hover:opacity-100 transition-opacity
                                                cursor-pointer"
                                            >
                                                + Add appointment
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>
        )}

        {/* Grid View - Custom Week/Month Calendar */}
        {(viewMode === AppointmentViewMode.WEEK || viewMode === AppointmentViewMode.MONTH) && (
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">
                            {viewMode === AppointmentViewMode.WEEK
                                ? `${getWeekStart(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${getWeekEnd(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                                : selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h3>
                    </div>
                    {/* Calendar Header */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {dayNames.map((day) => (
                            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                                {day}
                            </div>
                        ))}
                    </div>
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {(() => {
                            if (viewMode === AppointmentViewMode.WEEK) {
                                // 7 days of the current week
                                const weekStart = getWeekStart(selectedDate);
                                return Array.from({ length: 7 }, (_, i) => {
                                    const day = new Date(weekStart);
                                    day.setDate(weekStart.getDate() + i);
                                    // const dayAppointments = applyFilters(mockAppointments.filter(a => a.date.toDateString() === day.toDateString()));
                                    const dayAppointments: Array<any> = [];

                                    return (
                                        <div
                                            key={day.toDateString()}
                                            className={`
                                                min-h-[90px] border border-border bg-white transition-colors relative
                                                ${day.toDateString() === new Date().toDateString() ? 'ring-1 ring-primary' : ''}
                                                ${selectedDate.toDateString() === day.toDateString() ? 'bg-primary/5' : ''}`
                                            }
                                            onClick={e => {
                                                e.stopPropagation();
                                                // TODO
                                                // setSelectedDate(day);
                                                // setViewMode('day');
                                            }}
                                            onDragOver={e => {
                                                e.preventDefault();
                                                e.currentTarget.classList.add('bg-primary/10');
                                            }}
                                            onDragLeave={e => {
                                                e.currentTarget.classList.remove('bg-primary/10');
                                            }}
                                            onDrop={e => {
                                                e.preventDefault();
                                                e.currentTarget.classList.remove('bg-primary/10');
                                                // const appointmentId = e.dataTransfer.getData('text/plain');
                                                // Implement move logic here
                                                // TODO
                                            }}
                                        >
                                            <div className="text-xs font-medium opacity-60 pl-1 pt-1 absolute left-0 top-0">{day.getDate()}</div>
                                            <div className="flex flex-col justify-start items-start h-full pt-5 px-1 pb-1">
                                                {appointments.slice(0, 3).map((appointment: any) => (
                                                    <div
                                                        key={appointment.id}
                                                        draggable
                                                        onDragStart={e => {
                                                            e.dataTransfer.setData('text/plain', appointment.id.toString());
                                                            e.currentTarget.classList.add('opacity-50');
                                                        }}
                                                        onDragEnd={e => {
                                                            e.currentTarget.classList.remove('opacity-50');
                                                        }}
                                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium truncate mb-0.5 cursor-pointer
                                      ${appointment.status === 'completed' ? 'bg-green-200 text-green-900' :
                                                            appointment.status === 'no-show' ? 'bg-red-200 text-red-900' :
                                                                'bg-blue-200 text-blue-900'}
                                      hover:opacity-80 transition-opacity`}
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            // TODO
                                                            // setSelectedDate(day);
                                                            // setViewMode('day');
                                                        }}
                                                        style={{ maxWidth: '100%' }}
                                                    >
                                                        <span className="truncate">{appointment.service}</span>
                                                    </div>
                                                ))}
                                                {appointments.length > 3 && (
                                                    <div className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium truncate bg-muted text-muted-foreground">
                                                        <span className="sm:inline hidden">+{dayAppointments.length - 3} more</span>
                                                        <span className="inline sm:hidden">+{dayAppointments.length - 3}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                });
                            }

                            if (viewMode === AppointmentViewMode.MONTH) {
                                // Month view: show all days of the month in a grid
                                const year = selectedDate.getFullYear();
                                const month = selectedDate.getMonth();
                                const firstDay = new Date(year, month, 1);
                                const lastDay = new Date(year, month + 1, 0);
                                const startDate = new Date(firstDay);
                                startDate.setDate(firstDay.getDate() - firstDay.getDay());
                                const endDate = new Date(lastDay);
                                endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
                                const days = [];
                                const currentDate = new Date(startDate);
                                while (currentDate <= endDate) {
                                    const isCurrentMonth = currentDate.getMonth() === month;
                                    // const dayAppointments = applyFilters(mockAppointments.filter(a => a.date.toDateString() === currentDate.toDateString()));
                                    // const dayDate = new Date(currentDate); // Capture the current date value
                                    // TODO
                                    days.push(
                                        <div
                                            key={currentDate.toDateString()}
                                            className={`
                                            min-h-[90px] border border-border bg-white transition-colors relative
                                             ${isCurrentMonth ? 
                                                'bg-white border-border hover:bg-muted/10' :
                                                'bg-muted/20 border-muted text-muted-foreground'}
                                            ${currentDate.toDateString() === new Date().toDateString() ? 'ring-1 ring-primary' : ''}
                                            ${selectedDate.toDateString() === currentDate.toDateString() ? 'bg-primary/5' : ''}`}

                                            onClick={e => {
                                                e.stopPropagation();
                                                // TODO
                                                // setSelectedDate(dayDate);
                                                // setViewMode('day');
                                            }}
                                            onDragOver={e => {
                                                e.preventDefault();
                                                e.currentTarget.classList.add('bg-primary/10');
                                            }}
                                            onDragLeave={e => {
                                                e.currentTarget.classList.remove('bg-primary/10');
                                            }}
                                            onDrop={e => {
                                                e.preventDefault();
                                                e.currentTarget.classList.remove('bg-primary/10');
                                                // const appointmentId = e.dataTransfer.getData('text/plain');
                                                // Implement move logic here
                                                // TODO
                                            }}
                                        >
                                            <div className="text-xs font-medium opacity-60 pl-1 pt-1 absolute left-0 top-0">{currentDate.getDate()}</div>
                                            <div className="flex flex-col justify-start items-start h-full pt-5 px-1 pb-1">
                                                {
                                                    appointments.slice(0, 3).map((appointment: Appointment) => (
                                                    <div
                                                        key={appointment.id}
                                                        draggable
                                                        onDragStart={e => {
                                                            e.dataTransfer.setData('text/plain', appointment.id.toString());
                                                            e.currentTarget.classList.add('opacity-50');
                                                        }}
                                                        onDragEnd={e => {
                                                            e.currentTarget.classList.remove('opacity-50');
                                                        }}
                                                        className={`
                                                        inline-flex items-center rounded-full px-2 py-0.5 
                                                        text-xs font-medium truncate mb-0.5 cursor-pointer
                                                            ${appointment.status === 'completed' ? 
                                                            'bg-green-200 text-green-900' :
                                                            appointment.status === 'no-show' ? 
                                                                'bg-red-200 text-red-900' :
                                                                'bg-blue-200 text-blue-900'}
                                                            hover:opacity-80 transition-opacity`
                                                        }

                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            // TODO
                                                            // setSelectedDate(dayDate);
                                                            // setViewMode('day');
                                                        }}
                                                        style={{ maxWidth: '100%' }}
                                                    >
                                                        <span className="truncate">{appointment.service.name}</span>
                                                    </div>
                                                ))
                                                }
                                                {appointments.length > 3 && (
                                                    <div className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium truncate bg-muted text-muted-foreground">
                                                        <span className="sm:inline hidden">+{appointments.length - 3} more</span>
                                                        <span className="inline sm:hidden">+{appointments.length - 3}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                    currentDate.setDate(currentDate.getDate() + 1);
                                }
                                return days;
                            }
                        })()}
                    </div>
                </CardContent>
            </Card>
        )}
        </>
    )
}