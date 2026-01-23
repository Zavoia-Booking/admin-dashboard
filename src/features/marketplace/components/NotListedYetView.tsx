import { Card, CardContent } from "../../../shared/components/ui/card";
import { Button } from "../../../shared/components/ui/button";
import { DashedDivider } from "../../../shared/components/common/DashedDivider";
import { ArrowRight, ShieldCheck, Rocket, BadgeCheck } from "lucide-react";
import { useTranslation, Trans } from "react-i18next";
import type { Business } from "../types";
import type { LocationType } from "../../../shared/types/location";
import type { TeamMember } from "../../../shared/types/team-member";
import type { Service, MarketplaceListing } from "../types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../shared/components/ui/avatar";

interface NotListedYetViewProps {
  onStartListing: () => void;
  business: Business | null;
  listing: MarketplaceListing | null;
  locations: LocationType[];
  services: Service[];
  teamMembers: TeamMember[];
}

export function NotListedYetView({
  onStartListing,
  business,
  listing,
  locations,
  services,
  teamMembers,
}: NotListedYetViewProps) {
  const { t } = useTranslation("marketplace");
  const businessName = business?.name || "Your Business";

  // Effective data for preview
  const effectiveName = listing?.effectiveName || businessName;
  const effectiveEmail = listing?.effectiveEmail || business?.email;

  return (
    <div className="max-w-7xl mx-auto px-0 space-y-6 cursor-default">
      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Main Hero / Header Card - 3/4 Width */}
        <div className="md:col-span-3 relative group bg-surface border border-border rounded-xl p-4 overflow-hidden flex flex-col justify-between gap-8 transition-all duration-300 shadow-sm">
          {/* Subtle Accent Background */}
          <div className="absolute inset-0 bg-primary/[0.03] pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-6 w-full">
            {/* Header Row: Avatar + Title */}
            <div className="flex flex-row items-center gap-5 text-left">
              <Avatar className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-surface border-2 border-border shadow-md overflow-hidden transition-all duration-500 ease-out group-hover:scale-107 shrink-0">
                <AvatarImage
                  src={business?.logo || undefined}
                  alt={businessName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {businessName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl md:text-3xl font-bold leading-tight text-foreground-1">
                {t("marketing.hero.title")}
              </h2>
            </div>

            {/* Full Width Subtitle */}
            <p className="text-foreground-2 text-base md:text-xl leading-relaxed max-w-4xl text-left">
              <Trans
                t={t}
                i18nKey="marketing.hero.subtitle"
                values={{
                  businessName,
                  serviceCount: services.length,
                  teamCount: teamMembers.length,
                }}
                components={{
                  bold: <span className="font-bold text-foreground-1" />,
                }}
              />
            </p>
          </div>

          {/* Bottom Row: Badges + Button */}
          <div className="relative z-10 w-full">
            <DashedDivider marginTop="mt-0" paddingTop="pb-6" />
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
              <div className="flex flex-wrap justify-center justify-start gap-3">
                <div className="inline-flex items-center gap-2 text-xs font-medium bg-surface border border-border rounded-full px-3 py-1.5 text-foreground-2">
                  <Rocket className="w-3.5 h-3.5 text-primary" />
                  <span>{t("marketing.hero.timeEstimate")}</span>
                </div>
                <div className="inline-flex items-center gap-2 text-xs font-medium bg-surface border border-border rounded-full px-3 py-1.5 text-foreground-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                  <span>{t("marketing.hero.instantActivation")}</span>
                </div>
              </div>

              <Button
                onClick={onStartListing}
                className="btn-primary group !h-8 text-base w-full md:!w-52 rounded-full shadow-lg active:scale-95 flex items-center gap-2 w-full md:w-auto"
              >
                <span>{t("marketing.hero.cta")}</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Feature: Catalog - Marketplace Terms */}
        <Card className="md:col-span-1 group relative overflow-hidden bg-surface border-border transition-all duration-300 rounded-xl p-0 shadow-sm">
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 dark:bg-primary/70 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
          <CardContent className="h-full p-4 md:pt-8 relative flex flex-col gap-4">
            <div className="space-y-1 mb-0">
              <h4 className="font-bold text-base mb-3 uppercase tracking-widest text-foreground-2">
                {t("marketing.features.catalog.title")}
              </h4>
              <p className="text-xs text-foreground-2 leading-tight">
                {t("marketing.features.catalog.description")}
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <div className="space-y-1 mb-2 flex flex-row md:flex-col justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-green-400" />
                  <span className="text-sm font-bold text-foreground-1 block leading-tight">
                    {t("marketing.features.catalog.commission")}
                  </span>
                </div>
                <span className="text-xs text-foreground-3 block">
                  {t("marketing.features.catalog.commission_helper")}
                </span>
              </div>

              <DashedDivider
                marginTop="mt-0"
                paddingTop="pt-2 md:pt-0"
                className="mb-4 md:mb-2"
              />

              <div className="space-y-1 mb-2 flex flex-row md:flex-col justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-sm font-bold text-foreground-1 block leading-tight">
                    {t("marketing.features.catalog.locations_active", {
                      count: locations.length,
                    })}
                  </span>
                </div>
                <span className="text-xs text-foreground-3 block">
                  {t("marketing.features.catalog.locations_active_helper")}
                </span>
              </div>

              <DashedDivider
                marginTop="mt-0"
                paddingTop="pt-2 md:pt-0"
                className="mb-4 md:mb-2"
              />

              <div className="space-y-1 flex flex-row md:flex-col justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-purple-500" />
                  <span className="text-sm font-bold text-foreground-1 block leading-tight">
                    {t("marketing.features.catalog.no_setup")}
                  </span>
                </div>
                <span className="text-xs text-foreground-3 block">
                  {t("marketing.features.catalog.no_setup_helper")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Public Identity Preview - 2x1 */}
        <Card className="md:col-span-2 group relative overflow-hidden border-border rounded-xl p-0">
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-400/10 dark:bg-green-400/70 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
          <CardContent className="h-full p-4 relative flex flex-col justify-start">
            <div className="space-y-3">
              <div className="space-y-1 mb-0 md:mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-base uppercase tracking-widest text-foreground-2">
                    {effectiveName}
                  </h4>
                  <BadgeCheck className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground-2">
                  {effectiveEmail}
                </div>
              </div>
              <p className="text-sm text-foreground-2 mt-3 md:mt-6 leading-relaxed">
                {t("marketing.features.preview.text")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Benefit: 24/7 - 1x1 */}
        <Card className="md:col-span-1 group relative overflow-hidden bg-surface border-border transition-all duration-300 rounded-xl p-0">
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-orange-400/10 dark:bg-orange-400/70 rounded-full translate-y-8 -translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
          <CardContent className="h-full p-4 flex flex-col justify-start items-start min-h-[160px]">
            <div className="space-y-1">
              <h4 className="font-bold text-base uppercase tracking-widest text-foreground-2">
                {t("marketing.benefits.bookings.title")}
              </h4>
              <p className="text-sm text-foreground-2 mt-6 md:mt-2 leading-relaxed">
                {t("marketing.benefits.bookings.description")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Benefit: Reach - 1x1 */}
        <Card className="md:col-span-1 group relative overflow-hidden bg-surface border-border transition-all duration-300 rounded-xl p-0">
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-info/10 dark:bg-info/70 rounded-full translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
          <CardContent className="h-full p-4 flex flex-col justify-start items-start min-h-[160px]">
            <div className="space-y-1">
              <h4 className="font-bold text-base uppercase tracking-widest text-foreground-2 flex items-center gap-2">
                {t("marketing.benefits.reach.title")}
              </h4>
              <p className="text-sm text-foreground-2 mt-6 md:mt-2 leading-relaxed">
                {t("marketing.benefits.reach.description")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Benefit: Growth/Revenue - Full Width */}
        <Card className="md:col-span-4 group relative overflow-hidden bg-surface border-border transition-all duration-300 rounded-xl p-0">
          <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <CardContent className="h-full p-4 py-6 flex flex-col md:flex-row items-start justify-between gap-12 relative">
            <div className="flex items-center gap-10">
              <div className="space-y-4">
                <h4 className="text-2xl font-bold tracking-tight text-foreground-1">
                  {t("marketing.benefits.revenue.title")}
                </h4>
                <p className="text-foreground-2 text-base md:text-lg leading-relaxed max-w-2xl">
                  {t("marketing.benefits.revenue.description", {
                    count: locations.length,
                  })}
                </p>
              </div>
            </div>

            <div className="bg-base p-6 w-full md:w-auto rounded-xl border border-border shadow-lg group-hover:-translate-y-2 transition-all duration-500 flex flex-col gap-4 min-w-[240px]">
              <div className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-foreground-3">
                    {t("marketing.benefits.liveStats")}
                  </span>
                </div>
                <div className="px-2 py-0.5 bg-success-bg border border-border-strong rounded-full text-green-600 text-[11px] font-bold">
                  {t("marketing.benefits.active")}
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="h-2 w-40 rounded-full bg-neutral-400 dark:bg-neutral-700" />
                  <div className="h-2 w-24 rounded-full bg-primary/30" />
                </div>
                <div className="h-px bg-border-subtle" />
                <div className="flex justify-between items-center">
                  <div className="h-3 w-16 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                  <div className="h-3 w-12 rounded-full bg-primary/50" />
                </div>
              </div>
            </div>
            <Button
              onClick={onStartListing}
              className="btn-primary group !h-8 text-base w-full md:!w-52 rounded-full shadow-lg active:scale-95 flex items-center gap-2 w-full md:hidden"
            >
              <span>{t("marketing.hero.cta")}</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
