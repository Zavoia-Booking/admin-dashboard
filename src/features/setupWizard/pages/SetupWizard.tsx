import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSetupWizard } from '../../../shared/hooks/useSetupWizard';
import { useDispatch } from 'react-redux';
import { wizardCompleteAction } from '../actions';
import WizardLayout from '../components/WizardLayout';
import StepBusinessInfo from '../components/StepBusinessInfo';
import StepTeam from '../components/StepTeam';
// import StepTemplate from '../components/StepTemplate';
import StepLaunch from '../components/StepLaunch';
import StepLocation from '../components/StepLocation';

const stepConfig = [
  {
    component: StepBusinessInfo,
    title: 'Tell Us About Your Business',
    subtitle: 'This helps us customize your booking setup.'
  },
  {
    component: StepLocation,
    title: 'Where Do You Offer Services?',
    subtitle: 'Help customers find you or let them know you offer remote services'
  },
  {
    component: StepTeam,
    title: 'Want to Add Your Team?',
    subtitle: 'Invite team members so they can take bookings, manage their schedule, or access the calendar.'
  },
  {
    component: StepLaunch,
    title: '🎉 You\'re Live!',
    subtitle: 'Your booking page and website are up and running. Start accepting appointments today.'
  }
];

const SetupWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
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
      onNext={() => {
        if (currentStep === totalSteps - 1) {
          dispatch(wizardCompleteAction.request(data));
        }
        nextStep();
      }}
      onSave={!isLastStep ? handleSave : undefined}
      canProceed={canProceed(currentStep)}
      isLoading={isLoading}
      showNext={!isLastStep}
      nextLabel={currentStep === totalSteps - 1 ? 'Launch My Business' : 'Continue'}
    >
      {isLastStep ? (
        <CurrentStepComponent data={data} onUpdate={updateData} />
      ) : (
        <CurrentStepComponent data={data} onUpdate={updateData} />
      )}
    </WizardLayout>
  );
};

export default SetupWizardPage; 