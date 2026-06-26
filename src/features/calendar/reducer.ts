import * as actions from "./actions";
import { type ActionType, getType } from "typesafe-actions";
import { logoutRequestAction } from "../auth/actions";
import type { Reducer } from "redux";
import { AppointmentViewMode, AppointmentViewType, type CalendarViewState, type AddFormPrefill, type PendingDrop } from "./types.ts";
import type { Appointment, LocationContextData, DaySummary, DayDataResponse, CalendarWeekResponse, CalendarDayFilters, CalendarBlockDto } from "../../shared/types/calendar.ts";
import type { LocationService, LocationTeamMember } from "../assignments/types.ts";
import { getWeekStart } from "./utils.ts";

type Actions = ActionType<typeof actions> | ActionType<typeof logoutRequestAction>;

const initialDayFilters: CalendarDayFilters = {};

const initialState: CalendarViewState = {
    // --- Location-first design ---
    selectedLocationId: null,
    locationContext: null,
    locationContextLoading: false,
    locationServices: [],
    locationTeamMembers: [],
    locationBundles: [],

    // --- Summary data ---
    summary: {},
    summaryLoading: false,

    // --- Day data ---
    dayData: null,
    dayDataLoading: false,

    // --- Week data ---
    weekData: null,
    weekDataLoading: false,

    // --- Day filters ---
    dayFilters: initialDayFilters,

    // --- Staff filter ---
    staffFilter: [],

    // --- Selected appointment detail ---
    selectedAppointment: null,
    selectedAppointmentLoading: false,

    // --- UI drawers / forms ---
    addFormOpen: false,
    addFormPrefill: null,
    editForm: {
        open: false,
        item: null,
    },
    blockFormOpen: false,
    blockFormEditingBlock: null,

    // --- Calendar sidebar ---
    sidebarOpen: true,

    // --- View controls ---
    viewType: AppointmentViewType.LIST,
    viewMode: AppointmentViewMode.DAY,

    // --- Date navigation ---
    selectedDate: new Date(),
    displayedMonthStart: null,
    displayedWeekStart: null,
    sidebarMiniCalendarMonthStart: null,

    updateConflictOffer: null,
    pendingDrop: null as PendingDrop,

    optimisticBlocks: [],

    addFormCloseAfterMutationsRemaining: 0,

    scrollToNow: true,
};

/** Normalize API block payload to CalendarBlockDto (startsAt/endsAt as ISO strings). */
function blockPayloadToDto(payload: any): CalendarBlockDto {
    const startsAt = payload.startsAt instanceof Date ? payload.startsAt.toISOString() : (payload.startsAt ?? '');
    const endsAt = payload.endsAt instanceof Date ? payload.endsAt.toISOString() : (payload.endsAt ?? '');
    return {
        id: payload.id,
        blockScope: payload.blockScope,
        userId: payload.userId ?? null,
        startsAt,
        endsAt,
        isAllDay: payload.isAllDay ?? false,
        reason: payload.reason ?? 'other',
        title: payload.title ?? null,
        notes: payload.notes ?? null,
        isRecurring: payload.isRecurring ?? false,
        repeatFrequency: payload.repeatFrequency ?? undefined,
        repeatDaysOfWeek: payload.repeatDaysOfWeek ?? undefined,
        repeatEndDate: payload.repeatEndDate ?? undefined,
    };
}

// ─────────────────────────────────────────────────────────────
// Handler helpers
// ─────────────────────────────────────────────────────────────

export const handleOpenAddForm = (state: CalendarViewState, payload: { open: boolean; prefill?: AddFormPrefill }): CalendarViewState => {
    return {
        ...state,
        addFormOpen: payload.open,
        addFormPrefill: payload.open ? (payload.prefill ?? null) : null,
        addFormCloseAfterMutationsRemaining: 0,
    }
}

export const handleToggleEditForm = (state: CalendarViewState, payload: { open: boolean; item: Appointment | null }): CalendarViewState => {
    const { open, item } = payload;
    return {
        ...state,
        editForm: {
            open,
            item,
        },
    }
}

