import type { RegisterOwnerPayload, AuthResponse, AuthUser, CheckTeamInvitationResponse, CompleteTeamInvitationPayload, CompleteTeamInvitationResponse, AccountActionResponse, MobileRegisterRequestResponse, MobileRegisterTokenValidation, BusinessLinkTokenValidation } from "./types";
import { apiClient } from "../../shared/lib/http";
import i18n from "../../shared/lib/i18n";

// Send the current dashboard locale on auth flows that produce transactional
// emails. Backend uses this as the highest-priority signal (mirrors the
// User.locale → Business.countryCode → 'en' resolution order).
const currentLocale = (): 'en' | 'ro' | undefined => {
    const lang = i18n.language?.slice(0, 2).toLowerCase();
    return lang === 'en' || lang === 'ro' ? lang : undefined;
};

export const registerOwnerRequestApi = async (payload: RegisterOwnerPayload): Promise<AuthResponse> => {
    const { data } = await apiClient().post<AuthResponse>(`/auth/register-business-owner`, { ...payload, locale: currentLocale() });
    return data;
}

export const mobileRegisterRequestApi = async (payload: { email: string; locale?: string }): Promise<MobileRegisterRequestResponse> => {
    const { data } = await apiClient().post<MobileRegisterRequestResponse>(`/auth/mobile-register-request`, payload);
    return data;
}

export const validateMobileRegisterTokenApi = async (token: string): Promise<MobileRegisterTokenValidation> => {
    const { data } = await apiClient().get<MobileRegisterTokenValidation>(`/auth/mobile-register-validate`, {
        params: { token },
    });
    return data;
}

export const logoutApi = async (): Promise<void> => {
    await apiClient().post(`/auth/logout`);
}

export const loginApi = async (payload: { email: string, password: string }): Promise<AuthResponse> => {
    const { data } = await apiClient().post<AuthResponse>(`/auth/login`, payload);
    return data;
}

export const getCurrentUserApi = async (): Promise<{ user: AuthUser }> => {
    const { data } = await apiClient().get<{ user: AuthUser }>(`/auth/me`);
    return data;
}

export const forgotPasswordApi = async (payload: { email: string }): Promise<void> => {
    await apiClient().post(`/auth/forgot-password`, { ...payload, locale: currentLocale() });
}

export const resetPasswordApi = async (payload: { token: string, password: string }): Promise<void> => {
    await apiClient().post(`/auth/reset-password`, { password: payload.password }, {
        params: { token: payload.token }
    });
}

// Google OAuth login - for existing users
export const googleLoginApi = async (payload: { code: string, redirectUri: string }): Promise<AuthResponse> => {
    const { data } = await apiClient().post<AuthResponse>('/auth/google', { ...payload, intent: 'login' });
    return data;
};

// Google OAuth register - for creating a new business owner account
export const googleRegisterApi = async (payload: { code: string, redirectUri: string }): Promise<AuthResponse> => {
    const { data } = await apiClient().post<AuthResponse>('/auth/google', { ...payload, intent: 'register_business_owner' });
    return data;
};

export const reauthForLinkApi = async (payload: { email: string; password: string }): Promise<{ proof: string }> => {
    const { data } = await apiClient().post<{ proof: string }>(`/auth/link/google/re-auth`, payload);
    return data;
};

export const linkGoogleApi = async (payload: { tx_id: string; proof: string }): Promise<AuthResponse> => {
    const { data } = await apiClient().post<AuthResponse>(`/auth/link/google`, payload);
    return data;
};

export const unlinkGoogleApi = async (payload: { password: string }): Promise<{ message: string }> => {
    const { data } = await apiClient().post<{ message: string }>(`/auth/unlink/google`, payload);
    return data;
};

export const linkGoogleByCodeApi = async (payload: { code: string; redirectUri: string }): Promise<AuthResponse> => {
    const { data } = await apiClient().post<AuthResponse>(`/auth/link/google/by-code`, payload);
    return data;
};

export const selectBusinessApi = async (payload: { selectionToken: string; businessId: number }): Promise<AuthResponse> => {
    const { data } = await apiClient().post<AuthResponse>(`/auth/select-business`, payload);
    return data;
};

export const validateBusinessLinkTokenApi = async (token: string): Promise<BusinessLinkTokenValidation> => {
    const { data } = await apiClient().get<BusinessLinkTokenValidation>(`/auth/link-business-account/validate`, {
        params: { token },
    });
    return data;
};

export const completeBusinessLinkApi = async (payload: { token: string; password: string }): Promise<AuthResponse> => {
    const { data } = await apiClient().post<AuthResponse>(`/auth/link-business-account`, payload);
    return data;
};

export const sendBusinessLinkEmailApi = async (payload: { email: string; tx_id?: string }): Promise<{ message: string }> => {
    const { data} = await apiClient().post<{ message: string }>(`/auth/send-business-link-email`, { ...payload, locale: currentLocale() });
    return data;
};

export const checkTeamInvitationApi = async (token: string): Promise<CheckTeamInvitationResponse> => {
    const { data } = await apiClient().get<CheckTeamInvitationResponse>(`/auth/check-team-invitation`, {
        params: { token }
    });
    return data;
};

export const completeTeamInvitationApi = async (payload: CompleteTeamInvitationPayload): Promise<CompleteTeamInvitationResponse> => {
    const { data } = await apiClient().post<CompleteTeamInvitationResponse>(`/auth/complete-team-invitation`, payload);
    return data;
};

export const setPasswordApi = async (payload: { password: string }): Promise<{ message: string }> => {
    const { data } = await apiClient().post<{ message: string }>(`/auth/set-password`, payload);
    return data;
};

export const changeOwnerPasswordApi = async (payload: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
    const { data } = await apiClient().post<{ message: string }>(`/auth/change-password`, payload);
    return data;
};

export const changeAccountEmailApi = async (payload: { currentEmail: string; newEmail: string }): Promise<{ success: boolean; email: string; revokedSessionCount: number }> => {
    const { data } = await apiClient().post<{ success: boolean; email: string; revokedSessionCount: number }>(`/auth/change-email`, payload);
    return data;
};

// Account management APIs
export const deleteAccountApi = async (): Promise<AccountActionResponse> => {
    const { data } = await apiClient().post<AccountActionResponse>(`/auth/account/delete`);
    return data;
};