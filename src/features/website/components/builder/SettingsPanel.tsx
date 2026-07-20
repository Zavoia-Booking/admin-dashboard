import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowUpRight, Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../../../shared/lib/utils";
import { modalBody, modalHelperSmall } from "../../../../shared/components/ui/modal-tokens";
import type {
  SectionEntry,
  WebsiteBuilderLocation,
  FaqItem,
  AnnouncementContent,
  AnnouncementConfig,
  AboutConfig,
  HeroConfig,
  StripConfig,
  LocationsConfig,
  TeamConfig,
  GalleryConfig,
  ReviewsConfig,
  FooterConfig,
  FaqConfig,
  ServicesConfig,
} from "../../types";
import { isKnownSectionType, SECTION_META } from "./sectionCatalog";
import { FaqEditor } from "./FaqEditor";
import { AnnouncementEditor } from "./AnnouncementEditor";
import { AboutEditor } from "./AboutEditor";
import { HeroEditor } from "./HeroEditor";
import { StripEditor } from "./StripEditor";
import { LocationsEditor } from "./LocationsEditor";
import { TeamEditor } from "./TeamEditor";
import { GalleryEditor } from "./GalleryEditor";
import { ReviewsEditor } from "./ReviewsEditor";
import { FooterEditor } from "./FooterEditor";
import { ServicesEditor } from "./ServicesEditor";
import { footerDefaultHeadlineCopy } from "./footerHeadline";
import type { WebsiteDraftIssue } from "./draftValidation";

interface SettingsPanelProps {
  entry: SectionEntry;
  index: number;
  locations: WebsiteBuilderLocation[];
  /** Exact location set rendered by Services after the website-wide Locations selection. */
  serviceLocations?: WebsiteBuilderLocation[];
  faqItems: FaqItem[];
  announcementContent: AnnouncementContent;
  aboutContent: string;
  businessDescription: string | null;
  establishedYear: number | null;
  establishedYearError?: string | null;
  tagline: string;
  taglineError?: string;
  heroImageUrl: string | null;
  /** Save-blocking issues for this section; editors reveal the matching active-locale control. */
  blockingIssues?: WebsiteDraftIssue[];
  canWrite: boolean;
  locale: "en" | "ro";
  onConfigChange: (index: number, config: Record<string, unknown>) => void;
  /** `restoreConfig` = config an editor cascade changed alongside visibility; Undo reapplies it. */
  onTurnOffSection: (restoreConfig?: Record<string, unknown>) => void;
  onFaqChange: (items: FaqItem[]) => void;
  onAnnouncementChange: (value: AnnouncementContent) => void;
  onAboutChange: (value: string) => void;
  onEstablishedYearChange: (value: number | null) => void;
  onTaglineChange: (value: string) => void;
  selectedPreviewLocationId?: number | null;
  onPreviewLocationSelect?: (locationId: number) => void;
  /** Variant currently rendered in preview; may differ from the saved one while browsing a locked style. */
  previewVariant?: string;
  /** Presentation only; product behavior and data ownership remain identical. */
  variant?: "default" | "atelier";
}

function AtelierContentGroup({ children }: { children: ReactNode }) {
  return (
    <section className="atelier-inspector-group atelier-inspector-content-group">
      <div className="atelier-inspector-group-body">{children}</div>
    </section>
  );
}

function AtelierProfileSyncNote({
  description,
  sourceText,
  linkTo = "/account?tab=profile",
  linkText,
  secondaryLinkTo,
  secondaryLinkText,
}: {
  description?: string;
  sourceText?: string;
  linkTo?: string;
  linkText?: string;
  secondaryLinkTo?: string;
  secondaryLinkText?: string;
}) {
  const { t } = useTranslation("website");

  return (
    <section className="atelier-inspector-group atelier-inspector-source-group">
      <h3 className="atelier-inspector-group-label">
        {t("businessPage.builder.settings.contentSourceLabel")}
      </h3>
      <div className="atelier-settings-sync flex items-start gap-2.5">
        <Info className="mt-0.5 size-3.5 shrink-0 text-foreground-3" strokeWidth={1.7} aria-hidden />
        <div className="min-w-0">
          {description ? (
            <p className={cn(modalBody, "mt-0 text-foreground-2")}>{description}</p>
          ) : null}
          <p className={cn(modalHelperSmall, description ? "mt-1.5 text-foreground-3" : "mt-0 text-foreground-3")}>
            {sourceText ?? t("businessPage.builder.settings.profileSync")} {" "}
            <Link
              to={linkTo}
              className="font-semibold text-foreground-2 underline decoration-border-strong underline-offset-2 hover:text-foreground-1"
            >
              {linkText ?? t("businessPage.builder.settings.profileLink")}
            </Link>
            {secondaryLinkTo && secondaryLinkText ? (
              <>
                <span aria-hidden> · </span>
                <Link
                  to={secondaryLinkTo}
                  className="font-semibold text-foreground-2 underline decoration-border-strong underline-offset-2 hover:text-foreground-1"
                >
                  {secondaryLinkText}
                </Link>
              </>
            ) : null}
          </p>
        </div>
      </div>
    </section>
  );
}

