import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "../../../shared/components/layouts/app-layout";
import { LocationSelector } from "../../../shared/components/common/LocationSelector";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import { useIsMobile } from "../../../shared/hooks/use-mobile";
import { Loader2 } from "lucide-react";
import {
  LocationCapacityWidget,
  NeedsAttentionWidget,
  AppointmentBreakdownWidget,
  ReviewsWidget,
} from "../components";
import {
  fetchDashboardDataAction,
} from "../actions";
import { listLocationsAction } from "../../locations/actions";
import { getAllLocationsSelector, getLocationLoadingSelector } from "../../locations/selectors";
import { selectCurrentUser } from "../../auth/selectors";
import type { RootState } from "../../../app/providers/store";
import BusinessSetupGate from "../../../shared/components/guards/BusinessSetupGate";

const WIDGET_CONFIG: Record<string, { span: number }> = {
  locationCapacity: { span: 3 },
  appointmentBreakdown: { span: 3 },
  reviews: { span: 1 },
  needsAttention: { span: 2 },
};


function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      {/* Row 1: Merged Location & Capacity widget (full width) */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-5">
        {/* Header — mobile */}
        <div className="md:hidden flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        </div>
        {/* Header — desktop */}
        <div className="hidden md:flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-[10px]" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-5 w-24 rounded" />
        </div>

        {/* Today highlight — mobile (unified block) */}
        <div className="md:hidden space-y-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3.5 w-32" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-2 w-16" />
              <Skeleton className="h-2 w-20" />
            </div>
          </div>
          <Skeleton className="h-3 w-44" />
        </div>

        {/* Section divider — mobile only */}
        <div className="md:hidden h-px bg-border-subtle/60" />

        {/* Today highlight — desktop (3 plain cells) */}
        <div className="hidden md:grid grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`${i > 0 ? 'border-l border-border-subtle pl-5' : 'pr-5'} ${i === 1 ? 'pr-5' : ''} space-y-1.5`}>
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>

        {/* Metrics table — desktop (week + month only) */}
        <div className="hidden md:block">
          <Skeleton className="h-3 w-40 mb-2" />
          <div className="grid grid-cols-4 gap-4 pb-2 border-b border-border">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-2.5 w-16" />
            ))}
          </div>
          {[0, 1].map((row) => (
            <div key={row} className="grid grid-cols-4 gap-4 py-3 border-b border-border-subtle last:border-b-0">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-3 w-16" />
              <div className="space-y-1">
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-2 w-12" />
                  <Skeleton className="h-2 w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Metrics rows — mobile */}
        <div className="md:hidden space-y-3">
          <Skeleton className="h-3 w-40" />
          {[0, 1].map((i) => (
            <div key={i} className="space-y-2 py-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-2 w-12" />
                <Skeleton className="h-2 w-16" />
              </div>
            </div>
          ))}
        </div>

        {/* Staff list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-9 w-28 rounded-full" />
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-2.5 w-28" />
              </div>
              <Skeleton className="h-4 w-4" />
            </div>
          ))}
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
              {[0, 1, 2].map((i) => (
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
              {[0, 1, 2, 3, 4].map((i) => (
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
            {[0, 1, 2, 3, 4].map((i) => (
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
            {[0, 1].map((i) => (
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
            {[0, 1, 2].map((i) => (
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

function groupWidgetsIntoRows(widgetIds: string[]): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentSpan = 0;

  for (const widgetId of widgetIds) {
    const span = WIDGET_CONFIG[widgetId]?.span || 1;

    if (currentSpan + span > 3) {
      if (currentRow.length > 0) {
        rows.push(currentRow);
      }
      currentRow = [widgetId];
      currentSpan = span;
    } else {
      currentRow.push(widgetId);
      currentSpan += span;
    }
  }

  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  return rows;
}

function renderWidget(
  widgetId: string,
  data: any,
  locationId: number,
  onRefresh: () => void,
  businessCurrency: string
) {
  const {
    locationWidget,
    capacityUtilizationWidget,
    appointmentWidget,
    reviewWidget,
    needsAttentionWidget,
  } = data;

  const pendingTotal =
    appointmentWidget.today.pending + appointmentWidget.week.pending;

  const widgets: Record<string, React.ReactNode> = {
    locationCapacity: (
      <LocationCapacityWidget
        locationId={locationId}
        locationName={locationWidget.name}
        isCurrentlyOpen={locationWidget.isCurrentlyOpen}
        staff={locationWidget.staff}
        appointmentsToday={locationWidget.appointmentsToday}
        appointmentsThisWeek={locationWidget.appointmentsThisWeek}
        appointmentsThisMonth={locationWidget.appointmentsThisMonth}
        potentialRevenueToday={locationWidget.potentialRevenueToday}
        potentialRevenueThisWeek={locationWidget.potentialRevenueThisWeek}
        potentialRevenueThisMonth={locationWidget.potentialRevenueThisMonth}
        capacity={capacityUtilizationWidget}
        nextAppointment={appointmentWidget.upcoming?.[0] ?? null}
        businessCurrency={businessCurrency}
      />
    ),
    appointmentBreakdown: (
      <AppointmentBreakdownWidget
        todayDistribution={appointmentWidget.today}
        weeklyDistribution={appointmentWidget.week}
        monthlyDistribution={appointmentWidget.month}
        upcomingAppointments={appointmentWidget.upcoming}
        businessCurrency={businessCurrency}
      />
    ),
    reviews: (
      <ReviewsWidget
        averageRating={reviewWidget.averageRating}
        totalReviews={reviewWidget.totalReviews}
        ratingDistribution={reviewWidget.ratingDistribution}
      />
    ),
    needsAttention: (
      <NeedsAttentionWidget
        pendingAppointments={pendingTotal}
        needsAttentionItems={needsAttentionWidget ?? []}
        onAppointmentUpdated={onRefresh}
      />
    ),
  };

  return widgets[widgetId] || null;
}

export default function DashboardPage() {
  const { t, i18n } = useTranslation("dashboard");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { locationId } = useParams<{ locationId: string }>();
  const isMobile = useIsMobile();

  const data = useSelector((state: RootState) => state.dashboard.data);
  const isLoading = useSelector((state: RootState) => state.dashboard.isLoading);
  const error = useSelector((state: RootState) => state.dashboard.error);

  const locations = useSelector(getAllLocationsSelector);
  const isLoadingLocations = useSelector(getLocationLoadingSelector);
  const currentUser = useSelector(selectCurrentUser);
  const businessCurrency = currentUser?.business?.businessCurrency || 'eur';

  const defaultWidgetOrder = ["locationCapacity", "appointmentBreakdown", "reviews", "needsAttention"];

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

  const handleLocationChange = (id: number) => {
    navigate(`/dashboard/${id}`);
  };

  const handleRefreshDashboard = () => {
    if (locationId) {
      dispatch(fetchDashboardDataAction.request({ locationId: parseInt(locationId, 10) }));
    }
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
          <p className="text-foreground-3 text-sm">{t("page.noLocations")}</p>
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

    // Show grid layout with default widget order
    const rows = groupWidgetsIntoRows(defaultWidgetOrder);

    return (
      <div className="space-y-4">
        {rows.map((row, rowIndex) => {
          const totalSpan = row.reduce((sum, widgetId) => sum + (WIDGET_CONFIG[widgetId]?.span || 1), 0);
          const colSpanClass = totalSpan === 3 ? "lg:grid-cols-3" : "grid-cols-1";

          return (
            <div key={rowIndex} className={`grid grid-cols-1 ${colSpanClass} gap-4`}>
              {row.map((widgetId) => {
                const span = WIDGET_CONFIG[widgetId]?.span || 1;
                const colSpanUtil = span === 2 ? "lg:col-span-2" : span === 3 ? "lg:col-span-3" : "";

                return (
                  <div key={widgetId} className={`
                    bg-surface border border-border rounded-2xl p-5
                    shadow-sm
                    transition-all duration-200
                    md:hover:-translate-y-0.5 md:hover:shadow-md md:hover:border-border-strong
                    ${colSpanUtil}
                  `}>
                    {renderWidget(widgetId, data, parseInt(locationId!, 10), handleRefreshDashboard, businessCurrency)}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const locationSelectorNode = (
    <LocationSelector
      locations={locations}
      selectedLocationId={locationId ? parseInt(locationId, 10) : null}
      onSelect={handleLocationChange}
      isLoading={isLoadingLocations}
      placeholder={t("page.selectLocation")}
    />
  );

  return (
    <AppLayout headerTitleContent={isMobile ? locationSelectorNode : undefined}>
      <BusinessSetupGate>
        <div className="space-y-5">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-0">
            <div className="space-y-1 min-w-0">
              {!isMobile && (
                <div className="w-full sm:w-[280px]">
                  {locationSelectorNode}
                </div>
              )}
              <p className="hidden md:block text-xs text-foreground-3 py-4">
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
      </BusinessSetupGate>
    </AppLayout>
  );
}
