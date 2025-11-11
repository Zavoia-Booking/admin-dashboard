import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/providers/store';
import type { WizardData } from './useSetupWizard';


/**
 * Check if a specific field has user-entered data in draft.
 * This is used for per-field error display to only show errors
 * for fields that actually have saved draft data.
 */
export function hasFieldDraftData(
  fieldName: string,
  sectionData: any,
  section: 'businessInfo' | 'location',
  data: Partial<WizardData>
): boolean {
  if (!sectionData) return false;
  
  const value = sectionData[fieldName];

  // Handle empty/null/undefined values
    if (value === undefined || value === null || value === '') return false;
    if (typeof value === 'string' && value.trim().length === 0) return false;
  
  // Numbers are always considered valid draft data
    if (typeof value === 'number') return true;

  // Handle toggle-dependent fields
  if (section === 'businessInfo' && fieldName === 'email') {
    // Email only counts as draft data if toggle is OFF (user manually entered it)
    return data.useAccountEmail === false;
  }

  if (section === 'location' && (fieldName === 'email' || fieldName === 'phone')) {
    // Contact fields only count as draft data if toggle is OFF (user manually entered them)
    return data.useBusinessContact === false;
  }

  // For all other fields, if value exists, it's draft data
      return true;
    }

interface UseFieldDraftValidationOptions {
  fieldName: string;
  trigger: () => Promise<boolean>;
  data: Partial<WizardData>;
  section: 'businessInfo' | 'location';
}

// Module-level tracking to ensure validation is triggered only once per section
// This is shared across all field instances in the same section
const sectionValidationTriggered = new Set<string>();

/**
 * @example
 * const nameHasDraft = useFieldDraftValidation({ fieldName: 'name', trigger, data, section: 'businessInfo' });
 * const phoneHasDraft = useFieldDraftValidation({ fieldName: 'phone', trigger, data, section: 'businessInfo' });
 * 
 * // In error display:
 * error={(isTouched || isDirty || phoneHasDraft) ? error : undefined}
 */
export function useFieldDraftValidation({
  fieldName,
  trigger,
  data,
  section,
}: UseFieldDraftValidationOptions): boolean {
  const isWizardLoading = useSelector((state: RootState) => state.setupWizard.isLoading);
  const [showDraftErrors, setShowDraftErrors] = useState(false);

  useEffect(() => {
    if (isWizardLoading) return;

    const sectionData = (data as any)?.[section];
    const fieldHasDraft = hasFieldDraftData(fieldName, sectionData, section, data);

    if (fieldHasDraft) {
      // Trigger validation once per section (shared across all field instances)
      if (!sectionValidationTriggered.has(section)) {
        trigger(); // Validate all fields once
        sectionValidationTriggered.add(section);
      }
      setShowDraftErrors(true);
    } else {
      setShowDraftErrors(false);
    }
  }, [isWizardLoading, data, section, fieldName, trigger]);

  // Reset trigger tracking when section data changes significantly (e.g., new draft load)
  // Use a ref to track the previous section data to detect significant changes
  const prevSectionDataRef = useRef<any>(null);
  useEffect(() => {
    const sectionData = (data as any)?.[section];
    // If section data changed significantly (new draft load), reset tracking
    if (prevSectionDataRef.current !== sectionData) {
      sectionValidationTriggered.delete(section);
      prevSectionDataRef.current = sectionData;
    }
  }, [data?.[section], section]);

  return showDraftErrors;
}

