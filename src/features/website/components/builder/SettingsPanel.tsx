import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Info } from "lucide-react";
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
  /** Presentation only; product behavior and data ownership remain identical. */
  variant?: "default" | "atelier";
}

function AtelierProfileSyncNote() {
  const { t } = useTranslation("website");

  return (
    <div className="atelier-settings-sync flex items-start gap-2.5">
      <Info className="mt-0.5 size-3.5 shrink-0 text-foreground-3" strokeWidth={1.7} aria-hidden />
      <div className="min-w-0">
        <p className={cn(modalHelperSmall, "mt-0 text-foreground-3")}>
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
  variant = "default",
}: SettingsPanelProps) {
  const { t } = useTranslation("website");

  if (entry.type === "hero") {
    // Mirrors the hero rating gate in LivePreview (aggregateReviews → count > 0).
    const hasReviews = locations.some((l) => (l.totalReviews ?? 0) > 0);
    return (
      <div className="space-y-4">
        <HeroEditor
          tagline={tagline}
          setTagline={onTaglineChange}
          taglineError={taglineError}
          heroImageUrl={heroImageUrl}
          canWrite={canWrite}
          config={(entry.config ?? {}) as HeroConfig}
          onConfigChange={(patch) => onConfigChange(index, patch as Record<string, unknown>)}
          hasReviews={hasReviews}
          variant={variant}
        />
        {variant === "atelier" ? <AtelierProfileSyncNote /> : null}
      </div>
    );
  }

  if (entry.type === "about") {
    // A shown About surfaces a readiness hint here; incomplete drafts still save.
    return (
      <div className="space-y-4">
        <AboutEditor
          value={aboutContent}
          onChange={onAboutChange}
          required={entry.visible}
        />
        {variant === "atelier" ? <AtelierProfileSyncNote /> : null}
      </div>
    );
  }

  if (entry.type === "faq") {
    return <FaqEditor items={faqItems} onChange={onFaqChange} locale={locale} />;
  }

  if (entry.type === "announcement") {
    // A shown announcement surfaces a readiness hint here; incomplete drafts still save.
    return (
      <AnnouncementEditor
        value={announcementContent}
        onChange={onAnnouncementChange}
        config={(entry.config ?? {}) as AnnouncementConfig}
        onConfigChange={(patch) => onConfigChange(index, patch as Record<string, unknown>)}
        locale={locale}
        required={entry.visible}
        canWrite={canWrite}
        variant={variant}
      />
    );
  }

  if (entry.type === "locations") {
    return (
      <div className="space-y-4">
        <LocationsEditor
          config={(entry.config ?? {}) as LocationsConfig}
          locations={locations}
          locale={locale}
          onConfigChange={(patch) => onConfigChange(index, patch as Record<string, unknown>)}
          onTurnOffSection={onTurnOffSection}
        />
        {variant === "atelier" ? <AtelierProfileSyncNote /> : null}
      </div>
    );
  }

  if (entry.type === "team") {
    return (
      <div className="space-y-4">
        <TeamEditor
          config={(entry.config ?? {}) as TeamConfig}
          locale={locale}
          onConfigChange={(patch) => onConfigChange(index, patch as Record<string, unknown>)}
        />
        {variant === "atelier" ? <AtelierProfileSyncNote /> : null}
      </div>
    );
  }

  if (entry.type === "gallery") {
    return (
      <div className="space-y-4">
        <GalleryEditor
          config={(entry.config ?? {}) as GalleryConfig}
          locale={locale}
          onConfigChange={(patch) => onConfigChange(index, patch as Record<string, unknown>)}
        />
        {variant === "atelier" ? <AtelierProfileSyncNote /> : null}
      </div>
    );
  }

  if (entry.type === "testimonials") {
    return (
      <div className="space-y-4">
        <ReviewsEditor
          config={(entry.config ?? {}) as ReviewsConfig}
          locale={locale}
          onConfigChange={(patch) => onConfigChange(index, patch as Record<string, unknown>)}
        />
        {variant === "atelier" ? <AtelierProfileSyncNote /> : null}
      </div>
    );
  }

  // Sections that are pure views over existing data: a quiet note explaining what they show.
  const meta = isKnownSectionType(entry.type) ? SECTION_META[entry.type] : null;
  return (
    <div className={cn(
      "rounded-xl border border-border-subtle bg-surface-hover/45 px-3.5 py-3",
      variant === "atelier" && "atelier-settings-sync",
    )}>
      <p className={cn(modalBody, "mt-0 text-foreground-1")}>
        {meta ? t(meta.descriptionKey) : t("businessPage.builder.settings.noSettings")}
      </p>
      <p className={cn(modalHelperSmall, "mt-1.5 text-foreground-3")}>
        {variant === "atelier"
          ? t("businessPage.builder.settings.profileSync")
          : t("businessPage.builder.settings.viewOnlyHint")}
      </p>
      {variant === "atelier" ? (
        <Link
          to="/account?tab=profile"
          className="mt-2 inline-flex text-[11px] font-semibold text-foreground-2 underline decoration-border-strong underline-offset-2 hover:text-foreground-1"
        >
          {t("businessPage.builder.settings.profileLink")}
        </Link>
      ) : null}
    </div>
  );
}

export default SettingsPanel;
