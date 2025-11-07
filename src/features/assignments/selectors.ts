import type { RootState } from "../../app/providers/store.ts";
import type { AssignmentFilterState } from "./types.ts";

// Legacy selectors
export const getAssignmentsSelector = (state: RootState) => state.assignments.assignments;
export const getAssignmentsSummarySelector = (state: RootState) => state.assignments.summary;
export const getAssignmentsFiltersSelector = (state: RootState): AssignmentFilterState => state.assignments.filters;
export const getAddAssignmentFormSelector = (state: RootState) => state.assignments.addForm;
export const getEditAssignmentFormSelector = (state: RootState) => state.assignments.editForm;
export const getViewDetailsPopupSelector = (state: RootState) => state.assignments.viewDetailsPopup;

// New perspective-based selectors
export const getActivePerspectiveSelector = (state: RootState) => state.assignments.activePerspective;
export const getSearchQuerySelector = (state: RootState) => state.assignments.searchQuery;
export const getIsLoadingSelector = (state: RootState) => state.assignments.isLoading;
export const getIsSavingSelector = (state: RootState) => state.assignments.isSaving;

// Team Members selectors
export const getTeamMemberAssignmentsSelector = (state: RootState) => state.assignments.teamMemberAssignments;
export const getSelectedTeamMemberIdSelector = (state: RootState) => state.assignments.selectedTeamMemberId;
export const getSelectedTeamMemberSelector = (state: RootState) => {
  const selectedId = state.assignments.selectedTeamMemberId;
  if (!selectedId) return null;
  return state.assignments.teamMemberAssignments.find(tm => tm.id === selectedId) || null;
};

// Services selectors
export const getServiceAssignmentsSelector = (state: RootState) => state.assignments.serviceAssignments;
export const getSelectedServiceIdSelector = (state: RootState) => state.assignments.selectedServiceId;
export const getSelectedServiceSelector = (state: RootState) => {
  const selectedId = state.assignments.selectedServiceId;
  if (!selectedId) return null;
  return state.assignments.serviceAssignments.find(s => s.serviceId === selectedId) || null;
};

// Locations selectors
export const getLocationAssignmentsSelector = (state: RootState) => state.assignments.locationAssignments;
export const getSelectedLocationIdSelector = (state: RootState) => state.assignments.selectedLocationId;
export const getSelectedLocationSelector = (state: RootState) => {
  const selectedId = state.assignments.selectedLocationId;
  if (!selectedId) return null;
  return state.assignments.locationAssignments.find(l => l.locationId === selectedId) || null;
};

// Filtered selectors (with search)
export const getFilteredTeamMembersSelector = (state: RootState) => {
  const query = state.assignments.searchQuery.toLowerCase();
  if (!query) return state.assignments.teamMemberAssignments;
  
  return state.assignments.teamMemberAssignments.filter(tm => 
    tm.firstName.toLowerCase().includes(query) ||
    tm.lastName.toLowerCase().includes(query) ||
    tm.email.toLowerCase().includes(query)
  );
};

export const getFilteredServicesSelector = (state: RootState) => {
  const query = state.assignments.searchQuery.toLowerCase();
  if (!query) return state.assignments.serviceAssignments;
  
  return state.assignments.serviceAssignments.filter(s => 
    s.serviceName.toLowerCase().includes(query)
  );
};

export const getFilteredLocationsSelector = (state: RootState) => {
  const query = state.assignments.searchQuery.toLowerCase();
  if (!query) return state.assignments.locationAssignments;
  
  return state.assignments.locationAssignments.filter(l => 
    l.locationName.toLowerCase().includes(query) ||
    l.address.toLowerCase().includes(query)
  );
};
