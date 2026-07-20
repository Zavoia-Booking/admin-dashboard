import type { SectionEntry, WebsiteBuilderTeamMember, TeamConfig } from "../../../../../types";
import { getPersonInitials, getPersonColorKey } from "../../../../../../../shared/components/common/PersonAvatar";
import { getAvatarBgColor } from "../../../../../../setupWizard/components/StepTeam";
import { Section, SectionHead, Placeholder } from "../../shared/primitives";
import type { PreviewData, T } from "../../shared/types";
import { Portraits } from "./variants/Portraits";
import { Roster } from "./variants/Roster";
import { Columns } from "./variants/Columns";
import { Carousel } from "./variants/Carousel";
import type { TeamVariantProps, TeamMemberEntry, TeamLocationGroup } from "./types";
import { TEAM_FLAT_MAX, TEAM_LOCATION_MAX } from "../../../sectionDataRequirements";

// The flat everyone-list dedupes by member id (first assigned location wins) — the real data model allows
// multi-location members and duplicate cards read as a bug. Columns instead keeps them grouped per location
// behind a switcher, where working in two rooms legitimately shows the member in each. Job titles aren't in
// the data model, so no role/title line is shown; per-member ratings come from the reviews-stats feed.
// Booking/scroll is inert in the preview. Each layout is its own component under variants/ (with its own
// css), dispatched via the registry below.
// Layout registry — add a variant by adding its component + a catalog entry (sectionCatalog + backend seed).
// The resolver below maps the saved variant to its component, falling back to the free portraits base.
const VARIANTS: Record<string, React.FC<TeamVariantProps>> = {
  portraits: Portraits,
  roster: Roster,
  columns: Columns,
  carousel: Carousel,
};

export function Team({ entry, data, t, no }: { entry: SectionEntry; data: PreviewData; t: T; no: string }) {
  const cfg = (entry.config ?? {}) as TeamConfig;
  const showHeading = cfg.headingHidden?.[data.locale] !== true;
  const heading = cfg.heading?.[data.locale]?.trim() || t("businessPage.builder.preview.subhead.team");
  const sublede = cfg.sublede?.[data.locale]?.trim() ?? "";
  const showSublede = cfg.subledeHidden?.[data.locale] !== true && sublede !== "";

  const seen = new Set<number>();
  const members: TeamMemberEntry[] = data.locations
    .flatMap((l) => (l.teamMembers ?? []).map((m) => ({ m, locName: l.name, locId: l.id })))
    .filter(({ m }) => !seen.has(m.id) && (seen.add(m.id), true))
    .slice(0, TEAM_FLAT_MAX);
  // Per-location split for Columns — only locations that actually have a team, each capped so the doors fit.
  const locationGroups: TeamLocationGroup[] = data.locations
    .map((l) => ({
      id: l.id,
      name: l.name,
      members: (l.teamMembers ?? []).slice(0, TEAM_LOCATION_MAX).map((m) => ({ m, locName: l.name, locId: l.id })),
    }))
    .filter((g) => g.members.length > 0);
  const ratings = data.teamRatings;

  const nameOf = (m: WebsiteBuilderTeamMember) =>
    [m.firstName?.trim(), m.lastName?.trim()].filter(Boolean).join(" ") || t("businessPage.builder.preview.teamMember");
  const initialsOf = (m: WebsiteBuilderTeamMember) => getPersonInitials(m.firstName, m.lastName) || "•";
  // Photo-less members reuse the dashboard's per-person hash (same seed as PersonAvatar) for the hue, then
  // re-express it through --mc-* so each tile is distinct AND theme-adaptive — not the dashboard's fixed pastel.
  const tintOf = (m: WebsiteBuilderTeamMember) => {
    const hue = getAvatarBgColor(getPersonColorKey(m.id, m.firstName, m.lastName)).match(/\d+/)?.[0] ?? "0";
    return `color-mix(in oklch, hsl(${hue} 50% 62%) 16%, var(--mc-soft))`;
  };

  // Variant resolver — renderer seam: a not-entitled/unknown variant falls back to the free portraits default here.
  const View = Object.hasOwn(VARIANTS, entry.variant) ? VARIANTS[entry.variant] : Portraits;

  return (
    <Section>
      {!showHeading ? <h2 className="sr-only">{t("businessPage.builder.preview.subhead.team")}</h2> : null}
      {showHeading ? (
        <SectionHead
          no={no}
          kicker={t("businessPage.builder.preview.kicker.team")}
          heading={heading}
          sublede={showSublede ? sublede : undefined}
        />
      ) : showSublede ? (
        <div className="mb-[clamp(20px,3cqw,36px)]">
          <p className="max-w-[480px] text-[14px] leading-relaxed" style={{ color: "var(--mc-muted)" }}>
            {sublede}
          </p>
        </div>
      ) : null}
      {members.length === 0 ? (
        <Placeholder>{t("businessPage.builder.preview.teamEmpty")}</Placeholder>
      ) : (
        <View members={members} locationGroups={locationGroups} ratings={ratings} nameOf={nameOf} initialsOf={initialsOf} tintOf={tintOf} t={t} />
      )}
    </Section>
  );
}
