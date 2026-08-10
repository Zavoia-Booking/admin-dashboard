import React, { useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import { HeaderRightSlot } from '../../../shared/components/layouts/HeaderRightSlot';
import BusinessProfile from '../components/BusinessProfile';
import { Button } from '../../../shared/components/ui/button';
import {
  User,
  CreditCard,
  Loader2,
} from 'lucide-react';
import BillingAndSubscriptionV2 from '../components/BillingAndSubscriptionV2';
import { ResponsiveTabs, type ResponsiveTabItem } from '../../../shared/components/ui/responsive-tabs';
import { LimitedAccessBanner } from '../../../shared/components/common/subscription/LimitedAccessBanner';
import { getBusinessUpdatingSelector } from '../../business/selectors';
import { usePlatform } from '../../../shared/hooks/usePlatform';
import { useIsMobile } from '../../../shared/hooks/use-mobile';
import { selectCurrentUser } from '../../auth/selectors';

type SettingsTab = 'profile' | 'billing';

const SettingsPage = () => {
  const { t } = useTranslation('settings');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isUpdating = useSelector(getBusinessUpdatingSelector) as boolean;
  const currentUser = useSelector(selectCurrentUser);
  const [isProfileDirty, setIsProfileDirty] = React.useState(false);
  const [isPersonalSaving, setIsPersonalSaving] = React.useState(false);
  const { isNative } = usePlatform();
  const isMobile = useIsMobile();

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

  // Arriving from the marketplace "Add your name" nudge (/account?scrollTo=personal):
  // land on the profile tab, smooth-scroll to the personal-info card, flash a ring,
  // then clear the param so a refresh/back doesn't re-trigger it.
  useEffect(() => {
    if (searchParams.get('scrollTo') !== 'personal') return;
    if (activeTab !== 'profile') return;
    const ring = ['ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background', 'rounded-2xl'];
    let tries = 0;
    let ringTimer = 0;
    const tick = () => {
      const el = document.getElementById('account-personal-info');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add(...ring);
        ringTimer = window.setTimeout(() => el.classList.remove(...ring), 1800);
        navigate('/account?tab=profile', { replace: true });
        return;
      }
      if (tries++ < 20) window.setTimeout(tick, 100);
    };
    const startTimer = window.setTimeout(tick, 150);
    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(ringTimer);
    };
  }, [searchParams, activeTab, navigate]);

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
          return <BusinessProfile onDirtyChange={setIsProfileDirty} onSavingChange={setIsPersonalSaving} />;
        case 'billing':
          return <BillingAndSubscriptionV2 />;
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

  // Pre-wizard there is no business form on the page, so nothing to save.
  const showSaveButton = activeTab === 'profile' && !isOwnerWithoutBusiness;

  // Business updates report via redux; personal-info saves via onSavingChange.
  const isSaving = isUpdating || isPersonalSaving;

  const SaveButton = (
    <Button
      type="button"
      onClick={handleSaveProfile}
      className="group btn-primary !min-h-0 rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-all duration-300 font-bold flex items-center gap-2 !h-10 md:!h-11 !px-4 md:!px-6 md:-mt-4 text-xs md:text-sm !w-auto !min-w-34 md:!w-52 md:sm:w-auto"
      disabled={!isProfileDirty || isSaving}
    >
      {isSaving ? (
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
        <span>{t('buttons.saveChanges')}</span>
      )}
    </Button>
  );

  const HeaderSaveButton = (
    <Button
      type="button"
      onClick={handleSaveProfile}
      className="group btn-primary !h-8 px-3 rounded-full text-sm shadow-sm active:scale-95 flex items-center gap-1.5"
      disabled={!isProfileDirty || isSaving}
    >
      {isSaving ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
          <span>{t('buttons.saving')}</span>
        </>
      ) : (
        <span>{t('buttons.saveChanges')}</span>
      )}
    </Button>
  );

  if (isNative) {
    return (
      <AppLayout headerRightContent={isMobile && !isOwnerWithoutBusiness ? HeaderSaveButton : undefined}>
        <BusinessProfile onDirtyChange={setIsProfileDirty} onSavingChange={setIsPersonalSaving} />
      </AppLayout>
    );
  }

  return (
    <AppLayout tabbedPage>
      {isMobile && showSaveButton && (
        <HeaderRightSlot>{HeaderSaveButton}</HeaderRightSlot>
      )}
      <div className="cursor-default">
        <ResponsiveTabs
          items={tabItems}
          value={activeTab}
          onValueChange={handleTabChange}
          rightContent={!isMobile && showSaveButton ? SaveButton : undefined}
          stickyHeader={true}
        />
      </div>
    </AppLayout>
  );
};

export default SettingsPage; 