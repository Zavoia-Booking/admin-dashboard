import { AppLayout } from "../../../shared/components/layouts/app-layout"
import { Card, CardContent } from "../../../shared/components/ui/card"
import { Badge } from "../../../shared/components/ui/badge"
import { MapPin } from "lucide-react"
import {
  TodayOverview,
  AppointmentMetrics,
  RevenueAnalytics,
  ReviewsRatings
} from "../components"
import { mockDashboardData } from "../mockData"

export default function DashboardPage() {
  const data = mockDashboardData;

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h1 className="text-lg font-bold text-foreground-1">{data.locationName}</h1>
              <Badge className={`text-xs ${data.isCurrentlyOpen ? 'bg-success' : 'bg-error'}`}>
                {data.isCurrentlyOpen ? 'Open' : 'Closed'}
              </Badge>
            </div>
            <p className="text-xs text-foreground-3 mt-1">
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
                appointments={data.todayAppointments}
                revenueToday={data.revenueToday}
                isCurrentlyOpen={data.isCurrentlyOpen}
                staffAvailable={data.staffAvailableToday}
                staffLoadPercentage={data.staffLoadPercentage}
              />
            </CardContent>
          </Card>

          {/* Appointment Metrics */}
          <Card>
            <CardContent className="py-2 px-3">
              <AppointmentMetrics
                weeklyAppointments={data.weeklyAppointments}
                monthlyAppointments={data.monthlyAppointments}
                weeklyLoadPercentage={data.weeklyLoadPercentage}
                monthlyLoadPercentage={data.monthlyLoadPercentage}
              />
            </CardContent>
          </Card>

          {/* Revenue Analytics */}
          <Card>
            <CardContent className="py-2 px-3">
              <RevenueAnalytics
                revenueThisWeek={data.revenueThisWeek}
                revenueThisMonth={data.revenueThisMonth}
                revenueLastMonth={data.revenueLastMonth}
                averageTicketValue={data.averageTicketValue}
              />
            </CardContent>
          </Card>

          {/* Reviews & Ratings */}
          <Card>
            <CardContent className="py-2 px-3">
              <ReviewsRatings
                averageRating={data.averageRating}
                totalReviews={data.totalReviews}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
