import { useEffect } from "react"
import { Outlet, useLocation, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { AuthShell } from "./AuthShell"
import { AuthCard } from "./AuthCard"
import { ZavoiaWordmark } from "./ZavoiaWordmark"
import { LanguageSwitcher } from "../../../shared/components/common/LanguageSwitcher"
import { LanguageDrawer } from "../../../shared/components/common/LanguageDrawer"
import { DarkModeToggle } from "../../../shared/components/common/DarkModeToggle"

/**
 * Theme + language controls grouped as a single segmented pill, fixed
 * top-right on desktop only. The outer container owns the chrome (border,
 * surface tint, backdrop blur, shadow); the two embedded buttons share the
 * shell, divided by a 1px rule. Reads as one unified "page tools" control
 * rather than two separate floating buttons.
 */
function AuthControlsCluster() {
  return (
    <div className="inline-flex items-center h-9 rounded-md border border-border/60 bg-background/70 backdrop-blur-sm shadow-sm overflow-hidden dark:shadow-none dark:bg-background/40">
      <DarkModeToggle variant="embedded" />
      <div className="h-5 w-px bg-border/60" aria-hidden="true" />
      <LanguageSwitcher variant="embedded" />
    </div>
  )
}

/**
 * Quiet footer controls for the mobile auth screen: the language drawer's
 * ghost trigger plus the muted theme toggle.
 */
function MobileAuthControls() {
  return (
    <div className="md:hidden -mt-4 flex items-center justify-center gap-1">
      <LanguageDrawer />
      <DarkModeToggle variant="quiet" />
    </div>
  )
}

/**
 * Layout for the auth routes (/login and /register). Owns the persistent
 * card shell, including the AuthHero panel — by living above the route
 * boundary, the hero stays mounted across tab switches and its animation
 * isn't interrupted when the user toggles between Sign in and Create
 * account.
 *
 * The matched child route (LoginForm or RegisterPage) renders into the
 * <Outlet /> inside the form column. Title/subtitle and toggle active
 * state are derived from the current pathname.
 */
export function AuthLayout() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { t } = useTranslation("auth")
  const mode: "login" | "register" = location.pathname.startsWith("/register") ? "register" : "login"
  const isForgotMode = mode === "login" && searchParams.get("forgot") === "1"

  const title = isForgotMode
    ? t("forgotPassword.title")
    : mode === "login"
      ? t("login.title")
      : t("register.title")
  const subtitle = isForgotMode
    ? t("forgotPassword.subtitle")
    : mode === "login"
      ? t("login.workspaceSubtitle")
      : undefined

  useEffect(() => {
    document.documentElement.classList.add("scrollbar-hide")
    document.body.classList.add("scrollbar-hide")
    return () => {
      document.documentElement.classList.remove("scrollbar-hide")
      document.body.classList.remove("scrollbar-hide")
    }
  }, [])

  return (
    <>
      <div
        className="hidden md:block fixed z-50"
        style={{
          top: "max(1rem, env(safe-area-inset-top))",
          right: "max(1rem, env(safe-area-inset-right))",
        }}
      >
        <AuthControlsCluster />
      </div>
      <AuthShell>
        {/* splash-target-wordmark: the native splash mark settles into this
         *  wordmark on exit (see splash.css login hand-off). */}
        <div className="md:hidden splash-target-wordmark">
          <ZavoiaWordmark className="h-9 w-auto text-foreground-1" />
        </div>
        <div className="splash-target-card w-full">
          <AuthCard mode={mode} title={title} subtitle={subtitle} isForgotMode={isForgotMode}>
            <Outlet />
          </AuthCard>
        </div>
        <MobileAuthControls />
      </AuthShell>
    </>
  )
}
