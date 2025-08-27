export type RegisterOwnerPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
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
};

export type AuthResponse = {
  message: string;
  access_token: string;
  refresh_token: string;
  user: AuthUser;
};


