import type { TeamMember } from "../../../../../types";
import type { PreviewData, T } from "../../shared/types";

/** One team member resolved against the location it works at (a member at several locations appears once per location). */
export type TeamMemberEntry = { m: TeamMember; locName: string; locId: number };

/** Contract every Team layout variant renders against — the orchestrator owns data prep + the label helpers. */
export type TeamVariantProps = {
  members: TeamMemberEntry[];
  ratings: PreviewData["teamRatings"];
  nameOf: (m: TeamMember) => string;
  initialsOf: (m: TeamMember) => string;
  roleOf: (m: TeamMember) => string;
  t: T;
};
