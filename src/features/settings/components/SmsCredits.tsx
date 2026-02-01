import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  MessageSquare, 
  Loader2, 
  ChevronDown, 
  History,
  Zap,
  TrendingUp,
  Check
} from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import {
  createSmsCheckoutAction,
  getSmsPurchasesAction,
} from '../actions';
import {
  selectSmsBalance,
  selectSmsPackages,
  selectSmsPurchases,
  selectSmsPurchasesHasMore,
  selectSmsPurchasesNextCursor,
  selectIsSmsBalanceLoading,
  selectIsSmsPackagesLoading,
  selectIsSmsCheckoutLoading,
  selectIsSmsPurchasesLoading,
} from '../selectors';
import type { SmsPackage } from '../types';

// Helper function to format price from minor units (cents) to display
const formatPrice = (minorUnits: number, currency: string): string => {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(minorUnits / 100);
};

// Helper to format date
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Get best value package (most SMS per euro)
const getBestValuePackageId = (packages: SmsPackage[]): number | null => {
  if (packages.length === 0) return null;
  
  let bestValue = packages[0];
  let bestRatio = bestValue.smsCount / bestValue.priceMinor;
  
  packages.forEach(pkg => {
    const ratio = pkg.smsCount / pkg.priceMinor;
    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestValue = pkg;
    }
  });
  
  return bestValue.id;
};

