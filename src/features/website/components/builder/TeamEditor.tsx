import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { modalHelperSmall } from "../../../../shared/components/ui/modal-tokens";
import { PersonAvatar } from "../../../../shared/components/common/PersonAvatar";
import TextareaField from "../../../../shared/components/forms/fields/TextareaField";
import { OptionalCopyOverride } from "./OptionalCopyOverride";
import { localeCopyIsHidden, setLocaleCopyHidden } from "./copyBlankState";
import type { TeamConfig, WebsiteBuilderLocation } from "../../types";
import {
  hasUnsafeWebsiteCopyCharacters,
  validateWebsiteCopy,
} from "../../../../shared/utils/validation";
import type { WebsiteDraftIssue } from "./draftValidation";

interface TeamEditorProps {
  config: TeamConfig;
  locale: "en" | "ro";
  locations: WebsiteBuilderLocation[];
  onConfigChange: (patch: Partial<TeamConfig>) => void;
  blockingIssues?: WebsiteDraftIssue[];
}

const ROSTER_CAP = 12; // mirrors the preview's TEAM_MAX so the card lists exactly who renders
const ROSTER_VISIBLE = 6; // keep the inspector card compact; the rest collapse into "+N more"

/**
 * Team section settings: the team itself is pulled from the business's locations, so the owner's controls
 * are the inherited editorial heading plus an optional owner-authored subtitle. A read-only roster
 * mirrors exactly who the section renders (deduped by id, first-location-wins, capped like the preview) with
 * a jump-off to manage them. Layout (portraits vs roster …) is the variant gallery rendered by SectionBuilder.
 */
export function TeamEditor({
  config,
  locale,
  locations,
  onConfigChange,
  blockingIssues = [],
}: TeamEditorProps) {
  const { t } = useTranslation("website");
  const [subtitleBlurred, setSubtitleBlurred] = useState(false);
  const subtitle = config.sublede?.[locale] ?? "";
  const subtitleValidation = validateWebsiteCopy(subtitle, t, {
    fieldLabel: t("businessPage.builder.settings.subledeLabel"),
    maxLength: 220,
  });
  const issueFor = (controlId: string) => blockingIssues.find(
    (issue) => issue.controlId === controlId && (!issue.locale || issue.locale === locale),
  )?.message;
  const localSubtitleError = subtitleValidation && (
    subtitleBlurred || hasUnsafeWebsiteCopyCharacters(subtitle)
  )
    ? subtitleValidation
    : undefined;
  const subtitleError = issueFor("team-sublede") ?? localSubtitleError;

  useEffect(() => setSubtitleBlurred(false), [locale]);

  const setCopy = (field: "heading" | "sublede", value: string) => {
    const current = config[field] ?? { en: "", ro: "" };
    const next = { ...current, [locale]: value };
    const hasOverride = next.en.trim() !== "" || next.ro.trim() !== "";
    if (field === "sublede") {
      onConfigChange({
        sublede: hasOverride ? next : undefined,
        // Older drafts may carry the former inherited-subtitle blank flag. Once this plain optional
        // field is edited, its active locale is governed entirely by the authored value.
        subledeHidden: setLocaleCopyHidden(config.subledeHidden, locale, false),
      });
      return;
    }
    onConfigChange({ heading: hasOverride ? next : undefined });
  };
  const setHeadingBlank = (blank: boolean) => {
    onConfigChange({
      headingHidden: setLocaleCopyHidden(config.headingHidden, locale, blank),
    });
  };

  // Same everyone-list the Team orchestrator builds: dedupe by member id (first assigned location wins), cap.
  const seen = new Set<number>();
  const roster = locations
    .flatMap((l) => l.teamMembers ?? [])
    .filter((m) => !seen.has(m.id) && (seen.add(m.id), true))
    .slice(0, ROSTER_CAP);
  const visible = roster.slice(0, ROSTER_VISIBLE);
  const overflow = roster.length - visible.length;

  const manageLink = (
    <Link
      to="/team-members"
      className="shrink-0 text-[11px] font-semibold text-foreground-2 underline decoration-border-strong underline-offset-2 hover:text-foreground-1"
    >
      {t("businessPage.builder.settings.manageTeam")}
    </Link>
  );

  return (
    <div className="space-y-5">
      <p className={modalHelperSmall}>{t("businessPage.builder.settings.teamHint")}</p>

      {roster.length > 0 ? (
        <div className="rounded-xl border border-border-subtle bg-surface-hover/45 px-3 py-2.5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-foreground-3">
              {t("businessPage.builder.settings.teamRosterLabel")}
            </span>
            {manageLink}
          </div>
          <ul className="space-y-1.5">
            {visible.map((m) => (
              <li key={m.id} className="flex items-center gap-2">
                <PersonAvatar
                  id={m.id}
                  firstName={m.firstName}
                  lastName={m.lastName}
                  profileImage={m.profileImage}
                  className="size-6"
                  initialsClassName="text-[9px] font-semibold"
                />
                <span className="min-w-0 truncate text-[12.5px] text-foreground-1">
                  {`${m.firstName} ${m.lastName}`.trim()}
                </span>
              </li>
            ))}
          </ul>
          {overflow > 0 ? (
            <p className="mt-1.5 pl-8 text-[11px] text-foreground-3">
              {t("businessPage.builder.settings.teamRosterMore", { extra: overflow })}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border-subtle bg-surface-hover/30 px-3 py-3">
          <p className={modalHelperSmall}>{t("businessPage.builder.settings.teamRosterEmpty")}</p>
          <span className="mt-1.5 inline-block">{manageLink}</span>
        </div>
      )}

      <OptionalCopyOverride
        idBase="team-heading"
        locale={locale}
        label={t("businessPage.builder.settings.headingLabel")}
        defaultText={t("businessPage.builder.preview.subhead.team")}
        value={config.heading?.[locale] ?? ""}
        blank={localeCopyIsHidden(config.headingHidden, locale)}
        onChange={(v) => setCopy("heading", v)}
        onBlankChange={setHeadingBlank}
        maxLength={80}
        rows={2}
        externalError={issueFor("team-heading")}
      />
      <div className="border-t border-border-subtle pt-5">
        <TextareaField
          id="team-sublede"
          label={t("businessPage.builder.settings.subledeLabel")}
          labelMeta={(
            <span className="text-xs font-normal text-foreground-3">
              {t("businessPage.about.optionalLabel")}
            </span>
          )}
          placeholder={t("businessPage.builder.preview.sublede.team")}
          value={subtitle}
          onChange={(value) => setCopy("sublede", value)}
          onBlur={() => {
            const normalized = subtitle.trim();
            if (normalized !== subtitle) setCopy("sublede", normalized);
            setSubtitleBlurred(true);
          }}
          error={subtitleError}
          maxLength={220}
          rows={3}
          showCharacterCount
          className="!pt-0"
          textareaClassName="!h-auto min-h-24"
        />
      </div>
    </div>
  );
}

export default TeamEditor;