export const handleSetViewType = (state: CalendarViewState, payload: AppointmentViewType): CalendarViewState => {
    return {
        ...state,
        viewType: payload,
    }
}

export const handleViewMode = (state: CalendarViewState, payload: AppointmentViewMode): CalendarViewState => {
    const next = { ...state, viewMode: payload };
    if (payload === AppointmentViewMode.MONTH && state.selectedDate) {
        const d = state.selectedDate;
        next.displayedMonthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    }
    if (payload === AppointmentViewMode.WEEK && state.selectedDate) {
        next.displayedWeekStart = getWeekStart(state.selectedDate);
    }
    return next;
}

const handleSetDisplayedMonth = (state: CalendarViewState, payload: Date): CalendarViewState => {
    return { ...state, displayedMonthStart: payload, sidebarMiniCalendarMonthStart: payload };
}

const handleSetDisplayedWeek = (state: CalendarViewState, payload: Date): CalendarViewState => {
    // Sync mini calendar to the month that contains the new week
    const miniMonth = new Date(payload.getFullYear(), payload.getMonth(), 1);
    return { ...state, displayedWeekStart: payload, sidebarMiniCalendarMonthStart: miniMonth };
}

// --- Location-first design handlers ---

const handleSetSelectedLocation = (state: CalendarViewState, payload: number | null): CalendarViewState => {
    return {
        ...state,
        selectedLocationId: payload,
        // Clear stale data when switching locations
        locationContext: null,
        locationContextLoading: payload !== null,
        locationServices: [],
        locationTeamMembers: [],
        summary: {},
        dayData: null,
        weekData: null,
        dayFilters: initialDayFilters,
        staffFilter: [],
        optimisticBlocks: [],
        sidebarMiniCalendarMonthStart: null,
        pendingDrop: null,
    }
}

const handleSetLocationContext = (state: CalendarViewState, payload: LocationContextData | null): CalendarViewState => {
    return {
        ...state,
        locationContext: payload,
        locationContextLoading: false,
        locationServices: (payload?.services ?? []) as LocationService[],
        locationTeamMembers: (payload?.teamMembers ?? []) as LocationTeamMember[],
        locationBundles: payload?.bundles ?? [],
    };
}

const handleSetLocationContextLoading = (state: CalendarViewState, payload: boolean): CalendarViewState => {
    return {
        ...state,
        locationContextLoading: payload,
    }
}

const handleSetSummary = (state: CalendarViewState, payload: Record<string, DaySummary>): CalendarViewState => {
    return {
        ...state,
        summary: payload,
        summaryLoading: false,
    }
}

const handleSetSummaryLoading = (state: CalendarViewState, payload: boolean): CalendarViewState => {
    return {
        ...state,
        summaryLoading: payload,
    }
}

const handleSetDayData = (state: CalendarViewState, payload: DayDataResponse | null): CalendarViewState => {
    const summary = payload?.miniSummary
        ? { ...state.summary, ...payload.miniSummary }
        : state.summary;
    return {
        ...state,
        dayData: payload,
        dayDataLoading: false,
        summary,
    };
}

const handleSetDayDataLoading = (state: CalendarViewState, payload: boolean): CalendarViewState => {
    return {
        ...state,
        dayDataLoading: payload,
    }
}

const handleSetDayFilters = (state: CalendarViewState, payload: CalendarDayFilters): CalendarViewState => {
    return {
        ...state,
        dayFilters: payload,
    }
}

const handleSetSelectedDate = (state: CalendarViewState, payload: Date): CalendarViewState => {
    const miniMonth = new Date(payload.getFullYear(), payload.getMonth(), 1);
    return {
        ...state,
        selectedDate: payload,
        displayedWeekStart: getWeekStart(payload),
        displayedMonthStart: miniMonth,
        sidebarMiniCalendarMonthStart: miniMonth,
    }
}

const handleSetSelectedAppointment = (state: CalendarViewState, payload: Appointment | null): CalendarViewState => {
    return {
        ...state,
        selectedAppointment: payload,
        selectedAppointmentLoading: false,
    }
}

