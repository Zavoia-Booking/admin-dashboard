import type { LocationWithAssignments } from "../../types";

/** A single owner profile is not enough to present the business as a team. */
export const MIN_TEAM_MEMBERS = 2;

/** Count each person once when they are assigned to more than one location. The owner is included. */
export function teamMemberCount(locations: LocationWithAssignments[]): number {
  const ids = new Set<number | string>();
  locations.forEach((location) => {
    location.teamMembers?.forEach((member) => {
      ids.add(member.id ?? `${member.firstName ?? ""}-${member.lastName ?? ""}`);
    });
  });
  return ids.size;
}

export const isTeamLocked = (locations: LocationWithAssignments[]): boolean =>
  teamMemberCount(locations) < MIN_TEAM_MEMBERS;

/** Reviews need enough customer evidence to form a useful section. */
export const MIN_TESTIMONIAL_REVIEWS = 3;

export function reviewCount(
  locations: LocationWithAssignments[],
  loadedReviews?: ReadonlyArray<unknown>,
): number {
  const aggregate = locations.reduce(
    (count, location) => count + (location.totalReviews ?? 0),
    0,
  );
  return Math.max(aggregate, loadedReviews?.length ?? 0);
}

export const isTestimonialsLocked = (
  locations: LocationWithAssignments[],
  loadedReviews?: ReadonlyArray<unknown>,
): boolean => reviewCount(locations, loadedReviews) < MIN_TESTIMONIAL_REVIEWS;
