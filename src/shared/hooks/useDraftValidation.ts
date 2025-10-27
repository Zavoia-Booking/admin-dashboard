import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/providers/store';
import type { WizardData } from './useSetupWizard';

interface UseDraftValidationOptions {
  trigger: () => Promise<boolean>;
  data: Partial<WizardData>;
  section: 'businessInfo' | 'location' | 'team';
}

/**
 * Always-checked fields that require manual user input
 */
const userInputFields: Record<string, string[]> = {
  businessInfo: ['name', 'phone', 'description', 'industryId', 'instagramUrl', 'facebookUrl'],
  location: ['name', 'address', 'description'],
  team: [],
};

/**
 * Check if a section has actual user-entered values
 */
function hasUserInput(sectionData: any, section: string, data: Partial<WizardData>): boolean {
  if (!sectionData) return false;
  
  // Check always-required fields
  const fields = userInputFields[section] || [];
  const hasManualFields = fields.some(field => {
    const value = sectionData[field];
    if (value === undefined || value === null || value === '') return false;
    if (typeof value === 'string' && value.trim().length === 0) return false;
    if (typeof value === 'number') return true;
    return true;
  });

  if (hasManualFields) return true;

  // Check toggle-dependent fields
  if (section === 'businessInfo' && data.useAccountEmail === false) {
    // User toggled OFF useAccountEmail, so they manually entered email
    const email = sectionData.email;
    if (email && typeof email === 'string' && email.trim().length > 0) {
      return true;
    }
  }

  if (section === 'location' && data.useBusinessContact === false) {
    // User toggled OFF useBusinessContact, so they manually entered contact info
    const phone = sectionData.phone;
    const email = sectionData.email;
    if ((phone && phone.trim().length > 0) || (email && email.trim().length > 0)) {
      return true;
    }
  }

  return false;
}

/**
 * Returns true if we loaded from draft with actual user input, false otherwise.
 * This allows errors to show immediately on draft load, then switches to normal touched/dirty validation.
 */
export function useDraftValidation({ trigger, data, section }: Omit<UseDraftValidationOptions, 'isDirty'>): boolean {
  const isWizardLoading = useSelector((state: RootState) => state.setupWizard.isLoading);
  const hasValidated = useRef(false);
  const [showDraftErrors, setShowDraftErrors] = useState(false);

  useEffect(() => {
    if (hasValidated.current || isWizardLoading) return;

    const sectionData = (data as any)?.[section];
    const hasDraftData = hasUserInput(sectionData, section, data);

    if (hasDraftData) {
      hasValidated.current = true;
      trigger();
      setShowDraftErrors(true);
    }
  }, [isWizardLoading, data, section, trigger]);

  return showDraftErrors;
}

