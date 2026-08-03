import { LimitedAccessBanner } from "../../../../shared/components/common/subscription/LimitedAccessBanner";
import type { Business, Industry, IndustryTag } from "../../types";
import type { useMarketplaceForm } from "../../hooks/useMarketplaceForm";
import { MarketplaceDetailsSection } from "../profile/MarketplaceDetailsSection";
import IndustrySection from "../profile/IndustrySection";

interface BusinessListingTabProps {
  business: Business | null;
  canWrite: boolean;
  industries: Industry[];
  industryTags: IndustryTag[];
  form: ReturnType<typeof useMarketplaceForm>;
}

export function BusinessListingTab({
  business,
  canWrite,
  industries,
  industryTags,
  form,
}: BusinessListingTabProps) {
  return (
    <div className="max-w-5xl mb-0 md:mb-8">
      <LimitedAccessBanner className="!px-0 !pt-0" />
      <div
        className={!canWrite ? "pointer-events-none opacity-60" : ""}
        aria-disabled={!canWrite}
      >
        <div className="space-y-8">
          {/* Industry & tags lead: the only section needing active input to
              go live (details prefill from the business), and the page order
              mirrors the publish checklist. Anchor ids are the checklist's
              resolve targets; scroll-mt clears the sticky tab header. */}
          <div
            id="marketplace-industry-section"
            className="scroll-mt-24 rounded-2xl"
          >
            <IndustrySection
              industries={industries}
              industryTags={industryTags}
              selectedTags={form.selectedIndustryTags}
              onTagsChange={form.setSelectedIndustryTags}
              error={form.industryTagsError || undefined}
            />
          </div>
          <div
            id="marketplace-business-details-section"
            className="scroll-mt-24 rounded-2xl"
          >
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default BusinessListingTab;
