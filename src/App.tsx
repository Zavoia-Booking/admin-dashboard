import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

// Pages migrated from Next.js
import DashboardPage from './pages/dashboard'
import CalendarPage from './pages/calendar'
import LocationsPage from './pages/locations'
import ServicesPage from './pages/services'
import TeamMembersPage from './pages/team-members'
import SettingsPage from './pages/settings'
import SettingsProfilePage from './pages/settings/profile'
import ProfilePage from './pages/profile'
import LoginPage from './pages/login'
import RegisterPage from './pages/register'

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
