import type { SettingsState } from "./types";

export const selectSettings = (s: { settings: SettingsState }) => s.settings;

export const selectSubscriptionSummary = (s: { settings: SettingsState }) => s.settings.subscriptionSummary;
export const selectCheckoutResponse = (s: { settings: SettingsState }) => s.settings.checkoutResponse;
export const selectCustomerPortalUrl = (s: { settings: SettingsState }) => s.settings.customerPortalUrl;
export const selectSettingsError = (s: { settings: SettingsState }) => s.settings.error;

export const selectIsLoadingSubscriptionSummary = (s: { settings: SettingsState }) => s.settings.isLoading.subscriptionSummary;
export const selectIsLoadingCheckoutSession = (s: { settings: SettingsState }) => s.settings.isLoading.checkoutSession;
export const selectIsLoadingCustomerPortal = (s: { settings: SettingsState }) => s.settings.isLoading.customerPortal;
export const selectIsLoadingCancelSubscription = (s: { settings: SettingsState }) => s.settings.isLoading.cancelSubscription;
export const selectIsLoadingCancelRemoval = (s: { settings: SettingsState }) => s.settings.isLoading.cancelRemoval;
