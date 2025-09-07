import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSetupWizard } from '../../../shared/hooks/useSetupWizard';
import { useDispatch, useSelector } from 'react-redux';
import { wizardCompleteAction } from '../actions';
import WizardLayout from '../components/WizardLayout';
import StepBusinessInfo from '../components/StepBusinessInfo';
import StepTeam from '../components/StepTeam';
import StepLaunch from '../components/StepLaunch';
import StepLocation from '../components/StepLocation';
import { selectCurrentUser } from '../../auth/selectors';

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
  const user = useSelector(selectCurrentUser);
  
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
    user?.wizardCompleted ? (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Thank You for Completing Your Business Setup!</h2>
        <p className="text-gray-600 mb-8">
          Your business is now ready to go. You can start adding services, inviting team members, 
          and customizing your booking experience through the dashboard.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
        >
          Go to Dashboard
        </button>
      </div>
    ) : (
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
    )
  );
};

export default SetupWizardPage; 