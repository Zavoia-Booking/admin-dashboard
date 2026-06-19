import { useTranslation } from "react-i18next";
import { Switch } from "../../../../../shared/components/ui/switch";
import type {
  SectionEntry,
  LocationWithAssignments,
  FaqItem,
  AnnouncementContent,
} from "../../../types";
import { isKnownSectionType, SECTION_META } from "./sectionCatalog";
import { FaqEditor } from "./FaqEditor";
import { AnnouncementEditor } from "./AnnouncementEditor";
import { AboutEditor } from "./AboutEditor";
import { HeroEditor } from "./HeroEditor";

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
  onFaqChange,
  onAnnouncementChange,
  onAboutChange,
  onTaglineChange,
}: SettingsPanelProps) {
  const { t } = useTranslation("marketplace");

  if (entry.type === "hero") {
    return (
      <HeroEditor
        tagline={tagline}
        setTagline={onTaglineChange}
        taglineError={taglineError}
        heroImageUrl={heroImageUrl}
        canWrite={canWrite}
      />
    );
  }

  if (entry.type === "about") {
    return <AboutEditor value={aboutContent} onChange={onAboutChange} />;
  }

  if (entry.type === "faq") {
    return <FaqEditor items={faqItems} onChange={onFaqChange} locale={locale} />;
  }

  if (entry.type === "announcement") {
    return (
      <AnnouncementEditor value={announcementContent} onChange={onAnnouncementChange} locale={locale} />
    );
  }

  if (entry.type === "locations") {
    const hidden = new Set((entry.config?.hiddenLocationIds as number[] | undefined) ?? []);
    const toggle = (id: number, show: boolean) => {
      const next = new Set(hidden);
      if (show) next.delete(id);
      else next.add(id);
      onConfigChange(index, { hiddenLocationIds: Array.from(next) });
    };
    return (
      <div className="space-y-2">
        <p className="text-xs text-foreground-3">{t("businessPage.builder.settings.locationsHint")}</p>
        {locations.length === 0 ? (
          <p className="text-sm text-foreground-3">{t("businessPage.builder.settings.locationsNone")}</p>
        ) : (
          locations.map((l) => (
            <div key={l.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
              <span className="min-w-0 truncate text-sm text-foreground-1">{l.name}</span>
              <Switch checked={!hidden.has(l.id)} onCheckedChange={(v) => toggle(l.id, v)} />
            </div>
          ))
        )}
      </div>
    );
  }

  // Sections that are pure views over existing data: explain what they show.
  const descKey = isKnownSectionType(entry.type)
    ? SECTION_META[entry.type].descriptionKey
    : null;
  return (
    <p className="text-sm text-foreground-3 leading-relaxed">
      {descKey ? t(descKey) : t("businessPage.builder.settings.noSettings")}
    </p>
  );
}

export default SettingsPanel;