const handleToggleBlockForm = (state: CalendarViewState, payload: boolean): CalendarViewState => {
    return {
        ...state,
        blockFormOpen: payload,
        blockFormEditingBlock: payload ? state.blockFormEditingBlock : null,
    }
}

// --- Week data handlers ---

const handleSetWeekData = (state: CalendarViewState, payload: CalendarWeekResponse): CalendarViewState => {
    const summary = payload.miniSummary
        ? { ...state.summary, ...payload.miniSummary }
        : state.summary;
    return {
        ...state,
        weekData: payload.days,
        weekDataLoading: false,
        summary,
    };
}

const handleSetWeekDataLoading = (state: CalendarViewState, payload: boolean): CalendarViewState => {
    return {
        ...state,
        weekDataLoading: payload,
    }
}

// --- Sidebar / staff filter handlers ---

const handleToggleSidebar = (state: CalendarViewState, payload: boolean): CalendarViewState => {
    return {
        ...state,
        sidebarOpen: payload,
    }
}

const handleSetStaffFilter = (state: CalendarViewState, payload: number[]): CalendarViewState => {
    return {
        ...state,
        staffFilter: payload,
    }
}

const handleSetUpdateConflictOffer = (state: CalendarViewState, payload: { appointmentId: number; data: Record<string, unknown>; message: string; conflictType?: 'staff_appointment' | 'block' } | null): CalendarViewState => {
    return { ...state, updateConflictOffer: payload };
}

const clearUpdateConflictOffer = (state: CalendarViewState): CalendarViewState => {
    return state.updateConflictOffer === null ? state : { ...state, updateConflictOffer: null };
}

/** After a successful appointment mutation, count down and close add form when the counter reaches 0. */
const decrementAddFormCloseAfterMutations = (state: CalendarViewState): CalendarViewState => {
    if (state.addFormCloseAfterMutationsRemaining <= 0) return state;
    const remaining = state.addFormCloseAfterMutationsRemaining - 1;
    if (remaining === 0 && state.addFormOpen) {
        return {
            ...state,
            addFormCloseAfterMutationsRemaining: 0,
            addFormOpen: false,
            addFormPrefill: null,
        };
    }
    return { ...state, addFormCloseAfterMutationsRemaining: remaining };
};

const clearAddFormMutationWait = (state: CalendarViewState): CalendarViewState => {
    if (state.addFormCloseAfterMutationsRemaining <= 0) return state;
    return { ...state, addFormCloseAfterMutationsRemaining: 0 };
};

// ─────────────────────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────────────────────

