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
 * Returns true if we loaded from draft, false once user starts editing.
 * This allows errors to show immediately on draft load, then switches to normal touched/dirty validation.
 */
export function useDraftValidation({ trigger, data, section }: Omit<UseDraftValidationOptions, 'isDirty'>): boolean {
  const isWizardLoading = useSelector((state: RootState) => state.setupWizard.isLoading);
  const hasValidated = useRef(false);
  const [showDraftErrors, setShowDraftErrors] = useState(false);

  useEffect(() => {
    if (hasValidated.current || isWizardLoading) return;

    const sectionData = (data as any)?.[section];
    const hasDraftData = sectionData && Object.keys(sectionData).length > 0;

    if (hasDraftData) {
      hasValidated.current = true;
      trigger();
      setShowDraftErrors(true);
    }
  }, [isWizardLoading, data, section, trigger]);

  // showDraftErrors stays true once set - each field checks its own isTouched/isDirty
  return showDraftErrors;
}

