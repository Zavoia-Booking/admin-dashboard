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
