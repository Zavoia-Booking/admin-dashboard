import { useEffect, useRef, useState } from 'react';
import type { WizardData } from './useSetupWizard';

interface UseWizardStepHydrationOptions {
  draftData: Partial<WizardData>;
  isLoading: boolean;
  totalSteps: number;
  onStepHydrated: (step: number) => void;
  hasRequestedDraft: boolean;
}

/**
 * Hook to hydrate the wizard step from draft data.
 * 
 * Handles:
 * - Initial load from backend
 * - Multiple draft loads (e.g., from auth saga + wizard hook)
 * - Ensures we always use the latest currentStep from backend
 * 
 * Returns whether hydration has completed at least once.
 */
export function useWizardStepHydration({
  draftData,
  isLoading,
  totalSteps,
  onStepHydrated,
  hasRequestedDraft,
}: UseWizardStepHydrationOptions): boolean {
  const [isHydrated, setIsHydrated] = useState(false);
  const lastSeenStep = useRef<number | null>(null);
  const hasCompletedLoadThisMount = useRef(false);
  
  useEffect(() => {
    // Only process when we've actually requested a draft and backend load completes
    if (!hasRequestedDraft || isLoading) {
      return;
    }
    
    // Mark that we've seen at least one load completion on this mount
    if (!hasCompletedLoadThisMount.current) {
      hasCompletedLoadThisMount.current = true;
    }

    const draftStep = draftData.currentStep;
    
    // Validate step is in range
    if (typeof draftStep !== 'number' || draftStep < 1 || draftStep > totalSteps) {
      // No valid draft step, mark as hydrated anyway to prevent infinite loading
      if (!isHydrated) {
        setIsHydrated(true);
      }
      return;
    }

    // Only update if this is a new/different step value
    if (draftStep !== lastSeenStep.current) {
      lastSeenStep.current = draftStep;
      onStepHydrated(draftStep);
    }

    // Mark as hydrated once we've processed at least one backend response
    if (!isHydrated) {
      setIsHydrated(true);
    }
  }, [draftData, isLoading, totalSteps, onStepHydrated, isHydrated, hasRequestedDraft]);

  return isHydrated;
}

