import { lazy, Suspense, useEffect } from 'react'
import { createBrowserRouter, createRoutesFromElements, Navigate, Outlet, Route, RouterProvider, useLocation, useRouteError } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from './shared/components/ui/button'
import ProtectedRoute from './features/auth/components/ProtectedRoute'
import { warmMainRoutes } from './shared/utils/routePreload'
import { getHomeRouteForRole } from './shared/lib/permissions'
import { usePermissions } from './shared/hooks/usePermissions'
import PublicRoute from './features/auth/components/PublicRoute'
import AccountLinkingModal from './features/auth/components/AccountLinkingModal'
import AccountLinkingRequiredModal from './features/auth/components/AccountLinkingRequiredModal'
import BusinessSelectorModal from './features/auth/components/BusinessSelectorModal'
import SeatOverflowGate from './features/teamMembers/components/SeatOverflowGate'
import SeatOverflowDetector from './features/teamMembers/components/SeatOverflowDetector'
import { SubscriptionBlocker } from './shared/components/common/subscription/SubscriptionBlocker'
import PushListenersBootstrap from './features/push-notifications/PushListenersBootstrap'
import PushPrimerSheet from './features/push-notifications/PushPrimerSheet'
import SplashGate from './shared/components/splash/SplashGate'
import { MobileBottomNav } from './shared/components/navigation/mobile-bottom-nav'
import { useIsMobile } from './shared/hooks/use-mobile'
import { Spinner } from './shared/components/ui/spinner'
import { Toaster } from './shared/components/ui/sonner'

// Lazy-loaded pages (each route becomes a separate chunk)
const SetupWizardPage = lazy(() => import('./features/setupWizard/pages/SetupWizard'))
const DashboardPage = lazy(() => import('./features/dashboard/pages/Dashboard'))
const CalendarPage = lazy(() => import('./features/calendar/pages/calendar'))
const LocationsPage = lazy(() => import('./features/locations/pages/locations'))
const ServicesPage = lazy(() => import('./features/services/pages/services'))
const TeamMembersPage = lazy(() => import('./features/teamMembers/pages/team-members'))
const InvitationSuccessPage = lazy(() => import('./features/teamMembers/pages/invitation-success'))
const SettingsPage = lazy(() => import('./features/settings/pages/settings'))
const AuthLayout = lazy(() => import('./features/auth/components/AuthLayout').then(m => ({ default: m.AuthLayout })))
const LoginForm = lazy(() => import('./features/auth/components/login-form').then(m => ({ default: m.LoginForm })))
const RegisterPage = lazy(() => import('./features/auth/pages/register'))
const ResetPasswordPage = lazy(() => import('./features/auth/pages/reset-password'))
const GoogleOAuthCallback = lazy(() => import('./features/auth/components/GoogleOAuthCallback'))
const InfoPageComponent = lazy(() => import('./features/settings/pages/info-page'))
const AccountWebInfoPage = lazy(() => import('./features/settings/pages/AccountWebInfoPage'))
const AssignmentsPage = lazy(() => import('./features/assignments/pages/assignments'))
const VerifyEmailPage = lazy(() => import('./features/auth/pages/verify-email'))
const LinkBusinessAccountPage = lazy(() => import('./features/auth/pages/link-business-account'))
const TeamInvitationPage = lazy(() => import('./features/auth/pages/team-invitation'))
const SupportPage = lazy(() => import('./features/support/pages/support'))
const CustomersPage = lazy(() => import('./features/customers/pages/customers'))
const MarketplacePage = lazy(() => import('./features/marketplace/pages/marketplace'))
const WebsitePage = lazy(() => import('./features/website/pages/website'))
const LegalPage = lazy(() => import('./features/legal/pages/legal-page'))

// Notifications
const NotificationsPage = lazy(() => import('./features/notifications/pages/notifications'))

