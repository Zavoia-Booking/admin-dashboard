import type {
  WebsiteBuilderLocation,
  WebsiteIdentity,
} from "../types";
import type { WebsiteDraftForm } from "../hooks/useWebsiteDraft";
import type { WebsiteBuilderController } from "../hooks/useWebsiteBuilderController";
import type { WebsiteSectionFocusRequest } from "../hooks/useWebsiteWorkspaceController";
import { SectionBuilder } from "./builder/SectionBuilder";
import { AtelierBrandKit } from "./atelier/AtelierBrandKit";

interface WebsiteBuilderCoreProps {
  identity: WebsiteIdentity;
  canWrite: boolean;
  canPurchase: boolean;
  controller: WebsiteBuilderController;
  locations: WebsiteBuilderLocation[];
  form: WebsiteDraftForm;
  /** Request from the workspace (publish-blocker chips) to open/scroll to a section. */
  focusSection?: WebsiteSectionFocusRequest | null;
  /** Controlled shell entry point into the existing full-page preview flow. */
  previewOpen?: boolean;
  onPreviewOpenChange?: (open: boolean) => void;
  /** Stripe return is still reconciling ownership; all purchase entry points stay disabled. */
  checkoutReconciliationBusy?: boolean;
}

/**
 * The Website editor surface: section list + editors + style picker + live preview,
 * plus the store wiring (catalog, cart, checkout). The renderer reads the CANONICAL
 * Business identity (never Marketplace overrides) supplied by GET /website-builder.
 */
export function WebsiteBuilderCore({
  identity,
  canWrite,
  canPurchase,
  controller,
  locations,
  form,
  focusSection,
  previewOpen,
  onPreviewOpenChange,
  checkoutReconciliationBusy = false,
}: WebsiteBuilderCoreProps) {
  const {
    isNative,
    previewBusiness,
    heroImageUrl,
    variantCatalog,
    sectionCatalog,
    unavailableVariants,
    themeAssetCatalog,
    isCatalogLoading,
    catalogLoaded,
    catalogError,
    retryCatalog,
    catalogPurchasesReady,
    checkoutBlocked,
    purchaseMutationsBlocked,
    isVariantCheckoutLoading,
    variantCart,
    sectionCart,
    effectiveBrandColorHex,
    effectiveFontKey,
    hasWebsiteBuilder,
    teamRatings,
    ratingDistribution,
    previewReviews,
    highlightReviewsLoaded,
    previewOnlyVariantSelections,
    handlePreviewOnlyVariantsChange,
    handleBuyVariant,
    handleBuySection,
    handleToggleCartVariant,
    handleToggleCartSection,
    handleSelectThemeAsset,
  } = controller;

  const announcementCue =
    form.announcementCopyError ||
    form.announcementUrlError ||
    form.announcementScheduleError ||
    form.announcementMessageWarning;

  return (
    <div className="website-builder-core mb-0 min-h-0">
      <div
        className="website-builder-core-content min-h-0"
        aria-disabled={!canWrite}
      >
        <SectionBuilder
          focusSection={focusSection}
          shellPreviewOpen={previewOpen}
          onShellPreviewOpenChange={onPreviewOpenChange}
          layout={form.layout}
          reorderSections={form.reorderSections}
          toggleSectionVisible={form.toggleSectionVisible}
          moveSectionOfType={form.moveSectionOfType}
          setSectionVisibleByType={form.setSectionVisibleByType}
          setSectionConfigByType={form.setSectionConfigByType}
          setSectionVariant={form.setSectionVariant}
          setSectionConfig={form.setSectionConfig}
          fontKey={effectiveFontKey}
          faqItems={form.faqItems}
          setFaqItems={form.setFaqItems}
          announcementContent={form.announcementContent}
          setAnnouncementContent={form.setAnnouncementContent}
          blockingIssues={form.blockingIssues}
          publishReadinessIssues={form.publishReadinessIssues}
          aboutContent={form.aboutContent}
          setAboutContent={form.setAboutContent}
          establishedYear={form.establishedYear}
          setEstablishedYear={form.setEstablishedYear}
          establishedYearError={form.establishedYearError}
          brandPanel={
            <AtelierBrandKit
              business={previewBusiness}
              identity={identity}
              canWrite={
                canWrite &&
                !checkoutReconciliationBusy &&
                !purchaseMutationsBlocked
              }
              brandColorHex={form.brandColorHex}
              setBrandColorHex={form.setBrandColorHex}
              brandColorError={form.brandColorError}
              fontKey={form.fontKey}
              setFontKey={form.setFontKey}
              fontError={form.fontKeyError}
              themeAssets={themeAssetCatalog}
              catalogReady={catalogLoaded}
              catalogError={catalogError}
              onRetryCatalog={retryCatalog}
              premiumSelectionReady={
                catalogPurchasesReady &&
                !checkoutReconciliationBusy &&
                !purchaseMutationsBlocked
              }
              effectiveBrandColorHex={effectiveBrandColorHex}
              effectiveFontKey={effectiveFontKey}
              onThemeAssetSelect={handleSelectThemeAsset}
            />
          }
          business={previewBusiness}
          locations={locations}
          heroImageUrl={heroImageUrl}
          tagline={form.tagline}
          setTagline={form.setTagline}
          taglineError={form.taglineError || undefined}
          announcementError={announcementCue}
          canWrite={canWrite}
          canPurchase={canPurchase}
          brandColorHex={effectiveBrandColorHex}
          useBusinessEmail={true}
          email={identity.email ?? ""}
          useBusinessPhone={true}
          phone={identity.phone ?? ""}
          reviews={previewReviews}
          reviewsReady={highlightReviewsLoaded}
          teamRatings={teamRatings}
          ratingDistribution={ratingDistribution}
          variantCatalog={variantCatalog}
          sectionCatalog={sectionCatalog}
          unavailableVariants={unavailableVariants}
          hasWebsiteBuilder={hasWebsiteBuilder}
          isCatalogLoading={isCatalogLoading}
          catalogLoaded={catalogLoaded}
          isVariantCheckoutLoading={isVariantCheckoutLoading}
          purchaseActionsReady={
            catalogPurchasesReady &&
            !checkoutReconciliationBusy &&
            !purchaseMutationsBlocked
          }
          purchaseMutationsBlocked={purchaseMutationsBlocked}
          checkoutBlocked={checkoutBlocked}
          onBuyVariant={canPurchase ? handleBuyVariant : undefined}
          onBuySection={canPurchase ? handleBuySection : undefined}
          cartVariantIds={variantCart}
          cartSectionIds={sectionCart}
          onToggleCartVariant={canPurchase ? handleToggleCartVariant : undefined}
          onToggleCartSection={canPurchase ? handleToggleCartSection : undefined}
          previewOnlyVariantSelections={previewOnlyVariantSelections}
          onPreviewOnlyVariantsChange={handlePreviewOnlyVariantsChange}
          isNative={isNative}
        />
      </div>
    </div>
  );
}

export default WebsiteBuilderCore;
