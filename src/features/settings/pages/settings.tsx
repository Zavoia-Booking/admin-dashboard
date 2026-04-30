import React, { useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import BusinessProfile from '../components/BusinessProfile';
import { Button } from '../../../shared/components/ui/button';
import {
  User,
  CreditCard,
  Save,
  Loader2,
} from 'lucide-react';
import BillingAndSubscription from '../components/BillingAndSubscription';
import BillingAndSubscriptionV2 from '../components/BillingAndSubscriptionV2';
import { ResponsiveTabs, type ResponsiveTabItem } from '../../../shared/components/ui/responsive-tabs';
import { LimitedAccessBanner } from '../../../shared/components/common/subscription/LimitedAccessBanner';
import { getBusinessUpdatingSelector } from '../../business/selectors';
import { usePlatform } from '../../../shared/hooks/usePlatform';
import { selectCurrentUser } from '../../auth/selectors';

type SettingsTab = 'profile' | 'billing';

const SettingsPage = () => {
  const { t } = useTranslation('settings');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isUpdating = useSelector(getBusinessUpdatingSelector) as boolean;
  const currentUser = useSelector(selectCurrentUser);
  const [isProfileDirty, setIsProfileDirty] = React.useState(false);
  const { isNative } = usePlatform();

  // Owners that haven't finished the setup wizard have no businessId yet, so
  // every billing API call would 404. Hide the tab entirely until they're done.
  const isOwnerWithoutBusiness =
    currentUser?.role === 'owner' && !currentUser?.wizardCompleted;
  const canAccessBilling = !isNative && !isOwnerWithoutBusiness;

  // Get initial tab from URL or default to 'profile'
  const getInitialTab = (): SettingsTab => {
    const tab = searchParams.get('tab') as SettingsTab | null;
    if (tab && (tab === 'profile' || (tab === 'billing' && canAccessBilling))) {
      return tab;
    }
    return 'profile';
  };

  const [activeTab, setActiveTab] = React.useState<SettingsTab>(getInitialTab());

  // Sync with URL changes
  useEffect(() => {
    const tab = searchParams.get('tab') as SettingsTab | null;
    if (tab && (tab === 'profile' || (tab === 'billing' && canAccessBilling))) {
      setActiveTab(tab);
    }
  }, [searchParams, canAccessBilling]);

  // If billing access is revoked while the tab is open (e.g. wizard reset),
  // bounce back to profile.
  useEffect(() => {
    if (activeTab === 'billing' && !canAccessBilling) {
      setActiveTab('profile');
      navigate('/account?tab=profile', { replace: true });
    }
  }, [activeTab, canAccessBilling, navigate]);

  const handleTabChange = (tabId: string) => {
    const tab = tabId as SettingsTab;
    setActiveTab(tab);
    // Use replace so tab switches don't pollute browser history
    navigate(`/account?tab=${tab}`, { replace: true });
  };

  // Render tab content only when active (lazy loading)
  const renderTabContent = (tabId: SettingsTab) => {
    if (activeTab !== tabId) return null;

    const inner = (() => {
      switch (tabId) {
        case 'profile':
          return <BusinessProfile onDirtyChange={setIsProfileDirty} />;
        case 'billing':
          // Quick rollback during dev: localStorage.setItem('billing_v2', '0')
          return typeof window !== 'undefined' && window.localStorage.getItem('billing_v2') === '0'
            ? <BillingAndSubscription />
            : <BillingAndSubscriptionV2 />;
        default:
          return null;
      }
    })();

    return (
      <>
        <LimitedAccessBanner className="!px-0 !pt-0" />
        {inner}
      </>
    );
  };

  const tabItems: ResponsiveTabItem[] = useMemo(() => {
    const items: ResponsiveTabItem[] = [
      {
        id: 'profile',
        label: t('tabs.profile'),
        mobileLabel: t('tabs.profileMobile'),
        icon: User,
        content: renderTabContent('profile'),
      },
    ];
    if (canAccessBilling) {
      items.push({
        id: 'billing',
        label: t('tabs.billing'),
        mobileLabel: t('tabs.billingMobile'),
        icon: CreditCard,
        content: renderTabContent('billing'),
      });
    }
    return items;
  }, [activeTab, t, canAccessBilling]);

  const handleSaveProfile = () => {
    (document.getElementById('business-info-form') as HTMLFormElement | null)?.requestSubmit();
  };

  const showSaveButton = activeTab === 'profile';

  const SaveButton = (
    <Button
      type="button"
      onClick={handleSaveProfile}
      className="group btn-primary !min-h-0 rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-all duration-300 font-bold flex items-center gap-2 !h-10 md:!h-11 !px-4 md:!px-6 md:-mt-4 text-xs md:text-sm !w-auto !min-w-34 md:!w-52 md:sm:w-auto"
      disabled={!isProfileDirty || isUpdating}
    >
      {isUpdating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          <span>
            {t('buttons.saving')}
            <span className="inline-block w-4 text-left animate-pulse" aria-hidden>
              ...
            </span>
          </span>
        </>
      ) : (
        <>
          <span>{t('buttons.saveChanges')}</span>
          <Save className="hidden md:inline h-4 w-4" />
        </>
      )}
    </Button>
  );

  if (isNative) {
    return (
      <AppLayout headerRightContent={SaveButton}>
        <BusinessProfile onDirtyChange={setIsProfileDirty} />
      </AppLayout>
    );
  }

  return (
    <AppLayout tabbedPage>
      <div className="cursor-default">
        <ResponsiveTabs
          items={tabItems}
          value={activeTab}
          onValueChange={handleTabChange}
          rightContent={showSaveButton ? SaveButton : undefined}
          stickyHeader={true}
        />
      </div>
    </AppLayout>
  );
};

export default SettingsPage; 