const SmsCredits = () => {
  const dispatch = useDispatch();
  
  // Redux state
  const smsBalance = useSelector(selectSmsBalance);
  const smsPackages = useSelector(selectSmsPackages);
  const smsPurchases = useSelector(selectSmsPurchases);
  const smsPurchasesHasMore = useSelector(selectSmsPurchasesHasMore);
  const smsPurchasesNextCursor = useSelector(selectSmsPurchasesNextCursor);
  
  const balanceLoading = useSelector(selectIsSmsBalanceLoading);
  const packagesLoading = useSelector(selectIsSmsPackagesLoading);
  const checkoutLoading = useSelector(selectIsSmsCheckoutLoading);
  const purchasesLoading = useSelector(selectIsSmsPurchasesLoading);
  
  // Local state
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  
  // Get best value package
  const bestValueId = getBestValuePackageId(smsPackages);
  
  // Fetch purchases when history is expanded
  useEffect(() => {
    if (showHistory && smsPurchases.length === 0) {
      dispatch(getSmsPurchasesAction.request({ limit: 10 }));
    }
  }, [showHistory, smsPurchases.length, dispatch]);
  
  const handleBuyPackage = (pkg: SmsPackage) => {
    if (checkoutLoading) return;
    
    setSelectedPackageId(pkg.id);
    
    dispatch(createSmsCheckoutAction.request({
      packageId: pkg.id,
      successUrl: `${window.location.origin}/info?type=sms-purchase-success`,
      cancelUrl: `${window.location.origin}/settings?tab=billing`,
    }));
  };
  
  const handleLoadMorePurchases = () => {
    if (smsPurchasesNextCursor && !purchasesLoading) {
      dispatch(getSmsPurchasesAction.request({ 
        limit: 10, 
        cursor: smsPurchasesNextCursor 
      }));
    }
  };
  
  const isLoading = balanceLoading || packagesLoading;
  
  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading SMS information...</p>
        </div>
      ) : (
        <>
          {/* Combined SMS Section */}
          <Card className="border border-border bg-card shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {/* Header with Balance */}
              <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-5 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/15 ring-1 ring-primary/20">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground-1">SMS Credits</h3>
                      <p className="text-xs text-muted-foreground">Send appointment reminders & notifications</p>
                    </div>
                  </div>
                  
                  {smsBalance && (
                    <div className="text-right">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-bold text-primary">{smsBalance.smsCredits}</span>
                        <span className="text-sm text-muted-foreground">credits</span>
                      </div>
                      {smsBalance.smsTotalUsed > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {smsBalance.smsTotalUsed} used of {smsBalance.smsTotalPurchased}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Packages Grid */}
              <div className="p-5">
                {smsPackages.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="h-4 w-4 text-warning" />
                      <span className="text-sm font-medium text-foreground-1">Top up your credits</span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {smsPackages.map((pkg) => {
                        const isBestValue = pkg.id === bestValueId && smsPackages.length > 1;
                        const pricePerSms = pkg.priceMinor / pkg.smsCount;
                        const isSelected = checkoutLoading && selectedPackageId === pkg.id;
                        
                        return (
                          <button
                            key={pkg.id}
                            onClick={() => handleBuyPackage(pkg)}
                            disabled={checkoutLoading}
                            className={`
                              relative group text-left rounded-xl p-4 transition-all duration-200
                              border-2 hover:shadow-md
                              ${isBestValue 
                                ? 'border-primary bg-primary/5 hover:bg-primary/10' 
                                : 'border-border hover:border-primary/40 bg-surface hover:bg-muted/50'
                              }
                              ${checkoutLoading && !isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                              disabled:cursor-not-allowed
                            `}
                          >
                            {/* Best Value Badge */}
                            {isBestValue && (
                              <div className="absolute -top-2.5 left-3">
                                <Badge className="bg-primary text-white text-[10px] px-2 py-0.5 font-medium shadow-sm">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  Best Value
                                </Badge>
                              </div>
                            )}
                            
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-baseline gap-1">
                                  <span className="text-2xl font-bold text-foreground">{pkg.smsCount}</span>
                                  <span className="text-sm text-muted-foreground">SMS</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {formatPrice(Math.round(pricePerSms), pkg.currency)}/SMS
                                </p>
                              </div>
                              
                              <div className="text-right">
                                <p className={`text-xl font-bold ${isBestValue ? 'text-primary' : 'text-foreground'}`}>
                                  {formatPrice(pkg.priceMinor, pkg.currency)}
                                </p>
                              </div>
                            </div>
                            
                            {/* Buy indicator */}
                            <div className={`
                              mt-3 py-2 rounded-lg text-center text-sm font-medium transition-colors
                              ${isSelected 
                                ? 'bg-primary text-white' 
                                : isBestValue
                                ? 'bg-primary/15 text-primary group-hover:bg-primary group-hover:text-white'
                                : 'bg-muted text-foreground-2 group-hover:bg-primary group-hover:text-white'
                              }
                            `}>
                              {isSelected ? (
                                <span className="flex items-center justify-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Processing...
                                </span>
                              ) : (
                                <span className="flex items-center justify-center gap-1.5">
                                  Buy Now
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                      <MessageSquare className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-foreground-1 font-medium">No packages available</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Check back soon for available SMS packages
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Purchase History Section */}
          <Card className="border border-border bg-card shadow-sm">
            <CardContent className="p-0">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors rounded-t-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <History className="h-4 w-4 text-foreground-2" />
                  </div>
                  <span className="text-sm font-medium text-foreground-1">Purchase History</span>
                </div>
                <div className={`transition-transform duration-200 ${showHistory ? 'rotate-180' : ''}`}>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
              
              {showHistory && (
                <div className="border-t border-border">
                  {purchasesLoading && smsPurchases.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : smsPurchases.length > 0 ? (
                    <div className="divide-y divide-border">
                      {smsPurchases.map((purchase) => (
                        <div 
                          key={purchase.id} 
                          className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`
                              w-8 h-8 rounded-full flex items-center justify-center
                              ${purchase.status === 'completed' ? 'bg-success/10' : 'bg-muted'}
                            `}>
                              {purchase.status === 'completed' ? (
                                <Check className="h-4 w-4 text-success" />
                              ) : (
                                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                +{purchase.smsQuantity} SMS
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(purchase.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-foreground">
                              {formatPrice(purchase.totalAmountMinor, purchase.currency)}
                            </p>
                            <Badge 
                              variant="outline"
                              className={`
                                text-[10px] px-1.5 py-0
                                ${purchase.status === 'completed' 
                                  ? 'text-success border-success/30'
                                  : purchase.status === 'pending'
                                  ? 'text-warning border-warning/30'
                                  : 'text-error border-error/30'
                                }
                              `}
                            >
                              {purchase.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      
                      {/* Load More Button */}
                      {smsPurchasesHasMore && (
                        <div className="p-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLoadMorePurchases}
                            disabled={purchasesLoading}
                            className="w-full text-muted-foreground hover:text-foreground"
                          >
                            {purchasesLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              'Load more'
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 px-4">
                      <p className="text-sm text-muted-foreground">No purchases yet</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default SmsCredits;
