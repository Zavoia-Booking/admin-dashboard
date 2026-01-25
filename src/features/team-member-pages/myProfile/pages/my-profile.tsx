import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Save, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '../../../../shared/components/layouts/app-layout';
import { Card, CardContent } from '../../../../shared/components/ui/card';
import { Button } from '../../../../shared/components/ui/button';
import { ResponsiveTabs, type ResponsiveTabItem } from '../../../../shared/components/ui/responsive-tabs';
import ConfirmDialog from '../../../../shared/components/common/ConfirmDialog';
import { ProfileTab, type ProfileTabRef } from '../components/ProfileTab';
import { NoProfileYetView } from '../components/NoProfileYetView';
import { PortfolioImagesSection } from '../components/PortfolioImagesSection';
import { getMarketplaceProfile, type MarketplaceProfile } from '../api';

type MyProfileTab = 'profile' | 'portfolio' | 'reviews';

// Portfolio Tab Content
function PortfolioTabContent({ isActive }: { isActive: boolean }) {
  return <PortfolioImagesSection isActive={isActive} />;
}

// Reviews Tab Content
function ReviewsTabContent() {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-muted-foreground">
          Reviews content coming soon...
        </p>
      </CardContent>
    </Card>
  );
}

// Loading skeleton
function PageSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3"></div>
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3"></div>
        <div className="h-32 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
      </div>
    </div>
  );
}

