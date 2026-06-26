import { LimitedAccessBanner } from "../../../../shared/components/common/subscription/LimitedAccessBanner";
import type { Business, Industry, IndustryTag, LocationWithAssignments } from "../../types";
import type { useMarketplaceForm } from "../../hooks/useMarketplaceForm";
import { MarketplaceDetailsSection } from "../profile/MarketplaceDetailsSection";
import IndustrySection from "../profile/IndustrySection";
import { BrandingSection } from "./BrandingSection";
import { SectionBuilder } from "./builder/SectionBuilder";
import { ThemePanel } from "./builder/ThemePanel";
import type { PreviewReview } from "./builder/LivePreview";

interface BusinessPageTabProps {
  business: Business | null;
  canWrite: boolean;
  heroImageUrl: string | null;
  industries: Industry[];
  industryTags: IndustryTag[];
  locations: LocationWithAssignments[];
  form: ReturnType<typeof useMarketplaceForm>;
  /** Real 5★ quotes + per-member ratings for the live preview (from the reviews store). */
  reviews?: PreviewReview[];
  teamRatings?: Record<number, { rating: number; count: number }>;
}

/**
 * Business-level "page" tab — a single scrolling form, top to bottom:
 *  1. Page details   → public contact details (incl. the marketplace-card description) and the
 *     mandatory industry tags.
 *  2. Branding & theme → logo / slug / brand colour + font personality (global identity, reused across
 *     the marketplace).
 *  3. Page sections  → arrange the public page (reorder / show-hide / variant) and edit each section's
 *     own content inline — Hero (tagline + cover) / About / FAQ / Announcement — with the live preview
 *     opened on demand. The remaining sections are a themed *view* over the data above; nothing is
 *     duplicated.
 */
export function BusinessPageTab({
  business,
  canWrite,
  heroImageUrl,
  industries,
  industryTags,
  locations,
  form,
  reviews,
  teamRatings,
}: BusinessPageTabProps) {
  return (
    <div className="max-w-7xl mb-0 md:mb-8">
      <LimitedAccessBanner className="!px-0 !pt-0" />
      <div
        className={!canWrite ? "pointer-events-none opacity-60" : ""}
        aria-disabled={!canWrite}
      >
        <div className="space-y-12">
          {/* 1. Page details */}
          <div className="space-y-8">
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
            <IndustrySection
              industries={industries}
              industryTags={industryTags}
              selectedTags={form.selectedIndustryTags}
              onTagsChange={form.setSelectedIndustryTags}
              error={form.industryTagsError || undefined}
            />
          </div>

          {/* 2. Studio — section list + brand controls + live preview, in one module */}
          <SectionBuilder
            layout={form.layout}
            reorderSections={form.reorderSections}
            toggleSectionVisible={form.toggleSectionVisible}
            setSectionVariant={form.setSectionVariant}
            setSectionConfig={form.setSectionConfig}
            fontKey={form.fontKey}
            faqItems={form.faqItems}
            setFaqItems={form.setFaqItems}
            announcementContent={form.announcementContent}
            setAnnouncementContent={form.setAnnouncementContent}
            aboutContent={form.aboutContent}
            setAboutContent={form.setAboutContent}
            brandPanel={
              <div className="flex flex-col gap-6">
                <BrandingSection
                  business={business}
                  canWrite={canWrite}
                  pageName={form.pageName}
                  brandColorHex={form.brandColorHex}
                  setBrandColorHex={form.setBrandColorHex}
                />
                <div className="border-t border-border pt-6">
                  <ThemePanel fontKey={form.fontKey} onFontChange={form.setFontKey} />
                </div>
              </div>
            }
            business={business}
            locations={locations}
            heroImageUrl={heroImageUrl}
            tagline={form.tagline}
            setTagline={form.setTagline}
            taglineError={form.taglineError || undefined}
            aboutError={form.aboutError}
            announcementError={form.announcementError}
            canWrite={canWrite}
            brandColorHex={form.brandColorHex}
            useBusinessEmail={form.useBusinessEmail}
            email={form.email}
            useBusinessPhone={form.useBusinessPhone}
            phone={form.phone}
            reviews={reviews}
            teamRatings={teamRatings}
          />
        </div>
      </div>
    </div>
  );
}

export default BusinessPageTab;
