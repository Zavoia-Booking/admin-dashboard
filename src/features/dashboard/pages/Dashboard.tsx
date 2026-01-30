import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "../../../shared/components/layouts/app-layout"
import { Card, CardContent } from "../../../shared/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/components/ui/select"
import { MapPin, Loader2 } from "lucide-react"
import {
  TodayOverview,
  AppointmentMetrics,
  RevenueAnalytics,
  ReviewsRatings
} from "../components"
import { fetchDashboardDataAction } from "../actions"
import { listLocationsAction } from "../../locations/actions"
import { getAllLocationsSelector, getLocationLoadingSelector } from "../../locations/selectors"
import type { RootState } from "../../../app/providers/store"

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { locationId } = useParams<{ locationId: string }>();
  
  // Dashboard data
  const data = useSelector((state: RootState) => state.dashboard.data);
  const isLoading = useSelector((state: RootState) => state.dashboard.isLoading);
  const error = useSelector((state: RootState) => state.dashboard.error);

  // Locations data
  const locations = useSelector(getAllLocationsSelector);
  const isLoadingLocations = useSelector(getLocationLoadingSelector);

  // Fetch locations on mount
  useEffect(() => {
    dispatch(listLocationsAction.request());
  }, [dispatch]);

  // If no locationId in URL and locations are loaded, redirect to first location
  useEffect(() => {
    if (!locationId && locations.length > 0) {
      navigate(`/dashboard/${locations[0].id}`, { replace: true });
    }
  }, [locationId, locations, navigate]);

  // Fetch dashboard data when locationId changes
  useEffect(() => {
    if (locationId) {
      dispatch(fetchDashboardDataAction.request({ locationId: parseInt(locationId, 10) }));
    }
  }, [dispatch, locationId]);

  const handleLocationChange = (value: string) => {
    navigate(`/dashboard/${value}`);
  };

  // Show loading while fetching locations or dashboard data
  if (isLoadingLocations || isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-error">{error}</p>
        </div>
      </AppLayout>
    );
  }

  // No locations available
  if (locations.length === 0) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-foreground-3">No locations available. Please create a location first.</p>
        </div>
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-foreground-3">No dashboard data available</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-2">
            {/* Location Selector */}
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <Select value={locationId} onValueChange={handleLocationChange}>
                <SelectTrigger className="w-auto min-w-[200px] h-8 text-lg font-bold border-none shadow-none px-0 focus:ring-0">
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={String(location.id)}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-foreground-3">
              Location Dashboard • {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        {/* All Sections */}
        <div className="space-y-3">
          {/* Today's Overview */}
          <Card>
            <CardContent className="py-2 px-3">
              <TodayOverview
                appointments={data.todayWidget.appointments}
                revenue={data.todayWidget.revenue}
                staffAvailable={data.todayWidget.staffAvailable}
                staffLoadPercentage={data.todayWidget.staffLoadPercentage}
              />
            </CardContent>
          </Card>

          {/* Appointment Metrics */}
          <Card>
            <CardContent className="py-2 px-3">
              <AppointmentMetrics
                weeklyAppointments={data.appointmentWidget.weeklyAppointments}
                monthlyAppointments={data.appointmentWidget.monthlyAppointments}
                weeklyLoadPercentage={data.appointmentWidget.weeklyLoadPercentage}
                monthlyLoadPercentage={data.appointmentWidget.monthlyLoadPercentage}
              />
            </CardContent>
          </Card>

          {/* Revenue Analytics */}
          <Card>
            <CardContent className="py-2 px-3">
              <RevenueAnalytics
                revenueThisWeek={data.revenueWidget.revenueThisWeek}
                revenueThisMonth={data.revenueWidget.revenueThisMonth}
                weeklyLoadPercentage={data.revenueWidget.weeklyLoadPercentage}
                monthlyLoadPercentage={data.revenueWidget.monthlyLoadPercentage}
              />
            </CardContent>
          </Card>

          {/* Reviews & Ratings */}
          <Card>
            <CardContent className="py-2 px-3">
              <ReviewsRatings
                averageRating={data.reviewWidget.averageRating}
                totalReviews={data.reviewWidget.totalReviews}
                ratingDistribution={data.reviewWidget.ratingDistribution}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
