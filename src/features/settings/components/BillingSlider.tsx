import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CreditCard, Crown, ExternalLink, Loader2, Users, Calendar, CheckCircle, TrendingUp } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { Progress } from '../../../shared/components/ui/progress';
import { Separator } from '../../../shared/components/ui/separator';
import { toast } from 'sonner';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import { selectCurrentUser } from '../../auth/selectors';
import { getPricingSummary, getCustomerPortalUrl } from '../api';
import type { PricingSummary } from '../types';

interface BillingSliderProps {
  isOpen: boolean;
  onClose: () => void;
}

const BillingSlider: React.FC<BillingSliderProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const [pricingSummary, setPricingSummary] = useState<PricingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPricingSummary();
    }
  }, [isOpen]);

  const loadPricingSummary = async () => {
    try {
      setLoading(true);
      const data = await getPricingSummary();
      setPricingSummary(data);
    } catch (error) {
      console.error('Failed to fetch pricing summary:', error);
      toast.error('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setPortalLoading(true);
      const returnUrl = window.location.origin + '/settings';
      const { url } = await getCustomerPortalUrl(returnUrl);
      window.location.href = url;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to open customer portal');
      setPortalLoading(false);
    }
  };

  const handleAddSeats = () => {
    navigate('/upgrade');
    onClose();
  };

  const getStatusBadge = () => {
    const status = currentUser?.subscription?.status;
    
    if (currentUser?.entitlements?.status === 'trial') {
      return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>;
    }
    
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'canceled':
        return <Badge className="bg-red-100 text-red-800">Canceled</Badge>;
      case 'past_due':
        return <Badge className="bg-amber-100 text-amber-800">Past Due</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateSeatUsage = () => {
    const paidSeats = currentUser?.entitlements?.paidTeamSeats || 0;
    const usedSeats = pricingSummary?.currentTeamMembersCount || 0;
    const percentage = paidSeats > 0 ? (usedSeats / paidSeats) * 100 : 0;
    return { paidSeats, usedSeats, percentage };
  };

  const seatUsage = calculateSeatUsage();

  return (
    <BaseSlider
      isOpen={isOpen}
      onClose={onClose}
      title="Billing & Subscription"
      contentClassName="bg-muted/50 scrollbar-hide"
      footer={
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
          >
            Close
          </Button>
        </div>
      }
    >
      <div className="max-w-md mx-auto space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Loading billing information...</p>
          </div>
        ) : (
          <>
            {/* Current Subscription Card */}
            <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm">
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/20">
                    <Crown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Current Subscription</h3>
                </div>

                <div className="space-y-4">
                  {/* Plan Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-lg">
                        {pricingSummary?.planName || 'Free Plan'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {pricingSummary?.planTier || 'free'}
                      </p>
                    </div>
                    {getStatusBadge()}
                  </div>

                  {/* Trial Info */}
                  {currentUser?.entitlements?.status === 'trial' && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Trial Active
                        </span>
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        {currentUser.entitlements.daysRemaining} days remaining
                      </p>
                      {currentUser.subscription?.trialEndsAt && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Ends {formatDate(currentUser.subscription.trialEndsAt)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Pricing Breakdown */}
                  {pricingSummary && (
                    <div className="space-y-2 bg-muted/50 rounded-lg p-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Base Plan</span>
                        <span className="font-medium">
                          ${pricingSummary.basePlanPrice.toFixed(2)}/month
                        </span>
                      </div>
                      
                      {pricingSummary.currentTeamMembersCount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Team Members ({pricingSummary.currentTeamMembersCount} × ${pricingSummary.pricePerTeamMember.toFixed(2)})
                          </span>
                          <span className="font-medium">
                            ${pricingSummary.totalTeamMembersCost.toFixed(2)}/month
                          </span>
                        </div>
                      )}

                      <Separator className="my-2" />

                      <div className="flex justify-between">
                        <span className="font-semibold">Total</span>
                        <span className="text-xl font-bold text-primary">
                          ${pricingSummary.totalMonthlyCost.toFixed(2)}/month
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Next Billing Date */}
                  {currentUser?.subscription?.currentPeriodEnd && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Next billing date</span>
                      <span className="font-medium">
                        {formatDate(currentUser.subscription.currentPeriodEnd)}
                      </span>
                    </div>
                  )}

                  {/* Manage Button */}
                  <Button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className="w-full"
                  >
                    {portalLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Manage Subscription
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Team Seats Usage */}
            <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm">
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Team Member Seats</h3>
                </div>

                <div className="space-y-4">
                  {/* Usage Stats */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Seats in use</span>
                      <span className="font-semibold">
                        {seatUsage.usedSeats} of {seatUsage.paidSeats}
                      </span>
                    </div>
                    <Progress value={seatUsage.percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {seatUsage.paidSeats - seatUsage.usedSeats} seat{seatUsage.paidSeats - seatUsage.usedSeats !== 1 ? 's' : ''} available
                    </p>
                  </div>

                  {/* Pricing Info */}
                  {pricingSummary && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Price per seat</span>
                        <span className="text-sm font-semibold">
                          ${pricingSummary.pricePerTeamMember.toFixed(2)}/month
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Add Seats Button */}
                  <Button
                    variant="outline"
                    onClick={handleAddSeats}
                    className="w-full"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Add More Seats
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Plan Features */}
            {currentUser?.entitlements && (
              <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm">
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                    <div className="p-2 rounded-xl bg-green-100 dark:bg-green-900/20">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Your Plan Includes</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Maximum Locations</span>
                      <span className="text-sm font-semibold">
                        {currentUser.entitlements.maxLocations === -1 
                          ? 'Unlimited' 
                          : currentUser.entitlements.maxLocations}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Maximum Team Members</span>
                      <span className="text-sm font-semibold">
                        {currentUser.entitlements.maxTeamMembers === -1 
                          ? 'Unlimited' 
                          : currentUser.entitlements.maxTeamMembers}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Paid Team Seats</span>
                      <span className="text-sm font-semibold">
                        Unlimited
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm">
              <CardContent className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
                
                <Button
                  variant="outline"
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="w-full justify-start"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Update Payment Method
                </Button>

                <Button
                  variant="outline"
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="w-full justify-start"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Invoices
                </Button>

                {currentUser?.subscription?.status === 'active' && (
                  <Button
                    variant="outline"
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className="w-full justify-start text-destructive hover:bg-destructive/10"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Cancel Subscription
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Upgrade CTA */}
            {currentUser?.entitlements?.status === 'trial' && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-base mb-2">Upgrade Before Trial Ends</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get {currentUser.entitlements.daysRemaining} days left to try all features. Upgrade now to continue without interruption.
                  </p>
                  <Button onClick={handleAddSeats} className="w-full">
                    Upgrade Now
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </BaseSlider>
  );
};

export default BillingSlider;
