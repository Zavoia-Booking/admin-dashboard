import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../../../shared/lib/utils";
import { modalBody, modalHelperSmall } from "../../../../shared/components/ui/modal-tokens";
import type {
  SectionEntry,
  LocationWithAssignments,
  FaqItem,
  AnnouncementContent,
  AnnouncementConfig,
  HeroConfig,
  LocationsConfig,
  TeamConfig,
  GalleryConfig,
  ReviewsConfig,
  FooterConfig,
  FaqConfig,
} from "../../types";
import { isKnownSectionType, SECTION_META } from "./sectionCatalog";
import { FaqEditor } from "./FaqEditor";
import { AnnouncementEditor } from "./AnnouncementEditor";
import { AboutEditor } from "./AboutEditor";
import { HeroEditor } from "./HeroEditor";
import { LocationsEditor } from "./LocationsEditor";
import { TeamEditor } from "./TeamEditor";
import { GalleryEditor } from "./GalleryEditor";
import { ReviewsEditor } from "./ReviewsEditor";
import { FooterEditor } from "./FooterEditor";

interface SettingsPanelProps {
  entry: SectionEntry;
  index: number;
  locations: LocationWithAssignments[];
  faqItems: FaqItem[];
  announcementContent: AnnouncementContent;
  aboutContent: string;
  tagline: string;
  taglineError?: string;
  heroImageUrl: string | null;
  canWrite: boolean;
  locale: "en" | "ro";
  onConfigChange: (index: number, config: Record<string, unknown>) => void;
  /** `restoreConfig` = config an editor cascade changed alongside visibility; Undo reapplies it. */
  onTurnOffSection: (restoreConfig?: Record<string, unknown>) => void;
  onFaqChange: (items: FaqItem[]) => void;
  onAnnouncementChange: (value: AnnouncementContent) => void;
  onAboutChange: (value: string) => void;
  onTaglineChange: (value: string) => void;
  /** Variant currently rendered in preview; may differ from the saved one while browsing a locked style. */
  previewVariant?: string;
  /** Presentation only; product behavior and data ownership remain identical. */
  variant?: "default" | "atelier";
}

function AtelierContentGroup({ children }: { children: ReactNode }) {
  const { t } = useTranslation("website");

  return (
    <section className="atelier-inspector-group atelier-inspector-content-group">
      <h3 className="atelier-inspector-group-label">
        {t("businessPage.builder.settings.contentLabel")}
      </h3>
      <div className="atelier-inspector-group-body">{children}</div>
    </section>
  );
}

function AtelierProfileSyncNote({ description }: { description?: string }) {
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
            {t("businessPage.builder.settings.profileSync")} {" "}
            <Link
              to="/account?tab=profile"
              className="font-semibold text-foreground-2 underline decoration-border-strong underline-offset-2 hover:text-foreground-1"
            >
              {t("businessPage.builder.settings.profileLink")}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

/** Per-section settings. Most sections are views over existing data → only show/hide + variant; only
 *  Hero (tagline + cover), Locations (which to show), About, FAQ and Announcement carry editable
 *  content here. */
export function SettingsPanel({
  entry,
  index,
  locations,
  faqItems,
  announcementContent,
  aboutContent,
  tagline,
  taglineError,
  heroImageUrl,
  canWrite,
  locale,
  onConfigChange,
  onTurnOffSection,
  onFaqChange,
  onAnnouncementChange,
  onAboutChange,
  onTaglineChange,
  previewVariant,
  variant = "default",
}: SettingsPanelProps) {
  const { t } = useTranslation("website");
  const renderEditorGroups = (
    content: ReactNode,
    { includeSource = false, wrapDefault = true }: { includeSource?: boolean; wrapDefault?: boolean } = {},
  ) => {
    if (variant === "atelier") {
      return (
        <>
          <AtelierContentGroup>{content}</AtelierContentGroup>
          {includeSource ? <AtelierProfileSyncNote /> : null}
        </>
      );
    }
    return wrapDefault ? <div className="space-y-4">{content}</div> : content;
  };

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
      />,
      { includeSource: true },
    );
  }

  if (entry.type === "about") {
    // A shown About surfaces a readiness hint here; incomplete drafts still save.
    return renderEditorGroups(
      <AboutEditor
        value={aboutContent}
        onChange={onAboutChange}
        required={entry.visible}
      />,
      { includeSource: true },
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
      />,
      { wrapDefault: false },
    );
  }

  if (entry.type === "locations") {
    return renderEditorGroups(
      <LocationsEditor
        config={(entry.config ?? {}) as LocationsConfig}
        locations={locations}
        locale={locale}
        onConfigChange={(patch) => onConfigChange(index, patch as Record<string, unknown>)}
        onTurnOffSection={onTurnOffSection}
      />,
      { includeSource: true },
    );
  }

  if (entry.type === "team") {
    return renderEditorGroups(
      <TeamEditor
        config={(entry.config ?? {}) as TeamConfig}
        locale={locale}
        onConfigChange={(patch) => onConfigChange(index, patch as Record<string, unknown>)}
      />,
      { includeSource: true },
    );
  }

  if (entry.type === "gallery") {
    return renderEditorGroups(
      <GalleryEditor
        config={(entry.config ?? {}) as GalleryConfig}
        locations={locations}
        locale={locale}
        onConfigChange={(patch) => onConfigChange(index, patch as Record<string, unknown>)}
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
      />,
      { includeSource: true },
    );
  }

  if (entry.type === "footer" && (previewVariant ?? entry.variant) === "directory") {
    return renderEditorGroups(
      <FooterEditor
        config={(entry.config ?? {}) as FooterConfig}
        onConfigChange={(patch) => onConfigChange(index, patch as Record<string, unknown>)}
      />,
      { includeSource: true },
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
