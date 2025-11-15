import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import BusinessProfile from '../components/BusinessProfile';
import {
  User,
  CreditCard,
  Settings
} from 'lucide-react';
import BillingAndSubscription from '../components/BillingAndSubscription';
import AdvancedSettings from '../components/AdvancedSettings';

type SettingsTab = 'profile' | 'billing' | 'advanced';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Set active tab from URL query parameter
  useEffect(() => {
    const tab = searchParams.get('tab') as SettingsTab | null;
    if (tab && (tab === 'profile' || tab === 'billing' || tab === 'advanced')) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    navigate(`/settings?tab=${tab}`);
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Settings</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => handleTabChange('profile')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="h-4 w-4" />
            Profile
          </button>
          <button
            onClick={() => handleTabChange('billing')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'billing'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Billing & Subscription
          </button>
          <button
            onClick={() => handleTabChange('advanced')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'advanced'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Settings className="h-4 w-4" />
            Advanced Settings
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && <BusinessProfile />}
        
        {activeTab === 'billing' && <BillingAndSubscription />}

        {activeTab === 'advanced' && <AdvancedSettings />}
      </div>
    </AppLayout>
  );
};

export default SettingsPage; 