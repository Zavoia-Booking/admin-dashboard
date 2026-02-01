import React, { useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import BusinessProfile from '../components/BusinessProfile';
import {
  User,
  CreditCard,
  Settings,
} from 'lucide-react';
import BillingAndSubscription from '../components/BillingAndSubscription';
import AdvancedSettings from '../components/AdvancedSettings';
import { ResponsiveTabs, type ResponsiveTabItem } from '../../../shared/components/ui/responsive-tabs';

type SettingsTab = 'profile' | 'billing' | 'advanced';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
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
        return <BusinessProfile />;
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
      label: 'Profile',
      mobileLabel: 'Profile',
      icon: User,
      content: renderTabContent('profile'),
    },
    {
      id: 'billing',
      label: 'Billing & Subscription',
      mobileLabel: 'Billing',
      icon: CreditCard,
      content: renderTabContent('billing'),
    },
    {
      id: 'advanced',
      label: 'Advanced Settings',
      mobileLabel: 'Advanced',
      icon: Settings,
      content: renderTabContent('advanced'),
    },
  ], [activeTab]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <ResponsiveTabs
          items={tabItems}
          value={activeTab}
          onValueChange={handleTabChange}
          stickyHeader={true}
        />
      </div>
    </AppLayout>
  );
};

export default SettingsPage; 