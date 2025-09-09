import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { wizardLoadDraftAction, wizardSaveAction } from '../../features/setupWizard/actions';
import type { NewLocationPayload } from '../../features/locations/types';
import type { BusinessInfo } from '../types/generalType';
import type { InviteTeamMemberPayload } from '../types/team-member';
import { getWizardDataSelector } from '../../features/setupWizard/selectors';

export interface WizardData {
  // Step 1: Business Info
  businessInfo: BusinessInfo;

  // Step 2: Location
  location: NewLocationPayload;

  // Step 3: Team
  teamMembers: InviteTeamMemberPayload[];
  worksSolo: boolean;
}

export const useSetupWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const reducerData = useSelector(getWizardDataSelector);
  const [data, setData] = useState<WizardData>(reducerData);
  const [isLoading, setSaving] = useState(false);
  const dispatch = useDispatch();

  const totalSteps = 4;

  useEffect(() => {
    dispatch(wizardLoadDraftAction.request());
  }, [dispatch]);

  useEffect(() => {
    setData(reducerData);
  }, [reducerData]);

  const updateData = (newData: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

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

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
      // Scroll to wizard content when navigating to next step
      scrollToWizardContent();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      // Scroll to wizard content when navigating to previous step
      scrollToWizardContent();
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
      // Scroll to wizard content when navigating directly to a step
      scrollToWizardContent();
    }
  };

  const saveAndFinishLater = async () => {
    setSaving(true);
    try {
      await new Promise<void>((resolve) => {
        // fire-and-forget via saga, but we resolve immediately for UX responsiveness
        dispatch(wizardSaveAction.request(data));
        resolve();
      });
    } finally {
      setSaving(false);
    }
  };

  const getProgress = () => {
    return Math.round((currentStep / totalSteps) * 100);
  };

  const canProceed = (step: number) => {
    switch (step) {
      case 1:
        return data.businessInfo.name.trim() !== '' && data.businessInfo.industry !== '';
      case 2:
        if (data.location.isRemote) {
          const hasContact = (data.location.email?.trim() ?? '') !== '' || data.location.phone.trim() !== '';
          return data.location.name.trim() !== '' && data.location.timezone.trim() !== '' && hasContact;
        }
        return (
          data.location.name.trim() !== '' &&
          data.location.address?.trim() !== '' &&
          (data.location.email?.trim() ?? '') !== '' &&
          data.location.phone.trim() !== ''
        );
      default:
        return true; // Other steps are optional
    }
  };

  return {
    currentStep,
    totalSteps,
    data,
    isLoading,
    updateData,
    nextStep,
    prevStep,
    goToStep,
    saveAndFinishLater,
    getProgress,
    canProceed,
  };
}; 