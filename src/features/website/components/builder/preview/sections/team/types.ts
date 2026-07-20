import type { WebsiteBuilderTeamMember } from "../../../../../types";
import type { PreviewData, T } from "../../shared/types";

/** One team member resolved against a location: in the flat everyone-list a multi-location member appears
 *  ONCE (first assigned location wins); in the per-location groups they appear in each room they work at. */
export type TeamMemberEntry = { m: WebsiteBuilderTeamMember; locName: string; locId: number };

/** A location with its own team, for the per-location layouts (Columns). Empty locations are dropped upstream. */
export type TeamLocationGroup = { id: number; name: string; members: TeamMemberEntry[] };

/** Contract every Team layout variant renders against — the orchestrator owns data prep + the label helpers.
 *  `members` is the flat everyone-list (Portraits/Roster/Carousel); `locationGroups` is the per-location split (Columns). */
export type TeamVariantProps = {
  members: TeamMemberEntry[];
  locationGroups: TeamLocationGroup[];
  ratings: PreviewData["teamRatings"];
  nameOf: (m: WebsiteBuilderTeamMember) => string;
  initialsOf: (m: WebsiteBuilderTeamMember) => string;
  /** Background for a photo-less member's tile/avatar — a per-person hue (dashboard's hash) re-themed to --mc-*. */
  tintOf: (m: WebsiteBuilderTeamMember) => string;
  t: T;
};
