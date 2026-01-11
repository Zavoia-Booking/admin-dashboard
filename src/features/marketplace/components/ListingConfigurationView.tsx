import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/button';
import { ResponsiveTabs, type ResponsiveTabItem } from '../../../shared/components/ui/responsive-tabs';
import { Save, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '../../../shared/components/ui/card';
import type { Location, Service, TeamMember, Business } from '../types';
import { MarketplaceImagesSection } from './MarketplaceImagesSection';
import { AdvancedSettingsSection, type AdvancedSettingsSectionRef } from './AdvancedSettingsSection';
import { SectionDivider } from '../../../shared/components/common/SectionDivider';
import { useMarketplaceForm } from '../hooks/useMarketplaceForm';
import ConfirmDialog from '../../../shared/components/common/ConfirmDialog';

// Profile Tab Components
import { VisibilityToggleCard } from './profile/VisibilityToggleCard';
import { BookingToggleCard } from './profile/BookingToggleCard';
import { MarketplaceDetailsSection } from './profile/MarketplaceDetailsSection';
import { LocationCatalogSection } from './profile/LocationCatalogSection';
import IndustrySection from './profile/IndustrySection.tsx';

type MarketplaceTab = 'profile' | 'portfolio' | 'promotions';

interface LocationWithAssignments extends Location {
  services: Service[];
  teamMembers: TeamMember[];
}

interface ListingConfigurationViewProps {
  business: Business | null;
  locationsWithAssignments: LocationWithAssignments[];
  isPublishing: boolean;
  isVisible: boolean;
  isListed: boolean;
  marketplaceName?: string | null;
  marketplaceEmail?: string | null;
  marketplacePhone?: string | null;
  marketplaceDescription?: string | null;
  useBusinessName?: boolean;
  useBusinessEmail?: boolean;
  useBusinessPhone?: boolean;
  useBusinessDescription?: boolean;
  allowOnlineBooking: boolean;
  featuredImage?: string | null;
  portfolioImages?: string[] | null;
  industries: any[];
  industryTags: any[];
  selectedIndustryTags: any[];
  onSave: (data: any) => void;
  onSaveBookingSettings: (data: any) => void;
}

export function ListingConfigurationView(props: ListingConfigurationViewProps) {
  const {
    business,
    locationsWithAssignments,
    isPublishing,
    isListed,
  } = props;

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const bookingSettingsRef = useRef<AdvancedSettingsSectionRef>(null);
  const [bookingSettingsDirty, setBookingSettingsDirty] = useState(false);
  
  // State for unsaved changes confirmation dialog
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const pendingNavigationPathRef = useRef<string | null>(null);
  const allowNavigationRef = useRef(false);
  
  // Get initial tab from URL or default to 'profile'
  const getInitialTab = (): MarketplaceTab => {
    const tab = searchParams.get('tab') as MarketplaceTab | null;
    if (tab && (tab === 'profile' || tab === 'portfolio' || tab === 'promotions')) {
      return tab;
    }
    return 'profile';
  };

  const [activeTab, setActiveTab] = useState<MarketplaceTab>(getInitialTab());

  // Sync with URL changes
  useEffect(() => {
    const tab = searchParams.get('tab') as MarketplaceTab | null;
    if (tab && (tab === 'profile' || tab === 'portfolio' || tab === 'promotions')) {
      setActiveTab(tab);
    } else if (tab === 'booking-settings') {
      setActiveTab('profile');
      navigate('/marketplace?tab=profile', { replace: true });
    }
  }, [searchParams, navigate]);

  // Check booking settings dirty state periodically
  useEffect(() => {
    const checkBookingDirty = () => {
      const isDirty = bookingSettingsRef.current?.isDirty() ?? false;
      setBookingSettingsDirty(isDirty);
    };

    // Check immediately
    checkBookingDirty();

    // Check every 500ms to detect changes in booking settings
    const interval = setInterval(checkBookingDirty, 500);

    return () => clearInterval(interval);
  }, []);

  const form = useMarketplaceForm({
    business: props.business,
    marketplaceName: props.marketplaceName,
    marketplaceEmail: props.marketplaceEmail,
    marketplacePhone: props.marketplacePhone,
    marketplaceDescription: props.marketplaceDescription,
    useBusinessName: props.useBusinessName ?? true,
    useBusinessEmail: props.useBusinessEmail ?? true,
    useBusinessPhone: props.useBusinessPhone ?? true,
    useBusinessDescription: props.useBusinessDescription ?? true,
    allowOnlineBooking: props.allowOnlineBooking,
    isVisible: props.isVisible,
    featuredImage: props.featuredImage,
    portfolioImages: props.portfolioImages,
    selectedIndustryTags: props.selectedIndustryTags,
    onSave: props.onSave,
  });

  // Combined dirty state
  const isCombinedDirty = form.isDirty || bookingSettingsDirty;

  // Warn before closing browser tab/window with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isCombinedDirty) {
        e.preventDefault();
        // Modern browsers ignore custom messages and show their own
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isCombinedDirty]);

  // Custom navigation guard - intercept clicks on navigation links
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!isCombinedDirty || allowNavigationRef.current) {
        return;
      }

      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement | null;
      
      if (link && link.href) {
        const url = new URL(link.href);
        const currentPath = location.pathname + location.search;
        const targetPath = url.pathname + url.search;

        // Only block if navigating away from marketplace
        if (targetPath !== currentPath && !targetPath.startsWith('/marketplace')) {
          e.preventDefault();
          e.stopPropagation();
          pendingNavigationPathRef.current = targetPath;
          setShowUnsavedDialog(true);
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [isCombinedDirty, location]);

  // Dialog handlers
  const handleConfirmLeave = () => {
    setShowUnsavedDialog(false);
    allowNavigationRef.current = true;
    
    if (pendingNavigationPathRef.current) {
      navigate(pendingNavigationPathRef.current);
      pendingNavigationPathRef.current = null;
    }

    // Reset flag after navigation
    setTimeout(() => {
      allowNavigationRef.current = false;
    }, 100);
  };

  const handleCancelLeave = () => {
    setShowUnsavedDialog(false);
    pendingNavigationPathRef.current = null;
  };

  const handleTabChange = (tabId: string) => {
    const tab = tabId as MarketplaceTab;
    setActiveTab(tab);
    navigate(`/marketplace?tab=${tab}`, { replace: true });
  };

  // Combined save handler
  const handleCombinedSave = () => {
    // Save marketplace listing
    form.handleSave();
    
    // Save booking settings if they're dirty
    if (bookingSettingsDirty && bookingSettingsRef.current) {
      const bookingSettings = bookingSettingsRef.current.getCurrentSettings();
      props.onSaveBookingSettings(bookingSettings);
    }
  };

  const tabItems: ResponsiveTabItem[] = [
    {
      id: 'profile',
      label: 'Profile',
      content: (
        <div className="max-w-5xl">
          <Card className="border-none pt-0 sm:border shadow-none sm:shadow-sm bg-transparent sm:bg-card overflow-hidden">
            <CardContent className="p-0 sm:p-4 space-y-10">
              {/* Visibility & Booking Section */}
              <div className="px-0 space-y-6">
                <SectionDivider title="Visibility & Appointments" className='mt-4 uppercase tracking-wider text-foreground-2' />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isListed && (
                    <VisibilityToggleCard 
                      isVisible={form.isVisible}
                      onToggleVisibility={form.setIsVisible}
                      isUpdatingVisibility={isPublishing}
                    />
                  )}
                  <BookingToggleCard 
                    onlineBooking={form.onlineBooking}
                    setOnlineBooking={form.setOnlineBooking}
                  />
                </div>
              </div>

              {/* Marketplace Details Section */}
              <MarketplaceDetailsSection 
                business={business}
                useBusinessName={form.useBusinessName}
                setUseBusinessName={form.setUseBusinessName}
                name={form.name}
                setName={form.setName}
                useBusinessEmail={form.useBusinessEmail}
                setUseBusinessEmail={form.setUseBusinessEmail}
                email={form.email}
                setEmail={form.setEmail}
                useBusinessPhone={form.useBusinessPhone}
                setUseBusinessPhone={form.setUseBusinessPhone}
                phone={form.phone}
                setPhone={form.setPhone}
                useBusinessDescription={form.useBusinessDescription}
                setUseBusinessDescription={form.setUseBusinessDescription}
                description={form.description}
                setDescription={form.setDescription}
                nameError={form.nameError || undefined}
                emailError={form.emailError || undefined}
                phoneError={form.phoneError || undefined}
                descriptionError={form.descriptionError || undefined}
              />

              {/* Industry & Tags Section */}
              <IndustrySection 
                industries={props.industries}
                industryTags={props.industryTags}
                selectedTags={form.selectedIndustryTags}
                onTagsChange={form.setSelectedIndustryTags}
                error={form.industryTagsError || undefined}
              />

              {/* Location Catalog Section */}
              <LocationCatalogSection 
                locations={locationsWithAssignments}
              />

              <div className="pt-4">
                <SectionDivider title="Configuration" />
                <AdvancedSettingsSection ref={bookingSettingsRef} />
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      content: (
        <div className="space-y-6">
          <MarketplaceImagesSection
            featuredImageId={form.featuredImageId}
            portfolioImages={form.portfolio}
            onFeaturedImageChange={form.setFeaturedImageId}
            onPortfolioImagesChange={form.setPortfolio}
          />
        </div>
      ),
    },
    {
      id: 'promotions',
      label: 'Promotions',
      content: (
        <div className="flex flex-col items-start justify-start py-10 text-left gap-6">
          {/* Illustration */}
          <div className="relative w-full max-w-md h-44 text-left">
            {/* Subtle background glow */}
            <div className="absolute inset-0 -top-4 -bottom-4 bg-gradient-to-b from-primary/5 dark:from-primary/10 via-transparent to-transparent blur-2xl opacity-50 dark:opacity-40" />
            
            {/* back cards with better shadows */}
            <div className="absolute inset-x-10 top-2 h-28 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-border shadow-lg opacity-70 rotate-[-14deg] blur-[0.5px]" />
            <div className="absolute inset-x-6 top-10 h-30 rounded-2xl bg-neutral-50 dark:bg-neutral-900/70 border border-border shadow-xl opacity-85 rotate-[10deg] blur-[0.5px]" />

            {/* front card */}
            <div className="absolute inset-x-2 top-6 h-32 rounded-2xl bg-surface dark:bg-neutral-900 border border-border shadow-xl overflow-hidden">
              <div className="h-full w-full px-5 py-4 flex flex-col items-center justify-center gap-3">
                <div className="h-3 w-32 rounded bg-neutral-300 dark:bg-neutral-800" />
              </div>
            </div>
          </div>

          {/* Copy */}
          <div className="space-y-2 max-w-md px-4">
            <h3 className="text-lg font-semibold text-foreground-1">
              Promotions Coming Soon
            </h3>
            <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
              Create discounts, special offers, and promotional campaigns to attract more customers from the marketplace.
            </p>
          </div>
        </div>
      ),
    },
  ];

  // Dynamic button text based on listing state
  const buttonText = isListed ? 'Save Changes' : 'Publish';
  const buttonLoadingText = isPublishing ? (isListed ? 'Saving...' : 'Publishing...') : buttonText;

  const SaveButton = (
    <Button 
      onClick={handleCombinedSave} 
      className="group btn-primary !min-h-0 !h-11 !px-6 -mt-4 rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-all duration-300 font-bold text-sm flex items-center gap-2 !w-52 sm:w-auto"
      disabled={isPublishing || !isCombinedDirty || form.hasValidationErrors}
    >
      {isPublishing ? (
        <>
          <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
          <span>{buttonLoadingText}</span>
        </>
      ) : (
        <>
          <Save className="h-4 w-4" />
          <span>{buttonText}</span>
        </>
      )}
    </Button>
  );

  return (
    <>
      <div className="cursor-default">
        {/* Responsive Tabs */}
        <ResponsiveTabs
          items={tabItems}
          value={activeTab}
          onValueChange={handleTabChange}
          rightContent={SaveButton}
          stickyHeader={true}
        />
      </div>

      {/* Unsaved Changes Confirmation Dialog */}
      <ConfirmDialog
        open={showUnsavedDialog}
        onConfirm={handleConfirmLeave}
        onCancel={handleCancelLeave}
        onOpenChange={setShowUnsavedDialog}
        title="Unsaved Changes"
        description="You have unsaved changes that will be lost if you leave. Are you sure you want to continue?"
        confirmTitle="Leave"
        cancelTitle="Cancel"
        variant="destructive"
        icon={AlertTriangle}
        iconBgColor="transparent"
        iconColor="text-destructive"
        showCloseButton
        footerClassName=""
        cancelClassName="w-44"
        confirmClassName="w-32"
      />
    </>
  );
}
