// Service assigned to a location
export type LocationService = {
  serviceId: number;
  serviceName: string;
  category?: { id: number; name: string; color?: string } | null;
  
  // Default from service (global)
  defaultPrice: number; // cents
  defaultDisplayPrice: number; // decimal
  defaultDuration: number; // minutes
  
  // Location overrides (null = inherited from service default)
  customPrice: number | null; // cents
  customDuration: number | null; // minutes
  
  // Staff info
  staffCount: number; // how many team members can perform
  staffWithOverrides: number; // how many have custom pricing
};

// Staff service assignment at location level
export type StaffService = {
  serviceId: number;
  serviceName: string;
  canPerform: boolean;
  category?: { id: number; name: string; color?: string } | null;
  
  // Inherited from location (what the staff inherits)
  inheritedPrice: number; // cents
  inheritedDisplayPrice: number; // decimal
  inheritedDuration: number; // minutes
  
  // Staff overrides (null = inherited from location)
  customPrice: number | null; // cents
  customDuration: number | null; // minutes
  
  isCustom: boolean; // true if has any override
};

// Team member summary at location
export type LocationTeamMember = {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  profileImage: string | null;
  role: string;
  servicesEnabled: number; // count of services they can perform
  overridesCount: number; // count of services with custom pricing
};

// Full location assignment data for the new flow
export type LocationFullAssignment = {
  id: number;
  name: string;
  address: string;
  
  // All available services (from business) - for "Manage Services" drawer
  allServices: Array<{
    serviceId: number;
    serviceName: string;
    price_amount_minor: number;
    displayPrice: number;
    duration: number;
    category?: { id: number; name: string; color?: string } | null;
  }>;
  
  // Services assigned to this location (only assigned ones)
  services: LocationService[];
  
  // Team members at this location with summary info
  teamMembers: LocationTeamMember[];
  
  // All available team members (from business)
  allTeamMembers: Array<{
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    profileImage: string | null;
    role: string;
  }>;
};

// Staff services data for the drawer
export type StaffServicesAtLocation = {
  userId: number;
  firstName: string;
  lastName: string;
  locationId: number;
  locationName: string;
  services: StaffService[];
};

// Staff member with override data for a specific service
export type StaffOverrideData = {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  profileImage: string | null;
  customPrice: number | null; // cents
  customDisplayPrice: number | null; // decimal
  customDuration: number | null; // minutes
  inheritedPrice: number; // cents
  inheritedDisplayPrice: number; // decimal
  inheritedDuration: number; // minutes
};

// Response for service staff overrides endpoint
export type ServiceStaffOverrides = {
  serviceId: number;
  serviceName: string;
  locationId: number;
  staffOverrides: StaffOverrideData[];
};

// Payload for updating location services
export type UpdateLocationServicesPayload = {
  locationId: number;
  services: Array<{
    serviceId: number;
    isEnabled: boolean;
    customPrice?: number | null; // cents
    customDuration?: number | null; // minutes
  }>;
};

// Payload for updating staff services at location
export type UpdateStaffServicesPayload = {
  locationId: number;
  userId: number;
  services: Array<{
    serviceId: number;
    canPerform: boolean;
    customPrice?: number | null; // cents
    customDuration?: number | null; // minutes
  }>;
};

// Copy setup payload
export type CopyStaffSetupPayload = {
  locationId: number;
  sourceUserId: number;
  targetUserId: number;
  copyEnabledServices: boolean;
  copyCustomPricing: boolean;
};

// Payload for updating team member assignments at a location
export type UpdateLocationTeamMembersPayload = {
  locationId: number;
  userIds: number[]; // List of user IDs to assign to this location
};

// Unified payload for updating location assignments (services and team members)
export type UpdateLocationAssignmentsPayload = {
  locationId: number;
  services?: Array<{
    serviceId: number;
    isEnabled: boolean;
    customPrice?: number | null;
    customDuration?: number | null;
  }>;
  userIds?: number[];
  // Metadata for team member toggles (for better toast messages)
  teamMemberToggle?: {
    userId: number;
    enabled: boolean;
  };
};

// Redux state
export type AssignmentsState = {
  selectedLocationId: number | null;
  selectedLocationFullAssignment: LocationFullAssignment | null;
  staffServices: StaffService[];
  isLoading: boolean;
  isSaving: boolean;
  isStaffServicesLoading: boolean;
};
