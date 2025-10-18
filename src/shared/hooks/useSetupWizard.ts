import { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { wizardLoadDraftAction, wizardSaveAction, wizardUpdateDataAction } from '../../features/setupWizard/actions';
import type { NewLocationPayload } from '../../features/locations/types';
import type { BusinessInfo } from '../types/generalType';
import type { InviteTeamMemberPayload } from '../types/team-member';
import { getWizardDataSelector } from '../../features/setupWizard/selectors';
import type { RootState } from '../../app/providers/store';
import { isE164 } from '../utils/validation';

export interface WizardData {
  // Step 1: Business Info
  businessInfo: BusinessInfo;

  // Step 2: Location
  location: NewLocationPayload;

  // Step 3: Team
  teamMembers: InviteTeamMemberPayload[];
  worksSolo: boolean;
  currentStep?: number;
}

export const useSetupWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const reducerData = useSelector(getWizardDataSelector);
  const [isLoading, setSaving] = useState(false);
  const dispatch = useDispatch();
  const saveResolverRef = useRef<(() => void) | null>(null);
  const isLoadingState = useSelector((state: RootState) => state.setupWizard.isLoading);

  const totalSteps = 4;
  const [hydratedFromDraft, setHydratedFromDraft] = useState(false);

  useEffect(() => {
    dispatch(wizardLoadDraftAction.request());
  }, [dispatch]);

  useEffect(() => {
    // Hydrate step from draft only once, AFTER initial load completes
    if (!hydratedFromDraft && !isLoadingState) {
      const draftStep = (reducerData as any)?.currentStep;
      if (typeof draftStep === 'number' && draftStep >= 1 && draftStep <= totalSteps) {
        setCurrentStep(draftStep);
        setHydratedFromDraft(true);
      }
      // If no valid draftStep yet, wait for next reducerData update
    }
  }, [reducerData, hydratedFromDraft, isLoadingState]);

  // Listen for save completion
  useEffect(() => {
    if (!isLoadingState && saveResolverRef.current) {
      saveResolverRef.current();
      saveResolverRef.current = null;
    }
  }, [isLoadingState]);

  const updateData = useCallback((newData: Partial<WizardData>) => {
    // Update both local state and Redux to keep them in sync
    dispatch(wizardUpdateDataAction(newData));
  }, [dispatch]);

  const scrollToWizardContent = () => {
    // Scroll to the wizard content area instead of the window top
    const wizardContent = document.querySelector('[data-wizard-content]');
    if (wizardContent) {
      wizardContent.scrollIntoView({ block: 'start' });
    } else {
      // Fallback: scroll to a reasonable position below sticky elements
      window.scrollTo({ top: 200 });
    }
  };

  // Persist currentStep after state changes to avoid setState during render
  useEffect(() => {
    dispatch(wizardUpdateDataAction({ currentStep } as any));
  }, [currentStep, dispatch]);

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => {
        const next = prev + 1;
        return next;
      });
      scrollToWizardContent();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => {
        const next = prev - 1;
        return next;
      });
      scrollToWizardContent();
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
      scrollToWizardContent();
    }
  };

  const saveAndFinishLater = async (additionalData?: Partial<WizardData>) => {
    setSaving(true);
    try {
      // Wait for save to complete
      await new Promise<void>((resolve) => {
        saveResolverRef.current = resolve;
        // Merge current form data with Redux data
        const dataToSave = additionalData 
          ? { ...reducerData, ...additionalData, currentStep } 
          : { ...(reducerData as any), currentStep };
        dispatch(wizardSaveAction.request(dataToSave as any));
      });
    } finally {
      setSaving(false);
    }
  };

  const getProgress = () => {
    return Math.round((currentStep / totalSteps) * 100);
  };

  const canProceed = (step: number): boolean => {
    switch (step) {
      case 1: {
        const hasName = reducerData.businessInfo?.name?.trim() !== '';
        const hasIndustry = Number.isInteger((reducerData.businessInfo as any)?.industryId) && (reducerData.businessInfo as any).industryId > 0;
        const hasValidPhone = !!(reducerData.businessInfo?.phone && isE164(reducerData.businessInfo.phone));
        return hasName && hasIndustry && hasValidPhone;
      }
      case 2:
        if (reducerData.location.isRemote) {
          const hasContact = (reducerData.location.email?.trim() ?? '') !== '' || reducerData.location.phone?.trim() !== '';
          return reducerData.location.name?.trim() !== '' && reducerData.location.timezone?.trim() !== '' && hasContact;
        }
        return (
          reducerData.location.name?.trim() !== '' &&
          reducerData.location.address?.trim() !== '' &&
          (reducerData.location.email?.trim() ?? '') !== '' &&
          reducerData.location.phone?.trim() !== ''
        );
      default:
        return true; // Other steps are optional
    }
  };

  return {
    currentStep,
    totalSteps,
    data: reducerData,
    isLoading,
    hydratedFromDraft,
    updateData,
    nextStep,
    prevStep,
    goToStep,
    saveAndFinishLater,
    getProgress,
    canProceed,
  };
}; 