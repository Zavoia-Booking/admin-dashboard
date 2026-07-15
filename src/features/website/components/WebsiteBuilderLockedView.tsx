import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Eye, Lock, Palette, Sparkles } from "lucide-react";
import { Button } from "../../../shared/components/ui/button";
import { usePlatform } from "../../../shared/hooks/usePlatform";
import { cn } from "../../../shared/lib/utils";
import type { Business, LocationWithAssignments } from "../types";
import type { PreviewData } from "./builder/LivePreview";
import { ScaledPreview } from "./builder/preview/ScaledPreview";
import { DEFAULT_LAYOUT, DEFAULT_FONT_KEY } from "./builder/sectionCatalog";
import { FALLBACK_BRAND } from "./builder/theme";

interface WebsiteBuilderLockedViewProps {
  business: Business | null;
  locations: LocationWithAssignments[];
  heroImageUrl: string | null;
  tagline?: string;
  brandColorHex?: string;
}

/**
 * Upgrade/locked view rendered in place of the Website workspace when the plan lacks the
 * websiteBuilder entitlement (Standard, expired trial, downgraded). Purely presentational —
 * mounts none of the builder and fetches nothing, so deep-linking ?tab=website without the
 * entitlement is safe. The right column is a real, personalized render of the default page
 * layout — the business's own name/logo/hero/locations — so the upsell shows the actual saved
 * draft rather than a generic mockup.
 *
 * Native (Capacitor) builds hide the billing CTA and plan/upgrade wording — billing is
 * unreachable there and store policy forbids subscription friction (same convention as
 * SubscriptionBlocker/TrialStatusCard) — but still show the preview itself (a capability
 * demo, not purchase friction).
 */
export function WebsiteBuilderLockedView({
  business,
  locations,
  heroImageUrl,
  tagline,
  brandColorHex,
}: WebsiteBuilderLockedViewProps) {
  const { t, i18n } = useTranslation("website");
  const navigate = useNavigate();
  const { isNative } = usePlatform();
  const locale: "en" | "ro" = i18n.language?.toLowerCase().startsWith("ro") ? "ro" : "en";

  const features = [
    { icon: Eye, label: t("businessPage.locked.features.preview") },
    { icon: Palette, label: t("businessPage.locked.features.sections") },
    { icon: Sparkles, label: t("businessPage.locked.features.premiumVariants") },
  ];

  // Server strips pageTheme/pageLayout for non-entitled plans, so theme fields fall back to the
  // lookbook defaults here — every business still gets its own name/logo/hero/locations rendered.
  const teaserData = useMemo<PreviewData>(
    () => ({
      businessName: business?.name?.trim() || t("page.identity.fallbackName"),
      logo: business?.logo ?? null,
      heroImageUrl,
      tagline: tagline ?? "",
      aboutContent: "",
      email: business?.email ?? "",
      phone: business?.phone ?? "",
      social: {
        instagram: business?.instagramUrl,
        facebook: business?.facebookUrl,
        tiktok: business?.tiktokUrl,
        website: business?.websiteUrl,
        pinterest: business?.pinterestUrl,
      },
      locations,
      faq: [],
      announcement: {
        message: { en: "", ro: "" },
        cta: { enabled: false, label: { en: "", ro: "" }, url: "", newTab: false, showArrow: true },
        schedule: null,
      },
      brandColor: brandColorHex || FALLBACK_BRAND,
      fontKey: DEFAULT_FONT_KEY,
      locale,
    }),
    [business, heroImageUrl, tagline, locations, brandColorHex, locale, t],
  );

  const copy = (
    <div className="min-w-0">
      {!isNative && (
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-3">
          {t("businessPage.locked.eyebrow")}
        </div>
      )}

      <h2 className={cn("text-balance text-2xl font-semibold leading-tight text-foreground-1 min-[920px]:text-[28px]", !isNative && "mt-2")}>
        {t("businessPage.locked.title")}
      </h2>

      {isNative && (
        <p className="mt-2 max-w-[480px] text-sm leading-relaxed text-foreground-2">
          {t("businessPage.locked.nativeDescription")}
        </p>
      )}

      <ul className="mt-5 space-y-2.5">
        {features.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-start gap-2.5 text-sm text-foreground-2">
            <Icon className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.8} aria-hidden />
            <span>{label}</span>
          </li>
        ))}
      </ul>

      {!isNative && (
        <>
          <p className="mt-5 rounded-xl border border-primary/25 bg-primary/[0.05] px-4 py-2.5 text-[13px] leading-snug text-foreground-2 dark:bg-primary/[0.08]">
            {t("businessPage.locked.preserved")}
          </p>

          <Button
            type="button"
            data-navigate-to="/account?tab=billing"
            onClick={() => navigate("/account?tab=billing")}
            className="group mt-6 inline-flex items-center justify-center gap-1.5 rounded-full font-semibold"
          >
            <span>{t("businessPage.locked.cta")}</span>
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1"
              aria-hidden
            />
          </Button>
        </>
      )}
    </div>
  );

  // No business yet (still loading) — the copy stands on its own; there's nothing real to preview.
  if (!business) {
    return <div className="max-w-2xl">{copy}</div>;
  }

  return (
    <div className="max-w-5xl">
      <div className="grid gap-8 min-[920px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="border-b border-border pb-6 min-[920px]:border-b-0 min-[920px]:border-r min-[920px]:pb-0 min-[920px]:pr-8">{copy}</div>

        <div className="relative">
          <ScaledPreview
            layout={DEFAULT_LAYOUT}
            data={teaserData}
            chrome
            startNumber={1}
            className="h-[420px] rounded-xl border border-border min-[920px]:h-[500px]"
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 rounded-b-xl bg-gradient-to-t from-surface to-transparent"
            aria-hidden
          />
          <span className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-[11.5px] font-medium text-foreground-2 shadow-xs">
              <Lock className="size-3" strokeWidth={2} aria-hidden />
              {t("businessPage.locked.teaserCaption")}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default WebsiteBuilderLockedView;
