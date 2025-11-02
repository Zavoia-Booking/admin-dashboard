import type { RegisterOwnerPayload, AuthResponse, AuthUser, RegisterMemberResponse, RegisterMemberPayload } from "./types";
import { apiClient } from "../../shared/lib/http";

export const registerOwnerRequestApi = async (payload: RegisterOwnerPayload): Promise<AuthResponse> => {
    const { data } = await apiClient().post<AuthResponse>(`/auth/register-business-owner`, payload);
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
    await apiClient().post(`/auth/forgot-password`, payload);
}

export const resetPasswordApi = async (payload: { token: string, password: string }): Promise<void> => {
    await apiClient().post(`/auth/reset-password`, { password: payload.password }, {
        params: { token: payload.token }
    });
}

export const registerMemberApi = async (payload: RegisterMemberPayload): Promise<RegisterMemberResponse> => {
    const { data } = await apiClient().post<RegisterMemberResponse>(`/auth/register/member`, payload);
    return data;
};

export const googleLoginApi = async (payload: { code: string, redirectUri: string }): Promise<AuthResponse> => {
    const { data } = await apiClient().post<AuthResponse>('/auth/google/code/login', payload);
    return data;
};

export const googleRegisterApi = async (payload: { code: string, redirectUri: string }): Promise<AuthResponse> => {
    const { data } = await apiClient().post<AuthResponse>('/auth/google/code/register', payload);
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

export const sendBusinessLinkEmailApi = async (payload: { email: string }): Promise<{ message: string }> => {
    const { data} = await apiClient().post<{ message: string }>(`/auth/send-business-link-email`, payload);
    return data;
};