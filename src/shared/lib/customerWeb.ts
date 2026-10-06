import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import appConfig, { type APP_ENV_OPTIONS } from "../../app/config/env";

// Vite's production mode is also used for staging builds. Choose the customer
// host from the deployed app environment, with a LAN/custom-host override.
const WEB_URL_BY_ENV: Record<APP_ENV_OPTIONS, string> = {
  development: "http://localhost:3001",
  staging: "https://staging.zavoia.com",
  production: "https://zavoia.com",
};

export const CUSTOMER_WEB_ORIGIN: string =
  import.meta.env.VITE_WEB_URL || WEB_URL_BY_ENV[appConfig.APP_ENV];

export function buildWebsiteShareUrl(
  slug: string | null | undefined,
  language: string | null | undefined,
): string | null {
  const address = slug?.trim();
  if (!address || address === "." || address === "..") return null;
  const locale = language?.toLowerCase().split(/[-_]/)[0];
  return `${CUSTOMER_WEB_ORIGIN.replace(/\/+$/, "")}${locale === "ro" ? "/ro" : ""}/${encodeURIComponent(address)}`;
}

export async function openCustomerWebUrl(url: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    if (!Capacitor.isPluginAvailable("Browser")) {
      throw new Error("Customer browser is unavailable");
    }
    await Browser.open({ url });
    return;
  }
  // The caller does not report this as a confirmed opening: browsers may block
  // a new window, and noopener windows do not provide a reliable return value.
  window.open(url, "_blank", "noopener,noreferrer");
}
