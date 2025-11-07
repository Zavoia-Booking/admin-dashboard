import React, { useState, useEffect } from 'react';
import { Mail, UserPlus, MapPin, Loader2, CreditCard, ChevronsUpDown } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { useForm } from 'react-hook-form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../shared/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../../../shared/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../../shared/components/ui/command';
import { cn } from '../../../shared/lib/utils';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
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
  const subscriptionSummary = useSelector(selectSubscriptionSummary);
  const loadingPricing = useSelector(selectIsLoadingSubscriptionSummary);
  const allLocations = useSelector(getAllLocationsSelector);
  const navigate = useNavigate();
  const seatCtx = computeSeatContext({ currentUser, subscriptionSummary, teamMembersSummary });
  const isInviteAllowed = !(seatCtx.isCancelled || !seatCtx.hasSubscription || !seatCtx.hasAvailableSeats);
  const [locationOpen, setLocationOpen] = useState(false);
  const locationIds = watch('locationIds');
  
  // Prefill/lock location based on current location, and reset form when slider closes
  useEffect(() => {
    if (!isOpen) {
      reset(initialFormData);
      dispatch(clearInviteResponseAction());
      setLocationOpen(false);
      return;
    }
    // Fetch locations when slider opens
    dispatch(listLocationsAction.request());
  }, [isOpen, reset, setValue, dispatch]);

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

  // Register locationIds with validation
  useEffect(() => {
    register('locationIds', {
      validate: (value) => {
        if (!value || value.length === 0) {
          return 'At least one location must be selected';
        }
        return true;
      }
    });
  }, [register]);

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

  const onSubmit = async () => {
    const isValid = await trigger('locationIds');
    if (!isValid) {
      return;
    }

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
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Select Locations</Label>
                  <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={locationOpen}
                        className={cn(
                          "border-0 bg-muted/50 hover:bg-muted/70 h-12 text-base justify-between w-full",
                          errors.locationIds && "border-destructive border"
                        )}
                      >
                        {locationIds.length > 0 
                          ? `${locationIds.length} location${locationIds.length > 1 ? 's' : ''} selected`
                          : "Select locations"
                        }
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[350px] p-0 z-[80]">
                      <Command>
                        <CommandInput placeholder="Search locations..." />
                        <CommandList>
                          <CommandEmpty>No locations found.</CommandEmpty>
                          <CommandGroup>
                            {allLocations.map((location) => {
                              const currentIds = watch('locationIds');
                              const isSelected = currentIds.includes(location.id);
                              const isLastSelected = isSelected && currentIds.length === 1;
                              
                              return (
                              <CommandItem
                                key={location.id}
                                value={location.name}
                                onSelect={() => {
                                  const ids = getValues('locationIds');
                                  const selected = ids.includes(location.id);
                                  
                                  // Prevent deselecting if only one location is selected
                                  if (selected && ids.length === 1) {
                                    return;
                                  }
                                  
                                  const newIds = selected
                                    ? ids.filter(id => id !== location.id)
                                    : [...ids, location.id];
                                  setValue('locationIds', newIds, { shouldDirty: true, shouldValidate: true });
                                  trigger('locationIds');
                                }}
                                className={cn(
                                  "flex items-center gap-3 p-3",
                                  isLastSelected && "cursor-not-allowed opacity-75"
                                )}
                              >
                                <div className="flex-1">
                                  <div className="font-medium">{location.name}</div>
                                  {location.address && (
                                    <div className="text-sm text-muted-foreground truncate">{location.address}</div>
                                  )}
                                </div>
                                <div
                                  className={cn(
                                    "ml-auto flex h-4 w-4 items-center justify-center rounded border-2 transition-colors",
                                    isSelected
                                      ? "border-primary bg-primary"
                                      : "border-input bg-background",
                                    isLastSelected && "cursor-not-allowed"
                                  )}
                                  title={isLastSelected ? "At least one location must be selected" : undefined}
                                >
                                  {locationIds.includes(location.id) && (
                                    <svg
                                      className="h-3 w-3 text-primary-foreground"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      strokeWidth={3}
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  )}
                                </div>
                              </CommandItem>
                            );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.locationIds && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.locationIds.message as string}
                    </p>
                  )}
                </div>
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