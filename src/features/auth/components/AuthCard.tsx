import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardFooter } from "../../../shared/components/ui/card"
import { cn } from "../../../shared/lib/utils"
import { AuthHero } from "./AuthHero"
import "./auth-card.css"

type AuthCardProps = {
  /** Drives which tab in the toggle is shown as active. */
  mode: "login" | "register"
  title: string
  subtitle?: string
  children: ReactNode
  /** When true, suppress the toggle + heading. Used for sub-flows like
   *  forgot-password where the standard auth header doesn't apply. */
  hideHeader?: boolean
  /** When true, opens up the gap between the heading and the form. Used
   *  for the forgot-password sub-flow. */
  isForgotMode?: boolean
  /** Optional footer slot — rendered inside the card's CardFooter. */
  footer?: ReactNode
}

const tabBase =
  "flex-1 rounded-full py-2.5 px-4 text-sm font-medium text-center flex items-center justify-center relative z-10 transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
const tabActive = "text-foreground-1"
const tabInactive = "text-foreground-2 hover:text-foreground-1"

export function AuthCard({ mode, title, subtitle, children, hideHeader, isForgotMode, footer }: AuthCardProps) {
  const { t } = useTranslation("auth")
  const gapClass = isForgotMode ? "gap-16" : mode === "login" ? "gap-8" : "gap-6"
  return (
    <Card className="overflow-hidden p-0">
      <CardContent className="grid p-0 md:grid-cols-2">
        <div className="p-4 md:p-6 md:min-h-180">
          <div className={cn("flex flex-col", gapClass)}>
            {!hideHeader && (
              // Segmented-control recipe from ResponsiveTabs (track bg-sidebar,
              // thumb bg-surface) so dark mode matches the rest of the app.
              <div className="bg-sidebar rounded-full p-1 flex !min-h-0 !h-10 w-full relative">
                <div
                  aria-hidden="true"
                  className="absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-surface shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  style={{ transform: mode === "register" ? "translateX(100%)" : "translateX(0)" }}
                />
                <Link
                  to="/login"
                  aria-current={mode === "login" ? "page" : undefined}
                  className={cn(tabBase, mode === "login" ? tabActive : tabInactive)}
                >
                  {t("toggle.signIn")}
                </Link>
                <Link
                  to="/register"
                  aria-current={mode === "register" ? "page" : undefined}
                  className={cn(tabBase, mode === "register" ? tabActive : tabInactive)}
                >
                  {t("toggle.createAccount")}
                </Link>
              </div>
            )}
            <div
              key={mode}
              className={cn(
                "auth-card-content-enter flex flex-col",
                gapClass,
              )}
            >
              {!hideHeader && (
                <div className="space-y-1">
                  <h1 className="cursor-default text-[28px] md:leading-tight font-bold text-foreground-1">{title}</h1>
                  {subtitle && <p className="cursor-default text-base text-foreground-2">{subtitle}</p>}
                </div>
              )}
              {children}
            </div>
          </div>
        </div>
        <div className="relative hidden md:block">
          <AuthHero />
        </div>
      </CardContent>
      {footer && (
        <CardFooter className="px-6 md:px-8 pb-6">{footer}</CardFooter>
      )}
    </Card>
  )
}
