import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Building2, Mail, Globe, Clock, Shield, Instagram, Facebook, Camera, User } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Label } from '../../../shared/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../shared/components/ui/dialog';
import { toast } from 'sonner';
import LogoUpload from '../../../shared/components/common/LogoUpload';
import FormSectionHeader from '../../../shared/components/forms/FormSectionHeader';
import TextField from '../../../shared/components/forms/fields/TextField';
import TextareaField from '../../../shared/components/forms/fields/TextareaField';
import { uploadBusinessLogo } from '../api';
import GoogleAccountManager from './GoogleAccountManager';
import { fetchCurrentBusinessAction } from '../../business/actions';
import { getCurrentBusinessSelector } from '../../business/selectors';

interface BusinessFormData {
  businessName: string;
  description: string;
  industry: string;
  businessEmail: string;
  businessPhone: string;
  timeZone: string;
  country: string;
  instagramUrl: string;
  facebookUrl: string;
  bookingSlug: string;
  logo?: string | null;
  logoKey?: string | null;
}

const initialFormData: BusinessFormData = {
  businessName: '',
  description: '',
  industry: '',
  businessEmail: '',
  businessPhone: '',
  timeZone: 'America/New_York',
  country: '',
  instagramUrl: '',
  facebookUrl: '',
  bookingSlug: '',
  logo: null,
  logoKey: null,
};

