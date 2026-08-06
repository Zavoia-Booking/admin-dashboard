import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { legalUrl, type LegalPageType } from "../legal-links"

function getTypeFromPath(pathname: string): LegalPageType {
  if (pathname.startsWith("/cookies")) return "cookies"
  if (pathname.startsWith("/privacy")) return "privacy"
  return "terms"
}

/**
 * Legal content lives only in zavoia-web; these dashboard routes exist so old
 * links (app store listings, emails) keep working — they just forward there.
 */
export default function LegalPage() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.location.replace(legalUrl(getTypeFromPath(pathname)))
  }, [pathname])

  return null
}