export const CalendarReducer: Reducer<CalendarViewState, any> = (state: CalendarViewState = initialState, action: Actions) => {
    switch (action.type) {
        // Reset state on logout to prevent stale data across accounts
        case getType(logoutRequestAction.success):
            return { ...initialState };

        // --- UI actions ---
        case getType(actions.toggleAddForm):
            return handleOpenAddForm(state, action.payload);
        case getType(actions.toggleEditFormAction):
            return handleToggleEditForm(state, action.payload);
        case getType(actions.setViewTypeAction):
            return handleSetViewType(state, action.payload);
        case getType(actions.hydrateCalendarDisplayPreferencesAction): {
            const { viewMode, viewType } = action.payload;
            const withMode = handleViewMode(state, viewMode);
            return handleSetViewType(withMode, viewType);
        }
        case getType(actions.setViewModeAction):
            return handleViewMode(state, action.payload);

        // --- Location-first calendar ---
        case getType(actions.setSelectedLocationAction):
            return handleSetSelectedLocation(state, action.payload);

        case getType(actions.fetchLocationContext.request):
            return handleSetLocationContextLoading(state, true);
        case getType(actions.fetchLocationContext.success):
            return handleSetLocationContext(state, action.payload);
        case getType(actions.fetchLocationContext.failure):
            return handleSetLocationContextLoading(state, false);

        case getType(actions.fetchCalendarSummary.request):
            return handleSetSummaryLoading(state, true);
        case getType(actions.fetchCalendarSummary.success):
            return handleSetSummary(state, action.payload);
        case getType(actions.fetchCalendarSummary.failure):
            return handleSetSummaryLoading(state, false);

        case getType(actions.mergeCalendarSummaryAction):
            return {
                ...state,
                summary: { ...state.summary, ...action.payload },
            };

        case getType(actions.setSidebarMiniCalendarMonthAction):
            return { ...state, sidebarMiniCalendarMonthStart: action.payload };

        case getType(actions.fetchDayData.request):
            return handleSetDayDataLoading(state, true);
        case getType(actions.fetchDayData.success):
            return { ...handleSetDayData(state, action.payload), pendingDrop: null, optimisticBlocks: [] };
        case getType(actions.fetchDayData.failure):
            return {
                ...handleSetDayDataLoading(state, false),
                pendingDrop: null,
                optimisticBlocks: [],
            };

        case getType(actions.setDayFiltersAction):
            return handleSetDayFilters(state, action.payload);
        case getType(actions.setSelectedDateAction):
            return handleSetSelectedDate(state, action.payload);
        case getType(actions.navigateToCalendarDateAction): {
            const { date, viewMode: vm } = action.payload;
            const next: CalendarViewState = { ...state, selectedDate: date, viewMode: vm };
            if (vm === AppointmentViewMode.MONTH) {
                next.displayedMonthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            }
            if (vm === AppointmentViewMode.WEEK) {
                next.displayedWeekStart = getWeekStart(date);
            }
            return next;
        }
        case getType(actions.setDisplayedMonthAction):
            return handleSetDisplayedMonth(state, action.payload);
        case getType(actions.setDisplayedWeekAction):
            return handleSetDisplayedWeek(state, action.payload);
        case getType(actions.setSelectedAppointmentAction):
            return handleSetSelectedAppointment(state, action.payload);
        case getType(actions.toggleBlockFormAction):
            return handleToggleBlockForm(state, action.payload);

        case getType(actions.setBlockFormEditingAction):
            return { ...state, blockFormEditingBlock: action.payload };

        // --- Week data ---
        case getType(actions.fetchWeekData.request):
            return handleSetWeekDataLoading(state, true);
        case getType(actions.fetchWeekData.success):
            return { ...handleSetWeekData(state, action.payload), pendingDrop: null, optimisticBlocks: [] };
        case getType(actions.fetchWeekData.failure):
            return {
                ...handleSetWeekDataLoading(state, false),
                pendingDrop: null,
                optimisticBlocks: [],
            };

        // --- Sidebar / Staff filter ---
        case getType(actions.toggleCalendarSidebar):
            return handleToggleSidebar(state, action.payload);
        case getType(actions.setStaffFilter):
            return handleSetStaffFilter(state, action.payload);

        // --- Update conflict offer (409 override flow) ---
        case getType(actions.setUpdateConflictOffer):
            return handleSetUpdateConflictOffer(state, action.payload);
        case getType(actions.setCalendarPendingDrop):
            return { ...state, pendingDrop: action.payload };
        case getType(actions.beginAddFormCloseAfterMutations):
            return { ...state, addFormCloseAfterMutationsRemaining: action.payload };
        case getType(actions.updateAppointment.request):
            return clearUpdateConflictOffer(state);
        case getType(actions.updateAppointment.success): {
            const cleared = clearUpdateConflictOffer(state);
            return decrementAddFormCloseAfterMutations(cleared);
        }
        case getType(actions.updateAppointment.failure):
            return clearAddFormMutationWait(state);

        // --- CRUD result handling ---
        case getType(actions.adminCreateAppointmentGroup.success):
            return { ...state, addFormOpen: false, addFormPrefill: null };

        case getType(actions.createCalendarBlock.success): {
            const createdBlock = action.payload?.block ?? action.payload;
            return {
                ...state,
                optimisticBlocks: [...state.optimisticBlocks, blockPayloadToDto(createdBlock)],
            };
        }

        case getType(actions.setScrollToNow):
            return { ...state, scrollToNow: action.payload };

        default:
            return state;
    }
}
