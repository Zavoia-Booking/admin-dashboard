export type RegisterOwnerPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
};

export type AuthUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  businessId: number | null;
  emailVerified?: boolean;
  wizardCompleted?: boolean;
  googleSub?: string | null;
  provider?: string;
  registeredVia?: string;
  providerData?: string | null;
  lastGoogleLoginAt?: Date | null;
  business?: {
    id: number;
    name: string;
    logo?: string | null;
  };
  subscription?: {
    status: string | null;
    planTier: string | null;
    planName: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    trialEndsAt: string | null;
  };
  entitlements?: {
    entitled: boolean;
    status: 'trial' | 'active' | 'expired' | 'no_subscription' | null;
    reason?: string;
    daysRemaining: number;
    maxLocations: number;
    maxTeamMembers: number;
    paidTeamSeats: number;
  };
};

export type AuthResponse = {
  message: string;
  accessToken: string;
  user: AuthUser;
  csrfToken: string;
};

export enum AuthStatusEnum {
  IDLE = "idle",
  LOADING = "loading",
  AUTHENTICATED = "authenticated",
  UNAUTHENTICATED = "unauthenticated",
  ERROR = "error",
}

export type BusinessOption = {
  id: number;
  name: string;
  role: string;
};

export type BusinessSelectionRequired = {
  selectionToken: string;
  businesses: BusinessOption[];
};

export type AccountLinkingDetails = {
  email: string;
  firstName: string;
  lastName: string;
  existingRoles: {
    customer: boolean;
    teamMember: boolean;
  };
};

export interface AuthState {
  accessToken: string | null;
  csrfToken: string | null;
  businessId: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  status: AuthStatusEnum;
  error: string | null;
  lastRefreshAt: number | null;
  isAccountLinkingModalOpen?: boolean;
  pendingLinkTxId?: string;
  linkingLoading?: boolean;
  linkingError?: string | null;
  businessSelectionRequired?: BusinessSelectionRequired | null;
  accountLinkingRequired?: AccountLinkingDetails | null;
  isRegistration?: boolean;
  isMemberRegistrationLoading?: boolean;
  memberRegistrationError?: string | null;
  teamInvitationStatus?: 'checking' | 'needs_registration' | 'accepted' | 'completed' | 'error' | null;
  teamInvitationData?: {
    token: string;
    business: {
      id: number;
      name: string;
    };
    email: string;
  } | null;
  teamInvitationError?: string | null;
}

export type CheckTeamInvitationResponse = {
  status: 'needs_registration';
  message: string;
  token: string;
  business: {
    id: number;
    name: string;
  };
  email: string;
} | {
  status: 'accepted';
  message: string;
};

export type CompleteTeamInvitationPayload = {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
  phone: string;
};

export type CompleteTeamInvitationResponse = {
  message: string;
};