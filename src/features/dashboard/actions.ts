import { createAsyncAction } from "typesafe-actions";

// Dashboard data types for the API response
export interface DashboardApiResponse {
  location: {
    name: string;
    id: number;
    isCurrentlyOpen: boolean;
  };
  todayWidget: {
    appointments: number;
    revenue: number;
    staffAvailable: number;
    staffLoadPercentage: number;
    todayDistribution: {
      pending: number;
      confirmed: number;
      completed: number;
      no_show: number;
      cancelled: number;
    };
  };
  appointmentWidget: {
    monthlyAppointments: number;
    weeklyAppointments: number;
    monthlyLoadPercentage: number;
    weeklyLoadPercentage: number;
    weeklyDistribution: {
      pending: number;
      confirmed: number;
      completed: number;
      no_show: number;
      cancelled: number;
    };
    monthlyDistribution: {
      pending: number;
      confirmed: number;
      completed: number;
      no_show: number;
      cancelled: number;
    };
  };
  revenueWidget: {
    revenueThisWeek: number;
    revenueThisMonth: number;
    monthlyLoadPercentage: number;
    weeklyLoadPercentage: number;
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
}

export const fetchDashboardDataAction = createAsyncAction(
  "DASHBOARD/FETCH_DATA_REQUEST",
  "DASHBOARD/FETCH_DATA_SUCCESS",
  "DASHBOARD/FETCH_DATA_FAILURE"
)<{ locationId: number }, DashboardApiResponse, { message: string }>();
