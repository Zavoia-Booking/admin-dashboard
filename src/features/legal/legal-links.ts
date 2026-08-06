import { Capacitor } from "@capacitor/core"
import { Browser } from "@capacitor/browser"
import i18n from "../../shared/lib/i18n"

export type LegalPageType = "terms" | "cookies" | "privacy"

// Slugs of the corresponding documents in zavoia-web (src/data/legal), which is
// the single source of truth for legal content.
const LEGAL_SLUGS: Record<LegalPageType, string> = {
  terms: "terms-of-use",
  cookies: "cookie-policy",
  privacy: "privacy-policy",
}

const WEB_URL: string = import.meta.env.VITE_WEB_URL || "https://zavoia.com"

export function legalUrl(type: LegalPageType): string {
  // zavoia-web serves the default locale (en) without a prefix: /terms/<slug>
  // and other locales prefixed: /ro/terms/<slug>.
  const lang = i18n.language?.split("-")[0]
  const localePrefix = lang === "ro" ? "/ro" : ""
  return `${WEB_URL}${localePrefix}/terms/${LEGAL_SLUGS[type]}`
}

export function openLegalPage(type: LegalPageType): void {
  const url = legalUrl(type)
  if (Capacitor.isNativePlatform()) {
    // In-app browser sheet (Custom Tabs on Android, SFSafariViewController on
    // iOS) so the user never leaves the app.
    void Browser.open({ url })
  } else {
    window.open(url, "_blank", "noopener")
  }
}
