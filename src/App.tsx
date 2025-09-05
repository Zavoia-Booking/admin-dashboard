import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import DashboardPage from './features/setupWizard/pages/dashboard'
import CalendarPage from './features/calendar/pages/calendar'
import LocationsPage from './features/locations/pages/locations'
import ServicesPage from './features/services/pages/services'
import TeamMembersPage from './features/teamMembers/pages/team-members'
import SettingsPage from './features/settings/pages/settings'
import SettingsProfilePage from './features/settings/pages/profile'
import ProfilePage from './features/profile'
import LoginPage from './features/auth/pages/login'
import RegisterPage from './features/auth/pages/register'
import ProtectedRoute from './features/auth/components/ProtectedRoute'

function App() {

  // Boot hydration is handled by AuthGate (status === IDLE) to avoid re-triggering on navigation

  return (
    <BrowserRouter>
      <Routes>

        {/* Redirect old index to dashboard */}
        <Route path="/" element={<ProtectedRoute element={<DashboardPage />} />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Main */}
        <Route path="/dashboard" element={<ProtectedRoute element={<DashboardPage />} />} />
        <Route path="/calendar" element={<ProtectedRoute element={<CalendarPage />} />} />
        <Route path="/locations" element={<ProtectedRoute element={<LocationsPage />} />} />
        <Route path="/services" element={<ProtectedRoute element={<ServicesPage />} />} />
        <Route path="/team-members" element={<ProtectedRoute element={<TeamMembersPage />} />} />
        <Route path="/settings" element={<ProtectedRoute element={<SettingsPage />} />} />
        <Route path="/settings/profile" element={<ProtectedRoute element={<SettingsProfilePage />} />} />
        <Route path="/profile" element={<ProtectedRoute element={<ProfilePage />} />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
