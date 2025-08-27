import http from "../../shared/lib/http";
import type { RegisterOwnerPayload, AuthResponse } from "./types";

export const registerOwnerRequest = async (payload: RegisterOwnerPayload): Promise<AuthResponse> => {
    const { data } = await http.post<AuthResponse>(`/auth/register-business-owner`, payload);
    return data;
}