import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSetupWizard } from '../../../shared/hooks/useSetupWizard';
import { useDispatch, useSelector } from 'react-redux';
import { wizardCompleteAction } from '../actions';
import WizardLayout from '../components/WizardLayout';
import { Skeleton } from '../../../shared/components/ui/skeleton';
import StepBusinessInfo from '../components/StepBusinessInfo';
import StepTeam from '../components/StepTeam';
import StepLaunch from '../components/StepLaunch';
import StepLocation from '../components/StepLocation';
import { selectCurrentUser } from '../../auth/selectors';
import type { StepHandle } from '../types';

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
    title: "You're live — start taking bookings",
    subtitle: 'Share your booking link and invite clients. You can fine-tune everything from your dashboard.'
  }
];

const SetupWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const stepRef = useRef<StepHandle>(null);
  const [canProceedToNext, setCanProceedToNext] = useState(false);
  const [completeRequested, setCompleteRequested] = useState(false);
  
  const {
    currentStep,
    totalSteps,
    data,
    isLoading,
    hydratedFromDraft,
    updateData,
    nextStep,
    prevStep,
    goToStep,
    saveAndFinishLater,
    getProgress
  } = useSetupWizard();

  const stepLabels = ['Business Info', 'Location', 'Team', 'Launch'];

  const isLastStep = currentStep === totalSteps;

  const { component: CurrentStepComponent, title: effectiveTitle, subtitle: effectiveSubtitle } = stepConfig[currentStep - 1];
  const effectiveIsLastStep = isLastStep;

  const handleSave = async () => {
    // Get current form data from the step and pass directly to save
    let formData = {};
    if (stepRef.current) {
      formData = stepRef.current.getFormData();
      updateData(formData); // Also update Redux for consistency
    }
    await saveAndFinishLater(formData);
    toast.success("Progress Saved", {
      description: "You can continue setup anytime from your dashboard.",
    });
    navigate('/dashboard');
  };

  const handleValidityChange = (isValid: boolean) => {
    setCanProceedToNext(isValid);
  };

  // Enable button for last step by default
  useEffect(() => {
    if (isLastStep) {
      setCanProceedToNext(true);
    }
  }, [isLastStep]);

  // Wizard async state
  const isWizardLoading = useSelector((state: any) => state.setupWizard.isLoading);
  const wizardError = useSelector((state: any) => state.setupWizard.error);

  // After requesting completion, advance only when request finishes successfully
  useEffect(() => {
    if (!completeRequested) return;
    if (isWizardLoading) return;
    if (wizardError) {
      toast.error("We couldn't finish your setup", {
        description: String(wizardError),
        icon: undefined,
      });
      setCompleteRequested(false);
      return;
    }
    setCompleteRequested(false);
    nextStep();
  }, [completeRequested, isWizardLoading, wizardError, nextStep]);

  const handleNext = async () => {
    // Validate form before proceeding
    if (stepRef.current) {
      const isValid = await stepRef.current.triggerValidation();
      if (!isValid) {
        return; // Don't proceed if validation fails
      }
      
      // Sync form data to Redux after validation passes
      const formData = stepRef.current.getFormData();
      updateData(formData);
    }
    
    if (currentStep === totalSteps - 1) {
      setCompleteRequested(true);
      dispatch(wizardCompleteAction.request(data));
      return; // do not advance yet; wait for saga result
    }
    nextStep();
  };

  return (
    user?.wizardCompleted && currentStep < totalSteps ? (
      <div className="max-w-2xl mx-auto text-center py-12 cursor-default">
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
        title={effectiveTitle}
        subtitle={effectiveSubtitle}
        stepLabels={stepLabels}
        onGoToStep={goToStep}
        onClose={() => navigate('/dashboard')}
        onPrevious={prevStep}
        onNext={handleNext}
        onSave={!effectiveIsLastStep ? handleSave : undefined}
        canProceed={canProceedToNext && !(completeRequested && isWizardLoading)}
        isLoading={isLoading}
        showNext={!effectiveIsLastStep}
        nextLabel={currentStep === totalSteps - 1 ? 'Launch My Business' : 'Continue'}
      >
        {!hydratedFromDraft ? (
          <div className="space-y-6 cursor-default">
            <div className="grid gap-6">
              <div className="space-y-2">
                <Skeleton className="h-[14px] w-32" />
                <Skeleton className="h-10 w-full" />
                <div className="h-5" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-[14px] w-24" />
                <Skeleton className="h-[12px] w-64" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-lg" />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-[14px] w-40" />
                  <Skeleton className="h-[12px] w-12" />
                </div>
                <Skeleton className="h-[72px] w-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-[14px] w-28" />
                  <Skeleton className="h-10 w-full" />
                  <div className="h-5" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-[14px] w-32" />
                  <Skeleton className="h-10 w-full" />
                  <div className="h-5" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          effectiveIsLastStep ? (
            <CurrentStepComponent data={data} />
          ) : (
            <CurrentStepComponent ref={stepRef} data={data} onValidityChange={handleValidityChange} updateData={updateData} />
          )
        )}
      </WizardLayout>
    )
  );
};

export default SetupWizardPage; 