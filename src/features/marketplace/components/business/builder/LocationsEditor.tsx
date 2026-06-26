import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Switch } from "../../../../../shared/components/ui/switch";
import { Textarea } from "../../../../../shared/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
} from "../../../../../shared/components/ui/collapsible";
import { modalHelperSmall } from "../../../../../shared/components/ui/modal-tokens";
import { AutoHeight } from "./AutoHeight";
import type { LocationsConfig, LocationWithAssignments } from "../../../types";

const GROUP_LABEL = "text-[11px] font-medium uppercase tracking-[0.14em] text-foreground-3";

interface LocationsEditorProps {
  config: LocationsConfig;
  locations: LocationWithAssignments[];
  locale: "en" | "ro";
  onConfigChange: (patch: Partial<LocationsConfig>) => void;
  onTurnOffSection: () => void;
}

/**
 * Locations section settings: the editorial heading + sub-lede (each defaults to the built-in copy and is
 * only overridden once the owner flips its switch), then the picker for which locations appear. Copy is
 * stored per locale so the public page reads the right language; a blank override falls back to the default.
 */
export function LocationsEditor({
  config,
  locations,
  locale,
  onConfigChange,
  onTurnOffSection,
}: LocationsEditorProps) {
  const { t } = useTranslation("marketplace");
  const hidden = new Set(config.hiddenLocationIds ?? []);
  const shownCount = locations.filter((l) => !hidden.has(l.id)).length;

  const setCopy = (field: "heading" | "sublede", value: string) => {
    const current = config[field] ?? { en: "", ro: "" };
    onConfigChange({ [field]: { ...current, [locale]: value } });
  };

  const toggleLocation = (id: number, show: boolean) => {
    const next = new Set(hidden);
    if (show) next.delete(id);
    else next.add(id);
    onConfigChange({ hiddenLocationIds: Array.from(next) });
    // Hiding the last visible location turns the whole section off and collapses it.
    if (!locations.some((l) => !next.has(l.id))) onTurnOffSection();
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
                <Switch checked={!hidden.has(l.id)} onCheckedChange={(v) => toggleLocation(l.id, v)} />
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
            label={t("businessPage.builder.settings.locationsHeadingLabel")}
            defaultText={t("businessPage.builder.preview.subhead.locations", { count: shownCount })}
            value={config.heading?.[locale] ?? ""}
            onChange={(v) => setCopy("heading", v)}
            maxLength={80}
            rows={2}
            customizeAria={t("businessPage.builder.settings.locationsCustomize", {
              field: t("businessPage.builder.settings.locationsHeadingLabel"),
            })}
          />
          <div className="mt-5 border-t border-border-subtle pt-5">
            <CopyOverride
              idBase="locations-sublede"
              label={t("businessPage.builder.settings.locationsSubledeLabel")}
              defaultText={t("businessPage.builder.preview.sublede.locations", { count: shownCount })}
              value={config.sublede?.[locale] ?? ""}
              onChange={(v) => setCopy("sublede", v)}
              maxLength={220}
              rows={3}
              customizeAria={t("businessPage.builder.settings.locationsCustomize", {
                field: t("businessPage.builder.settings.locationsSubledeLabel"),
              })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * One copy field that defaults to the built-in text. The default is shown (muted) while the switch is off;
 * flipping it on reveals the editor. Turning it back off reverts to the default by clearing the override.
 */
function CopyOverride({
  idBase,
  label,
  defaultText,
  value,
  onChange,
  maxLength,
  rows,
  customizeAria,
}: {
  idBase: string;
  label: string;
  defaultText: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  rows: number;
  customizeAria: string;
}) {
  const labelId = `${idBase}-label`;
  const [open, setOpen] = useState(value.trim() !== "");

  const handleToggle = (next: boolean) => {
    setOpen(next);
    if (!next && value.trim() !== "") onChange("");
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span id={labelId} className={GROUP_LABEL}>
            {label}
          </span>
          {!open && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-foreground-2">{defaultText}</p>
          )}
        </div>
        <Switch checked={open} onCheckedChange={handleToggle} aria-label={customizeAria} />
      </div>
      <Collapsible open={open}>
        <CollapsibleContent>
          <AutoHeight className="pt-3">
            <Textarea
              id={idBase}
              aria-labelledby={labelId}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={defaultText}
              rows={rows}
              maxLength={maxLength}
              className="min-h-0 resize-none text-sm leading-relaxed transition-all border-border dark:border-border-subtle hover:border-border-strong focus:border-focus focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-focus focus-visible:ring-offset-0"
            />
            <div className="mt-2 text-right text-[11px] tabular-nums text-foreground-3">
              {value.length}/{maxLength}
            </div>
          </AutoHeight>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export default LocationsEditor;
