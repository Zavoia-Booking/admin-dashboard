import React, { useState, useEffect } from 'react';
import { Mail, UserPlus, MapPin, Loader2, CreditCard } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { useForm } from 'react-hook-form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../shared/components/ui/alert-dialog';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import type { InviteTeamMemberPayload } from '../types';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentLocationSelector } from '../../locations/selectors';
import { inviteTeamMemberAction, clearInviteResponseAction } from '../actions';
import { selectIsInviting, selectTeamMembersSummary, selectInviteResponse, selectTeamMembersError } from '../selectors';
import { selectCurrentUser } from '../../auth/selectors';
import { SubscriptionInfo } from './SubscriptionInfo';
import { getSubscriptionSummaryAction } from '../../settings/actions';
import { selectIsLoadingSubscriptionSummary, selectSubscriptionSummary } from '../../settings/selectors';
import { computeSeatContext } from '../../../shared/utils/billing';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface InviteTeamMemberSliderProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialFormData: InviteTeamMemberPayload = {
  email: '',
};

const InviteTeamMemberSlider: React.FC<InviteTeamMemberSliderProps> = ({
  isOpen,
  onClose,
}) => {
  const dispatch = useDispatch();
  const { register, handleSubmit, setValue, reset, formState: { errors }, watch } = useForm<InviteTeamMemberPayload>({
    defaultValues: initialFormData
  });
  const currentLocation = useSelector(getCurrentLocationSelector);
  const currentUser = useSelector(selectCurrentUser);
  const teamMembersSummary = useSelector(selectTeamMembersSummary);
  const isInviting = useSelector(selectIsInviting);
  const inviteResponse = useSelector(selectInviteResponse);
  const inviteError = useSelector(selectTeamMembersError);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const subscriptionSummary = useSelector(selectSubscriptionSummary);
  const loadingPricing = useSelector(selectIsLoadingSubscriptionSummary);
  const navigate = useNavigate();
  const seatCtx = computeSeatContext({ currentUser, subscriptionSummary, teamMembersSummary });
  const isInviteAllowed = !(seatCtx.isCancelled || !seatCtx.hasSubscription || !seatCtx.hasAvailableSeats);
  
  // Prefill/lock location based on current location, and reset form when slider closes
  useEffect(() => {
    if (!isOpen) {
      reset(initialFormData);
      dispatch(clearInviteResponseAction());
      return;
    }
    // no per-form locations when All locations
  }, [isOpen, reset, setValue, currentLocation?.id, dispatch]);

  // Fetch pricing summary when slider opens
  useEffect(() => {
    dispatch(getSubscriptionSummaryAction.request());
  }, []);

  // Handle invite success/error
  useEffect(() => {
    if (inviteResponse && !isInviting) {
      // Success: show toast and close slider
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
  }, [inviteResponse, inviteError, isInviting, onClose, reset, dispatch]);

  const onSubmit = () => {
    if (seatCtx.isTrial) {
      setShowConfirmDialog(true);

      return;
    }

    if (!isInviteAllowed) {
      navigate('/settings?open=billing');
      return;
    };

    setShowConfirmDialog(true);
  };

  const handleConfirmInvite = () => {
    const email = watch('email');
    const data: InviteTeamMemberPayload = {
      email,
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
      return 'Send Invitation';
    }

    if (isCancelled || !hasSubscription || !hasAvailableSeats) {
      return 'Go to Billing';
    }

    return 'Send Invitation';
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
        title="Invite Team Member"
        contentClassName="bg-muted/50 scrollbar-hide"
        footer={
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
              disabled={isInviting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="invite-team-member-form"
              className="flex-1 gap-2"
              disabled={isInviting}
            >
              {isInviting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  {getTextForButton()}
                </>
              )}
            </Button>
          </div>
        }
      >
        <form id="invite-team-member-form" onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto">
          <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm transition-all duration-300">
            <CardContent className="space-y-8">
              {/* Subscription & Pricing Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/20">
                    <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Subscription Info</h3>
                </div>
                {loadingPricing ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <SubscriptionInfo
                      currentUser={currentUser}
                      teamMembersSummary={teamMembersSummary}
                      subscriptionSummary={subscriptionSummary}
                      onClose={onClose}
                    />
                  </div>
                )}
              </div>

              {/* Contact Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Contact Information</h3>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address..."
                    aria-invalid={!!errors.email}
                    className="h-12 text-base border-border/50 bg-background/50 backdrop-blur-sm"
                    disabled={getDisableEmailStatus()}
                    {...register('email', { required: isInviteAllowed || seatCtx.isTrial })}
                  />
                </div>
              </div>

              {/* Location Assignment Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-green-100 dark:bg-green-900/20">
                    <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Location Assignment</h3>
                </div>
                {currentLocation ? (
                  <div className="text-sm text-muted-foreground">
                    Inviting to current location: <span className="font-medium text-foreground">{currentLocation.name}</span>. Switch location in the header to invite to a different location.
                  </div>
                ) : (
                  <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-md">
                    This invitation will be sent for all business locations. Switch to a specific location in the header to target only that location.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </form>
      </BaseSlider>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to send an invitation to {watch('email')} ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmInvite}>
              Send Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default InviteTeamMemberSlider; 