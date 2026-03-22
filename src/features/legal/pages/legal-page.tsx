import { useNavigate, useLocation } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "../../../shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/components/ui/card"
import { useTranslation } from "react-i18next"
import { LEGAL_CONFIG, CONTENT_MAP, type LegalPageType } from "../components/legal-content"

function getTypeFromPath(pathname: string): LegalPageType {
  if (pathname.startsWith("/cookies")) return "cookies"
  if (pathname.startsWith("/privacy")) return "privacy"
  return "terms"
}

export default function LegalPage() {
  const { t } = useTranslation("auth")
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const type = getTypeFromPath(pathname)
  const config = LEGAL_CONFIG[type]
  const ContentComponent = CONTENT_MAP[type]

  return (
    <div className="bg-muted min-h-svh flex flex-col items-center justify-center p-4 md:p-10">
      <div className="w-full max-w-2xl">
        <Card className="w-full">
          <CardHeader className="space-y-3 px-6 py-5 md:px-8 md:py-6">
            <Button
              variant="ghost"
              size="sm"
              className="w-fit gap-2 -ml-2 text-foreground-2 hover:text-foreground-1"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
              {t("legal.backToHome")}
            </Button>
            <CardTitle className="text-xl md:text-2xl text-foreground-1">
              {t(config.titleKey)}
            </CardTitle>
            <p className="text-xs text-foreground-3">
              {t("legal.lastUpdated", { date: "March 2026" })}
            </p>
          </CardHeader>
          <CardContent className="px-6 md:px-8 pb-6 md:pb-8">
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 mb-6">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                {t("legal.placeholderNotice")}
              </p>
            </div>
            <ContentComponent />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
