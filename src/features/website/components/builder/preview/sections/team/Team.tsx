import type { SectionEntry, TeamMember, TeamConfig } from "../../../../../types";
import { UserRole } from "../../../../../../../shared/types/auth";
import { Section, SectionHead, Placeholder } from "../../shared/primitives";
import type { PreviewData, T } from "../../shared/types";
import { Portraits } from "./variants/Portraits";
import { Roster } from "./variants/Roster";
import type { TeamVariantProps } from "./types";
import "./team.css";

// Portraits (default) or roster, mirroring the source `SecTeam`. Members are flattened per location so
// every card/row carries its own location pin (a member working at several locations appears once per
// location, like the source's `all = flatMap`). Job titles aren't in the data model, so only the owner
// gets a label; per-member ratings come from the reviews-stats feed. Booking/scroll is inert in the
// preview, so the portrait "Find at" CTA and the roster arrow are decorative affordances. Each layout is
// its own component under variants/, dispatched via the registry below.
const TEAM_MAX = 12;

// Layout registry — add a variant by adding its component file + a catalog entry (sectionCatalog). The
// resolver below maps the saved variant to its component, falling back to the portraits default.
const VARIANTS: Record<string, React.FC<TeamVariantProps>> = {
  portraits: Portraits,
  roster: Roster,
};

export function Team({ entry, data, t, no }: { entry: SectionEntry; data: PreviewData; t: T; no: string }) {
  const cfg = (entry.config ?? {}) as TeamConfig;
  const heading = cfg.heading?.[data.locale]?.trim() || t("businessPage.builder.preview.subhead.team");
  const sublede = cfg.sublede?.[data.locale]?.trim() || t("businessPage.builder.preview.sublede.team");
  const members = data.locations
    .flatMap((l) => (l.teamMembers ?? []).map((m) => ({ m, locName: l.name, locId: l.id })))
    .slice(0, TEAM_MAX);
  const ratings = data.teamRatings;

  const nameOf = (m: TeamMember) =>
    [m.firstName, m.lastName].filter(Boolean).join(" ") || t("businessPage.builder.preview.teamMember");
  const initialsOf = (m: TeamMember) => `${m.firstName?.[0] ?? ""}${m.lastName?.[0] ?? ""}`.toUpperCase() || "•";
  // The role enum carries no job titles and there's no specialty field — label the owner, omit the rest.
  const roleOf = (m: TeamMember) => (m.role === UserRole.OWNER ? t("businessPage.builder.preview.teamRoleOwner") : "");

  // Variant resolver — renderer seam for future paid variants: a not-entitled variant falls back to the free default here.
  const View = Object.hasOwn(VARIANTS, entry.variant) ? VARIANTS[entry.variant] : Portraits;

  return (
    <Section>
      <SectionHead no={no} kicker={t("businessPage.builder.preview.kicker.team")} heading={heading} sublede={sublede} />
      {members.length === 0 ? (
        <Placeholder>{t("businessPage.builder.preview.teamEmpty")}</Placeholder>
      ) : (
        <View members={members} ratings={ratings} nameOf={nameOf} initialsOf={initialsOf} roleOf={roleOf} t={t} />
      )}
    </Section>
  );
}
