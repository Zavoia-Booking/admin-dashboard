export type RegisterOwnerPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  /** Token issued by the mobile welcome email; marks the email as pre-verified. */
  welcomeToken?: string;
};

export type MobileRegisterRequestResponse = {
  message: string;
};

export type MobileRegisterTokenValidation = {
  email: string;
  /** 'google' when the invite came from native Google sign-in — the web form leads with Google. */
  provider?: 'google';
};

/** Payload for the unified Google actions: web sends an OAuth code, native an ID token. */
export type GoogleAuthRequestPayload =
  | { code: string; redirectUri: string }
  | { idToken: string };

/** Native Google email funnel outcome (register intent, no session issued). */
export type GoogleNativeEmailSent = {
  outcome: 'email_sent';
  message: string;
  email: string;
};

export type GoogleNativeRegisterResponse = AuthResponse | GoogleNativeEmailSent;

/** Pre-flight info for the /link-business-account page. */
export type BusinessLinkTokenValidation = {
  email: string;
  hasPassword: boolean;
  googleLinked: boolean;
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
    /** Current plan tier ('STANDARD' | 'PLUS' | 'CUSTOM') or null when no plan. */
    planTier?: string | null;
    /** Tier-derived feature flags (display only — builder gating is deferred). */
    features?: {
      websiteBuilder: boolean;
    };
    maxLocations: number | null; // Null = unlimited
    maxTeamMembers: number | null; // Null = unlimited
    paidTeamSeats: number;
    usedSeats: number;
  };
  // Limited access fields (dashboard_user — orphaned users with no business)
  limitedAccess?: boolean;
  reason?: string;
  unreadNotificationsCount?: number;
  // Account management fields
  accountStatus?: 'active' | 'pending_acceptance';
};

export type AuthResponse = {
  message: string;
  accessToken: string;
  user: AuthUser;
  csrfToken: string;
  refreshToken?: string; // Returned for native apps
  isNewUser?: boolean; // Returned by unified Google OAuth endpoint
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
  /** When `user` was last populated from the server. Null = never / stale. */
  lastUserFetchAt: number | null;
  isAccountLinkingModalOpen?: boolean;
  pendingLinkTxId?: string;
  pendingLinkEmail?: string | null;
  linkingLoading?: boolean;
  linkingError?: string | null;
  linkingErrorCode?: string | null;
  businessSelectionRequired?: BusinessSelectionRequired | null;
  accountLinkingRequired?: AccountLinkingDetails | null;
  isRegistration?: boolean;
  isMemberRegistrationLoading?: boolean;
  memberRegistrationError?: string | null;
  /** Native Google register resolved to the email funnel — address the invite went to. */
  mobileGoogleEmailSentTo?: string | null;
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

// Account management types
export type AccountActionResponse = {
  message: string;
  businessDeleted?: boolean;
  userDeleted?: boolean;
};

export type AccountActionError = {
  statusCode: number;
  message: string;
  code?: 'has_active_subscription' | 'deletion_instructions_sent';
  details?: Record<string, unknown>;
};