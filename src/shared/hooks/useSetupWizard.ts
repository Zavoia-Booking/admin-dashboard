import { useState } from 'react';
import type { UserRole } from '../types/auth';

export interface WizardData {
  // Step 1: Business Info
  businessName: string;
  industry: string;
  description: string;
  logo?: File;
  
  // Step 2: Location
  isRemote: boolean;
  address: string;
  city: string;
  
  // Step 3: Services
  services: Array<{
    id: string;
    name: string;
    price: number;
    duration: number;
  }>;
  
  // Step 4: Schedule
  schedule: Array<{
    day: string;
    open: string;
    close: string;
    isClosed: boolean;
  }>;
  bufferTime: number;
  
  // Step 5: Team
  teamMembers: Array<{
    email: string;
    role: UserRole;
  }>;
  worksSolo: boolean;
  
  // Step 6: Template
  selectedTemplate: string;
  
  // Step 7: Launch
  isLaunched: boolean;
}

const initialData: WizardData = {
  businessName: '',
  industry: '',
  description: '',
  isRemote: false,
  address: '',
  city: '',
  services: [],
  schedule: [
    { day: 'Monday', open: '09:00', close: '17:00', isClosed: false },
    { day: 'Tuesday', open: '09:00', close: '17:00', isClosed: false },
    { day: 'Wednesday', open: '09:00', close: '17:00', isClosed: false },
    { day: 'Thursday', open: '09:00', close: '17:00', isClosed: false },
    { day: 'Friday', open: '09:00', close: '17:00', isClosed: false },
    { day: 'Saturday', open: '09:00', close: '17:00', isClosed: true },
    { day: 'Sunday', open: '09:00', close: '17:00', isClosed: true },
  ],
  bufferTime: 15,
  teamMembers: [],
  worksSolo: true,
  selectedTemplate: '',
  isLaunched: false,
};

export const useSetupWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<WizardData>(initialData);
  const [isLoading, setSaving] = useState(false);

  const totalSteps = 7;

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
        return data.businessName.trim() !== '' && data.industry !== '';
      case 2:
        return data.isRemote || (data.address.trim() !== '' && data.city.trim() !== '');
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