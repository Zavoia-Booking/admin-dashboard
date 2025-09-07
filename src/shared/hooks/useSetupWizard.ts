import { useState } from 'react';
import type { WorkingHours } from '../types/location';
import type { NewLocationPayload } from '../../features/locations/types';
import type { BusinessInfo } from '../types/generalType';
import type { InviteTeamMemberPayload } from '../types/team-member';

export interface WizardData {
  // Step 1: Business Info
  businessInfo: BusinessInfo;

  // Step 2: Location
  location: NewLocationPayload;

  // Step 3: Team
  teamMembers: InviteTeamMemberPayload[];
  worksSolo: boolean;
}

const defaultWorkingHours: WorkingHours = {
  monday: { open: '09:00', close: '17:00', isOpen: true },
  tuesday: { open: '09:00', close: '17:00', isOpen: true },
  wednesday: { open: '09:00', close: '17:00', isOpen: true },
  thursday: { open: '09:00', close: '17:00', isOpen: true },
  friday: { open: '09:00', close: '17:00', isOpen: true },
  saturday: { open: '10:00', close: '15:00', isOpen: true },
  sunday: { open: '10:00', close: '15:00', isOpen: false },
};

const initialData: WizardData = {
  businessInfo: {
    name: '',
    industry: '',
    description: '',
    email: '',
    phone: '',
    timezone: (typeof Intl !== 'undefined' && Intl.DateTimeFormat ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC') as string,
    country: '',
    currency: 'USD',
    instagramUrl: '',
    facebookUrl: '',
  },
  location: {
    isRemote: false,
    name: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    isActive: true,
    timezone: (typeof Intl !== 'undefined' && Intl.DateTimeFormat ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC') as string,
    workingHours: defaultWorkingHours,
  },
  teamMembers: [],
  worksSolo: true,
};

export const useSetupWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<WizardData>(initialData);
  const [isLoading, setSaving] = useState(false);

  const totalSteps = 4;

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
    // Simulate save
    setTimeout(() => {
      setSaving(false);
      // In real app, navigate to dashboard with saved state
    }, 1000);
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