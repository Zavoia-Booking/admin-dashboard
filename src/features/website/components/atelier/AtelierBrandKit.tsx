import { ArrowUpRight, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Business, WebsiteIdentity, WebsiteThemeAssetCatalogItem } from "../../types";
import { BrandColorControl } from "../BrandingSection";
import { ThemePanel } from "../builder/ThemePanel";
import { displayFontFor, safeBrandColor } from "../builder/theme";
import { useAtelierCompactLayout } from "./useAtelierCompactLayout";

interface AtelierBrandKitProps {
  business: Business | null;
  identity: WebsiteIdentity;
  canWrite: boolean;
  brandColorHex: string;
  setBrandColorHex: (value: string) => void;
  brandColorError?: string | null;
  fontKey: string;
  setFontKey: (value: string) => void;
  fontError?: string | null;
  themeAssets?: WebsiteThemeAssetCatalogItem[];
  catalogReady?: boolean;
  catalogError?: string | null;
  onRetryCatalog?: () => void;
  premiumSelectionReady?: boolean;
  /** Preview-only selections are effective here without mutating the persisted draft. */
  effectiveBrandColorHex?: string;
  effectiveFontKey?: string;
  onThemeAssetSelect?: (asset: WebsiteThemeAssetCatalogItem) => void;
}

const monogramFor = (name: string) => name.trim().charAt(0).toLocaleUpperCase() || "Z";

/**
 * The compact, production-backed identity kit used by both Atelier editor modes.
 * It intentionally does not show the Business profile's external website URL. A public Website
 * Builder domain is not part of the current API contract, so the identity card stays domain-free.
 */
export function AtelierBrandKit({
  business,
  identity,
  canWrite,
  brandColorHex,
  setBrandColorHex,
  brandColorError,
  fontKey,
  setFontKey,
  fontError,
  themeAssets,
  catalogReady,
  catalogError,
  onRetryCatalog,
  premiumSelectionReady,
  effectiveBrandColorHex,
  effectiveFontKey,
  onThemeAssetSelect,
}: AtelierBrandKitProps) {
  const { t } = useTranslation("website");
  const isAtelierCompact = useAtelierCompactLayout();
  const brandColor = safeBrandColor(effectiveBrandColorHex ?? brandColorHex);
  const monogramFont = displayFontFor(effectiveFontKey ?? fontKey);
  const identityName = identity.name?.trim() || t("page.identity.fallbackName");

  return (
    <section className="atelier-brand-kit" aria-label={t("page.identity.title")}>
      <div className="atelier-brand-identity">
        <div
          className="atelier-brand-monogram"
          style={{
            backgroundColor: brandColor,
            fontFamily: monogramFont.stack,
            fontWeight: monogramFont.weight,
          }}
          aria-hidden={business?.logo ? undefined : true}
        >
          {business?.logo || identity.logo ? (
            <img src={business?.logo ?? identity.logo ?? ""} alt="" loading="eager" decoding="async" />
          ) : identityName ? (
            monogramFor(identityName)
          ) : (
            <Building2 className="size-4" strokeWidth={1.8} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="atelier-brand-name">{identityName}</p>
        </div>
        <Link
          to="/account?tab=profile"
          className="atelier-brand-profile-link website-atelier-focus website-atelier-press"
          aria-label={t("page.identity.edit")}
        >
          <ArrowUpRight className="size-3.5" strokeWidth={1.75} aria-hidden />
        </Link>
      </div>

      <p className="atelier-brand-kicker">{t("businessPage.branding.kitLabel")}</p>
      <div className="atelier-brand-controls">
        <BrandColorControl
          variant="atelier"
          canWrite={canWrite}
          brandColorHex={brandColorHex}
          setBrandColorHex={setBrandColorHex}
          compact={isAtelierCompact}
          themeAssets={themeAssets}
          catalogReady={catalogReady}
          catalogError={catalogError}
          onRetryCatalog={onRetryCatalog}
          premiumSelectionReady={premiumSelectionReady}
          effectiveBrandColorHex={effectiveBrandColorHex}
          onThemeAssetSelect={onThemeAssetSelect}
          error={brandColorError}
        />
        <ThemePanel
          variant="atelier"
          disabled={!canWrite}
          fontKey={fontKey}
          onFontChange={setFontKey}
          compact={isAtelierCompact}
          themeAssets={themeAssets}
          catalogReady={catalogReady}
          catalogError={catalogError}
          onRetryCatalog={onRetryCatalog}
          premiumSelectionReady={premiumSelectionReady}
          effectiveFontKey={effectiveFontKey}
          onThemeAssetSelect={onThemeAssetSelect}
          error={fontError}
        />
      </div>
    </section>
  );
}

export default AtelierBrandKit;
