import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Switch } from '../../../shared/components/ui/switch';
import { Input } from '../../../shared/components/ui/input';
import { Textarea } from '../../../shared/components/ui/textarea';
import { Label } from '../../../shared/components/ui/label';
import { Pill } from '../../../shared/components/ui/pill';
import { MultiSelect } from '../../../shared/components/common/MultiSelect';
import { CollapsibleFormSection } from '../../../shared/components/forms/CollapsibleFormSection';
import { Checkbox } from '../../../shared/components/ui/checkbox';
import { ResponsiveTabs, type ResponsiveTabItem } from '../../../shared/components/ui/responsive-tabs';
import { Users, MapPin, FolderTree, Save, Eye, EyeOff, Store, Building2, User, Images, Megaphone } from 'lucide-react';
import type { Location, Service, TeamMember, Category, Business } from '../types';
import { MarketplaceImagesSection, type PortfolioImage } from './MarketplaceImagesSection';

type MarketplaceTab = 'profile' | 'portfolio' | 'promotions';

interface ListingConfigurationViewProps {
  business: Business | null;
  locations: Location[];
  services: Service[];
  categories: Category[];
  teamMembers: TeamMember[];
  listedLocations: number[];
  listedServices: number[];
  listedCategories: number[];
  listedTeamMembers: number[];
  isPublishing: boolean;
  isVisible: boolean;
  isUpdatingVisibility: boolean;
  isListed: boolean;
  marketplaceName?: string | null;
  marketplaceEmail?: string | null;
  marketplaceDescription?: string | null;
  useBusinessName?: boolean;
  useBusinessEmail?: boolean;
  useBusinessDescription?: boolean;
  allowOnlineBooking: boolean;
  featuredImage?: string | null;
  portfolioImages?: string[] | null;
  onSave: (data: {
    locationIds: number[];
    serviceIds: number[];
    categoryIds: number[];
    teamMemberIds: number[];
    marketplaceName?: string;
    marketplaceEmail?: string;
    marketplaceDescription?: string;
    useBusinessName: boolean;
    useBusinessEmail: boolean;
    useBusinessDescription: boolean;
    allowOnlineBooking: boolean;
    featuredImageId?: string | null;
    portfolioImages?: PortfolioImage[];
  }) => void;
  onToggleVisibility: (isVisible: boolean) => void;
}

