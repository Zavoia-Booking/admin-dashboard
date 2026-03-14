import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { useForm } from 'react-hook-form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../shared/components/ui/alert-dialog';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import { FormFooter } from '../../../shared/components/forms/FormFooter';
import { Pill } from '../../../shared/components/ui/pill';
import type { InviteTeamMemberPayload } from '../types';
import { useDispatch, useSelector } from 'react-redux';
import { inviteTeamMemberAction, clearInviteResponseAction } from '../actions';
import { selectIsInviting, selectTeamMembersSummary, selectInviteResponse, selectTeamMembersError } from '../selectors';
import { selectCurrentUser } from '../../auth/selectors';
import { SubscriptionInfo } from './SubscriptionInfo';
import { getSubscriptionSummaryAction } from '../../settings/actions';
import { selectIsLoadingSubscriptionSummary, selectSubscriptionSummary } from '../../settings/selectors';
import { getAllLocationsSelector } from '../../locations/selectors';
import { listLocationsAction } from '../../locations/actions';
import { computeSeatContext } from '../../../shared/utils/billing';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface InviteTeamMemberSliderProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialFormData: InviteTeamMemberPayload = {
  email: '',
  locationIds: [],
};

const InviteTeamMemberSlider: React.FC<InviteTeamMemberSliderProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation('teamMembers');
  const dispatch = useDispatch();
  const { register, handleSubmit, setValue, reset, getValues, formState: { errors }, watch, trigger } = useForm<InviteTeamMemberPayload>({
    defaultValues: initialFormData
  });
  const currentUser = useSelector(selectCurrentUser);
  const teamMembersSummary = useSelector(selectTeamMembersSummary);
  const isInviting = useSelector(selectIsInviting);
  const inviteResponse = useSelector(selectInviteResponse);
  const inviteError = useSelector(selectTeamMembersError);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const justOpenedRef = React.useRef(false);
  const subscriptionSummary = useSelector(selectSubscriptionSummary);
  const loadingPricing = useSelector(selectIsLoadingSubscriptionSummary);
  const allLocations = useSelector(getAllLocationsSelector);
  const navigate = useNavigate();
  const seatCtx = computeSeatContext({ currentUser, subscriptionSummary, teamMembersSummary });
  const isInviteAllowed = !(seatCtx.isCancelled || !seatCtx.hasSubscription || !seatCtx.hasAvailableSeats);
  const locationIds = watch('locationIds');
  
  // When slider opens, reset submission state and fetch data
  useEffect(() => {
    if (isOpen) {
      justOpenedRef.current = true;
      // Clear the flag after a brief delay to allow effects to run
      setTimeout(() => {
        justOpenedRef.current = false;
      }, 0);
      // Fetch locations when slider opens
      dispatch(listLocationsAction.request());
    }
  }, [isOpen, dispatch]);

  // Reset form when slider closes
  useEffect(() => {
    if (!isOpen) {
      reset(initialFormData);
      dispatch(clearInviteResponseAction());
    }
  }, [isOpen, reset, dispatch]);

  // Initialize all locations as selected by default when locations are loaded
  useEffect(() => {
    if (isOpen && allLocations.length > 0) {
      const currentIds = getValues('locationIds');
      if (currentIds.length === 0) {
        const allLocationIds = allLocations.map(loc => loc.id);
        setValue('locationIds', allLocationIds, { shouldValidate: true });
      }
    }
  }, [isOpen, allLocations, getValues, setValue]);

  // Register email with validation
  useEffect(() => {
    register('email', {
      validate: (value) => {
        // Only validate if invite is allowed or in trial
        if (isInviteAllowed || seatCtx.isTrial) {
          if (!value || value.trim().length === 0) {
            return t('inviteSlider.validation.emailRequired');
          }
          // Email pattern validation
          const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
          if (!emailPattern.test(value)) {
            return t('inviteSlider.validation.invalidEmail');
          }
        }
        return true;
      }
    });
  }, [register, isInviteAllowed, seatCtx.isTrial, t]);

  // Register locationIds with validation
  useEffect(() => {
    register('locationIds', {
      validate: (value) => {
        if (!value || value.length === 0) {
          return t('inviteSlider.validation.locationRequired');
        }
        return true;
      }
    });
  }, [register, t]);

  // Fetch pricing summary when slider opens
  useEffect(() => {
    dispatch(getSubscriptionSummaryAction.request());
  }, []);

  // Handle invite success/error
  useEffect(() => {
    // Don't process if slider just opened (prevents race condition)
    if (justOpenedRef.current) return;
    
    if (inviteResponse && !isInviting) {
      // Success: navigate and close slider
      navigate(`/team-members/invitation-success?email=${watch('email')}`);
      onClose();
      reset(initialFormData);
      dispatch(clearInviteResponseAction());
    }
    
    if (inviteError && !isInviting) {
      // Error: show toast but don't close slider
      toast.error(inviteError);
      dispatch(clearInviteResponseAction());
    }
  }, [inviteResponse, inviteError, isInviting, onClose, reset, dispatch, navigate, watch]);

  const onSubmit = async () => {
    // Prevent opening dialog if already submitting
    if (isInviting) {
      return;
    }

    const isValid = await trigger('locationIds');
    if (!isValid) {
      return;
    }

    if (seatCtx.isTrial) {
      setShowConfirmDialog(true);
      return;
    }

    if (!isInviteAllowed) {
      navigate('/settings?tab=billing');
      return;
    };

    setShowConfirmDialog(true);
  };

  const handleConfirmInvite = () => {
    // Guard against double-clicks on Confirm button
    if (isInviting) {
      return;
    }

    const email = watch('email');
    const locationIds = watch('locationIds');
    const data: InviteTeamMemberPayload = {
      email,
      locationIds,
    };
    dispatch(inviteTeamMemberAction.request(data));
    setShowConfirmDialog(false);
  };

  const handleCancel = () => {
    onClose();
    reset(initialFormData);
    dispatch(clearInviteResponseAction());
  };

  const getTextForButton = () => {
    const { hasAvailableSeats, isCancelled, hasSubscription, isTrial } = computeSeatContext({
      currentUser,
      subscriptionSummary,
      teamMembersSummary,
    });
  
    if (isTrial) {
      return t('inviteSlider.buttons.sendInvitation');
    }

    if (isCancelled || !hasSubscription || !hasAvailableSeats) {
      return t('inviteSlider.buttons.goToBilling');
    }

    return t('inviteSlider.buttons.sendInvitation');
  }

  const getDisableEmailStatus = () => {
    const { hasAvailableSeats, isCancelled, hasSubscription, isTrial } = computeSeatContext({
      currentUser,
      subscriptionSummary,
      teamMembersSummary,
    });
  
    if (isTrial) {
      return false;
    }

    if (isCancelled || !hasSubscription || !hasAvailableSeats) {
      return true;
    }

    return false;
  }

  return (
    <>
      <BaseSlider
        isOpen={isOpen}
        onClose={onClose}
        title={t('inviteSlider.title')}
        footer={
          <FormFooter
            onCancel={handleCancel}
            formId="invite-team-member-form"
            cancelLabel={t('inviteSlider.buttons.cancel')}
            submitLabel={getTextForButton()}
            disabled={isInviting}
            isLoading={isInviting}
          />
        }
      >
        <form 
          id="invite-team-member-form" 
          onSubmit={handleSubmit(onSubmit)} 
          className="h-full flex flex-col cursor-default"
        >
          <div className="flex-1 overflow-y-auto p-1 py-6 pt-0 md:p-6 md:pt-0 bg-surface">
            <div className="max-w-2xl mx-auto space-y-8 cursor-default">
              
              {/* Subscription & Pricing Information */}
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground-1">
                    {t('inviteSlider.subscriptionInfo.title')}
                  </h3>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                    {t('inviteSlider.subscriptionInfo.description')}
                  </p>
                </div>

                {loadingPricing ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <SubscriptionInfo
                      currentUser={currentUser}
                      subscriptionSummary={subscriptionSummary}
                      onClose={onClose}
                    />
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-end gap-2 mb-6 pt-4">
                <div className="flex-1 h-px bg-border dark:bg-border-strong"></div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground-1">
                    {t('inviteSlider.contactInfo.title')}
                  </h3>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                    {t('inviteSlider.contactInfo.description')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-medium">
                    {t('inviteSlider.contactInfo.emailLabel')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('inviteSlider.contactInfo.emailPlaceholder')}
                      value={watch('email')}
                      onChange={(e) => {
                        setValue('email', e.target.value, { shouldValidate: true });
                      }}
                      className={`!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                        errors.email
                          ? 'border-destructive bg-error-bg focus-visible:ring-error'
                          : 'border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus'
                      }`}
                      autoComplete="email"
                      aria-invalid={!!errors.email}
                      disabled={getDisableEmailStatus()}
                    />
                    <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  </div>
                  <div className="h-5">
                    {errors.email && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>{errors.email.message as string}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-end gap-2 mb-6 pt-4">
                <div className="flex-1 h-px bg-border dark:bg-border-strong"></div>
              </div>

              {/* Location Assignment Section */}
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground-1">
                    {t('inviteSlider.locationAssignment.title')}
                  </h3>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                    {t('inviteSlider.locationAssignment.description')}
                  </p>
                </div>

                <div className="space-y-5">
                  {allLocations.length === 0 ? (
                    <p className="text-sm text-foreground-3 dark:text-foreground-2">
                      {t('inviteSlider.locationAssignment.noLocations')}
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {allLocations.map((location) => {
                        const isSelected = locationIds.includes(location.id);
                        const isLastSelected = isSelected && locationIds.length === 1;

                        return (
                          <Pill
                            key={location.id}
                            selected={isSelected}
                            icon={MapPin}
                            className="w-auto justify-start items-start transition-none active:scale-100"
                            showCheckmark={true}
                            disabled={isLastSelected}
                            onClick={() => {
                              // Prevent deselecting if only one location is selected
                              if (isLastSelected) {
                                return;
                              }

                              const newIds = isSelected
                                ? locationIds.filter((id) => id !== location.id)
                                : [...locationIds, location.id];
                              setValue('locationIds', newIds, { shouldDirty: true, shouldValidate: true });
                              trigger('locationIds');
                            }}
                          >
                            <div className="flex flex-col text-left">
                              <div className="flex items-center">
                                {location.name}
                              </div>
                              {location.address && (
                                <div className="text-xs text-foreground-3 dark:text-foreground-2 mt-0.5">
                                  {location.address}
                                </div>
                              )}
                            </div>
                          </Pill>
                        );
                      })}
                    </div>
                  )}
                  {allLocations.length > 0 && (
                    <p className="text-xs text-foreground-3 dark:text-foreground-2">
                      {locationIds.length === 0
                        ? t('inviteSlider.locationAssignment.noLocationsSelected')
                        : locationIds.length === 1
                        ? t('inviteSlider.locationAssignment.oneLocationSelected')
                        : t('inviteSlider.locationAssignment.locationsSelected', { count: locationIds.length })}
                    </p>
                  )}
                  {errors.locationIds && (
                    <p className="text-sm text-destructive flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>{errors.locationIds.message as string}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      </BaseSlider>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('inviteSlider.confirmDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('inviteSlider.confirmDialog.description', { email: watch('email') })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('inviteSlider.buttons.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmInvite}>
              {t('inviteSlider.buttons.sendInvitation')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default InviteTeamMemberSlider; 