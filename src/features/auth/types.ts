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
}

export type RegisterMemberPayload = {
  token: string;
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
};

export type RegisterMemberResponse = {
  message: string;
};
