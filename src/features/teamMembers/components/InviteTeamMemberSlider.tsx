import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, UserPlus, ChevronsUpDown, Check, MapPin, Loader2, Users, CreditCard } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { useForm } from 'react-hook-form';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../../shared/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../../../shared/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../shared/components/ui/alert-dialog';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import { cn } from '../../../shared/lib/utils';
import { UserRole } from '../../../shared/types/auth';
import type { InviteTeamMemberPayload } from '../types';
import { userRoles } from '../../../shared/constants';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentLocationSelector } from '../../locations/selectors';
import { inviteTeamMemberAction, listTeamMembersAction, clearInviteResponseAction } from '../actions';
import { selectInviteResponse, selectIsInviting, selectTeamMembersSummary } from '../selectors';
import { selectCurrentUser } from '../../auth/selectors';
import { getPricingSummary } from '../../settings/api';
import type { PricingSummary } from '../../settings/types';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';

interface InviteTeamMemberSliderProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialFormData: InviteTeamMemberPayload = {
  email: '',
  role: UserRole.TEAM_MEMBER,
};

const InviteTeamMemberSlider: React.FC<InviteTeamMemberSliderProps> = ({ 
  isOpen, 
  onClose, 
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, reset, formState: { errors }, watch } = useForm<InviteTeamMemberPayload>({
    defaultValues: initialFormData
  });
  // const locations = useSelector(getAllLocationsSelector);
  const currentLocation = useSelector(getCurrentLocationSelector);
  const currentUser = useSelector(selectCurrentUser);
  const teamMembersSummary = useSelector(selectTeamMembersSummary);
  const inviteResponse = useSelector(selectInviteResponse);
  const isInviting = useSelector(selectIsInviting);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [pricingSummary, setPricingSummary] = useState<PricingSummary | null>(null);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const processedResponseRef = useRef<string | null>(null);
  const invitedEmailRef = useRef<string | null>(null);
  const invitationCreatedRef = useRef<boolean>(false);
  
  // Popover states
  const [roleOpen, setRoleOpen] = useState(false);
  

  // Prefill/lock location based on current location, and reset form when slider closes
  useEffect(() => {
    if (!isOpen) {
      // If an invitation was created but user closed slider (e.g., cancelled payment), refresh the list
      if (invitationCreatedRef.current) {
        dispatch(listTeamMembersAction.request());
        invitationCreatedRef.current = false;
      }
      
      reset(initialFormData);
      setProcessingPayment(false);
      processedResponseRef.current = null;
      setPricingSummary(null);
      dispatch(clearInviteResponseAction());
      return;
    }
    // no per-form locations when All locations
  }, [isOpen, reset, setValue, currentLocation?.id, dispatch]);

  // Fetch pricing summary when slider opens
  useEffect(() => {
    if (isOpen && !pricingSummary && !loadingPricing) {
      setLoadingPricing(true);
      getPricingSummary()
        .then((data) => {
          setPricingSummary(data);
        })
        .catch((error) => {
          console.error('Failed to fetch pricing summary:', error);
        })
        .finally(() => {
          setLoadingPricing(false);
        });
    }
  }, [isOpen, pricingSummary, loadingPricing]);

  // Handle invite response - process payment if needed
  useEffect(() => {
    if (!inviteResponse || processingPayment) return;

    // Create a unique key for this response to prevent duplicate processing
    const responseKey = inviteResponse.clientSecret || inviteResponse.message;
    if (processedResponseRef.current === responseKey) return;
    
    processedResponseRef.current = responseKey;

    const handlePayment = async () => {
      // Mark that an invitation was created (team member record exists in DB)
      invitationCreatedRef.current = true;

      if (inviteResponse.requiresAction && inviteResponse.clientSecret) {
        // Payment authentication required
        setProcessingPayment(true);
        try {
          const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
          
          if (!publishableKey) {
            throw new Error('Stripe publishable key not configured');
          }

          const stripe = await loadStripe(publishableKey);
          if (!stripe) {
            throw new Error('Failed to load Stripe');
          }

          // Confirm the payment - this will open Stripe's payment UI if needed
          const { error } = await stripe.confirmCardPayment(inviteResponse.clientSecret);

          if (error) {
            // Payment cancelled or failed - refresh list to show pending_payment member
            toast.error(error.message || 'Payment failed');
            dispatch(listTeamMembersAction.request());
            dispatch(clearInviteResponseAction());
            setProcessingPayment(false);
            invitationCreatedRef.current = false; // Clear flag since we're handling it
            onClose();
            reset(initialFormData);
          } else {
            // Payment confirmed - redirect to success page
            dispatch(listTeamMembersAction.request());
            dispatch(clearInviteResponseAction());
            invitationCreatedRef.current = false; // Clear flag since we're handling it
            onClose();
            reset(initialFormData);
            setProcessingPayment(false);
            const email = invitedEmailRef.current || '';
            navigate(`/team-members/invitation-success?email=${encodeURIComponent(email)}&payment=true`);
          }
        } catch (err: any) {
          // Payment processing error - refresh list to show pending_payment member
          toast.error(err?.message || 'Payment processing failed');
          dispatch(listTeamMembersAction.request());
          dispatch(clearInviteResponseAction());
          setProcessingPayment(false);
          invitationCreatedRef.current = false; // Clear flag since we're handling it
          onClose();
          reset(initialFormData);
        }
      } else if (inviteResponse.paymentComplete === true) {
        // Payment completed - redirect to success page
        dispatch(clearInviteResponseAction());
        invitationCreatedRef.current = false; // Clear flag since we're handling it
        onClose();
        reset(initialFormData);
        const email = invitedEmailRef.current || '';
        navigate(`/team-members/invitation-success?email=${encodeURIComponent(email)}&payment=true`);
      } else if (inviteResponse.paymentComplete === false) {
        // Payment required but not complete yet - member created with pending_payment status
        // Don't clear invitationCreatedRef - we want to refresh on manual slider close
        toast.info(inviteResponse.message);
        setProcessingPayment(false);
      } else {
        // Simple success response without payment fields - redirect to success page (no payment required)
        dispatch(clearInviteResponseAction());
        invitationCreatedRef.current = false; // Clear flag since we're handling it
        onClose();
        reset(initialFormData);
        const email = invitedEmailRef.current || '';
        navigate(`/team-members/invitation-success?email=${encodeURIComponent(email)}&payment=false`);
      }
    };

    handlePayment();
  }, [inviteResponse]);

  const onSubmit = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmInvite = () => {
    const email = watch('email');
    const data: InviteTeamMemberPayload = {
      email,
      role: watch('role') as UserRole,
    };
    // Store email for success page redirect
    invitedEmailRef.current = email;
    dispatch(inviteTeamMemberAction.request(data));
    setShowConfirmDialog(false);
    // Don't close the slider - wait for response
  };

  const handleCancel = () => {
    onClose();
    reset(initialFormData);
  };

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
              disabled={isInviting || processingPayment}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              form="invite-team-member-form"
              className="flex-1 gap-2"
              disabled={isInviting || processingPayment}
            >
              {isInviting || processingPayment ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {processingPayment ? 'Processing Payment...' : 'Sending...'}
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Send Invitation
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
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">Price per Team Member</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {pricingSummary ? `$${pricingSummary.pricePerTeamMember.toFixed(2)}/${pricingSummary.currency === 'usd' ? 'month' : pricingSummary.currency}` : 'N/A'}
                      </span>
                    </div>
                    
                    {(() => {
                      const paidSeats = currentUser?.entitlements?.paidTeamSeats ?? pricingSummary?.currentTeamMembersCount ?? 0;
                      const usedSeats = (teamMembersSummary?.active ?? 0) + (teamMembersSummary?.pending ?? 0);
                      const availableSeats = paidSeats - usedSeats;
                      const hasAvailableSeats = availableSeats > 0;

                      return (
                        <>
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground">Paid Seats</span>
                            </div>
                            <span className="text-sm font-semibold text-foreground">
                              {paidSeats}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground">Used Seats</span>
                            </div>
                            <span className="text-sm font-semibold text-foreground">
                              {usedSeats} / {paidSeats}
                            </span>
                          </div>

                          {hasAvailableSeats ? (
                            <div className="text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3 rounded-lg">
                              ✓ You have {availableSeats} available seat{availableSeats !== 1 ? 's' : ''}. No additional charge for this invitation.
                            </div>
                          ) : (
                            <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
                              ⚠  Adding a new team member will incur an additional charge of ${pricingSummary?.pricePerTeamMember.toFixed(2) ?? '0.00'}/month.
                            </div>
                          )}
                        </>
                      );
                    })()}
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
                    {...register('email', { required: true })}
                  />
                </div>
              </div>

              {/* Role Assignment Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Role Assignment</h3>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Role</Label>
                  <Popover open={roleOpen} onOpenChange={setRoleOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={roleOpen}
                        className="w-full h-12 text-base border-border/50 bg-background/50 backdrop-blur-sm justify-between"
                      >
                        {(() => {
                          const value = watch('role') as unknown as UserRole | undefined;
                          const selected = userRoles.find(r => r.value === value);
                          return selected ? selected.label : 'Select role...';
                        })()}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[350px] p-0 z-[80]">
                      <Command>
                        <CommandInput placeholder="Search roles..." />
                        <CommandList>
                          <CommandEmpty>No roles found.</CommandEmpty>
                          <CommandGroup>
                            {userRoles.map((role) => (
                              <CommandItem
                                key={role.value}
                                value={role.value}
                                onSelect={(currentValue) => {
                                  setValue('role', currentValue as UserRole, { shouldDirty: true, shouldTouch: true });
                                  setRoleOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    (watch('role') === role.value ? 'opacity-100' : 'opacity-0')
                                  )}
                                />
                                {role.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <input type="hidden" {...register('role')} name="role" value={undefined as any} />
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
              Are you sure you want to send an invitation to {watch('email')} as a {watch('role')}?
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