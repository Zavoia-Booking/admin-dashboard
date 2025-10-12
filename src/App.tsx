import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import SetupWizardPage from './features/setupWizard/pages/SetupWizard'
import DashboardPage from './features/dashboard/pages/Dashboard'
import CalendarPage from './features/calendar/pages/calendar'
import LocationsPage from './features/locations/pages/locations'
import ServicesPage from './features/services/pages/services'
import TeamMembersPage from './features/teamMembers/pages/team-members'
import InvitationSuccessPage from './features/teamMembers/pages/invitation-success'
import SettingsPage from './features/settings/pages/settings'
import SettingsProfilePage from './features/settings/pages/profile'
import ProfilePage from './features/profile'
import LoginPage from './features/auth/pages/login'
import RegisterPage from './features/auth/pages/register'
import ResetPasswordPage from './features/auth/pages/reset-password'
import RegisterMemberPage from './features/auth/pages/register-member'
import ProtectedRoute from './features/auth/components/ProtectedRoute'
import GoogleOAuthCallback from './features/auth/components/GoogleOAuthCallback'
import AccountLinkingModal from './features/auth/components/AccountLinkingModal'
import InfoPageComponent from './features/settings/pages/info-page'
import AssignmentsPage from './features/assignments/pages/assignments'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProtectedRoute element={<DashboardPage />} />} />
        <Route path="/welcome" element={<ProtectedRoute element={<SetupWizardPage />} />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/team-member" element={<RegisterMemberPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<GoogleOAuthCallback />} />

        {/* Main */}
        <Route path="/dashboard" element={<ProtectedRoute element={<DashboardPage />} />} />
        <Route path="/calendar" element={<ProtectedRoute element={<CalendarPage />} />} />
        <Route path="/locations" element={<ProtectedRoute element={<LocationsPage />} />} />
        <Route path="/services" element={<ProtectedRoute element={<ServicesPage />} />} />
        <Route path="/assignments" element={<ProtectedRoute element={<AssignmentsPage />} />} />
        <Route path="/team-members" element={<ProtectedRoute element={<TeamMembersPage />} />} />
        <Route path="/settings" element={<ProtectedRoute element={<SettingsPage />} />} />
        <Route path="/settings/profile" element={<ProtectedRoute element={<SettingsProfilePage />} />} />
        <Route path="/profile" element={<ProtectedRoute element={<ProfilePage />} />} />

        {/* Info Pages */}
        <Route path="/info" element={<InfoPageComponent />} />
        <Route path="/team-members/invitation-success" element={<ProtectedRoute element={<InvitationSuccessPage />} />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/calendar" replace />} />
      </Routes>
      <AccountLinkingModal />
    </BrowserRouter>
  )
}

export default App