export function ListingConfigurationView({
  business,
  locations: locationsFromProps,
  services,
  categories,
  teamMembers,
  listedLocations,
  listedServices,
  listedCategories,
  listedTeamMembers,
  isPublishing,
  isVisible,
  isUpdatingVisibility,
  isListed,
  marketplaceName,
  marketplaceEmail,
  marketplaceDescription,
  useBusinessName: initialUseBusinessName,
  useBusinessEmail: initialUseBusinessEmail,
  useBusinessDescription: initialUseBusinessDescription,
  allowOnlineBooking,
  featuredImage,
  portfolioImages,
  onSave,
  onToggleVisibility,
}: ListingConfigurationViewProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get initial tab from URL or default to 'profile'
  const getInitialTab = (): MarketplaceTab => {
    const tab = searchParams.get('tab') as MarketplaceTab | null;
    if (tab && (tab === 'profile' || tab === 'portfolio' || tab === 'promotions')) {
      return tab;
    }
    return 'profile';
  };

  const [activeTab, setActiveTab] = useState<MarketplaceTab>(getInitialTab());

  // Sync with URL changes (for sidebar navigation)
  useEffect(() => {
    const tab = searchParams.get('tab') as MarketplaceTab | null;
    if (tab && (tab === 'profile' || tab === 'portfolio' || tab === 'promotions')) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>(listedLocations);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>(listedServices);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(listedCategories);
  const [selectedTeamMemberIds, setSelectedTeamMemberIds] = useState<number[]>(listedTeamMembers);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<number[]>([]);
  const [categorySearchTerms, setCategorySearchTerms] = useState<Record<number, string>>({});
  const [categoryValidationErrors, setCategoryValidationErrors] = useState<number[]>([]);
  
  // Use locations directly from props
  const locations = locationsFromProps;
  
  // Toggle states (default to true if undefined)
  const [useBusinessName, setUseBusinessName] = useState<boolean>(initialUseBusinessName ?? true);
  const [useBusinessEmail, setUseBusinessEmail] = useState<boolean>(initialUseBusinessEmail ?? true);
  const [useBusinessDescription, setUseBusinessDescription] = useState<boolean>(initialUseBusinessDescription ?? true);
  
  // Marketplace-specific values
  const [name, setName] = useState<string>(marketplaceName || business?.name || '');
  const [email, setEmail] = useState<string>(marketplaceEmail || business?.email || '');
  const [description, setDescription] = useState<string>(marketplaceDescription || business?.description || '');
  
  const [onlineBooking, setOnlineBooking] = useState<boolean>(allowOnlineBooking);
  const [featuredImageId, setFeaturedImageId] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioImage[]>([]);

  // Initialize portfolio from existing images (convert URLs to PortfolioImage format)
  useState(() => {
    if (portfolioImages && portfolioImages.length > 0) {
      const existingImages: PortfolioImage[] = portfolioImages.map((url, index) => ({
        tempId: `existing-${index}`,
        url,
      }));
      setPortfolio(existingImages);
      
      // Set featured if it exists
      if (featuredImage) {
        const featuredIndex = portfolioImages.indexOf(featuredImage);
        if (featuredIndex !== -1) {
          setFeaturedImageId(`existing-${featuredIndex}`);
        }
      }
    }
  });

  const handleTabChange = (tabId: string) => {
    const tab = tabId as MarketplaceTab;
    setActiveTab(tab);
    navigate(`/marketplace?tab=${tab}`, { replace: true });
  };

  const toggleLocation = (id: number) => {
    setSelectedLocationIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleService = (id: number) => {
    setSelectedServiceIds(prev => {
      const isSelected = prev.includes(id);
      const next = isSelected ? prev.filter(x => x !== id) : [...prev, id];

      // When selecting a service, clear validation error for its category if it becomes valid
      const service = services.find(s => s.id === id);
      const categoryId = service?.categoryId ?? service?.category?.id;

      if (categoryId && !isSelected) {
        const categoryServices = services.filter(
          (svc) => svc.categoryId === categoryId || svc.category?.id === categoryId
        );
        const hasSelected = categoryServices.some((svc) => next.includes(svc.id));

        if (hasSelected) {
          setCategoryValidationErrors((prevErrors) =>
            prevErrors.filter((cid) => cid !== categoryId)
          );
        }
      }

      return next;
    });
  };

  const toggleCategory = (id: number) => {
    setSelectedCategoryIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleTeamMember = (id: number) => {
    setSelectedTeamMemberIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    // Validate that each selected category has at least one selected service
    const invalidCategoryIds = selectedCategoryIds.filter((categoryId) => {
      const categoryServices = services.filter(
        (service) =>
          service.categoryId === categoryId || service.category?.id === categoryId
      );
      if (categoryServices.length === 0) return true;
      return !categoryServices.some((service) => selectedServiceIds.includes(service.id));
    });

    if (invalidCategoryIds.length > 0) {
      setCategoryValidationErrors(invalidCategoryIds);
      // Expand invalid categories so the user sees the message
      setExpandedCategoryIds((prev) =>
        Array.from(new Set([...prev, ...invalidCategoryIds]))
      );
      return;
    }

    // Clear previous errors on successful validation
    if (categoryValidationErrors.length > 0) {
      setCategoryValidationErrors([]);
    }
    onSave({
      locationIds: selectedLocationIds,
      serviceIds: selectedServiceIds,
      categoryIds: selectedCategoryIds,
      teamMemberIds: selectedTeamMemberIds,
      marketplaceName: useBusinessName ? business?.name : name,
      marketplaceEmail: useBusinessEmail ? business?.email : email,
      marketplaceDescription: useBusinessDescription ? business?.description : description,
      useBusinessName,
      useBusinessEmail,
      useBusinessDescription,
      allowOnlineBooking: onlineBooking,
      featuredImageId,
      portfolioImages: portfolio,
    });
  };

  // Profile Tab Content
  const ProfileTabContent = () => (
    <div className="space-y-6">
      {/* Visibility Toggle Card - Only show when already listed */}
      {isListed && (
        <Card className={isVisible ? "border-green-500/50 bg-green-500/5 dark:bg-green-500/10" : "border-orange-500/50 bg-orange-500/5 dark:bg-orange-500/10"}>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isVisible ? (
                  <Eye className="h-5 w-5 text-green-600 dark:text-green-500" />
                ) : (
                  <EyeOff className="h-5 w-5 text-orange-600 dark:text-orange-500" />
                )}
                <div>
                  <h3 className="font-semibold text-base text-foreground">
                    {isVisible ? 'Listing is Visible' : 'Listing is Hidden'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isVisible 
                      ? 'Your business is visible to users in the marketplace' 
                      : 'Your business is hidden from the marketplace'}
                  </p>
                </div>
              </div>
              <Switch
                checked={isVisible}
                onCheckedChange={onToggleVisibility}
                disabled={isUpdatingVisibility}
                className="cursor-pointer"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Marketplace Details Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Marketplace Details
          </CardTitle>
          <CardDescription>
            Customize how your business appears in the marketplace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Business Name */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketplaceName">Business Name</Label>
                <p className="text-xs text-muted-foreground">
                  {useBusinessName ? 'Using your business name' : 'Custom marketplace name'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <Switch
                  checked={useBusinessName}
                  onCheckedChange={setUseBusinessName}
                  className="cursor-pointer"
                />
              </div>
            </div>
            {useBusinessName ? (
              <div className="p-3 rounded-md bg-muted/50 border">
                <p className="text-sm font-medium">{business?.name || 'N/A'}</p>
                <p className="text-xs text-muted-foreground mt-1">From your business profile</p>
              </div>
            ) : (
              <Input
                id="marketplaceName"
                placeholder="Enter custom marketplace name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
          </div>

          {/* Business Email */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketplaceEmail">Contact Email</Label>
                <p className="text-xs text-muted-foreground">
                  {useBusinessEmail ? 'Using your business email' : 'Custom marketplace email'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <Switch
                  checked={useBusinessEmail}
                  onCheckedChange={setUseBusinessEmail}
                  className="cursor-pointer"
                />
              </div>
            </div>
            {useBusinessEmail ? (
              <div className="p-3 rounded-md bg-muted/50 border">
                <p className="text-sm font-medium">{business?.email || 'N/A'}</p>
                <p className="text-xs text-muted-foreground mt-1">From your business profile</p>
              </div>
            ) : (
              <Input
                id="marketplaceEmail"
                type="email"
                placeholder="contact@yourbusiness.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}
          </div>

          {/* Business Description */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketplaceDescription">Description</Label>
                <p className="text-xs text-muted-foreground">
                  {useBusinessDescription ? 'Using your business description' : 'Custom marketplace description'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <Switch
                  checked={useBusinessDescription}
                  onCheckedChange={setUseBusinessDescription}
                  className="cursor-pointer"
                />
              </div>
            </div>
            {useBusinessDescription ? (
              <div className="p-3 rounded-md bg-muted/50 border min-h-[100px]">
                <p className="text-sm">{business?.description || 'N/A'}</p>
                <p className="text-xs text-muted-foreground mt-2">From your business profile</p>
              </div>
            ) : (
              <Textarea
                id="marketplaceDescription"
                placeholder="Describe your business and services..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="space-y-0.5">
              <Label htmlFor="allowOnlineBooking" className="text-base">
                Allow Online Booking
              </Label>
              <p className="text-sm text-muted-foreground">
                Let customers book appointments directly from the marketplace
              </p>
            </div>
            <Switch
              id="allowOnlineBooking"
              checked={onlineBooking}
              onCheckedChange={setOnlineBooking}
              className="cursor-pointer"
            />
          </div>
        </CardContent>
      </Card>

      {/* Team Members Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
          <CardDescription>
            Select team members to feature on your marketplace profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No team members available</p>
          ) : (
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {teamMembers.map((member) => (
                <Pill
                  key={member.id}
                  selected={selectedTeamMemberIds.includes(member.id)}
                  icon={Users}
                  className="w-auto justify-start items-start transition-none active:scale-100"
                  showCheckmark={true}
                  onClick={() => toggleTeamMember(member.id)}
                >
                  <div className="flex flex-col text-left">
                    <div className="flex items-center">
                      {member.firstName} {member.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {member.email}
                    </div>
                  </div>
                </Pill>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Locations Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Locations
          </CardTitle>
          <CardDescription>
            Select locations to display on your marketplace profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No locations available</p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {locations.map((location) => (
                  <div key={location.id} className="relative">
                    <Pill
                      selected={selectedLocationIds.includes(location.id)}
                      icon={MapPin}
                      className="w-auto justify-start items-start transition-none active:scale-100"
                      showCheckmark={true}
                      onClick={() => toggleLocation(location.id)}
                    >
                      <div className="flex flex-col text-left">
                        <div className="flex items-center gap-2">
                          {location.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {location.address}
                        </div>
                      </div>
                    </Pill>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categories Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Service Categories
          </CardTitle>
          <CardDescription>
            Select service categories to display on your marketplace profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories available</p>
          ) : (
            <div className="space-y-4">
              <div className="max-w-md">
                <MultiSelect
                  value={selectedCategoryIds.map(String)}
                  onChange={(newSelectedIds) => {
                    const currentIds = new Set(selectedCategoryIds.map(String));
                    
                    // Toggle newly selected categories
                    newSelectedIds.forEach((id) => {
                      if (!currentIds.has(String(id))) {
                        toggleCategory(Number(id));
                      }
                    });

                    // Toggle deselected categories
                    selectedCategoryIds.forEach((id) => {
                      if (!newSelectedIds.includes(String(id))) {
                        toggleCategory(Number(id));
                      }
                    });
                  }}
                  options={categories.map((category) => ({
                    id: String(category.id),
                    name: category.name,
                    subtitle: category.description || undefined,
                  }))}
                  placeholder="+ Add Categories"
                  searchPlaceholder="Search categories..."
                />
              </div>

              {selectedCategoryIds.length > 0 && (
                <div className="mt-2 space-y-3">
                  {categories
                    .filter((category) => selectedCategoryIds.includes(category.id))
                    .map((category) => {
                      const allCategoryServices = services.filter(
                        (service) =>
                          service.categoryId === category.id ||
                          service.category?.id === category.id
                      );
                      const selectedCount = allCategoryServices.filter((service) =>
                        selectedServiceIds.includes(service.id)
                      ).length;
                      const totalCount = allCategoryServices.length;
                      const searchTerm = categorySearchTerms[category.id] || '';

                      const filteredServices = allCategoryServices.filter((service) =>
                        service.name.toLowerCase().includes(searchTerm.toLowerCase())
                      );

                      return (
                        <CollapsibleFormSection
                          key={category.id}
                          icon={FolderTree}
                          title={category.name}
                          description={
                            totalCount > 0
                              ? `${selectedCount} of ${totalCount} services selected`
                              : 'No services in this category'
                          }
                          open={expandedCategoryIds.includes(category.id)}
                          onOpenChange={(open) => {
                            setExpandedCategoryIds((prev) =>
                              open
                                ? [...prev, category.id]
                                : prev.filter((id) => id !== category.id)
                            );
                          }}
                          className="bg-muted/40 px-3 py-2 rounded-lg"
                        >
                          {totalCount === 0 ? (
                            <div className="py-3 space-y-1 text-xs">
                              <div className="text-muted-foreground">
                                No services belong to this category yet.
                              </div>
                              {categoryValidationErrors.includes(category.id) && (
                                <div className="text-destructive">
                                  You cannot publish this category until it has at least one service.
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="max-h-64 overflow-y-auto pr-1">
                              <div className="sticky top-0 z-10 bg-muted/60 pt-1 pb-2 space-y-2">
                                {categoryValidationErrors.includes(category.id) && (
                                  <div className="text-xs text-destructive">
                                    Remove this category, or select at least one service to publish.
                                  </div>
                                )}
                                <Input
                                  value={searchTerm}
                                  onChange={(e) =>
                                    setCategorySearchTerms((prev) => ({
                                      ...prev,
                                      [category.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Search services in this category..."
                                  className="h-8 text-xs"
                                />

                                <div
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => {
                                    const allSelected =
                                      totalCount > 0 &&
                                      allCategoryServices.every((service) =>
                                        selectedServiceIds.includes(service.id)
                                      );

                                    setSelectedServiceIds((prev) => {
                                      const categoryServiceIds = allCategoryServices.map(
                                        (service) => service.id
                                      );

                                      if (allSelected) {
                                        // Unselect all services in this category
                                        return prev.filter(
                                          (id) => !categoryServiceIds.includes(id)
                                        );
                                      }

                                      // Select all services in this category
                                      const merged = new Set([...prev, ...categoryServiceIds]);
                                      return Array.from(merged);
                                    });
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      const allSelected =
                                        totalCount > 0 &&
                                        allCategoryServices.every((service) =>
                                          selectedServiceIds.includes(service.id)
                                        );

                                      setSelectedServiceIds((prev) => {
                                        const categoryServiceIds = allCategoryServices.map(
                                          (service) => service.id
                                        );

                                        if (allSelected) {
                                          return prev.filter(
                                            (id) => !categoryServiceIds.includes(id)
                                          );
                                        }

                                        const merged = new Set([...prev, ...categoryServiceIds]);
                                        return Array.from(merged);
                                      });
                                    }
                                  }}
                                  className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-background/60 focus:outline-none cursor-pointer"
                                >
                                  <Checkbox
                                    checked={
                                      totalCount > 0 &&
                                      allCategoryServices.every((service) =>
                                        selectedServiceIds.includes(service.id)
                                      )
                                    }
                                    className="h-3.5 w-3.5 !min-h-0 !min-w-0"
                                  />
                                  <span className="text-xs font-medium">
                                    All services in this category
                                  </span>
                                </div>
                              </div>

                              <div className="mt-2 space-y-1 pb-2">
                                {filteredServices.length === 0 ? (
                                  <div className="py-2 text-xs text-muted-foreground">
                                    No services match your search.
                                  </div>
                                ) : (
                                  filteredServices.map((service) => {
                                    const checked = selectedServiceIds.includes(service.id);
                                    const handleToggle = () => toggleService(service.id);

                                    return (
                                      <div
                                        key={service.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={handleToggle}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleToggle();
                                          }
                                        }}
                                        className="w-full flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left hover:bg-background/60 focus:outline-none cursor-pointer"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <Checkbox
                                            checked={checked}
                                            onCheckedChange={handleToggle}
                                            className="h-3.5 w-3.5 !min-h-0 !min-w-0"
                                          />
                                          <span className="text-sm font-medium truncate">
                                            {service.name}
                                          </span>
                                        </div>
                                        <span className="text-[11px] text-muted-foreground shrink-0">
                                          {(service.price_amount_minor / 100).toFixed(2)} •{' '}
                                          {service.duration} min
                                        </span>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          )}
                        </CollapsibleFormSection>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button 
          onClick={handleSave} 
          size="lg" 
          className="gap-2"
          disabled={isPublishing}
        >
          <Save className="h-4 w-4" />
          {isPublishing ? 'Publishing...' : 'Save & Publish Listing'}
        </Button>
      </div>
    </div>
  );

  // Portfolio Tab Content
  const PortfolioTabContent = () => (
    <div className="space-y-6">
      <MarketplaceImagesSection
        featuredImageId={featuredImageId}
        portfolioImages={portfolio}
        onFeaturedImageChange={setFeaturedImageId}
        onPortfolioImagesChange={setPortfolio}
      />

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button 
          onClick={handleSave} 
          size="lg" 
          className="gap-2"
          disabled={isPublishing}
        >
          <Save className="h-4 w-4" />
          {isPublishing ? 'Publishing...' : 'Save & Publish Listing'}
        </Button>
      </div>
    </div>
  );

  // Promotions Tab Content
  const PromotionsTabContent = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
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
            <Megaphone className="h-10 w-10 text-muted-foreground" />
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
  );

  const tabItems: ResponsiveTabItem[] = [
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      content: <ProfileTabContent />,
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      icon: Images,
      content: <PortfolioTabContent />,
    },
    {
      id: 'promotions',
      label: 'Promotions',
      icon: Megaphone,
      content: <PromotionsTabContent />,
    },
  ];

  return (
    <div>
      {/* Responsive Tabs */}
      <ResponsiveTabs
        items={tabItems}
        value={activeTab}
        onValueChange={handleTabChange}
      />
    </div>
  );
}
