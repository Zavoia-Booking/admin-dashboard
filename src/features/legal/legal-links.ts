import { Capacitor } from "@capacitor/core"
import { Browser } from "@capacitor/browser"
import i18n from "../../shared/lib/i18n"
import appConfig, { type APP_ENV_OPTIONS } from "../../app/config/env"

export type LegalPageType = "terms" | "cookies" | "privacy"

// Slugs of the corresponding documents in zavoia-web (src/data/legal), which is
// the single source of truth for legal content.
const LEGAL_SLUGS: Record<LegalPageType, string> = {
  terms: "terms-of-use",
  cookies: "cookie-policy",
  privacy: "privacy-policy",
}

/* Where zavoia-web lives per environment. Vercel builds run in Vite's
 * `production` mode on every project, so the committed .env.production is what
 * loads on staging too — a hardcoded production default there silently sent
 * staging users to the live site. The deployed environment is known at runtime
 * (VITE_APP_ENV, set per Vercel project), so key the default off that instead.
 * VITE_WEB_URL still wins where the host isn't one of these: local dev and
 * native builds, which need a LAN address the device can reach. */
const WEB_URL_BY_ENV: Record<APP_ENV_OPTIONS, string> = {
  development: "http://localhost:3001",
  staging: "https://staging.zavoia.com",
  production: "https://zavoia.com",
}

const WEB_URL: string =
  import.meta.env.VITE_WEB_URL || WEB_URL_BY_ENV[appConfig.APP_ENV]

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
