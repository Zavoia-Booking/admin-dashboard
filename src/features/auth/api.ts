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
    await apiClient().post(`/auth/reset-password`, payload);
}

export const registerMemberApi = async (payload: RegisterMemberPayload): Promise<RegisterMemberResponse> => {
    const { data } = await apiClient().post<RegisterMemberResponse>(`/auth/register/member`, payload);
    return data;
};