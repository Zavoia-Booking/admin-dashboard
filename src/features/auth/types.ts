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
  profileImage?: string | null;
  role?: string;
  businessId: number | null;
  emailVerified?: boolean;
  wizardCompleted?: boolean;
  hasPassword?: boolean;
  googleSub?: string | null;
  provider?: string;
  registeredVia?: string;
  providerData?: string | null;
  lastGoogleLoginAt?: Date | null;
  business?: {
    id: number;
    name: string;
    logo?: string | null;
    businessCurrency?: string;
    countryCode?: string | null; // ISO 3166-1 alpha-2 country code (e.g., "ro", "de")
    phone?: string;
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
    status: 'trial' | 'active' | 'expired' | 'no_subscription' | 'past_due' | 'ltd' | null;
    reason?: string;
    daysRemaining: number;
    maxLocations: number;
    maxTeamMembers: number;
    paidTeamSeats: number;
    usedSeats: number;
  };
  // Limited access fields (dashboard_user — orphaned users with no business)
  limitedAccess?: boolean;
  reason?: string;
  unreadNotificationsCount?: number;
  // Account management fields
  accountStatus?: 'active' | 'pending_acceptance' | 'disabled';
  deletionScheduledAt?: string | null;
  accountDisabled?: boolean;
  accountScheduledForDeletion?: boolean;
};

export type AuthResponse = {
  message: string;
  accessToken: string;
  user: AuthUser;
  csrfToken: string;
  refreshToken?: string; // Returned for native apps
  isNewUser?: boolean; // Returned by unified Google OAuth endpoint
  // Account status flags (present when account is disabled or scheduled for deletion)
  accountDisabled?: boolean;
  accountScheduledForDeletion?: boolean;
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
  tx_id?: string;
};

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null; // For native apps only
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
  // Account status prompt (shown during login when account is disabled or scheduled for deletion)
  accountStatusPrompt?: {
    type: 'disabled' | 'scheduled_for_deletion';
  } | null;
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

// Account management types
export type AccountActionResponse = {
  message: string;
  ok: boolean;
  deletionScheduledAt?: string; // Only returned for schedule deletion
};

export type AccountBlocker = {
  messageCode: string;
  code: string;
  details: Record<string, unknown>;
};

export type AccountActionError = {
  statusCode: number;
  message: string;
  code?: 'needs_to_remove_team_members' | 'must_leave_all_organisations' | 'account_has_blockers';
  details?: {
    teamMemberCount?: number;
    organisationCount?: number;
    blockers?: AccountBlocker[];
  };
};