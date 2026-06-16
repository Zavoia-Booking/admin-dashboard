import { Card, CardContent } from "../../../../shared/components/ui/card";
import { LimitedAccessBanner } from "../../../../shared/components/common/subscription/LimitedAccessBanner";
import type { Business, Industry, IndustryTag } from "../../types";
import type { useMarketplaceForm } from "../../hooks/useMarketplaceForm";
import { MarketplaceDetailsSection } from "../profile/MarketplaceDetailsSection";
import IndustrySection from "../profile/IndustrySection";
import { BrandingSection } from "./BrandingSection";
import { AboutSection } from "./AboutSection";

interface BusinessPageTabProps {
  business: Business | null;
  canWrite: boolean;
  heroImageUrl: string | null;
  industries: Industry[];
  industryTags: IndustryTag[];
  form: ReturnType<typeof useMarketplaceForm>;
}

/**
 * Business-level "page" tab: branding (logo / hero / tagline / slug / accent
 * color), public contact details, about content, and industry tags. All
 * business-scoped data the owner fills in for their public microsite.
 */
export function BusinessPageTab({
  business,
  canWrite,
  heroImageUrl,
  industries,
  industryTags,
  form,
}: BusinessPageTabProps) {
  return (
    <div className="max-w-5xl mb-0 md:mb-8">
      <LimitedAccessBanner className="!px-0 !pt-0" />
      <div
        className={!canWrite ? "pointer-events-none opacity-60" : ""}
        aria-disabled={!canWrite}
      >
        <Card className="border-none pt-0 pb-2 sm:border shadow-none sm:shadow-sm bg-transparent sm:bg-white dark:sm:bg-surface overflow-hidden">
          <CardContent className="p-0 sm:p-4 space-y-10">
            <BrandingSection
              business={business}
              canWrite={canWrite}
              heroImageUrl={heroImageUrl}
              tagline={form.tagline}
              setTagline={form.setTagline}
              taglineError={form.taglineError || undefined}
              businessSlug={form.businessSlug}
              setBusinessSlug={form.setBusinessSlug}
              slugError={form.slugError || undefined}
              brandColorHex={form.brandColorHex}
              setBrandColorHex={form.setBrandColorHex}
              brandColorError={form.brandColorError || undefined}
            />

            <MarketplaceDetailsSection
              business={business}
              useBusinessName={form.useBusinessName}
              setUseBusinessName={form.setUseBusinessName}
              name={form.name}
              setName={form.setName}
              useBusinessEmail={form.useBusinessEmail}
              setUseBusinessEmail={form.setUseBusinessEmail}
              email={form.email}
              setEmail={form.setEmail}
              useBusinessPhone={form.useBusinessPhone}
              setUseBusinessPhone={form.setUseBusinessPhone}
              phone={form.phone}
              setPhone={form.setPhone}
              useBusinessDescription={form.useBusinessDescription}
              setUseBusinessDescription={form.setUseBusinessDescription}
              description={form.description}
              setDescription={form.setDescription}
              nameError={form.nameError || undefined}
              emailError={form.emailError || undefined}
              phoneError={form.phoneError || undefined}
              descriptionError={form.descriptionError || undefined}
            />

            <AboutSection value={form.aboutContent} onChange={form.setAboutContent} />

            <IndustrySection
              industries={industries}
              industryTags={industryTags}
              selectedTags={form.selectedIndustryTags}
              onTagsChange={form.setSelectedIndustryTags}
              error={form.industryTagsError || undefined}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default BusinessPageTab;
