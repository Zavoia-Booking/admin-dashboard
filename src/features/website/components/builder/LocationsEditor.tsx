import { useTranslation } from "react-i18next";
import { Switch } from "../../../../shared/components/ui/switch";
import { modalHelperSmall } from "../../../../shared/components/ui/modal-tokens";
import { CopyOverride } from "./CopyOverride";
import type { LocationsConfig, LocationWithAssignments } from "../../types";

interface LocationsEditorProps {
  config: LocationsConfig;
  locations: LocationWithAssignments[];
  locale: "en" | "ro";
  onConfigChange: (patch: Partial<LocationsConfig>) => void;
  /** `restoreConfig` reverts this cascade's config change when the section-off toast is undone. */
  onTurnOffSection: (restoreConfig?: Record<string, unknown>) => void;
}

/**
 * Locations section settings: the editorial heading + sub-lede (each defaults to the built-in copy and is
 * directly editable while retaining its built-in default), then the picker for which locations appear. Copy is
 * stored per locale so the public page reads the right language; a blank override falls back to the default.
 */
export function LocationsEditor({
  config,
  locations,
  locale,
  onConfigChange,
  onTurnOffSection,
}: LocationsEditorProps) {
  const { t } = useTranslation("website");
  const hidden = new Set(config.hiddenLocationIds ?? []);
  const shownCount = locations.filter((l) => !hidden.has(l.id)).length;

  const setCopy = (field: "heading" | "sublede", value: string) => {
    const current = config[field] ?? { en: "", ro: "" };
    const next = { ...current, [locale]: value };
    const hasOverride = next.en.trim() !== "" || next.ro.trim() !== "";
    onConfigChange({ [field]: hasOverride ? next : undefined });
  };

  const toggleLocation = (id: number, show: boolean) => {
    const next = new Set(hidden);
    if (show) next.delete(id);
    else next.add(id);
    onConfigChange({ hiddenLocationIds: Array.from(next) });
    // Hiding the last visible location turns the whole section off and collapses it. Undo must
    // also bring that location back — hand the pre-toggle hidden set to the section-off toast.
    if (!locations.some((l) => !next.has(l.id))) {
      onTurnOffSection({ hiddenLocationIds: Array.from(hidden) });
    }
  };

  return (
    <div className="space-y-6">
      {/* Which locations appear on the page */}
      <div className="space-y-3">
        <p className={modalHelperSmall}>{t("businessPage.builder.settings.locationsHint")}</p>
        {locations.length === 0 ? (
          <p className="text-sm text-foreground-3">{t("businessPage.builder.settings.locationsNone")}</p>
        ) : (
          <div className="space-y-2">
            {locations.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 transition-colors duration-150 hover:border-border-strong"
              >
                <span className="min-w-0 truncate text-sm text-foreground-1">{l.name}</span>
                <Switch
                  aria-label={t("businessPage.builder.settings.locationVisibility", { name: l.name })}
                  checked={!hidden.has(l.id)}
                  onCheckedChange={(v) => toggleLocation(l.id, v)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section copy — heading + subtitle, each defaulting to the built-in text until customized */}
      <div className="border-t border-border pt-5">
        <div>
          <CopyOverride
            idBase="locations-heading"
            locale={locale}
            label={t("businessPage.builder.settings.locationsHeadingLabel")}
            defaultText={t("businessPage.builder.preview.subhead.locations", { count: shownCount })}
            value={config.heading?.[locale] ?? ""}
            onChange={(v) => setCopy("heading", v)}
            maxLength={80}
            rows={2}
          />
          <div className="mt-5 border-t border-border-subtle pt-5">
            <CopyOverride
              idBase="locations-sublede"
              locale={locale}
              label={t("businessPage.builder.settings.locationsSubledeLabel")}
              defaultText={t("businessPage.builder.preview.sublede.locations", { count: shownCount })}
              value={config.sublede?.[locale] ?? ""}
              onChange={(v) => setCopy("sublede", v)}
              maxLength={220}
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LocationsEditor;
