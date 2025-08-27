import { createAction } from "@reduxjs/toolkit";
import type { RegisterOwnerPayload, AuthResponse, AuthUser } from "./types";

export const setAuthLoadingAction = createAction<boolean>('AUTH/SET/LOADING');

export const loginAction = createAction<void>('AUTH/LOGIN');

// Register owner flow
export const registerOwnerRequest = createAction<RegisterOwnerPayload>('AUTH/REGISTER_OWNER/REQUEST');
export const registerOwnerSuccess = createAction<AuthResponse>('AUTH/REGISTER_OWNER/SUCCESS');
export const registerOwnerFailure = createAction<string>('AUTH/REGISTER_OWNER/FAILURE');

// Set user (e.g., after refresh/me)
export const setAuthUser = createAction<AuthUser | null>('AUTH/SET/USER');

// Logout
export const logoutAction = createAction('AUTH/LOGOUT');