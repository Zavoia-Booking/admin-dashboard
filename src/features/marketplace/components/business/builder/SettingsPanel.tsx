import { useTranslation } from "react-i18next";
import { cn } from "../../../../../shared/lib/utils";
import { modalBody, modalHelperSmall } from "../../../../../shared/components/ui/modal-tokens";
import type {
  SectionEntry,
  LocationWithAssignments,
  FaqItem,
  AnnouncementContent,
  HeroConfig,
  LocationsConfig,
} from "../../../types";
import { isKnownSectionType, SECTION_META } from "./sectionCatalog";
import { FaqEditor } from "./FaqEditor";
import { AnnouncementEditor } from "./AnnouncementEditor";
import { AboutEditor } from "./AboutEditor";
import { HeroEditor } from "./HeroEditor";
import { LocationsEditor } from "./LocationsEditor";

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
  onTurnOffSection: () => void;
  onFaqChange: (items: FaqItem[]) => void;
  onAnnouncementChange: (value: AnnouncementContent) => void;
  onAboutChange: (value: string) => void;
  onTaglineChange: (value: string) => void;
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
}: SettingsPanelProps) {
  const { t } = useTranslation("marketplace");

  if (entry.type === "hero") {
    // Mirrors the hero rating gate in LivePreview (aggregateReviews → count > 0).
    const hasReviews = locations.some((l) => (l.totalReviews ?? 0) > 0);
    return (
      <HeroEditor
        tagline={tagline}
        setTagline={onTaglineChange}
        taglineError={taglineError}
        heroImageUrl={heroImageUrl}
        canWrite={canWrite}
        config={(entry.config ?? {}) as HeroConfig}
        onConfigChange={(patch) => onConfigChange(index, patch as Record<string, unknown>)}
        hasReviews={hasReviews}
      />
    );
  }

  if (entry.type === "about") {
    // A shown About needs a headline → require it here, mirroring the publish gate in useMarketplaceForm.
    return (
      <AboutEditor
        value={aboutContent}
        onChange={onAboutChange}
        required={entry.visible}
      />
    );
  }

  if (entry.type === "faq") {
    return <FaqEditor items={faqItems} onChange={onFaqChange} locale={locale} />;
  }

  if (entry.type === "announcement") {
    // A shown announcement needs a message → require it here, mirroring the publish gate in useMarketplaceForm.
    return (
      <AnnouncementEditor
        value={announcementContent}
        onChange={onAnnouncementChange}
        locale={locale}
        required={entry.visible}
      />
    );
  }

  if (entry.type === "locations") {
    return (
      <LocationsEditor
        config={(entry.config ?? {}) as LocationsConfig}
        locations={locations}
        locale={locale}
        onConfigChange={(patch) => onConfigChange(index, patch as Record<string, unknown>)}
        onTurnOffSection={onTurnOffSection}
      />
    );
  }

  // Sections that are pure views over existing data: an editorial note explaining what they show. No icon
  // tile — a brand-tinted left rule reads as an informational aside without the boxy chrome.
  const meta = isKnownSectionType(entry.type) ? SECTION_META[entry.type] : null;
  return (
    <div className="border-l-2 border-primary/30 py-0.5 pl-4">
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
