import type { SettingsState } from "./types";

export const selectSettings = (s: { settings: SettingsState }) => s.settings;

export const selectSubscriptionSummary = (s: { settings: SettingsState }) => s.settings.subscriptionSummary;
export const selectCheckoutResponse = (s: { settings: SettingsState }) => s.settings.checkoutResponse;
export const selectCustomerPortalUrl = (s: { settings: SettingsState }) => s.settings.customerPortalUrl;
export const selectSettingsError = (s: { settings: SettingsState }) => s.settings.error;

export const selectAvailablePlans = (s: { settings: SettingsState }) => s.settings.plans;

export const selectIsLoadingSubscriptionSummary = (s: { settings: SettingsState }) => s.settings.isLoading.subscriptionSummary;
export const selectSubscriptionSummaryError = (s: { settings: SettingsState }) => s.settings.summaryError;
export const selectIsLoadingPlans = (s: { settings: SettingsState }) => s.settings.isLoading.plans;
export const selectIsLoadingCheckoutSession = (s: { settings: SettingsState }) => s.settings.isLoading.checkoutSession;
export const selectIsLoadingCustomerPortal = (s: { settings: SettingsState }) => s.settings.isLoading.customerPortal;
export const selectIsLoadingModifySubscription = (s: { settings: SettingsState }) => s.settings.isLoading.modifySubscription;
export const selectIsLoadingCancelRemoval = (s: { settings: SettingsState }) => s.settings.isLoading.cancelRemoval;

// SMS Selectors
export const selectSmsBalance = (s: { settings: SettingsState }) => s.settings.smsBalance;
export const selectSmsPackages = (s: { settings: SettingsState }) => s.settings.smsPackages;
export const selectSmsPurchases = (s: { settings: SettingsState }) => s.settings.smsPurchases;
export const selectSmsPurchasesHasMore = (s: { settings: SettingsState }) => s.settings.smsPurchasesHasMore;
export const selectSmsPurchasesNextCursor = (s: { settings: SettingsState }) => s.settings.smsPurchasesNextCursor;
export const selectSmsError = (s: { settings: SettingsState }) => s.settings.smsError;

export const selectIsSmsBalanceLoading = (s: { settings: SettingsState }) => s.settings.smsIsLoading.balance;
export const selectIsSmsPackagesLoading = (s: { settings: SettingsState }) => s.settings.smsIsLoading.packages;
export const selectIsSmsCheckoutLoading = (s: { settings: SettingsState }) => s.settings.smsIsLoading.checkout;
export const selectIsSmsPurchasesLoading = (s: { settings: SettingsState }) => s.settings.smsIsLoading.purchases;

// Business Invoices Selectors
export const selectBusinessInvoices = (s: { settings: SettingsState }) => s.settings.invoices;
export const selectBusinessInvoicesHasMore = (s: { settings: SettingsState }) => s.settings.invoicesHasMore;
export const selectBusinessInvoicesNextCursor = (s: { settings: SettingsState }) => s.settings.invoicesNextCursor;
export const selectIsLoadingBusinessInvoices = (s: { settings: SettingsState }) => s.settings.isLoading.invoices;
