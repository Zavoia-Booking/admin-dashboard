import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { LocationType } from "../types/location.ts";
import type { TeamMember } from "../types/team-member.ts";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getLocationById = (list: Array<LocationType>, id: number): LocationType | undefined => {
  return list.find((location) => {
    return location.id === id;
  })
}

export const getTeamMemberById = (list: Array<TeamMember>, id: number): TeamMember | undefined => {
  return list.find((location) => {
    return location.id === id;
  })
}
