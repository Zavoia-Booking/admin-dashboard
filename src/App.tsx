import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './features/auth/components/ProtectedRoute'
import PublicRoute from './features/auth/components/PublicRoute'
import AccountLinkingModal from './features/auth/components/AccountLinkingModal'
import AccountLinkingRequiredModal from './features/auth/components/AccountLinkingRequiredModal'
import BusinessSelectorModal from './features/auth/components/BusinessSelectorModal'
import { Spinner } from './shared/components/ui/spinner'

// Lazy-loaded pages (each route becomes a separate chunk)
const SetupWizardPage = lazy(() => import('./features/setupWizard/pages/SetupWizard'))
const DashboardPage = lazy(() => import('./features/dashboard/pages/Dashboard'))
const CalendarPage = lazy(() => import('./features/calendar/pages/calendar'))
const LocationsPage = lazy(() => import('./features/locations/pages/locations'))
const ServicesPage = lazy(() => import('./features/services/pages/services'))
const TeamMembersPage = lazy(() => import('./features/teamMembers/pages/team-members'))
const InvitationSuccessPage = lazy(() => import('./features/teamMembers/pages/invitation-success'))
const SettingsPage = lazy(() => import('./features/settings/pages/settings'))
const LoginPage = lazy(() => import('./features/auth/pages/login'))
const RegisterPage = lazy(() => import('./features/auth/pages/register'))
const ResetPasswordPage = lazy(() => import('./features/auth/pages/reset-password'))
const GoogleOAuthCallback = lazy(() => import('./features/auth/components/GoogleOAuthCallback'))
const InfoPageComponent = lazy(() => import('./features/settings/pages/info-page'))
const AssignmentsPage = lazy(() => import('./features/assignments/pages/assignments'))
const VerifyEmailPage = lazy(() => import('./features/auth/pages/verify-email'))
const LinkBusinessAccountPage = lazy(() => import('./features/auth/pages/link-business-account'))
const TeamInvitationPage = lazy(() => import('./features/auth/pages/team-invitation'))
const SupportPage = lazy(() => import('./features/support/pages/support'))
const CustomersPage = lazy(() => import('./features/customers/pages/customers'))
const MarketplacePage = lazy(() => import('./features/marketplace/pages/marketplace'))

// Team Member Only Pages
const MyAssignmentsPage = lazy(() => import('./features/team-member-pages/myAssignments/pages/my-assignments'))
const MyCustomersPage = lazy(() => import('./features/team-member-pages/myCustomers/pages/my-customers'))
const MyProfilePage = lazy(() => import('./features/team-member-pages/myProfile/pages/my-profile'))
const MySettingsPage = lazy(() => import('./features/team-member-pages/mySettings/pages/my-settings'))

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<ProtectedRoute element={<DashboardPage />} />} />
          <Route path="/welcome" element={<ProtectedRoute element={<SetupWizardPage />} />} />

          {/* Auth */}
          <Route path="/login" element={<PublicRoute element={<LoginPage />} />} />
          <Route path="/register" element={<PublicRoute element={<RegisterPage />} />} />
          <Route path="/team-invitation" element={<TeamInvitationPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/link-business-account" element={<LinkBusinessAccountPage />} />
          <Route path="/auth/callback" element={<GoogleOAuthCallback />} />

          {/* Main */}
          <Route path="/dashboard" element={<ProtectedRoute element={<DashboardPage />} />} />
          <Route path="/calendar" element={<ProtectedRoute element={<CalendarPage />} />} />
          <Route path="/locations" element={<ProtectedRoute element={<LocationsPage />} />} />
          <Route path="/services" element={<ProtectedRoute element={<ServicesPage />} />} />
          <Route path="/assignments" element={<ProtectedRoute element={<AssignmentsPage />} />} />
          <Route path="/team-members" element={<ProtectedRoute element={<TeamMembersPage />} />} />
          <Route path="/customers" element={<ProtectedRoute element={<CustomersPage />} />} />
          <Route path="/marketplace" element={<ProtectedRoute element={<MarketplacePage />} />} />
          <Route path="/support" element={<ProtectedRoute element={<SupportPage />} />} />
          <Route path="/settings" element={<ProtectedRoute element={<SettingsPage />} />} />

          {/* Team Member Only */}
          <Route path="/my-assignments" element={<ProtectedRoute element={<MyAssignmentsPage />} />} />
          <Route path="/my-customers" element={<ProtectedRoute element={<MyCustomersPage />} />} />
          <Route path="/my-profile" element={<ProtectedRoute element={<MyProfilePage />} />} />
          <Route path="/my-settings" element={<ProtectedRoute element={<MySettingsPage />} />} />

          {/* Info Pages */}
          <Route path="/info" element={<InfoPageComponent />} />
          <Route path="/team-members/invitation-success" element={<ProtectedRoute element={<InvitationSuccessPage />} />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/calendar" replace />} />
        </Routes>
      </Suspense>
      <AccountLinkingModal />
      <BusinessSelectorModal />
      <AccountLinkingRequiredModal />
    </BrowserRouter>
  )
}

export default App
