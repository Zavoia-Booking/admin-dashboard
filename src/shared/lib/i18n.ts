import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import config from '../../app/config/env';

// Mobile overlay bundles — only loaded when running in a Capacitor native container.
// Each overlay contains only the keys that need to change on native; missing keys
// fall through to the base namespace via i18next's default resource resolution.
import enSettingsMobile from '../../locales/en/settings.mobile.json';
import roSettingsMobile from '../../locales/ro/settings.mobile.json';
import enTeamMembersMobile from '../../locales/en/teamMembers.mobile.json';
import roTeamMembersMobile from '../../locales/ro/teamMembers.mobile.json';
import enNavigationMobile from '../../locales/en/navigation.mobile.json';
import roNavigationMobile from '../../locales/ro/navigation.mobile.json';

// Import translation files
import enServices from '../../locales/en/services.json';
import roServices from '../../locales/ro/services.json';
import enNavigation from '../../locales/en/navigation.json';
import roNavigation from '../../locales/ro/navigation.json';
import enLocations from '../../locales/en/locations.json';
import roLocations from '../../locales/ro/locations.json';
import enTeamMembers from '../../locales/en/teamMembers.json';
import roTeamMembers from '../../locales/ro/teamMembers.json';
import enCustomers from '../../locales/en/customers.json';
import roCustomers from '../../locales/ro/customers.json';
import enAssignments from '../../locales/en/assignments.json';
import roAssignments from '../../locales/ro/assignments.json';
import enCommon from '../../locales/en/common.json';
import roCommon from '../../locales/ro/common.json';
import enMarketplace from '../../locales/en/marketplace.json';
import roMarketplace from '../../locales/ro/marketplace.json';
import enMessages from '../../locales/en/messages.json';
import roMessages from '../../locales/ro/messages.json';
import enMyAssignments from '../../locales/en/myAssignments.json';
import roMyAssignments from '../../locales/ro/myAssignments.json';
import enAdvancedSettings from '../../locales/en/advancedSettings.json';
import roAdvancedSettings from '../../locales/ro/advancedSettings.json';
import enNotifications from '../../locales/en/notifications.json';
import roNotifications from '../../locales/ro/notifications.json';
import enReviews from '../../locales/en/reviews.json';
import roReviews from '../../locales/ro/reviews.json';
import enSupport from '../../locales/en/support.json';
import roSupport from '../../locales/ro/support.json';
import enSettings from '../../locales/en/settings.json';
import roSettings from '../../locales/ro/settings.json';
import enDashboard from '../../locales/en/dashboard.json';
import roDashboard from '../../locales/ro/dashboard.json';
import enMyAccount from '../../locales/en/myAccount.json';
import roMyAccount from '../../locales/ro/myAccount.json';
import enMyProfile from '../../locales/en/myProfile.json';
import roMyProfile from '../../locales/ro/myProfile.json';
import enAuth from '../../locales/en/auth.json';
import roAuth from '../../locales/ro/auth.json';
import enCalendar from '../../locales/en/calendar.json';
import roCalendar from '../../locales/ro/calendar.json';
import setupWizardEn from '../../locales/en/setupWizard.json';
import setupWizardRo from '../../locales/ro/setupWizard.json';
import enBusiness from '../../locales/en/business.json';
import roBusiness from '../../locales/ro/business.json';
import enLocationMarketplaceDetails from '../../locales/en/locationMarketplaceDetails.json';
import roLocationMarketplaceDetails from '../../locales/ro/locationMarketplaceDetails.json';
import enIndustries from '../../locales/en/industries.json';
import roIndustries from '../../locales/ro/industries.json';

const resources = {
  en: {
    services: enServices,
    navigation: enNavigation,
    locations: enLocations,
    teamMembers: enTeamMembers,
    customers: enCustomers,
    assignments: enAssignments,
    common: enCommon,
    marketplace: enMarketplace,
    messages: enMessages,
    myAssignments: enMyAssignments,
    advancedSettings: enAdvancedSettings,
    notifications: enNotifications,
    reviews: enReviews,
    support: enSupport,
    settings: enSettings,
    dashboard: enDashboard,
    myAccount: enMyAccount,
    myProfile: enMyProfile,
    auth: enAuth,
    calendar: enCalendar,
    setupWizard: setupWizardEn,
    business: enBusiness,
    locationMarketplaceDetails: enLocationMarketplaceDetails,
    industries: enIndustries,
  },
  ro: {
    services: roServices,
    navigation: roNavigation,
    locations: roLocations,
    teamMembers: roTeamMembers,
    customers: roCustomers,
    assignments: roAssignments,
    common: roCommon,
    marketplace: roMarketplace,
    messages: roMessages,
    myAssignments: roMyAssignments,
    advancedSettings: roAdvancedSettings,
    notifications: roNotifications,
    reviews: roReviews,
    support: roSupport,
    settings: roSettings,
    dashboard: roDashboard,
    myAccount: roMyAccount,
    myProfile: roMyProfile,
    auth: roAuth,
    calendar: roCalendar,
    setupWizard: setupWizardRo,
    business: roBusiness,
    locationMarketplaceDetails: roLocationMarketplaceDetails,
    industries: roIndustries,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

// On native builds, merge mobile overlays on top of the base namespaces.
// Keys present in the overlay replace the base value; everything else is preserved.
// This keeps billing/subscription/payment wording off iOS & Android to comply with
// Apple Guidelines 3.1.1 / 3.1.3(a) and Google Play equivalents.
if (config.IS_NATIVE) {
  const overlays: Record<string, Record<string, object>> = {
    en: {
      settings: enSettingsMobile,
      teamMembers: enTeamMembersMobile,
      navigation: enNavigationMobile,
    },
    ro: {
      settings: roSettingsMobile,
      teamMembers: roTeamMembersMobile,
      navigation: roNavigationMobile,
    },
  };
  for (const [lng, nsMap] of Object.entries(overlays)) {
    for (const [ns, bundle] of Object.entries(nsMap)) {
      i18n.addResourceBundle(lng, ns, bundle, /* deep */ true, /* overwrite */ true);
    }
  }
}

export default i18n;
