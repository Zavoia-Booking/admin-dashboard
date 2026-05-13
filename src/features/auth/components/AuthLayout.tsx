import { useEffect, useState } from "react"
import { Outlet, useLocation, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import type { LegalPageType } from "../../legal/components/legal-content"
import LegalContentDialog from "../../legal/components/LegalContentDialog"
import { AuthShell } from "./AuthShell"
import { AuthCard } from "./AuthCard"
import { LanguageSwitcher } from "../../../shared/components/common/LanguageSwitcher"
import { DarkModeToggle } from "../../../shared/components/common/DarkModeToggle"

/**
 * Theme + language controls grouped as a single segmented pill for the
 * unauthenticated auth pages. The outer container owns the chrome (border,
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

  const [legalDialog, setLegalDialog] = useState<LegalPageType | null>(null)

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
        onClick={() => setLegalDialog("terms")}
        className="text-muted-foreground hover:text-primary underline underline-offset-4 cursor-pointer"
      >
        {t("login.termsOfService")}
      </button>{" "}
      {t("login.and")}{" "}
      <button
        type="button"
        onClick={() => setLegalDialog("privacy")}
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
        <div className="md:hidden w-full flex justify-end">
          <AuthControlsCluster />
        </div>
        <div className="splash-target-card w-full">
          <AuthCard mode={mode} title={title} subtitle={subtitle} isForgotMode={isForgotMode}>
            <Outlet />
          </AuthCard>
        </div>
        {footer}
      </AuthShell>
      <LegalContentDialog
        type={legalDialog}
        onOpenChange={(open) => !open && setLegalDialog(null)}
      />
    </>
  )
}