export default function MyProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const profileTabRef = useRef<ProfileTabRef>(null);
  
  // Data state
  const [profile, setProfile] = useState<MarketplaceProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  
  // Track state from ProfileTab ref for save button
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Unsaved changes dialog state
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const pendingNavigationPathRef = useRef<string | null>(null);
  const pendingTabRef = useRef<MyProfileTab | null>(null);
  const allowNavigationRef = useRef(false);

  // Get initial tab from URL or default to 'profile'
  const getInitialTab = (): MyProfileTab => {
    const tab = searchParams.get('tab') as MyProfileTab | null;
    if (tab && (tab === 'profile' || tab === 'portfolio' || tab === 'reviews')) {
      return tab;
    }
    return 'profile';
  };

  const [activeTab, setActiveTab] = useState<MyProfileTab>(getInitialTab());

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await getMarketplaceProfile();
        if (response.marketplaceProfile) {
          setProfile(response.marketplaceProfile);
          setHasProfile(true);
        } else {
          setHasProfile(false);
        }
      } catch (error: any) {
        console.error('Error fetching marketplace profile:', error);
        toast.error(error?.message || 'Failed to load marketplace profile');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Sync with URL changes
  useEffect(() => {
    const tab = searchParams.get('tab') as MyProfileTab | null;
    if (tab && (tab === 'profile' || tab === 'portfolio' || tab === 'reviews')) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Poll ProfileTab ref for dirty/saving state (only when form is shown)
  useEffect(() => {
    if (!hasProfile && !showProfileForm) return;
    
    const checkState = () => {
      if (profileTabRef.current) {
        setIsDirty(profileTabRef.current.isDirty());
        setIsSaving(profileTabRef.current.isSaving());
      }
    };
    checkState();
    const interval = setInterval(checkState, 300);
    return () => clearInterval(interval);
  }, [hasProfile, showProfileForm]);

  // Warn before closing browser tab/window with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Custom navigation guard - intercept clicks on navigation links
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!isDirty || allowNavigationRef.current) {
        return;
      }

      const target = e.target as HTMLElement;
      const link = target.closest("a[href]") as HTMLAnchorElement | null;

      if (link && link.href) {
        const url = new URL(link.href);
        const currentPath = location.pathname + location.search;
        const targetPath = url.pathname + url.search;

        // Only block if navigating away from my-profile
        if (
          targetPath !== currentPath &&
          !targetPath.startsWith("/my-profile")
        ) {
          e.preventDefault();
          e.stopPropagation();
          pendingNavigationPathRef.current = targetPath;
          pendingTabRef.current = null;
          setShowUnsavedDialog(true);
        }
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [isDirty, location]);

  // Dialog handlers
  const handleConfirmLeave = () => {
    setShowUnsavedDialog(false);
    allowNavigationRef.current = true;

    if (pendingNavigationPathRef.current) {
      navigate(pendingNavigationPathRef.current);
      pendingNavigationPathRef.current = null;
    } else if (pendingTabRef.current) {
      const tab = pendingTabRef.current;
      setActiveTab(tab);
      navigate(`/my-profile?tab=${tab}`, { replace: true });
      pendingTabRef.current = null;
    }

    // Reset flag after navigation
    setTimeout(() => {
      allowNavigationRef.current = false;
    }, 100);
  };

  const handleCancelLeave = () => {
    setShowUnsavedDialog(false);
    pendingNavigationPathRef.current = null;
    pendingTabRef.current = null;
  };

  const handleTabChange = (tabId: string) => {
    const tab = tabId as MyProfileTab;
    
    // If leaving profile tab with unsaved changes, show warning
    if (activeTab === 'profile' && tab !== 'profile' && isDirty) {
      pendingTabRef.current = tab;
      pendingNavigationPathRef.current = null;
      setShowUnsavedDialog(true);
      return;
    }
    
    setActiveTab(tab);
    navigate(`/my-profile?tab=${tab}`, { replace: true });
  };

  const handleCreateProfile = () => {
    setShowProfileForm(true);
  };

  const handleSave = () => {
    profileTabRef.current?.save();
  };

  const handleProfileSaved = (savedProfile: MarketplaceProfile) => {
    setProfile(savedProfile);
    setHasProfile(true);
  };

  // Show loading state
  if (isLoading) {
    return (
      <AppLayout>
        <PageSkeleton />
      </AppLayout>
    );
  }

  // Show "No Profile Yet" marketing view when not created and user hasn't clicked "Create Profile"
  if (!hasProfile && !showProfileForm) {
    return (
      <AppLayout>
        <div className="px-4">
          <NoProfileYetView onCreateProfile={handleCreateProfile} />
        </div>
      </AppLayout>
    );
  }

  // Show tabs with profile form
  const tabItems: ResponsiveTabItem[] = [
    {
      id: 'profile',
      label: 'Profile',
      content: (
        <ProfileTab 
          ref={profileTabRef} 
          initialProfile={profile}
          onProfileSaved={handleProfileSaved}
        />
      ),
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      content: <PortfolioTabContent isActive={activeTab === 'portfolio'} />,
    },
    {
      id: 'reviews',
      label: 'Reviews',
      content: <ReviewsTabContent />,
    },
  ];

  // Only show save button on profile tab
  const showSaveButton = activeTab === 'profile';

  const SaveButton = (
    <Button
      onClick={handleSave}
      className="group btn-primary !min-h-0 rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-all duration-300 font-bold flex items-center gap-2 !h-10 md:!h-11 !px-4 md:!px-6 md:-mt-4 text-xs md:text-sm !w-auto !min-w-34 md:!w-44"
      disabled={isSaving || !isDirty}
    >
      {isSaving ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Saving...</span>
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
          stickyHeader
        />
      </div>

      {/* Unsaved Changes Confirmation Dialog */}
      <ConfirmDialog
        open={showUnsavedDialog}
        onConfirm={handleConfirmLeave}
        onCancel={handleCancelLeave}
        onOpenChange={setShowUnsavedDialog}
        title="Unsaved Changes"
        description="You have unsaved changes. Are you sure you want to leave? Your changes will be lost."
        confirmTitle="Leave"
        cancelTitle="Stay"
        variant="destructive"
        icon={AlertTriangle}
        iconBgColor="transparent"
        iconColor="text-destructive"
        showCloseButton
        footerClassName=""
        cancelClassName="w-auto md:w-44"
        confirmClassName="w-auto md:w-32"
      />
    </AppLayout>
  );
}
