import type { WebsiteBuilderLocation } from "../../types";

/** A single owner profile is not enough to present the business as a team. */
export const MIN_TEAM_MEMBERS = 2;

/** Match the actual Team render budgets so builder summaries never promise hidden cards. */
export const TEAM_FLAT_MAX = 12;
export const TEAM_LOCATION_MAX = 6;

/** Count each person once when they are assigned to more than one location. The owner is included. */
export function teamMemberCount(locations: WebsiteBuilderLocation[]): number {
  const ids = new Set<number | string>();
  locations.forEach((location) => {
    location.teamMembers?.forEach((member) => {
      ids.add(member.id ?? `${member.firstName ?? ""}-${member.lastName ?? ""}`);
    });
  });
  return ids.size;
}

export const isTeamLocked = (locations: WebsiteBuilderLocation[]): boolean =>
  teamMemberCount(locations) < MIN_TEAM_MEMBERS;

/** Reviews need enough customer evidence to form a useful section. */
export const MIN_TESTIMONIAL_REVIEWS = 3;

export function reviewCount(
  locations: WebsiteBuilderLocation[],
  loadedReviews?: ReadonlyArray<unknown>,
): number {
  const aggregate = locations.reduce(
    (count, location) => count + (location.totalReviews ?? 0),
    0,
  );
  return Math.max(aggregate, loadedReviews?.length ?? 0);
}

export const isTestimonialsLocked = (
  locations: WebsiteBuilderLocation[],
  loadedReviews?: ReadonlyArray<unknown>,
): boolean => reviewCount(locations, loadedReviews) < MIN_TESTIMONIAL_REVIEWS;
