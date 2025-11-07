import React, { useRef, useState, useEffect, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useSetupWizard } from "../../../shared/hooks/useSetupWizard";
import { useDispatch, useSelector } from "react-redux";
import { wizardCompleteAction } from "../actions";
import WizardLayout from "../components/WizardLayout";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import StepBusinessInfo from "../components/StepBusinessInfo";
import StepTeam from "../components/StepTeam";
import StepLocation from "../components/StepLocation";
import StepLaunch from "../components/StepLaunch";
import { selectCurrentUser } from "../../auth/selectors";
import { getCurrentBusinessSelector, getBusinessLoadingSelector } from "../../business/selectors";
import { getAllLocationsSelector, getLocationLoadingSelector } from "../../locations/selectors";
import { fetchCurrentBusinessAction } from "../../business/actions";
import { listLocationsAction } from "../../locations/actions";
import { listTeamMembersAction } from "../../teamMembers/actions";
import { selectTeamMembers } from "../../teamMembers/selectors";
import type { TeamMember } from "../../../shared/types/team-member";
import type { StepHandle } from "../types";
import LaunchPageSkeleton from "../components/LaunchPageSkeleton";

const stepConfig = [
  {
    component: StepBusinessInfo,
    title: "Tell Us About Your Business",
    subtitle: "This helps us customize your booking setup.",
  },
  {
    component: StepLocation,
    title: "Where Do You Offer Services?",
    subtitle:
      "Help customers find you or let them know you offer remote services",
  },
  {
    component: StepTeam,
    title: "Want to Add Your Team?",
    subtitle:
      "Invite team members so they can take bookings, manage their schedule, or access the calendar.",
  },
];

// Split to avoid calling wizard hooks when wizard is completed (prevents flicker)
const WizardRunner: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
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
    getProgress,
  } = useSetupWizard();

  const stepLabels = ["Business Info", "Location", "Team"];
  const isLastStep = currentStep === totalSteps;
  const { component: CurrentStepComponent, title: effectiveTitle, subtitle: effectiveSubtitle } = stepConfig[currentStep - 1];

  const handleSave = async () => {
    let formData = {};
    if (stepRef.current) {
      formData = stepRef.current.getFormData();
      updateData(formData);
    }
    await saveAndFinishLater(formData);
    toast.success("Progress Saved", { description: "You can continue setup anytime from your dashboard." });
    navigate("/dashboard");
  };

  const handleValidityChange = (isValid: boolean) => setCanProceedToNext(isValid);

  useEffect(() => { if (isLastStep) setCanProceedToNext(true); }, [isLastStep]);

  const isWizardLoading = useSelector((state: any) => state.setupWizard.isLoading);
  const wizardError = useSelector((state: any) => state.setupWizard.error);

  useEffect(() => {
    if (!completeRequested) return;
    if (isWizardLoading) return;
    if (wizardError) {
      toast.error("We couldn't finish your setup", { description: String(wizardError), icon: undefined });
      setCompleteRequested(false);
      return;
    }
    setCompleteRequested(false);
  }, [completeRequested, isWizardLoading, wizardError, nextStep]);

  const handleNext = async () => {
    if (stepRef.current) {
      const isValid = await stepRef.current.triggerValidation();
      if (!isValid) {
        return; // Don't proceed if validation fails
      }
      
      // Sync form data to Redux after validation passes
      const formData = stepRef.current.getFormData();
      updateData(formData);

      // If completing wizard, use fresh form data (includes File objects for upload)
      if (currentStep === totalSteps) {
        setCompleteRequested(true);
        // Pass form data directly, not Redux data (which strips Files)
        const completeData = { ...data, ...formData, currentStep };
        dispatch(wizardCompleteAction.request(completeData));
        return; // do not advance yet; wait for saga result
      }
    }

    nextStep();
  };

  return (
    <WizardLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      progress={getProgress()}
      title={effectiveTitle}
      subtitle={effectiveSubtitle}
      stepLabels={stepLabels}
      onGoToStep={goToStep}
      onClose={() => navigate("/dashboard")}
      onPrevious={prevStep}
      onNext={handleNext}
      onSave={handleSave}
      canProceed={canProceedToNext && !(completeRequested && isWizardLoading)}
      isLoading={isLoading}
      showNext={true}
      nextLabel={currentStep === totalSteps ? "Finish Setup" : "Continue"}
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
        <CurrentStepComponent ref={stepRef} data={data} onValidityChange={handleValidityChange} updateData={updateData} />
      )}
    </WizardLayout>
  );
};

const SetupWizardPage: React.FC = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const business = useSelector(getCurrentBusinessSelector);
  const locations = useSelector(getAllLocationsSelector);
  const allTeamMembers = useSelector(selectTeamMembers);
  const hasRequestedData = useRef(false);

  // Load business, locations, and team members when completed user visits
  useLayoutEffect(() => {
    if (!hasRequestedData.current && user?.wizardCompleted) {
      hasRequestedData.current = true;
      dispatch(fetchCurrentBusinessAction.request());
      dispatch(listLocationsAction.request());
      dispatch(listTeamMembersAction.request());
    }
  }, [dispatch, user?.wizardCompleted]);

  // Filter to only show pending team members (invited but not yet accepted)
  const pendingTeamMembers = (allTeamMembers || []).filter(
    (member: TeamMember) => member.status === 'pending'
  );

  const isBusinessLoading = useSelector(getBusinessLoadingSelector);
  const isLocationsLoading = useSelector(getLocationLoadingSelector);
  const isLoadingLaunchData = isBusinessLoading || isLocationsLoading;

  // AuthGate handles spinner when user is null
  if (!user) {
    return null;
  }

  // Show LaunchPageSkeleton while data is loading for completed users
  if (user?.wizardCompleted && isLoadingLaunchData) {
    return (
      <div className="min-h-[100svh] bg-background cursor-default">
        <div className="container mx-auto pt-0 md:pt-8 pb-0 md:pb-8 min-h-[100svh] flex flex-col">
          <div className="mx-auto max-w-[960px] w-full rounded-none md:rounded-2xl md:border bg-card shadow-md flex-1 flex flex-col">
            <div className="md:px-6 pt-0 md:pb-4 flex flex-col min-h-0 pb-0">
              <div className="rounded-lg bg-white p-0 pt-4 flex-1 md:min-h-[500px] md:pb-4">
                <LaunchPageSkeleton />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user?.wizardCompleted) {
    return (
      <div className="min-h-[100svh] bg-background cursor-default">
        <div className="container mx-auto pt-0 md:pt-8 pb-0 md:pb-8 min-h-[100svh] flex flex-col">
          <div className="mx-auto max-w-[960px] w-full rounded-none md:rounded-2xl md:border bg-card shadow-md flex-1 flex flex-col">
            <div className="md:px-6 pt-0 md:pb-4 flex flex-col min-h-0 pb-0">
              <div className="rounded-lg bg-white p-0 pt-4 flex-1 md:min-h-[500px] md:pb-4">
                <StepLaunch
                  business={business}
                  location={locations[0] || null}
                  teamMembers={pendingTeamMembers}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return <WizardRunner />;
};

export default SetupWizardPage;
