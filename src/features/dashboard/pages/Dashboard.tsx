import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "../../../shared/components/layouts/app-layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/components/ui/select";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import { MapPin, Loader2 } from "lucide-react";
import {
  TodayOverviewWidget,
  NeedsAttentionWidget,
  AppointmentBreakdownWidget,
  CapacityUtilizationWidget,
  ReviewsWidget,
} from "../components";
import { fetchDashboardDataAction } from "../actions";
import { listLocationsAction } from "../../locations/actions";
import { getAllLocationsSelector, getLocationLoadingSelector } from "../../locations/selectors";
import type { RootState } from "../../../app/providers/store";

interface AnalyticsCardProps {
  children: React.ReactNode;
  className?: string;
}

function AnalyticsCard({ children, className = '' }: AnalyticsCardProps) {
  return (
    <div
      className={`
        bg-surface border border-border rounded-2xl p-5
        shadow-sm
        transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-md hover:border-border-strong
        ${className}
      `}
    >
      {children}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      {/* Row 1: Today Overview (2col) + Capacity Utilization (1col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today Overview */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-5">
          {/* Header: title + status badge + action */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-5 w-24 rounded" />
          </div>
          {/* Metrics grid: 2 columns */}
          <div className="grid grid-cols-2 gap-5 mb-4">
            {[0, 1].map(col => (
              <div key={col} className="space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-3.5 w-3.5 rounded" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
                {[0, 1, 2].map(row => (
                  <div key={row} className="flex items-center gap-2">
                    <Skeleton className="h-2.5 w-[88px] shrink-0" />
                    <Skeleton className="h-2 flex-1 rounded-full" />
                    <Skeleton className="h-2.5 w-6 shrink-0" />
                  </div>
                ))}
              </div>
            ))}
          </div>
          {/* Staff table */}
          <Skeleton className="h-px w-full mb-3" />
          <div className="space-y-2.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-32 hidden md:block" />
                <Skeleton className="h-3 w-20 hidden md:block" />
              </div>
            ))}
          </div>
        </div>

        {/* Capacity Utilization */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <Skeleton className="h-3 w-36 mb-5" />
          <div className="flex flex-row md:flex-col gap-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex items-center gap-3 flex-1">
                <Skeleton className="h-14 w-14 rounded-full shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-2.5 w-12" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-2 w-20" />
                </div>
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-5">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-1">
                <Skeleton className="h-1.5 w-1.5 rounded-full" />
                <Skeleton className="h-2 w-10" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Appointment Breakdown (full width) */}
      <div className="bg-surface border border-border rounded-2xl p-5">
        <Skeleton className="h-3 w-44 mb-4" />
        <div className="flex flex-col md:flex-row gap-5">
          {/* Left: Donut chart */}
          <div className="md:w-[30%] space-y-4">
            {/* Tabs */}
            <div className="flex gap-3">
              {[0, 1, 2].map(i => (
                <Skeleton key={i} className="h-7 w-16 rounded" />
              ))}
            </div>
            {/* Donut */}
            <div className="flex items-center justify-center">
              <div className="relative h-[180px] w-[180px]">
                <Skeleton className="h-full w-full rounded-full" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-[96px] w-[96px] rounded-full bg-surface" />
                </div>
              </div>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 justify-center">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-1">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-2 w-14" />
                </div>
              ))}
            </div>
          </div>
          {/* Divider */}
          <div className="hidden md:block w-px bg-border" />
          <div className="md:hidden h-px bg-border" />
          {/* Right: Upcoming appointments */}
          <div className="md:flex-1 space-y-3">
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-3.5 w-3.5 rounded" />
              <Skeleton className="h-3 w-40" />
            </div>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-2 w-20" />
                </div>
                <Skeleton className="h-2.5 w-12 hidden md:block" />
                <Skeleton className="h-2.5 w-10 hidden md:block" />
                <Skeleton className="h-2.5 w-14" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Reviews (1col) + Needs Attention (2col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Reviews */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-14 rounded" />
          </div>
          {/* Gauge arc */}
          <div className="flex justify-center mb-4">
            <Skeleton className="h-[100px] w-[180px] rounded-t-full rounded-b-none" />
          </div>
          {/* Gradient bar */}
          <div className="max-w-[160px] mx-auto space-y-1">
            <Skeleton className="h-[5px] w-full rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-2 w-8" />
              <Skeleton className="h-2 w-12" />
            </div>
          </div>
        </div>

        {/* Needs Attention */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-5 w-16 rounded" />
          </div>
          <div className="space-y-3">
            {[0, 1].map(i => (
              <div key={i} className="flex items-center gap-3 py-2">
                <Skeleton className="h-2 w-2 rounded-full shrink-0" />
                <Skeleton className="h-4 w-4 rounded shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-2 w-56" />
                </div>
                <Skeleton className="h-5 w-16 rounded shrink-0" />
              </div>
            ))}
            {/* Unresolved appointment rows */}
            {[0, 1, 2].map(i => (
              <div key={`appt-${i}`} className="flex items-center gap-2 py-2">
                <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2 w-24" />
                </div>
                <div className="flex gap-1.5">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-18 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { t, i18n } = useTranslation("dashboard");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { locationId } = useParams<{ locationId: string }>();

  const data = useSelector((state: RootState) => state.dashboard.data);
  const isLoading = useSelector((state: RootState) => state.dashboard.isLoading);
  const error = useSelector((state: RootState) => state.dashboard.error);

  const locations = useSelector(getAllLocationsSelector);
  const isLoadingLocations = useSelector(getLocationLoadingSelector);

  useEffect(() => {
    dispatch(listLocationsAction.request());
  }, [dispatch]);

  useEffect(() => {
    if (!locationId && locations.length > 0) {
      navigate(`/dashboard/${locations[0].id}`, { replace: true });
    }
  }, [locationId, locations, navigate]);

  useEffect(() => {
    if (locationId) {
      dispatch(fetchDashboardDataAction.request({ locationId: parseInt(locationId, 10) }));
    }
  }, [dispatch, locationId]);

  const handleLocationChange = (value: string) => {
    navigate(`/dashboard/${value}`);
  };

  const renderContent = () => {
    if (isLoadingLocations || isLoading) {
      return <DashboardSkeleton />;
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-error text-sm">{error}</p>
        </div>
      );
    }

    if (locations.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-foreground-3 text-sm">
            {t("page.noLocations")}
          </p>
        </div>
      );
    }

    if (!data) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-foreground-3" />
        </div>
      );
    }

    const { locationWidget, capacityUtilizationWidget, appointmentWidget, reviewWidget, needsAttentionWidget } = data;

    const pendingTotal =
      appointmentWidget.today.pending + appointmentWidget.week.pending;

    return (
      <div className="space-y-4">
        {/* Row 1: Today Overview (wide) + Capacity Utilization */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <AnalyticsCard className="lg:col-span-2">
            <TodayOverviewWidget
              locationId={parseInt(locationId!, 10)}
              locationName={locationWidget.name}
              isCurrentlyOpen={locationWidget.isCurrentlyOpen}
              staff={locationWidget.staff}
              appointmentsToday={locationWidget.appointmentsToday}
              appointmentsThisWeek={locationWidget.appointmentsThisWeek}
              appointmentsThisMonth={locationWidget.appointmentsThisMonth}
              potentialRevenueToday={locationWidget.potentialRevenueToday}
              potentialRevenueThisWeek={locationWidget.potentialRevenueThisWeek}
              potentialRevenueThisMonth={locationWidget.potentialRevenueThisMonth}
            />
          </AnalyticsCard>

          <AnalyticsCard>
            <CapacityUtilizationWidget
              today={capacityUtilizationWidget.today}
              week={capacityUtilizationWidget.week}
              month={capacityUtilizationWidget.month}
            />
          </AnalyticsCard>
        </div>

        {/* Row 2: Appointment Breakdown (full width) */}
        <AnalyticsCard>
          <AppointmentBreakdownWidget
            todayDistribution={appointmentWidget.today}
            weeklyDistribution={appointmentWidget.week}
            monthlyDistribution={appointmentWidget.month}
            upcomingAppointments={appointmentWidget.upcoming}
          />
        </AnalyticsCard>

        {/* Row 3: Reviews + Needs Attention */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <AnalyticsCard>
            <ReviewsWidget
              averageRating={reviewWidget.averageRating}
              totalReviews={reviewWidget.totalReviews}
              ratingDistribution={reviewWidget.ratingDistribution}
            />
          </AnalyticsCard>

          <AnalyticsCard className="lg:col-span-2">
            <NeedsAttentionWidget
              pendingAppointments={pendingTotal}
              needsAttentionItems={needsAttentionWidget ?? []}
              onAppointmentUpdated={() => {
                if (locationId) {
                  dispatch(fetchDashboardDataAction.request({ locationId: parseInt(locationId, 10) }));
                }
              }}
            />
          </AnalyticsCard>
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              {isLoadingLocations ? (
                <Skeleton className="h-7 w-48" />
              ) : (
                <Select value={locationId} onValueChange={handleLocationChange}>
                  <SelectTrigger className="w-auto min-w-[200px] h-8 text-lg font-bold border-none shadow-none px-0 focus:ring-0">
                    <SelectValue placeholder={t("page.selectLocation")} />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={String(location.id)}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <p className="text-xs text-foreground-3">
              {t("page.analyticsDashboard")} &bull;{" "}
              {new Date().toLocaleDateString(i18n.language === "ro" ? "ro-RO" : "en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {renderContent()}
      </div>
    </AppLayout>
  );
}
