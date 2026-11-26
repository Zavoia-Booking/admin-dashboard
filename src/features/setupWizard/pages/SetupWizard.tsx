import React, { useRef, useState, useEffect, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useSetupWizard } from "../../../shared/hooks/useSetupWizard";
import { useDispatch, useSelector } from "react-redux";
import { wizardCompleteAction } from "../actions";
import WizardLayout from "../components/WizardLayout";
import BusinessInfoSkeleton from "../components/BusinessInfoSkeleton";
import StepBusinessInfo from "../components/StepBusinessInfo";
import StepTeam from "../components/StepTeam";
import StepLocation from "../components/StepLocation";
import StepLaunch from "../components/StepLaunch";
import { selectCurrentUser } from "../../auth/selectors";
import { getHomeRouteForRole } from "../../../shared/lib/permissions";
import { getCurrentBusinessSelector } from "../../business/selectors";
import { getAllLocationsSelector } from "../../locations/selectors";
import { fetchCurrentBusinessAction } from "../../business/actions";
import { listLocationsAction } from "../../locations/actions";
import { listTeamMembersAction } from "../../teamMembers/actions";
import { selectTeamMembers } from "../../teamMembers/selectors";
import type { TeamMember } from "../../../shared/types/team-member";
import type { StepHandle } from "../types";

// Split to avoid calling wizard hooks when wizard is completed (prevents flicker)
const WizardRunner: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation("setupWizard");
  const stepRef = useRef<StepHandle>(null);
  const [canProceedToNext, setCanProceedToNext] = useState(false);
  const [completeRequested, setCompleteRequested] = useState(false);

  const stepConfig = [
    {
      component: StepBusinessInfo,
      title: t("steps.businessInfo.title"),
      subtitle: t("steps.businessInfo.subtitle"),
    },
    {
      component: StepLocation,
      title: t("steps.location.title"),
      subtitle: t("steps.location.subtitle"),
    },
    {
      component: StepTeam,
      title: t("steps.team.title"),
      subtitle: t("steps.team.subtitle"),
    },
  ];

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

  const stepLabels = [
    t("steps.labels.businessInfo"),
    t("steps.labels.location"),
    t("steps.labels.team"),
  ];
  const isLastStep = currentStep === totalSteps;
  const { component: CurrentStepComponent, title: effectiveTitle, subtitle: effectiveSubtitle } = stepConfig[currentStep - 1];
  const isLoadingDraft = !hydratedFromDraft;

  const handleSave = async () => {
    // Belt and braces: the button is disabled while completing, but a click
    // that slipped through must not overwrite the submission with a draft save.
    if (completeRequested) return;
    let formData = {};
    if (stepRef.current) {
      formData = stepRef.current.getFormData();
      updateData(formData);
    }
    await saveAndFinishLater(formData);
    toast.success(t("page.progressSavedTitle"), { description: t("page.progressSavedDescription") });
    navigate("/dashboard");
  };

  const handleValidityChange = (isValid: boolean) => setCanProceedToNext(isValid);

  useEffect(() => { if (isLastStep) setCanProceedToNext(true); }, [isLastStep]);

  const wizardError = useSelector((state: any) => state.setupWizard.error);
  const user = useSelector(selectCurrentUser);
  
  // The final submission is in flight from the moment it is requested until the
  // user comes back flagged as completed -- including the gap after the API call
  // where the wizard is no longer "loading" but the redirect hasn't happened.
  const isCompleting = completeRequested && !user?.wizardCompleted;

  // Handle completion flow: reset completeRequested when user state updates
  useEffect(() => {
    if (!completeRequested) return;
    
    // If user is now completed, the parent component will handle the redirect
    // Just reset the flag to clean up state
    if (user?.wizardCompleted) {
      setCompleteRequested(false);
      return;
    }
    
    // If there's an error, show it and reset
    if (wizardError) {
      toast.error(t("page.completeError"), { description: String(wizardError), icon: undefined });
      setCompleteRequested(false);
      return;
    }
    
    // If wizard loading finished but user is not yet completed, keep waiting
    // (This handles the gap between API completion and user state update)
  }, [completeRequested, wizardError, user?.wizardCompleted]);

  const handleNext = async () => {
    // A second "finish" click must not fire a second submission
    if (isCompleting) return;
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
      canProceed={canProceedToNext}
      isLoading={isLoading}
      isCompleting={isCompleting}
      showNext={true}
      nextLabel={currentStep === totalSteps ? t("layout.finishSetup") : t("layout.continue")}
      isLoadingDraft={isLoadingDraft}
    >
      {isLoadingDraft ? (
        <BusinessInfoSkeleton useAccountEmail={data.useAccountEmail} />
      ) : (
        <CurrentStepComponent ref={stepRef} data={data} onValidityChange={handleValidityChange} updateData={updateData} />
      )}
    </WizardLayout>
  );
};

const SetupWizardPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
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

  // Non-owners should never see the wizard - redirect to their home route
  useEffect(() => {
    if (user && user.role !== 'owner') {
      navigate(getHomeRouteForRole(user.role), { replace: true });
    }
  }, [user, navigate]);

  // Filter to only show pending team members (invited but not yet accepted)
  const pendingTeamMembers = (allTeamMembers || []).filter(
    (member: TeamMember) => member.roleStatus === 'pending_acceptance'
  );

  // AuthGate handles spinner when user is null
  if (!user) {
    return null;
  }

  // Don't render wizard for non-owners (redirect is in progress)
  if (user.role !== 'owner') {
    return null;
  }

  if (user?.wizardCompleted) {
    return (
      <div className="min-h-[100svh] cursor-default">
        <div className="container mx-auto pt-0 md:pt-8 pb-0 md:pb-8 min-h-[100svh] flex flex-col">
          <div className="mx-auto max-w-[960px] w-full rounded-none md:rounded-2xl md:border bg-surface shadow-md flex-1 flex flex-col">
            <div className="md:px-6 pt-0 md:pb-4 flex flex-col min-h-0 pb-0">
              <div className="rounded-lg p-0 md:p-4 pt-4 flex-1 md:min-h-[500px] !pb-8">
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
