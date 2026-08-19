import { useEffect, useState } from "react"
import { Outlet, useLocation, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { openLegalPage } from "../../legal/legal-links"
import { AuthShell } from "./AuthShell"
import { AuthCard } from "./AuthCard"
import { ZavoiaWordmark } from "./ZavoiaWordmark"
import { LanguageSwitcher } from "../../../shared/components/common/LanguageSwitcher"
import { LanguageDrawer } from "../../../shared/components/common/LanguageDrawer"
import { DarkModeToggle } from "../../../shared/components/common/DarkModeToggle"
import { usePlatform } from "../../../shared/hooks/usePlatform"

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

/** Outlet context so the native register email-gate can tell AuthLayout when
 *  it has moved to its "check your inbox" state — see the subtitle logic below. */
export type AuthOutletContext = {
  onRegisterEmailSentChange: (sent: boolean) => void
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
  const { isNative } = usePlatform()
  const mode: "login" | "register" = location.pathname.startsWith("/register") ? "register" : "login"
  const isForgotMode = mode === "login" && searchParams.get("forgot") === "1"
  // Once the native register email-gate has sent its confirmation, its own
  // "Check your inbox" heading repeats this subtitle's instructions almost
  // verbatim — drop the subtitle so the card doesn't say the same thing twice.
  const [isRegisterEmailSent, setIsRegisterEmailSent] = useState(false)

  const title = isForgotMode
    ? t("forgotPassword.title")
    : mode === "login"
      ? t("login.title")
      : t("register.title")
  const subtitle = isForgotMode
    ? t("forgotPassword.subtitle")
    : mode === "login"
      ? t("login.workspaceSubtitle")
      : isNative && !isRegisterEmailSent
        // Native register is the email gate; its explainer lives here so the
        // form column stays single-titled like the login tab.
        ? t("mobileRegister.subtitle")
        : undefined

  useEffect(() => {
    document.documentElement.classList.add("scrollbar-hide")
    document.body.classList.add("scrollbar-hide")
    return () => {
      document.documentElement.classList.remove("scrollbar-hide")
      document.body.classList.remove("scrollbar-hide")
    }
  }, [])

  const footer = (
    <div className="text-muted-foreground text-center text-xs text-balance w-full">
      {t("login.termsNotice")}{" "}
      <button
        type="button"
        onClick={() => openLegalPage("terms")}
        className="text-muted-foreground hover:text-primary underline underline-offset-4 cursor-pointer"
      >
        {t("login.termsOfService")}
      </button>{" "}
      {t("login.and")}{" "}
      <button
        type="button"
        onClick={() => openLegalPage("privacy")}
        className="text-muted-foreground hover:text-primary underline underline-offset-4 cursor-pointer"
      >
        {t("login.privacyPolicy")}
      </button>.
    </div>
  )

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
            <Outlet context={{ onRegisterEmailSentChange: setIsRegisterEmailSent } satisfies AuthOutletContext} />
          </AuthCard>
        </div>
        {footer}
        <MobileAuthControls />
      </AuthShell>
    </>
  )
}
