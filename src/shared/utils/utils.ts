import type { LocationType } from "../types/location.ts";
import type { TeamMember } from "../types/team-member.ts";


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

export const getUserFullName = (item: any): string => {
  return `${item.firstName} ${item.lastName}`
}