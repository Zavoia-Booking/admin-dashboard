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
  BusinessStatusWidget,
  TodayPerformanceWidget,
  AppointmentBreakdownWidget,
  AppointmentsVolumeWidget,
  CapacityUtilizationWidget,
  RevenueSnapshotWidget,
  StaffUtilizationWidget,
  ReviewsWidget,
  WorkingHoursWidget,
  BusinessHealthSummaryWidget,
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
      {/* Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-5 h-44">
            <Skeleton className="h-3 w-24 mb-4" />
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-5 h-64">
          <Skeleton className="h-3 w-32 mb-4" />
          <div className="flex gap-4">
            <Skeleton className="h-28 w-28 rounded-full" />
            <div className="flex-1 space-y-2 pt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-full" />
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-2xl p-5 h-[calc(50%-8px)]">
            <Skeleton className="h-3 w-24 mb-4" />
            <Skeleton className="h-8 w-16" />
          </div>
          <div className="bg-surface border border-border rounded-2xl p-5 h-[calc(50%-8px)]">
            <Skeleton className="h-3 w-24 mb-4" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </div>
      {/* Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-5 h-56">
            <Skeleton className="h-3 w-24 mb-4" />
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
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

    const { location, todayWidget, appointmentWidget, revenueWidget, reviewWidget } = data;

    return (
      <div className="space-y-4">
        {/* Row 1: Business Status + Today + Revenue + Capacity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnalyticsCard>
            <BusinessStatusWidget
              name={location.name}
              isCurrentlyOpen={location.isCurrentlyOpen}
              open247={location.open247}
              timezone={location.timezone}
              workingHours={location.workingHours}
            />
          </AnalyticsCard>

          <AnalyticsCard>
            <TodayPerformanceWidget
              appointments={todayWidget.appointments}
              revenue={todayWidget.revenue}
              staffAvailable={todayWidget.staffAvailable}
              staffLoadPercentage={todayWidget.staffLoadPercentage}
            />
          </AnalyticsCard>

          <AnalyticsCard>
            <RevenueSnapshotWidget
              revenueToday={todayWidget.revenue}
              revenueThisWeek={revenueWidget.revenueThisWeek}
              revenueThisMonth={revenueWidget.revenueThisMonth}
            />
          </AnalyticsCard>

          <AnalyticsCard>
            <CapacityUtilizationWidget
              staffLoadPercentage={todayWidget.staffLoadPercentage}
              weeklyLoadPercentage={appointmentWidget.weeklyLoadPercentage}
              monthlyLoadPercentage={appointmentWidget.monthlyLoadPercentage}
            />
          </AnalyticsCard>
        </div>

        {/* Row 2: Appointment Breakdown (wide) + Volume + Staff (stacked) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <AnalyticsCard className="lg:col-span-2">
            <AppointmentBreakdownWidget
              todayDistribution={todayWidget.todayDistribution}
              weeklyDistribution={appointmentWidget.weeklyDistribution}
              monthlyDistribution={appointmentWidget.monthlyDistribution}
            />
          </AnalyticsCard>

          <div className="flex flex-col gap-4">
            <AnalyticsCard className="flex-1">
              <AppointmentsVolumeWidget
                weeklyAppointments={appointmentWidget.weeklyAppointments}
                monthlyAppointments={appointmentWidget.monthlyAppointments}
              />
            </AnalyticsCard>

            <AnalyticsCard className="flex-1">
              <StaffUtilizationWidget
                staffAvailable={todayWidget.staffAvailable}
                staffLoadPercentage={todayWidget.staffLoadPercentage}
              />
            </AnalyticsCard>
          </div>
        </div>

        {/* Row 3: Reviews + Working Hours + Business Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <AnalyticsCard>
            <ReviewsWidget
              averageRating={reviewWidget.averageRating}
              totalReviews={reviewWidget.totalReviews}
              ratingDistribution={reviewWidget.ratingDistribution}
            />
          </AnalyticsCard>

          <AnalyticsCard>
            <WorkingHoursWidget
              workingHours={location.workingHours}
              timezone={location.timezone}
              isCurrentlyOpen={location.isCurrentlyOpen}
            />
          </AnalyticsCard>

          <AnalyticsCard>
            <BusinessHealthSummaryWidget
              weeklyLoadPercentage={appointmentWidget.weeklyLoadPercentage}
              monthlyLoadPercentage={appointmentWidget.monthlyLoadPercentage}
              weeklyDistribution={appointmentWidget.weeklyDistribution}
              monthlyDistribution={appointmentWidget.monthlyDistribution}
              totalReviews={reviewWidget.totalReviews}
              monthlyAppointments={appointmentWidget.monthlyAppointments}
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
