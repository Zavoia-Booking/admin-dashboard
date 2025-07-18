import { AppLayout } from "@/components/layouts/app-layout"
import { UserRole } from "@/types/auth"
import { useStores } from "@/pages/_app"
import { SetupWizard } from "@/components/SetupWizard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Calendar, 
  MapPin, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Plus,
  ArrowRight
} from "lucide-react"

export default function DashboardPage() {
  const { authStore } = useStores()

  // Show business setup wizard if user is an owner without a business
  // if (authStore.user?.role === UserRole.OWNER && !authStore.user.businessId) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <SetupWizard />
        </div>
      </AppLayout>
    )
  // }

  // Show regular dashboard for all other users
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome back!</h2>
          <p className="text-blue-100 mb-4">Here's what's happening with your business today.</p>
          <Button variant="secondary" size="sm" className="bg-white text-blue-600 hover:bg-gray-100">
            <Plus className="mr-2 h-4 w-4" />
            Add New Booking
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Team Members</p>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Locations</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">$2.4k</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New booking confirmed</p>
                <p className="text-xs text-gray-500">Sarah Johnson - Haircut at 2:00 PM</p>
              </div>
              <span className="text-xs text-gray-400">2 min ago</span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New team member added</p>
                <p className="text-xs text-gray-500">Mike Wilson joined as Stylist</p>
              </div>
              <span className="text-xs text-gray-400">1 hour ago</span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                <MapPin className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Location updated</p>
                <p className="text-xs text-gray-500">Downtown location hours changed</p>
              </div>
              <span className="text-xs text-gray-400">3 hours ago</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-between h-12">
              <span>View Today's Schedule</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between h-12">
              <span>Manage Team Members</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between h-12">
              <span>Update Services</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

// Add required roles for authentication
// DashboardPage.requireAuth = true;
// DashboardPage.requiredRoles = [UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER, UserRole.TEAM_MEMBER]; 