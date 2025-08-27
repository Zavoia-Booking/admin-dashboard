import config from "../../app/config/env";
import type { RegisterOwnerPayload, AuthResponse } from "./types";

export const registerOwnerRequest = async (payload: RegisterOwnerPayload): Promise<AuthResponse> => {
    const response = await fetch(`${config.API_URL}/auth/register-business-owner`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message = errorBody?.message || 'Registration failed';
        throw new Error(Array.isArray(message) ? message.join(', ') : message);
    }

    return response.json();
}