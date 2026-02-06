import React, { useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../../../../shared/components/layouts/app-layout';
import { Button } from '../../../../shared/components/ui/button';
import { User, Settings, Save, Loader2 } from 'lucide-react';
import MySettingsProfile from '../components/MySettingsProfile';
import MySettingsAdvanced from '../components/MySettingsAdvanced';
import { ResponsiveTabs, type ResponsiveTabItem } from '../../../../shared/components/ui/responsive-tabs';

type MySettingsTab = 'profile' | 'advanced';

export default function MySettingsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProfileDirty, setIsProfileDirty] = React.useState(false);
  const [isProfileSaving, setIsProfileSaving] = React.useState(false);

  // Get initial tab from URL or default to 'profile'
  const getInitialTab = (): MySettingsTab => {
    const tab = searchParams.get('tab') as MySettingsTab | null;
    if (tab && (tab === 'profile' || tab === 'advanced')) {
      return tab;
    }
    return 'profile';
  };

  const [activeTab, setActiveTab] = React.useState<MySettingsTab>(getInitialTab());

  // Sync with URL changes
  useEffect(() => {
    const tab = searchParams.get('tab') as MySettingsTab | null;
    if (tab && (tab === 'profile' || tab === 'advanced')) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: string) => {
    const tab = tabId as MySettingsTab;
    setActiveTab(tab);
    // Use replace so tab switches don't pollute browser history
    navigate(`/my-settings?tab=${tab}`, { replace: true });
  };

  // Render tab content only when active (lazy loading)
  const renderTabContent = (tabId: MySettingsTab) => {
    if (activeTab !== tabId) return null;

    switch (tabId) {
      case 'profile':
        return (
          <MySettingsProfile
            onDirtyChange={setIsProfileDirty}
            onSavingChange={setIsProfileSaving}
          />
        );
      case 'advanced':
        return <MySettingsAdvanced />;
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
      id: 'advanced',
      label: 'Advanced Settings',
      mobileLabel: 'Advanced',
      icon: Settings,
      content: renderTabContent('advanced'),
    },
  ], [activeTab]);

  const handleSaveProfile = () => {
    (document.getElementById('my-settings-profile-form') as HTMLFormElement | null)?.requestSubmit();
  };

  const showSaveButton = activeTab === 'profile';

  const SaveButton = (
    <Button
      type="button"
      onClick={handleSaveProfile}
      className="group btn-primary !min-h-0 rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-all duration-300 font-bold flex items-center gap-2 !h-10 md:!h-11 !px-4 md:!px-6 md:-mt-4 text-xs md:text-sm !w-auto !min-w-34 md:!w-44"
      disabled={!isProfileDirty || isProfileSaving}
    >
      {isProfileSaving ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          <span>
            Saving
            <span className="inline-block w-4 text-left animate-pulse" aria-hidden>
              ...
            </span>
          </span>
        </>
      ) : (
        <>
          <span>Save Changes</span>
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
}
