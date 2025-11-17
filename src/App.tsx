import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import SetupWizardPage from './features/setupWizard/pages/SetupWizard'
import DashboardPage from './features/dashboard/pages/Dashboard'
import CalendarPage from './features/calendar/pages/calendar'
import LocationsPage from './features/locations/pages/locations'
import ServicesPage from './features/services/pages/services'
import TeamMembersPage from './features/teamMembers/pages/team-members'
import InvitationSuccessPage from './features/teamMembers/pages/invitation-success'
import SettingsPage from './features/settings/pages/settings'
import LoginPage from './features/auth/pages/login'
import RegisterPage from './features/auth/pages/register'
import ResetPasswordPage from './features/auth/pages/reset-password'
import ProtectedRoute from './features/auth/components/ProtectedRoute'
import PublicRoute from './features/auth/components/PublicRoute'
import GoogleOAuthCallback from './features/auth/components/GoogleOAuthCallback'
import AccountLinkingModal from './features/auth/components/AccountLinkingModal'
import AccountLinkingRequiredModal from './features/auth/components/AccountLinkingRequiredModal'
import InfoPageComponent from './features/settings/pages/info-page'
import AssignmentsPage from './features/assignments/pages/assignments'
import VerifyEmailPage from './features/auth/pages/verify-email'
import LinkBusinessAccountPage from './features/auth/pages/link-business-account'
import BusinessSelectorModal from './features/auth/components/BusinessSelectorModal'
import TeamInvitationPage from './features/auth/pages/team-invitation'
import SupportPage from './features/support/pages/support'
import CustomersPage from './features/customers/pages/customers'
import MarketplacePage from './features/marketplace/pages/marketplace'
import { ThemeToggle } from './shared/components/common/ThemeToggle'

function App() {
  return (
    <BrowserRouter>
      <ThemeToggle />
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

        {/* Info Pages */}
        <Route path="/info" element={<InfoPageComponent />} />
        <Route path="/team-members/invitation-success" element={<ProtectedRoute element={<InvitationSuccessPage />} />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/calendar" replace />} />
      </Routes>
      <AccountLinkingModal />
      <BusinessSelectorModal />
      <AccountLinkingRequiredModal />
    </BrowserRouter>
  )
}

export default App
