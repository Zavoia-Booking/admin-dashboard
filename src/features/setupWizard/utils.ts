import { UserRole } from "../../shared/types/auth";
import type { WizardData } from "../../shared/hooks/useSetupWizard";

export const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
        case UserRole.TEAM_MEMBER: return 'bg-blue-100 text-blue-800 border-blue-200';
        case UserRole.OWNER: return 'bg-purple-100 text-purple-800 border-purple-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

export const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
        case UserRole.TEAM_MEMBER: return 'Team Member';
        case UserRole.OWNER: return 'Owner';
        default: return 'Unknown';
    }
};

/**
 * Ensures businessInfo.timezone is set before wizard completion
 * Priority: location.timezone → browser timezone → UTC
 */
export const ensureBusinessTimezone = (wizardData: WizardData): void => {
  if (wizardData.businessInfo && !wizardData.businessInfo.timezone) {
    wizardData.businessInfo.timezone = 
      wizardData.location?.timezone || 
      Intl.DateTimeFormat().resolvedOptions().timeZone || 
      'UTC';
  }
};

/**
 * Copies business contact info to location when useBusinessContact toggle is enabled
 */
export const applyBusinessContactToLocation = (wizardData: WizardData): void => {
  const location = wizardData.location as any;
  if (location?.useBusinessContact && wizardData.businessInfo) {
    // Always override with business info when toggle is on
    if (wizardData.businessInfo.email) {
      location.email = wizardData.businessInfo.email;
    }
    if (wizardData.businessInfo.phone) {
      location.phone = wizardData.businessInfo.phone;
    }
  } else {
    // When toggle is off, ensure we have SOME value (required by DB)
    // If location fields are empty, copy from business as fallback
    if (!location.email && wizardData.businessInfo?.email) {
      location.email = wizardData.businessInfo.email;
    }
    if (!location.phone && wizardData.businessInfo?.phone) {
      location.phone = wizardData.businessInfo.phone;
    }
  }
};

/**
 * Ensures businessInfo.businessCurrency is set before wizard completion
 * Defaults to 'eur' if not provided
 */
export const ensureBusinessCurrency = (wizardData: WizardData): void => {
  if (wizardData.businessInfo && !wizardData.businessInfo.businessCurrency) {
    wizardData.businessInfo.businessCurrency = 'eur';
  }
};

/**
 * Prepares wizard data for backend submission
 * Ensures all required fields are populated with proper defaults
 */
export const prepareWizardDataForSubmission = (wizardData: WizardData): WizardData => {
  const payload = { ...wizardData };
  ensureBusinessTimezone(payload);
  ensureBusinessCurrency(payload);
  applyBusinessContactToLocation(payload);
  return payload;
}; 

/**
 * Slugify a string for URLs
 */
export const toSlug = (value: string): string => {
  return (value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

/**
 * Build the public booking URL
 * Later this can read from settings (custom domain or stored slug)
 */
export const getBookingUrl = (data: WizardData): string => {
  const name = (data?.businessInfo?.name || '').trim();
  const slug = toSlug(name) || 'your-business';
  const host = 'bookaroo.com';
  return `https://${host}/${slug}`;
};

/**
 * Reusable toggle handler factory for wizard steps.
 * Updates react-hook-form value and mirrors to Redux via updateData.
 */
export function makeWizardToggleHandler(options: {
  setValue: (name: any, value: any, opts?: { shouldDirty?: boolean; shouldTouch?: boolean; shouldValidate?: boolean }) => void;
  watch: (name?: any) => any;
  updateData?: (data: Partial<WizardData>) => void;
  section?: 'location' | 'businessInfo' | 'root';
  field: string;
  onToggleExtra?: (checked: boolean) => void;
}) {
  const { setValue, watch, updateData, section = 'root', field, onToggleExtra } = options;
  return (checked: boolean) => {
    const path = section === 'root' ? field : `${section}.${field}`;
    setValue(path as any, checked, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    if (updateData) {
      if (section === 'root') {
        updateData({ [field]: checked } as any);
      } else {
        const currentSection = (watch(section as any) as any) || {};
        updateData({ [section]: { ...currentSection, [field]: checked } } as any);
      }
    }
    onToggleExtra?.(checked);
  };
}