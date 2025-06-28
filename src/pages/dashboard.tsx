import { AppLayout } from "@/components/layouts/app-layout"
import { UserRole } from "@/types/auth"
import { useStores } from "@/pages/_app"
import { BusinessSetupWizard } from "@/components/business-setup-wizard"

export default function DashboardPage() {
  const { authStore } = useStores()

  // Show business setup wizard if user is an owner without a business
  // if (authStore.user?.role === UserRole.OWNER && !authStore.user.businessId) {
    return (
      <AppLayout>
        <div className="container mx-auto py-10">
          <BusinessSetupWizard />
        </div>
      </AppLayout>
    )
  // }

  // Show regular dashboard for all other users
  // return (
  //   <AppLayout>
  //     <div className="container mx-auto py-10">
  //       <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
  //       <div className="grid auto-rows-min gap-4 md:grid-cols-3">
  //         <div className="bg-muted/50 aspect-video rounded-xl" />
  //         <div className="bg-muted/50 aspect-video rounded-xl" />
  //         <div className="bg-muted/50 aspect-video rounded-xl" />
  //       </div>
  //       <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min mt-4" />
  //     </div>
  //   </AppLayout>
  // )
}

// Add required roles for authentication
// DashboardPage.requireAuth = true;
// DashboardPage.requiredRoles = [UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER, UserRole.TEAM_MEMBER]; 