// Team Member Only Pages
const MyAssignmentsPage = lazy(() => import('./features/team-member-pages/myAssignments/pages/my-assignments'))
const MyProfilePage = lazy(() => import('./features/team-member-pages/myProfile/pages/my-profile'))
const MyAccountPage = lazy(() => import('./features/team-member-pages/myAccount/pages/my-account'))

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}

/**
 * Router-level crash screen: catches render errors on any route, including
 * lazy-chunk 404s from a stale tab across a deploy (offered as "new version").
 */
function RouteErrorFallback() {
  const error = useRouteError()
  const { t } = useTranslation('common')
  console.error('Route error:', error)

  return (
    <div
      role="alert"
      aria-atomic="true"
      className="flex min-h-dvh flex-col items-center justify-center px-6 pb-[10vh] text-center"
    >
      <div className="flex items-center gap-2">
        <AlertCircle className="size-5 shrink-0 text-error" aria-hidden="true" />
        <h1 className="text-lg font-semibold tracking-tight text-foreground-1">
          {t('errorState.title')}
        </h1>
      </div>
      <p className="mt-1.5 max-w-sm text-balance text-sm leading-relaxed text-foreground-2">
        {t('errorState.crashBody')}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => window.location.reload()}
        className="mt-6 min-h-10 font-medium md:min-h-9"
      >
        <RotateCcw className="size-3.5" aria-hidden="true" />
        {t('errorState.reload')}
      </Button>
    </div>
  )
}

/**
 * Root layout route: the shared chrome that used to live directly inside BrowserRouter.
 * splash-app-root wraps every route so the splash exit can rise the page up into view as a
 * single unit; the account/seat/subscription modals ride along on every route.
 */
function RootLayout() {
  const location = useLocation()
  const isWebsiteBuilder = location.pathname === '/website'

  // Warm the main flows' chunks once the browser is idle, so navigating to one
  // never suspends into the full-screen RouteFallback spinner.
  useEffect(() => {
    const start = () => { void warmMainRoutes() }
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(start, { timeout: 4000 })
      return () => window.cancelIdleCallback(id)
    }
    const id = window.setTimeout(start, 2000)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <>
      <div className="splash-app-root">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </div>
      <AccountLinkingModal />
      <BusinessSelectorModal />
      <AccountLinkingRequiredModal />
      <SeatOverflowDetector />
      <SeatOverflowGate />
      <SubscriptionBlocker />
      <PushListenersBootstrap />
      <PushPrimerSheet />
      <SplashGate />
      <Toaster
        position="top-right"
        // Keep toasts below the native status bar; the stable var survives
        // keyboard-open env() collapses (see shared/lib/safeArea.ts). 0 on web.
        offset={{ top: "calc(var(--safe-area-top-stable, env(safe-area-inset-top)) + 24px)" }}
        mobileOffset={{ top: "calc(var(--safe-area-top-stable, env(safe-area-inset-top)) + 16px)" }}
        expand={isWebsiteBuilder}
        visibleToasts={isWebsiteBuilder ? 3 : undefined}
        gap={isWebsiteBuilder ? 8 : undefined}
      />
    </>
  )
}

/**
 * Pathless layout for the signed-in flows: owns the mobile bottom nav so route
 * changes reconcile it instead of remounting it — the More drawer finishes its
 * close animation and the tab indicator transitions instead of replaying its
 * mount animation. Same idea as the shared AuthLayout for /login–/register.
 *
 * The nav sits OUTSIDE its own Suspense boundary: a cold lazy chunk suspends
 * into this fallback instead of RootLayout's, so the shell teardown that
 * routePreload.ts documents can no longer unmount the nav mid-drawer-close.
 */
function AppNavLayout() {
  const isMobile = useIsMobile()
  return (
    <>
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
      {isMobile && <MobileBottomNav />}
    </>
  )
}

/**
 * The bare root is an entry alias only (native cold start loads the server root,
 * so the router mounts at "/"). Normalize to the role-aware home route so the
 * app never rests on a path the chrome route lists (Breadcrumbs back-button,
 * notification bell) don't know about.
 */
