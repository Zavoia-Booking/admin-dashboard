import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { 
  MessageSquare, 
  Loader2, 
  ChevronDown, 
  History,
  Zap,
  Check
} from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { Info } from 'lucide-react';
import {
  createSmsCheckoutAction,
  getSmsPurchasesAction,
} from '../actions';
import { selectIsOnTrial } from '../../auth/selectors';
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
  const { t } = useTranslation('settings');
  const dispatch = useDispatch();
  
  // Redux state
  const smsBalance = useSelector(selectSmsBalance);
  const smsPackages = useSelector(selectSmsPackages);
  const smsPurchases = useSelector(selectSmsPurchases);
  const smsPurchasesHasMore = useSelector(selectSmsPurchasesHasMore);
  const smsPurchasesNextCursor = useSelector(selectSmsPurchasesNextCursor);
  
  const isTrial = useSelector(selectIsOnTrial);
  const balanceLoading = useSelector(selectIsSmsBalanceLoading);
  const packagesLoading = useSelector(selectIsSmsPackagesLoading);
  const checkoutLoading = useSelector(selectIsSmsCheckoutLoading);
  const purchasesLoading = useSelector(selectIsSmsPurchasesLoading);
  
  // Local state
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const hasInitializedSelection = useRef(false);

  // Get best value package
  const bestValueId = getBestValuePackageId(smsPackages);

  // Pre-select best value when packages load
  useEffect(() => {
    if (smsPackages.length > 0 && bestValueId != null && !hasInitializedSelection.current) {
      hasInitializedSelection.current = true;
      setSelectedPackageId(bestValueId);
    }
  }, [smsPackages, bestValueId]);

  // Fetch purchases when history is expanded
  useEffect(() => {
    if (showHistory && smsPurchases.length === 0) {
      dispatch(getSmsPurchasesAction.request({ limit: 10 }));
    }
  }, [showHistory, smsPurchases.length, dispatch]);
  
  const handleSelectPackage = (pkg: SmsPackage) => {
    setSelectedPackageId((prev) => (prev === pkg.id ? null : pkg.id));
  };

  const handleBuySelected = () => {
    if (!selectedPackageId || checkoutLoading) return;

    dispatch(createSmsCheckoutAction.request({
      packageId: selectedPackageId,
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
    <div id="sms-credits" className="space-y-6">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">{t('sms.loading')}</p>
        </div>
      ) : (
        <>
          {/* SMS Credits - Compact editorial style */}
          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden">
            {/* Header - minimal bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{t('sms.title')}</h3>
                  <p className="text-xs text-muted-foreground">{t('sms.subtitle')}</p>
                </div>
              </div>
              {smsBalance && (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold tabular-nums text-foreground">{smsBalance.smsCredits}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">{t('sms.available')}</span>
                  {smsBalance.smsTotalUsed > 0 && (
                    <span className="text-xs text-muted-foreground ml-2">
                      · {t('sms.used', { used: smsBalance.smsTotalUsed, total: smsBalance.smsTotalPurchased })}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Packages */}
            <div className="p-5">
              {isTrial ? (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20 p-4">
                  <Info className="h-5 w-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-200">{t('sms.trialRestriction')}</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400/80 mt-1">{t('sms.trialRestrictionDescription')}</p>
                  </div>
                </div>
              ) : smsPackages.length > 0 ? (
                <>
                  <div className="divide-y divide-border/40">
                    {smsPackages.map((pkg) => {
                      const isBestValue = pkg.id === bestValueId && smsPackages.length > 1;
                      const pricePerSms = pkg.priceMinor / pkg.smsCount;
                      const isSelected = selectedPackageId === pkg.id;

                      return (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => handleSelectPackage(pkg)}
                          disabled={checkoutLoading}
                          className={`
                            w-full flex items-center justify-between gap-4 px-4 py-3.5 rounded-lg
                            text-left transition-all duration-150
                            ${isSelected
                              ? 'bg-primary/10 border-l-4 border-l-primary -ml-[1px] pl-[15px]'
                              : 'bg-muted/30 border-l-4 border-l-transparent hover:bg-muted/60 hover:border-l-primary/40'
                            }
                            ${checkoutLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2
                          `}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                              {isSelected && <Check className="h-4 w-4 text-primary" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">{pkg.smsCount} SMS</span>
                                {isBestValue && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-0">
                                    {t('sms.bestValue')}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {t('sms.perSms', { price: formatPrice(Math.round(pricePerSms), pkg.currency) })}
                              </p>
                            </div>
                          </div>
                          <span className={`font-semibold tabular-nums shrink-0 ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                            {formatPrice(pkg.priceMinor, pkg.currency)}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {selectedPackageId && (
                    <div className="mt-4 pt-4 border-t border-border/60 flex justify-center">
                      <Button
                        onClick={handleBuySelected}
                        disabled={checkoutLoading}
                        rounded="full"
                        size="sm"
                        className="w-44 bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {checkoutLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t('sms.processing')}
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            {t('sms.buyCredits', { count: smsPackages.find((p) => p.id === selectedPackageId)?.smsCount ?? 0 })}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">{t('sms.noPackages')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('sms.checkBackSoon')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Purchase History */}
          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <History className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{t('sms.purchaseHistory')}</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showHistory ? 'rotate-180' : ''}`} />
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
                              {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
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
                            rounded="full"
                            onClick={handleLoadMorePurchases}
                            disabled={purchasesLoading}
                            className="w-full text-muted-foreground hover:text-foreground"
                          >
                            {purchasesLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {t('billing.loadingShort')}
                              </>
                            ) : (
                              t('sms.loadMore')
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 px-4">
                      <p className="text-sm text-muted-foreground">{t('sms.noPurchases')}</p>
                    </div>
                  )}
                </div>
              )}
          </div>
        </>
      )}
    </div>
  );
};

export default SmsCredits;