function AtelierFooterSourceNote() {
  const { t } = useTranslation("website");

  return (
    <section className="atelier-inspector-group atelier-inspector-source-group">
      <h3 className="atelier-inspector-group-label">
        {t("businessPage.builder.settings.contentSourceLabel")}
      </h3>
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <Link
          to="/account?tab=profile"
          className="group flex min-h-11 items-start justify-between gap-3 px-3 py-3 outline-none transition-colors duration-150 hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
        >
          <span className="min-w-0">
            <span className="block text-[12px] font-semibold text-foreground-1">
              {t("businessPage.builder.settings.footerSourceBusinessTitle")}
            </span>
            <span className="mt-0.5 block text-pretty text-[10.5px] leading-[1.45] text-foreground-3">
              {t("businessPage.builder.settings.footerSourceBusinessBody")}
            </span>
          </span>
          <ArrowUpRight
            className="mt-0.5 size-3.5 shrink-0 text-foreground-3 transition-colors duration-150 group-hover:text-foreground-1 group-focus-visible:text-foreground-1"
            strokeWidth={1.8}
            aria-hidden
          />
        </Link>

        <Link
          to="/locations"
          className="group flex min-h-11 items-start justify-between gap-3 border-t border-border-subtle px-3 py-3 outline-none transition-colors duration-150 hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
        >
          <span className="min-w-0">
            <span className="block text-[12px] font-semibold text-foreground-1">
              {t("businessPage.builder.settings.footerSourceLocationsTitle")}
            </span>
            <span className="mt-0.5 block text-pretty text-[10.5px] leading-[1.45] text-foreground-3">
              {t("businessPage.builder.settings.footerSourceLocationsBody")}
            </span>
          </span>
          <ArrowUpRight
            className="mt-0.5 size-3.5 shrink-0 text-foreground-3 transition-colors duration-150 group-hover:text-foreground-1 group-focus-visible:text-foreground-1"
            strokeWidth={1.8}
            aria-hidden
          />
        </Link>
      </div>
    </section>
  );
}

/** Per-section settings. Data-backed sections expose presentation copy, refs, and toggles without
 *  duplicating their canonical business data; only FAQ and Announcement own net-new section content. */
