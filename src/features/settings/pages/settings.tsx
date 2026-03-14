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
  Settings,
  Save,
  Loader2,
} from 'lucide-react';
import BillingAndSubscription from '../components/BillingAndSubscription';
import AdvancedSettings from '../components/AdvancedSettings';
import { ResponsiveTabs, type ResponsiveTabItem } from '../../../shared/components/ui/responsive-tabs';
import { getBusinessUpdatingSelector } from '../../business/selectors';

type SettingsTab = 'profile' | 'billing' | 'advanced';

const SettingsPage = () => {
  const { t } = useTranslation('settings');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isUpdating = useSelector(getBusinessUpdatingSelector) as boolean;
  const [isProfileDirty, setIsProfileDirty] = React.useState(false);

  // Get initial tab from URL or default to 'profile'
  const getInitialTab = (): SettingsTab => {
    const tab = searchParams.get('tab') as SettingsTab | null;
    if (tab && (tab === 'profile' || tab === 'billing' || tab === 'advanced')) {
      return tab;
    }
    return 'profile';
  };

  const [activeTab, setActiveTab] = React.useState<SettingsTab>(getInitialTab());

  // Sync with URL changes
  useEffect(() => {
    const tab = searchParams.get('tab') as SettingsTab | null;
    if (tab && (tab === 'profile' || tab === 'billing' || tab === 'advanced')) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: string) => {
    const tab = tabId as SettingsTab;
    setActiveTab(tab);
    // Use replace so tab switches don't pollute browser history
    navigate(`/settings?tab=${tab}`, { replace: true });
  };

  // Render tab content only when active (lazy loading)
  const renderTabContent = (tabId: SettingsTab) => {
    if (activeTab !== tabId) return null;
    
    switch (tabId) {
      case 'profile':
        return <BusinessProfile onDirtyChange={setIsProfileDirty} />;
      case 'billing':
        return <BillingAndSubscription />;
      case 'advanced':
        return <AdvancedSettings />;
      default:
        return null;
    }
  };

  const tabItems: ResponsiveTabItem[] = useMemo(() => [
    {
      id: 'profile',
      label: t('tabs.profile'),
      mobileLabel: t('tabs.profileMobile'),
      icon: User,
      content: renderTabContent('profile'),
    },
    {
      id: 'billing',
      label: t('tabs.billing'),
      mobileLabel: t('tabs.billingMobile'),
      icon: CreditCard,
      content: renderTabContent('billing'),
    },
    {
      id: 'advanced',
      label: t('tabs.advanced'),
      mobileLabel: t('tabs.advancedMobile'),
      icon: Settings,
      content: renderTabContent('advanced'),
    },
  ], [activeTab, t]);

  const handleSaveProfile = () => {
    (document.getElementById('business-info-form') as HTMLFormElement | null)?.requestSubmit();
  };

  const showSaveButton = activeTab === 'profile';

  const SaveButton = (
    <Button
      type="button"
      onClick={handleSaveProfile}
      className="group btn-primary !min-h-0 rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-all duration-300 font-bold flex items-center gap-2 !h-10 md:!h-11 !px-4 md:!px-6 md:-mt-4 text-xs md:text-sm !w-auto !min-w-34 md:!w-44"
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

  return (
    <AppLayout>
      <div className="space-y-6">
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