function HomeRedirect() {
  const { role } = usePermissions()
  return <Navigate to={getHomeRouteForRole(role)} replace />
}

/** Resolve the retired Marketplace Website Builder tab before Marketplace mounts or fetches. */
function MarketplaceRoute() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)

  if (params.get('tab') === 'website') {
    const websiteParams = new URLSearchParams()
    for (const key of ['session_id', 'variantPurchase', 'website_business_id', 'website_checkout_context']) {
      const value = params.get(key)
      if (value) websiteParams.set(key, value)
    }
    const search = websiteParams.toString()
    return <Navigate to={search ? `/website?${search}` : '/website'} replace />
  }

  return <ProtectedRoute element={<MarketplacePage />} />
}

// Data router (createBrowserRouter, not <BrowserRouter>): required for useBlocker — the
// route-aware unsaved-changes guard on /website (and later My Profile) depends on it.
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<RootLayout />} errorElement={<RouteErrorFallback />}>
      <Route path="/welcome" element={<ProtectedRoute element={<SetupWizardPage />} />} />

      {/* Auth — shared AuthLayout keeps the hero panel mounted across
          tab switches between /login and /register so its animation
          isn't interrupted on navigation. */}
      <Route element={<PublicRoute element={<AuthLayout />} />}>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route path="/team-invitation" element={<TeamInvitationPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/link-business-account" element={<LinkBusinessAccountPage />} />
      <Route path="/auth/callback" element={<GoogleOAuthCallback />} />

      {/* Main — shared AppNavLayout keeps the mobile bottom nav mounted across navigations */}
      <Route element={<AppNavLayout />}>
        <Route path="/" element={<ProtectedRoute element={<HomeRedirect />} />} />
        <Route path="/dashboard" element={<ProtectedRoute element={<DashboardPage />} />} />
        <Route path="/dashboard/:locationId" element={<ProtectedRoute element={<DashboardPage />} />} />
        <Route path="/calendar" element={<ProtectedRoute element={<CalendarPage />} />} />
        <Route path="/locations" element={<ProtectedRoute element={<LocationsPage />} />} />
        <Route path="/services" element={<ProtectedRoute element={<ServicesPage />} />} />
        <Route path="/assignments" element={<ProtectedRoute element={<AssignmentsPage />} />} />
        <Route path="/team-members" element={<ProtectedRoute element={<TeamMembersPage />} />} />
        <Route path="/customers" element={<ProtectedRoute element={<CustomersPage />} />} />
        <Route path="/marketplace" element={<MarketplaceRoute />} />
        <Route path="/website" element={<ProtectedRoute element={<WebsitePage />} />} />
        <Route path="/support" element={<ProtectedRoute element={<SupportPage />} />} />
        <Route path="/notifications" element={<ProtectedRoute element={<NotificationsPage />} />} />
        <Route path="/account" element={<ProtectedRoute element={<SettingsPage />} />} />

        {/* Team Member Only */}
        <Route path="/my-assignments" element={<ProtectedRoute element={<MyAssignmentsPage />} />} />
        <Route path="/my-profile" element={<ProtectedRoute element={<MyProfilePage />} />} />
        <Route path="/my-account" element={<ProtectedRoute element={<MyAccountPage />} />} />
      </Route>

      {/* Legal */}
      <Route path="/terms" element={<LegalPage />} />
      <Route path="/cookies" element={<LegalPage />} />
      <Route path="/privacy" element={<LegalPage />} />

      {/* Info Pages */}
      <Route path="/info" element={<InfoPageComponent />} />
      <Route path="/account-info" element={<ProtectedRoute element={<AccountWebInfoPage />} />} />
      <Route path="/team-members/invitation-success" element={<ProtectedRoute element={<InvitationSuccessPage />} />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/calendar" replace />} />
    </Route>,
  ),
)

function App() {
  return <RouterProvider router={router} />
}

export default App
