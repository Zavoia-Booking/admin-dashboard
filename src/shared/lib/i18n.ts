import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { Device } from '@capacitor/device';
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
import enWebsite from '../../locales/en/website.json';
import roWebsite from '../../locales/ro/website.json';
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

/** localStorage key holding the user's explicit language pick (absent until they make one). */
const LANGUAGE_CHOICE_KEY = 'zavoia.language';

function storedLanguageChoice(): string | null {
  try {
    return localStorage.getItem(LANGUAGE_CHOICE_KEY);
  } catch {
    return null;
  }
}
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
    website: enWebsite,
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
    website: roWebsite,
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
    supportedLngs: ['en', 'ro'],
    // "ro-RO" (browser/device) resolves to the bare "ro" resource.
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    // Keep development consoles actionable. Set VITE_I18N_DEBUG=true only while
    // investigating translations instead of logging every initialization and fallback.
    debug: config.IS_DEV && import.meta.env.VITE_I18N_DEBUG === 'true',
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },

    // Language precedence: the user's explicit pick (chooseLanguage) for good,
    // otherwise the device. Nothing is cached on detection, so an untouched app
    // keeps following the device; on native the device language is read from
    // the OS below (languageReady), on the web from the browser.
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: LANGUAGE_CHOICE_KEY,
      caches: [],
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

/** An explicit pick from a language switcher: applied now and kept over the device language. */
export function chooseLanguage(code: string) {
  try {
    localStorage.setItem(LANGUAGE_CHOICE_KEY, code);
  } catch {
    // Storage unavailable: the pick still applies for this session.
  }
  return i18n.changeLanguage(code);
}

/**
 * Native apps: until the user picks a language, use the phone's, read from the
 * OS (Capacitor Device) rather than the WebView's navigator.language, which
 * iOS doesn't keep reliably in step with the device. main.tsx renders once
 * this settles, so the first frame is already in the right language.
 */
export const languageReady: Promise<void> =
  config.IS_NATIVE && !storedLanguageChoice()
    ? Device.getLanguageCode()
        .then(({ value }) => i18n.changeLanguage(value.slice(0, 2).toLowerCase()))
        .then(
          () => undefined,
          () => undefined,
        )
    : Promise.resolve();

export default i18n;
