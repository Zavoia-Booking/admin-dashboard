import React, { useState } from 'react';
import { Copy, Building2, Mail, Clock, ChevronsUpDown, Check } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../../../shared/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../../shared/components/ui/command';
import { toast } from 'sonner';
import { cn } from '../../../shared/lib/utils';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import LogoUpload from '../../../shared/components/common/LogoUpload';
import { uploadBusinessLogo } from '../api';

interface BusinessInfoSliderProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BusinessFormData {
  businessName: string;
  industry: string;
  businessEmail: string;
  businessPhone: string;
  timeZone: string;
  bookingSlug: string;
  logo?: string | null;
  logoKey?: string | null;
}

const initialFormData: BusinessFormData = {
  businessName: 'Your Business Name',
  industry: '',
  businessEmail: 'business@example.com',
  businessPhone: '+1 (555) 123-4567',
  timeZone: 'America/New_York',
  bookingSlug: 'your-business',
  logo: null,
  logoKey: null,
};

const BusinessInfoSlider: React.FC<BusinessInfoSliderProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<BusinessFormData>(initialFormData);
  const [industryOpen, setIndustryOpen] = useState(false);
  const [timeZoneOpen, setTimeZoneOpen] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const handleLogoUpload = async (file: File | null) => {
    if (!file) {
      // Logo removed
      setFormData(prev => ({ ...prev, logo: null, logoKey: null }));
      return;
    }

    try {
      setIsUploadingLogo(true);
      const response = await uploadBusinessLogo(file);
      
      setFormData(prev => ({
        ...prev,
        logo: response.logo,
        logoKey: response.logoKey,
      }));
      
      toast.success('Logo uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error(error?.message || 'Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Here you would normally save the business info including logo and logoKey
    console.log('Saving business info:', formData);
    
    toast.success('✅ Business information saved successfully');
    onClose();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const industries = [
    { value: 'beauty', label: 'Beauty & Wellness' },
    { value: 'fitness', label: 'Fitness & Health' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'education', label: 'Education' },
    { value: 'other', label: 'Other' }
  ];

  const timeZones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' }
  ];

  return (
    <BaseSlider
      isOpen={isOpen}
      onClose={onClose}
      title="Business Information"
      contentClassName="bg-muted/50 scrollbar-hide"
      footer={
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => { onClose(); setFormData(initialFormData); }}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="business-info-form"
            className="flex-1"
          >
            Save Changes
          </Button>
        </div>
      }
    >
      <form id="business-info-form" onSubmit={handleSubmit} className="max-w-md mx-auto">
        {/* Single Card with All Business Data */}
        <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm">
          <CardContent className="space-y-8">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Basic Information</h3>
              </div>
              <div className="space-y-4">
                {/* Logo Upload Section */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Business Logo</Label>
                  <p className="text-xs text-muted-foreground">Upload your business logo to personalize your booking page.</p>
                  <LogoUpload
                    value={formData.logo}
                    onChange={handleLogoUpload}
                    uploading={isUploadingLogo}
                    maxSizeMB={10}
                    recommendedSizeMB={2}
                    recommendedDimensions={{ width: 1024, height: 1024 }}
                    allowedTypes={[
                      'image/jpeg',
                      'image/jpg',
                      'image/png',
                      'image/webp',
                      'image/svg+xml',
                      'image/heic',
                      'image/heif',
                      'image/avif',
                    ]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="text-sm font-medium text-foreground">Business Name</Label>
                  <p className="text-xs text-muted-foreground">How your name appears on your booking page.</p>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                    className="border-0 bg-muted/50 focus:bg-background text-base h-12"
                    placeholder="Enter your business name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Industry</Label>
                  <p className="text-xs text-muted-foreground">Choose the category that best describes your services.</p>
                  <Popover open={industryOpen} onOpenChange={setIndustryOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={industryOpen}
                        className="border-0 bg-muted/50 hover:bg-muted/70 h-12 text-base justify-between w-full"
                      >
                        {formData.industry ? industries.find(industry => industry.value === formData.industry)?.label : "Select industry"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[350px] p-0 z-[80]">
                      <Command>
                        <CommandInput placeholder="Search industries..." />
                        <CommandList>
                          <CommandEmpty>No industries found.</CommandEmpty>
                          <CommandGroup>
                            {industries.map((industry) => (
                              <CommandItem
                                key={industry.value}
                                value={industry.value}
                                onSelect={() => {
                                  setFormData(prev => ({ ...prev, industry: industry.value }));
                                  setIndustryOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.industry === industry.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {industry.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            {/* Contact Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Contact Information</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessEmail" className="text-sm font-medium text-foreground">Business Email</Label>
                  <p className="text-xs text-muted-foreground">This is where we&#39;ll send appointment confirmations and notifications.</p>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={formData.businessEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessEmail: e.target.value }))}
                    className="border-0 bg-muted/50 focus:bg-background text-base h-12"
                    placeholder="business@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessPhone" className="text-sm font-medium text-foreground">Business Phone</Label>
                  <p className="text-xs text-muted-foreground">Displayed on your website for clients to contact you.</p>
                  <Input
                    id="businessPhone"
                    value={formData.businessPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessPhone: e.target.value }))}
                    className="border-0 bg-muted/50 focus:bg-background text-base h-12"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>
            {/* Settings Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Settings</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Time Zone</Label>
                  <p className="text-xs text-muted-foreground">All appointments and reminders will follow this time zone.</p>
                  <Popover open={timeZoneOpen} onOpenChange={setTimeZoneOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={timeZoneOpen}
                        className="border-0 bg-muted/50 hover:bg-muted/70 h-12 text-base justify-between w-full"
                      >
                        {formData.timeZone ? timeZones.find(tz => tz.value === formData.timeZone)?.label : "Select timezone"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[350px] p-0 z-[80]">
                      <Command>
                        <CommandInput placeholder="Search timezones..." />
                        <CommandList>
                          <CommandEmpty>No timezones found.</CommandEmpty>
                          <CommandGroup>
                            {timeZones.map((tz) => (
                              <CommandItem
                                key={tz.value}
                                value={tz.value}
                                onSelect={() => {
                                  setFormData(prev => ({ ...prev, timeZone: tz.value }));
                                  setTimeZoneOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.timeZone === tz.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {tz.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Public Booking Link</Label>
                  <p className="text-xs text-muted-foreground">This is the link clients will use to book you online.</p>
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="text-xs text-muted-foreground bg-muted px-3 py-2 rounded-t-md sm:rounded-l-md sm:rounded-t-none border sm:border-r-0 sm:rounded-r-none">
                        https://book.yourdomain.com/
                      </span>
                      <Input
                        value={formData.bookingSlug}
                        onChange={(e) => setFormData(prev => ({ ...prev, bookingSlug: e.target.value }))}
                        className="border-0 bg-muted/50 focus:bg-background text-base h-10 rounded-b-md sm:rounded-l-none sm:rounded-b-none sm:rounded-r-md border-t-0 sm:border-t"
                        placeholder="your-business"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => copyToClipboard(`https://book.yourdomain.com/${formData.bookingSlug}`)}
                      className="w-full mt-2 h-10"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </BaseSlider>
  );
};

export default BusinessInfoSlider; 