import React, { useEffect } from 'react';
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
    navigate(`/settings?tab=${tab}`);
  };

  const tabItems: ResponsiveTabItem[] = [
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      content: <BusinessProfile />,
    },
    {
      id: 'billing',
      label: 'Billing & Subscription',
      icon: CreditCard,
      content: <BillingAndSubscription />,
    },
    {
      id: 'advanced',
      label: 'Advanced Settings',
      icon: Settings,
      content: <AdvancedSettings />,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <ResponsiveTabs
          items={tabItems}
          value={activeTab}
          onValueChange={handleTabChange}
        />
      </div>
    </AppLayout>
  );
};

export default SettingsPage; 