export function SettingsPanel({
  entry,
  index,
  locations,
  serviceLocations,
  faqItems,
  announcementContent,
  aboutContent,
  businessDescription,
  establishedYear,
  establishedYearError,
  tagline,
  taglineError,
  heroImageUrl,
  blockingIssues = [],
  canWrite,
  locale,
  onConfigChange,
  onTurnOffSection,
  onFaqChange,
  onAnnouncementChange,
  onAboutChange,
  onEstablishedYearChange,
  onTaglineChange,
  selectedPreviewLocationId,
  onPreviewLocationSelect,
  previewVariant,
  variant = "default",
}: SettingsPanelProps) {
  const { t } = useTranslation("website");
  const renderEditorGroups = (
    content: ReactNode,
    {
      includeSource = false,
      sourceText,
      sourceLinkTo,
      sourceLinkText,
      secondarySourceLinkTo,
      secondarySourceLinkText,
      wrapDefault = true,
    }: {
      includeSource?: boolean;
      sourceText?: string;
      sourceLinkTo?: string;
      sourceLinkText?: string;
      secondarySourceLinkTo?: string;
      secondarySourceLinkText?: string;
      wrapDefault?: boolean;
    } = {},
  ) => {
    if (variant === "atelier") {
      return (
        <>
          <AtelierContentGroup>{content}</AtelierContentGroup>
          {includeSource ? (
            <AtelierProfileSyncNote
              sourceText={sourceText}
              linkTo={sourceLinkTo}
              linkText={sourceLinkText}
              secondaryLinkTo={secondarySourceLinkTo}
              secondaryLinkText={secondarySourceLinkText}
            />
          ) : null}
        </>
      );
    }
    return wrapDefault ? <div className="space-y-4">{content}</div> : content;
  };

  if (entry.type === "nav") {
    if (variant === "atelier") {
      return (
        <AtelierProfileSyncNote
          sourceText={t("businessPage.builder.settings.navSource")}
          linkTo="/account?tab=profile"
          linkText={t("businessPage.builder.settings.editBusinessProfile")}
        />
      );
    }
  }

  if (entry.type === "hero") {
    // Mirrors the hero rating gate in LivePreview (aggregateReviews → count > 0).
    const hasReviews = locations.some((l) => (l.totalReviews ?? 0) > 0);
    return renderEditorGroups(
      <HeroEditor
        tagline={tagline}
        setTagline={onTaglineChange}
        taglineError={taglineError}
        heroImageUrl={heroImageUrl}
        canWrite={canWrite}
        config={(entry.config ?? {}) as HeroConfig}
        onConfigChange={(patch) => onConfigChange(index, patch as Record<string, unknown>)}
        locations={locations}
        locale={locale}
        hasReviews={hasReviews}
        variant={variant}
        previewVariant={previewVariant ?? entry.variant}
        blockingIssues={blockingIssues}
      />,
      { includeSource: true },
    );
  }

  if (entry.type === "about") {
    return renderEditorGroups(
      <AboutEditor
        value={aboutContent}
        onChange={onAboutChange}
        config={(entry.config ?? {}) as AboutConfig}
        locations={locations}
        onConfigChange={(patch) => onConfigChange(index, patch as Record<string, unknown>)}
        businessDescription={businessDescription}
        establishedYear={establishedYear}
        onEstablishedYearChange={onEstablishedYearChange}
        establishedYearError={establishedYearError}
        required={entry.visible}
        showPhoto={["editorial", "sticky"].includes(previewVariant ?? entry.variant)}
        locale={locale}
        blockingIssues={blockingIssues}
      />,
      {
        includeSource: true,
        sourceText: t("businessPage.about.storySource"),
        sourceLinkTo: "/account?tab=profile",
        sourceLinkText: t("businessPage.about.storySourceLink"),
      },
    );
  }

  if (entry.type === "marquee") {
    return renderEditorGroups(
      <StripEditor
        config={(entry.config ?? {}) as StripConfig}
        onConfigChange={(patch) => onConfigChange(index, patch as Record<string, unknown>)}
      />,
      {
        includeSource: true,
        sourceText: t("businessPage.builder.settings.stripSeparator.source"),
        sourceLinkTo: "/services",
        sourceLinkText: t("businessPage.builder.settings.stripSeparator.manageServices"),
      },
    );
  }

  if (entry.type === "faq") {
    return renderEditorGroups(
      <FaqEditor
        items={faqItems}
        onChange={onFaqChange}
        locale={locale}
        config={(entry.config ?? {}) as FaqConfig}
        onConfigChange={(patch) => onConfigChange(index, patch as Record<string, unknown>)}
        showHeading={(previewVariant ?? entry.variant) !== "index"}
        blockingIssues={blockingIssues}
      />,
      { wrapDefault: false },
    );
  }

  if (entry.type === "announcement") {
    // A shown announcement surfaces a readiness hint here; incomplete drafts still save.
    return renderEditorGroups(
      <AnnouncementEditor
        value={announcementContent}
        onChange={onAnnouncementChange}
        config={(entry.config ?? {}) as AnnouncementConfig}
        onConfigChange={(patch) => onConfigChange(index, patch as Record<string, unknown>)}
        locale={locale}
        required={entry.visible}
        canWrite={canWrite}
        variant={variant}
        blockingIssues={blockingIssues}
      />,
      { wrapDefault: false },
    );
  }

  if (entry.type === "locations") {
    return renderEditorGroups(
      <LocationsEditor
        config={(entry.config ?? {}) as LocationsConfig}
        locations={locations}
        onConfigChange={(patch) => onConfigChange(index, patch as Record<string, unknown>)}
        onTurnOffSection={onTurnOffSection}
        selectedPreviewLocationId={selectedPreviewLocationId}
        onPreviewLocationSelect={onPreviewLocationSelect}
      />,
      {
        includeSource: true,
        sourceText: t("businessPage.builder.settings.locationsSource"),
        sourceLinkTo: "/locations",
        sourceLinkText: t("businessPage.builder.settings.manageLocations"),
      },
    );
  }

  if (entry.type === "team") {
    // The roster + Manage link inside TeamEditor stands in for the generic (and mis-attributed) profile-sync note.
    return renderEditorGroups(
      <TeamEditor
        config={(entry.config ?? {}) as TeamConfig}
        locale={locale}
        locations={locations}
        onConfigChange={(patch) => onConfigChange(index, patch as Record<string, unknown>)}
        blockingIssues={blockingIssues}
      />,
      { includeSource: false },
    );
  }

  if (entry.type === "gallery") {
    return renderEditorGroups(
      <GalleryEditor
        config={(entry.config ?? {}) as GalleryConfig}
        locations={locations}
        locale={locale}
        onConfigChange={(patch) => onConfigChange(index, patch as Record<string, unknown>)}
        blockingIssues={blockingIssues}
      />,
      { includeSource: false },
    );
  }

  if (entry.type === "testimonials") {
    return renderEditorGroups(
      <ReviewsEditor
        config={(entry.config ?? {}) as ReviewsConfig}
        locale={locale}
        onConfigChange={(patch) => onConfigChange(index, patch as Record<string, unknown>)}
        blockingIssues={blockingIssues}
      />,
      {
        includeSource: true,
        sourceText: t("businessPage.builder.settings.reviewsSource"),
        sourceLinkTo: "/marketplace?tab=reviews",
        sourceLinkText: t("businessPage.builder.settings.viewReviews"),
      },
    );
  }

  if (entry.type === "footer") {
    const footerVariant = previewVariant ?? entry.variant;
    const footerSupportsCopy = footerVariant === "directory" || footerVariant === "editorial";
    const hasFooterIssue = (controlId: string) => blockingIssues.some(
      (issue) => issue.controlId === controlId && (!issue.locale || issue.locale === locale),
    );
    const headlineNeedsRepair = hasFooterIssue("footer-headline");
    const descriptionNeedsRepair = hasFooterIssue("footer-description");
    if (footerSupportsCopy || headlineNeedsRepair || descriptionNeedsRepair) {
      const footerHeadlineCopy = footerDefaultHeadlineCopy(
        locations,
        selectedPreviewLocationId,
      );
      const editor = (
        <FooterEditor
          config={(entry.config ?? {}) as FooterConfig}
          locale={locale}
          showHeadlineControl={footerVariant === "editorial" || headlineNeedsRepair}
          showDescriptionControl={footerSupportsCopy || descriptionNeedsRepair}
          defaultHeadline={t(footerHeadlineCopy.key, footerHeadlineCopy.options)}
          showLogoControl={footerVariant === "directory"}
          onConfigChange={(patch) => onConfigChange(index, patch as Record<string, unknown>)}
          blockingIssues={blockingIssues}
        />
      );
      if (variant === "atelier") {
        return (
          <>
            <AtelierContentGroup>{editor}</AtelierContentGroup>
            <AtelierFooterSourceNote />
          </>
        );
      }
      return <div className="space-y-4">{editor}</div>;
    }
    if (variant === "atelier") {
      return <AtelierFooterSourceNote />;
    }
  }

  if (entry.type === "services") {
    const resolvedServiceLocations = serviceLocations ?? locations;
    const followsLocationSelection =
      resolvedServiceLocations.length !== locations.length ||
      resolvedServiceLocations.some(
        (location, locationIndex) => location.id !== locations[locationIndex]?.id,
      );
    return renderEditorGroups(
      <ServicesEditor
        config={(entry.config ?? {}) as ServicesConfig}
        locale={locale}
        locations={resolvedServiceLocations}
        selectedPreviewLocationId={selectedPreviewLocationId}
        showPhoto={(previewVariant ?? entry.variant) === "feature"}
        followsLocationSelection={followsLocationSelection}
        onConfigChange={(patch) => onConfigChange(index, patch as Record<string, unknown>)}
        blockingIssues={blockingIssues}
      />,
      { wrapDefault: false },
    );
  }

  // Sections that are pure views over existing data: a quiet note explaining what they show.
  const meta = isKnownSectionType(entry.type) ? SECTION_META[entry.type] : null;
  if (variant === "atelier") {
    return (
      <AtelierProfileSyncNote
        description={meta ? t(meta.descriptionKey) : t("businessPage.builder.settings.noSettings")}
      />
    );
  }
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-hover/45 px-3.5 py-3">
      <p className={cn(modalBody, "mt-0 text-foreground-1")}>
        {meta ? t(meta.descriptionKey) : t("businessPage.builder.settings.noSettings")}
      </p>
      <p className={cn(modalHelperSmall, "mt-1.5 text-foreground-3")}>
        {t("businessPage.builder.settings.viewOnlyHint")}
      </p>
    </div>
  );
}

export default SettingsPanel;
