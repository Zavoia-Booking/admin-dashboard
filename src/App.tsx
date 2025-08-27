import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

// Pages migrated from Next.js
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect old index to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Main */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/locations" element={<LocationsPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/team-members" element={<TeamMembersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/profile" element={<SettingsProfilePage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
