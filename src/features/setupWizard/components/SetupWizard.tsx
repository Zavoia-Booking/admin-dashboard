import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSetupWizard } from '../../../shared/hooks/useSetupWizard';
import WizardLayout from './WizardLayout';
import Step1BusinessInfo from './Step1BusinessInfo';
import Step2Location from './Step2Location';
import Step3Services from './Step3Services';
import Step4Schedule from './Step4Schedule';
import Step5Team from './Step5Team';
import Step6Template from './Step6Template';
import Step7Launch from './Step7Launch';

const stepConfig = [
  {
    component: Step1BusinessInfo,
    title: 'Tell Us About Your Business',
    subtitle: 'This helps us customize your booking setup.'
  },
  {
    component: Step2Location,
    title: 'Where Do You Offer Services?',
    subtitle: 'Help customers find you or let them know you offer remote services'
  },
  {
    component: Step3Services,
    title: 'What Services Do You Offer?',
    subtitle: 'Add the services you want clients to book. You can always update them later.'
  },
  {
    component: Step4Schedule,
    title: 'When are you available?',
    subtitle: 'Set your working hours so customers know when to book'
  },
  {
    component: Step5Team,
    title: 'Want to Add Your Team?',
    subtitle: 'Invite team members so they can take bookings, manage their schedule, or access the calendar.'
  },
  {
    component: Step6Template,
    title: 'Your Business. Your Look.',
    subtitle: 'Choose a website template. We\'ll auto-fill your info—you can customize it later.'
  },
  {
    component: Step7Launch,
    title: '🎉 You\'re Live!',
    subtitle: 'Your booking page and website are up and running. Start accepting appointments today.'
  }
];

const SetupWizard: React.FC = () => {
  const navigate = useNavigate();
  
  const {
    currentStep,
    totalSteps,
    data,
    isLoading,
    updateData,
    nextStep,
    prevStep,
    saveAndFinishLater,
    getProgress,
    canProceed
  } = useSetupWizard();

  const handleSave = async () => {
    await saveAndFinishLater();
    toast.success("Progress Saved", {
      description: "You can continue setup anytime from your dashboard.",
    });
    navigate('/dashboard');
  };

  const handleLaunch = () => {
    toast.success("🎉 Congratulations!", {
      description: "Your business is now live and ready to accept bookings!",
    });
    navigate('/dashboard');
  };

  const getCurrentStepConfig = () => stepConfig[currentStep - 1];
  const { component: CurrentStepComponent, title, subtitle } = getCurrentStepConfig();

  const isLastStep = currentStep === totalSteps;

  return (
    <WizardLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      progress={getProgress()}
      title={title}
      subtitle={subtitle}
      onPrevious={prevStep}
      onNext={nextStep}
      onSave={!isLastStep ? handleSave : undefined}
      canProceed={canProceed(currentStep)}
      isLoading={isLoading}
      showNext={!isLastStep}
      nextLabel={currentStep === totalSteps - 1 ? (currentStep === 6 ? 'Launch My Business' : 'Review & Launch') : 'Continue'}
    >
      {isLastStep ? (
        <CurrentStepComponent 
          data={data} 
          onUpdate={updateData} 
          onLaunch={handleLaunch}
        />
      ) : (
        <CurrentStepComponent 
          data={data} 
          onUpdate={updateData} 
          {...(currentStep === 6 ? { onNext: nextStep } : {})}
        />
      )}
    </WizardLayout>
  );
};

export default SetupWizard; 