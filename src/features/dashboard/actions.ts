import { createAsyncAction } from "typesafe-actions";

export interface StaffSnapshot {
  userId: number;
  lastName: string;
  userUuid: string;
  firstName: string;
  profileImage: string | null;
  professionalTitle?: string | null;
}

export interface CustomerSnapshot {
  email: string;
  phone: string;
  userId: number;
  lastName: string;
  userUuid: string;
  firstName: string;
  profileImage: string | null;
}

export interface AppointmentDistribution {
  pending: number;
  confirmed: number;
  completed: number;
  no_show: number;
  cancelled: number;
}

export interface UpcomingAppointment {
  uuid: string;
  bookedItemName: string;
  scheduledAt: string;
  endsAt: string;
  duration: number;
  price: number;
  status: string;
  staffSnapshot: StaffSnapshot[];
  customerSnapshot: CustomerSnapshot | null;
}

export interface LocationStaffMember {
  firstName: string;
  lastName: string;
  profileImage: string | null;
  email: string;
  phone: string;
  /** Invited but has not accepted yet — no name, no phone, no bookings. */
  invitationPending?: boolean;
}

export interface UnresolvedAppointment {
  id: number;
  uuid: string;
  bookedItemName: string;
  scheduledAt: string;
  endsAt: string;
  status: string;
  customerSnapshot: CustomerSnapshot | null;
  staffSnapshot: StaffSnapshot[];
}

export interface NeedsAttentionItem {
  type: string;
  count: number;
  appointments: UnresolvedAppointment[];
}

export interface CapacityPeriod {
  filledPercentage: number;
  availablePercentage: number;
  /**
   * False when the period has no capacity to measure against — no opening hours,
   * or nobody assigned to work them. Optional so a response from an API that
   * predates the flag is treated as "measured" rather than "unknown".
   */
  hasCapacityData?: boolean;
}

export interface DashboardApiResponse {
  locationWidget: {
    name: string;
    id: number;
    isCurrentlyOpen: boolean;
    staff: LocationStaffMember[] | null;
    appointmentsToday: number;
    appointmentsThisWeek: number;
    appointmentsThisMonth: number;
    potentialRevenueToday: number;
    potentialRevenueThisWeek: number;
    potentialRevenueThisMonth: number;
  };
  capacityUtilizationWidget: {
    today: CapacityPeriod;
    week: CapacityPeriod;
    month: CapacityPeriod;
  };
  appointmentWidget: {
    today: AppointmentDistribution;
    week: AppointmentDistribution;
    month: AppointmentDistribution;
    upcoming: UpcomingAppointment[];
  };
  reviewWidget: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
      "5": number;
      "4": number;
      "3": number;
      "2": number;
      "1": number;
    };
  };
  needsAttentionWidget: NeedsAttentionItem[];
}

export const fetchDashboardDataAction = createAsyncAction(
  "DASHBOARD/FETCH_DATA_REQUEST",
  "DASHBOARD/FETCH_DATA_SUCCESS",
  "DASHBOARD/FETCH_DATA_FAILURE"
)<{ locationId: number }, DashboardApiResponse, { message: string }>();
