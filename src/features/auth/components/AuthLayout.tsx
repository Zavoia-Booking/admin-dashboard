import { useState } from "react"
import { Outlet, useLocation, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import type { LegalPageType } from "../../legal/components/legal-content"
import LegalContentDialog from "../../legal/components/LegalContentDialog"
import { AuthShell } from "./AuthShell"
import { AuthCard } from "./AuthCard"

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
      ? "Login to your Zavoia workspace."
      : undefined

  const [legalDialog, setLegalDialog] = useState<LegalPageType | null>(null)

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
      <AuthShell>
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
