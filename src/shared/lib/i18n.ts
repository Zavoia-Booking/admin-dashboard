import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

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
import enMySettings from '../../locales/en/mySettings.json';
import roMySettings from '../../locales/ro/mySettings.json';
import enMyProfile from '../../locales/en/myProfile.json';
import roMyProfile from '../../locales/ro/myProfile.json';
import enAuth from '../../locales/en/auth.json';
import roAuth from '../../locales/ro/auth.json';

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
    mySettings: enMySettings,
    myProfile: enMyProfile,
    auth: enAuth,
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
    mySettings: roMySettings,
    myProfile: roMyProfile,
    auth: roAuth,
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

export default i18n;
