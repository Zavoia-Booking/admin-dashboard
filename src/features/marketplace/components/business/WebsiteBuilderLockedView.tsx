import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Globe, Lock, Palette, Sparkles } from "lucide-react";
import { Button } from "../../../../shared/components/ui/button";
import { usePlatform } from "../../../../shared/hooks/usePlatform";

/**
 * Upgrade/locked view rendered in place of the WebsiteBuilderTab when the plan
 * lacks the websiteBuilder entitlement (trialing, Standard, expired, downgraded).
 * Purely presentational — mounts none of the builder and fetches nothing, so
 * deep-linking ?tab=website without the entitlement is safe.
 *
 * Native (Capacitor) builds hide the billing CTA and plan/upgrade wording —
 * billing is unreachable there and store policy forbids subscription friction
 * (same convention as SubscriptionBlocker/TrialStatusCard).
 */
export function WebsiteBuilderLockedView() {
  const { t } = useTranslation("marketplace");
  const navigate = useNavigate();
  const { isNative } = usePlatform();

  const features = [
    { icon: Globe, label: t("businessPage.locked.features.publicPage") },
    { icon: Palette, label: t("businessPage.locked.features.sections") },
    { icon: Sparkles, label: t("businessPage.locked.features.premiumVariants") },
  ];

  return (
    <div className="max-w-2xl">
      <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
        <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
          <Lock className="size-5" strokeWidth={1.8} aria-hidden />
        </span>

        {!isNative && (
          <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-3">
            {t("businessPage.locked.eyebrow")}
          </div>
        )}

        <h2 className="mt-2 text-lg font-semibold text-foreground-1 md:text-xl">
          {t("businessPage.locked.title")}
        </h2>

        <p className="mt-2 max-w-[480px] text-sm leading-relaxed text-foreground-2">
          {isNative
            ? t("businessPage.locked.nativeDescription")
            : t("businessPage.locked.description")}
        </p>

        <ul className="mt-5 space-y-2.5">
          {features.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-start gap-2.5 text-sm text-foreground-2"
            >
              <Icon
                className="mt-0.5 size-4 shrink-0 text-primary"
                strokeWidth={1.8}
                aria-hidden
              />
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
    </div>
  );
}

export default WebsiteBuilderLockedView;
