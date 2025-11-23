import type { WizardData } from "../../shared/hooks/useSetupWizard";

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
 * Note: We still send useBusinessContact flag to backend so it can track the relationship
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
  
  // Preserve useBusinessContact flag for backend
  // Backend needs to know if this location should inherit future business contact changes
  if (typeof wizardData.useBusinessContact === 'boolean') {
    location.useBusinessContact = wizardData.useBusinessContact;
  }
  
  // Preserve addressManualMode flag for backend
  // Backend may need to know how the address was entered
  if (typeof location.addressManualMode === 'boolean') {
    // Already in location object, just ensure it's preserved
    location.addressManualMode = location.addressManualMode;
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
  const payload = { ...wizardData, businessInfo: { ...wizardData.businessInfo, country: wizardData.location.addressComponents?.country || '' } };
  ensureBusinessTimezone(payload);
  ensureBusinessCurrency(payload);
  applyBusinessContactToLocation(payload);
  return payload;
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