const BusinessProfile: React.FC = () => {
  const dispatch = useDispatch();
  const currentBusiness = useSelector(getCurrentBusinessSelector);
  
  const [formData, setFormData] = useState<BusinessFormData>(initialFormData);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isLogoDialogOpen, setIsLogoDialogOpen] = useState(false);

  // Fetch business data on mount
  useEffect(() => {
    dispatch(fetchCurrentBusinessAction.request());
  }, [dispatch]);

  // Populate form when business data is loaded
  useEffect(() => {
    if (currentBusiness) {
      setFormData({
        businessName: currentBusiness.name || '',
        description: currentBusiness.description || '',
        industry: currentBusiness.industry?.name || '',
        businessEmail: currentBusiness.email || '',
        businessPhone: currentBusiness.phone || '',
        timeZone: currentBusiness.timezone || 'America/New_York',
        country: currentBusiness.country || '',
        instagramUrl: currentBusiness.instagramUrl || '',
        facebookUrl: currentBusiness.facebookUrl || '',
        bookingSlug: currentBusiness.uuid || '',
        logo: currentBusiness.logo || null,
        logoKey: null,
      });
    }
  }, [currentBusiness]);

  const handleLogoUpload = async (file: File | null) => {
    if (!file) {
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
    
    console.log('Saving business info:', formData);
    toast.success('✅ Business information saved successfully');
  };

  return (
    <form id="business-info-form" onSubmit={handleSubmit} className="w-full">
      <div className="space-y-6">
        {/* Basic Information Section */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <FormSectionHeader
            icon={Building2}
            title="Basic Information"
            description="Essential details about your business"
            className="mb-6"
          />
          
          <div className="space-y-6">
            {/* Logo Upload - Circular Display */}
            <div className="space-y-2">
              <Label className="text-base font-medium text-foreground-1">Business Logo</Label>
              <p className="text-sm text-foreground-3 dark:text-foreground-2">
                Your logo appears on your booking page and communications
              </p>
              
              {/* Circular Logo Preview */}
              <div className="flex items-center gap-4 pt-2">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-muted border-2 border-border flex items-center justify-center">
                    {formData.logo ? (
                      <img
                        src={formData.logo}
                        alt="Business logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md bg-surface border-border hover:bg-surface-hover"
                    onClick={() => setIsLogoDialogOpen(true)}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsLogoDialogOpen(true)}
                  >
                    {formData.logo ? 'Change Logo' : 'Upload Logo'}
                  </Button>
                  {formData.logo && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="ml-2 text-destructive hover:text-destructive"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, logo: null, logoKey: null }));
                        toast.success('Logo removed');
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Logo Upload Dialog */}
            <Dialog open={isLogoDialogOpen} onOpenChange={setIsLogoDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload Business Logo</DialogTitle>
                  <DialogDescription>
                    Choose a logo for your business.
                  </DialogDescription>
                </DialogHeader>
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
                    'image/avif',
                  ]}
                />
                {formData.logo && (
                  <div className="flex justify-end">
                    <Button onClick={() => setIsLogoDialogOpen(false)}>
                      Done
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Two Column Layout */}
            <div className="flex flex-wrap gap-6">
              <div className="flex-1 min-w-[280px]">
                <TextField
                  label="Business Name"
                  placeholder="Enter your business name"
                  value={formData.businessName}
                  onChange={(value) => setFormData(prev => ({ ...prev, businessName: value }))}
                  icon={Building2}
                  required
                />
              </div>
              
              <div className="flex-1 min-w-[280px]">
                <TextField
                  label="Industry"
                  placeholder="e.g., Beauty & Wellness"
                  value={formData.industry}
                  onChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}
                  icon={Globe}
                />
              </div>
            </div>

            {/* Description */}
            <TextareaField
              label="Business Description"
              placeholder="Tell your clients about your business..."
              value={formData.description}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              maxLength={500}
            />
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <FormSectionHeader
            icon={Mail}
            title="Contact Information"
            description="How clients can reach you"
            className="mb-6"
          />
          
          <div className="flex flex-wrap gap-6">
            <div className="flex-1 min-w-[280px]">
              <TextField
                label="Business Email"
                placeholder="business@example.com"
                value={formData.businessEmail}
                onChange={(value) => setFormData(prev => ({ ...prev, businessEmail: value }))}
                icon={Mail}
                required
              />
            </div>
            
            <div className="flex-1 min-w-[280px]">
              <TextField
                label="Business Phone"
                placeholder="+1 (555) 123-4567"
                value={formData.businessPhone}
                onChange={(value) => setFormData(prev => ({ ...prev, businessPhone: value }))}
                icon={Globe}
              />
            </div>
          </div>
        </div>

        {/* Social Media Section */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <FormSectionHeader
            icon={Globe}
            title="Social Media Links"
            description="Connect your social media profiles"
            className="mb-6"
          />
          
          <div className="flex flex-wrap gap-6">
            <div className="flex-1 min-w-[280px]">
              <TextField
                label="Instagram URL"
                placeholder="https://instagram.com/yourbusiness"
                value={formData.instagramUrl}
                onChange={(value) => setFormData(prev => ({ ...prev, instagramUrl: value }))}
                icon={Instagram}
              />
            </div>
            
            <div className="flex-1 min-w-[280px]">
              <TextField
                label="Facebook URL"
                placeholder="https://facebook.com/yourbusiness"
                value={formData.facebookUrl}
                onChange={(value) => setFormData(prev => ({ ...prev, facebookUrl: value }))}
                icon={Facebook}
              />
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <FormSectionHeader
            icon={Clock}
            title="Regional Settings"
            description="Configure timezone and location preferences"
            className="mb-6"
          />
          
          <div className="flex flex-wrap gap-6">
            <div className="flex-1 min-w-[280px]">
              <TextField
                label="Time Zone"
                placeholder="America/New_York"
                value={formData.timeZone}
                onChange={(value) => setFormData(prev => ({ ...prev, timeZone: value }))}
                icon={Clock}
              />
            </div>
            
            <div className="flex-1 min-w-[280px]">
              <TextField
                label="Country"
                placeholder="United States"
                value={formData.country}
                onChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                icon={Globe}
              />
            </div>
          </div>
        </div>
        
        {/* Account Security Section */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <FormSectionHeader
            icon={Shield}
            title="Account Security"
            description="Manage your account authentication and security"
            className="mb-6"
          />
          
          <GoogleAccountManager />
        </div>
        
        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => dispatch(fetchCurrentBusinessAction.request())}
          >
            Reset Changes
          </Button>
          <Button type="submit" className="min-w-[140px]">
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  );
};

export default BusinessProfile;
