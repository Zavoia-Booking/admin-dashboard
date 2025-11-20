import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Switch } from '../../../shared/components/ui/switch';
import { Input } from '../../../shared/components/ui/input';
import { Textarea } from '../../../shared/components/ui/textarea';
import { Label } from '../../../shared/components/ui/label';
import { Pill } from '../../../shared/components/ui/pill';
import { Users, MapPin, Briefcase, FolderTree, Save, Eye, EyeOff, Store, Building2 } from 'lucide-react';
import type { Location, Service, TeamMember, Category, Business } from '../types';
import { MarketplaceImagesSection } from './MarketplaceImagesSection';

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
    featuredImage?: string | null;
    portfolioImages?: string[];
  }) => void;
  onToggleVisibility: (isVisible: boolean) => void;
}

export function ListingConfigurationView({
  business,
  locations,
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
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>(listedLocations);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>(listedServices);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(listedCategories);
  const [selectedTeamMemberIds, setSelectedTeamMemberIds] = useState<number[]>(listedTeamMembers);
  
  // Toggle states (default to true if undefined)
  const [useBusinessName, setUseBusinessName] = useState<boolean>(initialUseBusinessName ?? true);
  const [useBusinessEmail, setUseBusinessEmail] = useState<boolean>(initialUseBusinessEmail ?? true);
  const [useBusinessDescription, setUseBusinessDescription] = useState<boolean>(initialUseBusinessDescription ?? true);
  
  // Marketplace-specific values
  const [name, setName] = useState<string>(marketplaceName || business?.name || '');
  const [email, setEmail] = useState<string>(marketplaceEmail || business?.email || '');
  const [description, setDescription] = useState<string>(marketplaceDescription || business?.description || '');
  
  const [onlineBooking, setOnlineBooking] = useState<boolean>(allowOnlineBooking);
  const [featured, setFeatured] = useState<string | null>(featuredImage || null);
  const [portfolio, setPortfolio] = useState<string[]>(portfolioImages || []);

  const toggleLocation = (id: number) => {
    setSelectedLocationIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleService = (id: number) => {
    setSelectedServiceIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
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
      featuredImage: featured,
      portfolioImages: portfolio,
    });
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Configure Your Marketplace Listing</h1>
          <p className="text-muted-foreground mt-1">
            Select what you want to display on your marketplace profile
          </p>
        </div>
      </div>

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

      {/* Marketplace Images Section */}
      <MarketplaceImagesSection
        featuredImage={featured}
        portfolioImages={portfolio}
        onFeaturedImageChange={setFeatured}
        onPortfolioImagesChange={setPortfolio}
      />

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
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {locations.map((location) => (
                <Pill
                  key={location.id}
                  selected={selectedLocationIds.includes(location.id)}
                  icon={MapPin}
                  className="w-auto justify-start items-start transition-none active:scale-100"
                  showCheckmark={true}
                  onClick={() => toggleLocation(location.id)}
                >
                  <div className="flex flex-col text-left">
                    <div className="flex items-center">
                      {location.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {location.address}
                    </div>
                  </div>
                </Pill>
              ))}
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
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {categories.map((category) => (
                <Pill
                  key={category.id}
                  selected={selectedCategoryIds.includes(category.id)}
                  icon={FolderTree}
                  className="w-auto justify-start items-start transition-none active:scale-100"
                  showCheckmark={true}
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex flex-col text-left">
                    <div className="flex items-center">
                      {category.name}
                    </div>
                    {category.description && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {category.description}
                      </div>
                    )}
                  </div>
                </Pill>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Services Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Services
          </CardTitle>
          <CardDescription>
            Select services to showcase on your marketplace profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground">No services available</p>
          ) : (
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {services.map((service) => (
                <Pill
                  key={service.id}
                  selected={selectedServiceIds.includes(service.id)}
                  icon={Briefcase}
                  className="w-auto justify-start items-start transition-none active:scale-100"
                  showCheckmark={true}
                  onClick={() => toggleService(service.id)}
                >
                  <div className="flex flex-col text-left">
                    <div className="flex items-center">
                      {service.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      ${(service.price_amount_minor / 100).toFixed(2)} • {service.duration} min
                    </div>
                  </div>
                </Pill>
              ))}
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
}

