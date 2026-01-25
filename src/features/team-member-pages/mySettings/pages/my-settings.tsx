import { AppLayout } from '../../../../shared/components/layouts/app-layout';
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { User, Mail, Phone, Shield, Camera, Loader2, Check, Lock } from 'lucide-react';
import { Skeleton } from '../../../../shared/components/ui/skeleton';
import { Button } from '../../../../shared/components/ui/button';
import { Label } from '../../../../shared/components/ui/label';
import { toast } from 'sonner';
import FormSectionHeader from '../../../../shared/components/forms/FormSectionHeader';
import TextField from '../../../../shared/components/forms/fields/TextField';
import { getTeamMemberProfile, updateTeamMemberProfile, changeTeamMemberPassword, uploadTeamMemberProfileImage, type TeamMemberProfile } from '../api';
import { setPasswordApi } from '../../../auth/api';
import { fetchCurrentUserAction } from '../../../auth/actions';
import GoogleAccountManager from '../../../settings/components/GoogleAccountManager';
import { translateMessageCode } from '../../../../shared/utils/error';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImage: string | null;
}

const initialFormData: ProfileFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  profileImage: null,
};

export default function MySettingsPage() {
  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ProfileFormData>(initialFormData);
  const [originalFormData, setOriginalFormData] = useState<ProfileFormData>(initialFormData);
  const [_, setProfileData] = useState<TeamMemberProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);


  // Fetch profile data on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await getTeamMemberProfile();
      setProfileData(response.profile);
      const newFormData = {
        firstName: response.profile.firstName || '',
        lastName: response.profile.lastName || '',
        email: response.profile.email || '',
        phone: response.profile.phone || '',
        profileImage: response.profile.profileImage || null,
      };
      setFormData(newFormData);
      setOriginalFormData(newFormData);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast.error(error?.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateTeamMemberProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
      });
      toast.success('Profile updated successfully!');
      setOriginalFormData(formData);
      // Refresh user data in Redux
      dispatch(fetchCurrentUserAction.request());
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to update profile';
      const translatedMessage = Array.isArray(message)
        ? translateMessageCode(message[0])
        : translateMessageCode(message);
      toast.error(translatedMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetForm = () => {
    setFormData(originalFormData);
  };

  // Check if form has changes
  const hasChanges = formData.firstName !== originalFormData.firstName ||
    formData.lastName !== originalFormData.lastName ||
    formData.email !== originalFormData.email ||
    formData.phone !== originalFormData.phone;

  const handleSetPasswordClick = () => {
    // Small delay to allow modal to close first, then focus and scroll to the password input
    setTimeout(() => {
      passwordInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Focus after scroll starts
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 300);
    }, 100);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml', 'image/avif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, WebP, SVG, or AVIF)');
      return;
    }

    // Validate file size (10MB max)
    const maxSizeMB = 10;
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    try {
      setIsUploadingImage(true);
      const response = await uploadTeamMemberProfileImage(file);
      
      setFormData(prev => ({
        ...prev,
        profileImage: response.profileImage,
      }));
      setOriginalFormData(prev => ({
        ...prev,
        profileImage: response.profileImage,
      }));
      
      toast.success('Profile image uploaded successfully!');
      
      // Refresh user data to update sidebar/header
      dispatch(fetchCurrentUserAction.request());
    } catch (error: any) {
      console.error('Error uploading profile image:', error);
      const message = error?.response?.data?.message || error?.message || 'Failed to upload profile image';
      const translatedMessage = Array.isArray(message)
        ? translateMessageCode(message[0])
        : translateMessageCode(message);
      toast.error(translatedMessage);
    } finally {
      setIsUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      toast.error('Please enter a new password');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      // If user provides current password, use change password endpoint
      // If not (Google users setting password for first time), use set password endpoint
      if (currentPassword.trim()) {
        await changeTeamMemberPassword({
          currentPassword,
          newPassword,
        });
        toast.success('Password changed successfully!');
      } else {
        await setPasswordApi({ password: newPassword });
        toast.success('Password set successfully!');
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // Refresh user data
      dispatch(fetchCurrentUserAction.request());
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to update password';
      const translatedMessage = Array.isArray(message)
        ? translateMessageCode(message[0])
        : translateMessageCode(message);
      toast.error(translatedMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="w-full">
          <div className="space-y-6">
            {/* Personal Information Skeleton */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3 pb-2 border-b border-border mb-6">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-64" />
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Profile Photo Skeleton */}
                <div className="space-y-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-72" />
                  <div className="pt-2">
                    <Skeleton className="h-24 w-24 rounded-full" />
                  </div>
                </div>
                
                {/* Name Fields Skeleton */}
                <div className="flex flex-wrap gap-6">
                  <div className="flex-1 min-w-[280px] space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="flex-1 min-w-[280px] space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Skeleton */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3 pb-2 border-b border-border mb-6">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-6">
                <div className="flex-1 min-w-[280px] space-y-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="flex-1 min-w-[280px] space-y-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>

            {/* Account Security Skeleton */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3 pb-2 border-b border-border mb-6">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-3 w-72" />
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Google Account Skeleton */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-8 w-20 rounded-full" />
                </div>
                
                {/* Password Section Skeleton */}
                <div className="pt-4 border-t border-border">
                  <div className="space-y-1 mb-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                  
                  <div className="flex flex-wrap gap-6">
                    <div className="flex-1 min-w-[280px] space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="flex-1 min-w-[280px] space-y-2">
                      <Skeleton className="h-5 w-28" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-6 mt-4">
                    <div className="flex-1 min-w-[280px] space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="flex-1 min-w-[280px]" />
                  </div>
                  
                  <Skeleton className="h-9 w-36 mt-4" />
                </div>
              </div>
            </div>

            {/* Save Buttons Skeleton */}
            <div className="flex justify-end gap-3 pt-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-36" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="w-full">
        <div className="space-y-6">
          {/* Basic Information Section */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <FormSectionHeader
              icon={User}
              title="Personal Information"
              description="Your profile details visible on the marketplace"
              className="mb-6"
            />

            <div className="space-y-6">
              {/* Profile Image Upload - Circular Display */}
              <div className="space-y-2">
                <Label className="text-base font-medium text-foreground-1">Profile Photo</Label>
                <p className="text-sm text-foreground-3 dark:text-foreground-2">
                  Your profile photo appears on your marketplace profile
                </p>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml,image/avif"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Circular Profile Image Preview with Edit Button */}
                <div className="flex items-center gap-4 pt-2">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-muted border-2 border-border flex items-center justify-center">
                      {formData.profileImage ? (
                        <img
                          src={formData.profileImage}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 text-muted-foreground" />
                      )}
                    </div>
                    {/* Edit Button on Image */}
                    <div
                      onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                      className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 flex items-center gap-1 px-2 py-1 bg-white text-foreground-1 text-xs font-medium rounded-md shadow-lg hover:bg-gray-50 transition-colors border border-border ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                    >
                      <Camera className="h-3 w-3" />
                      {isUploadingImage ? 'Uploading...' : 'Edit'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Two Column Layout - Name Fields */}
              <div className="flex flex-wrap gap-6">
                <div className="flex-1 min-w-[280px]">
                  <TextField
                    label="First Name"
                    placeholder="Enter your first name"
                    value={formData.firstName}
                    onChange={(value) => setFormData(prev => ({ ...prev, firstName: value }))}
                    icon={User}
                    disabled={isSaving}
                    maxLength={32}
                  />
                </div>

                <div className="flex-1 min-w-[280px]">
                  <TextField
                    label="Last Name"
                    placeholder="Enter your last name"
                    value={formData.lastName}
                    onChange={(value) => setFormData(prev => ({ ...prev, lastName: value }))}
                    icon={User}
                    disabled={isSaving}
                    maxLength={32}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <FormSectionHeader
              icon={Mail}
              title="Contact Information"
              description="Your contact details for account communication"
              className="mb-6"
            />

            <div className="flex flex-wrap gap-6">
              <div className="flex-1 min-w-[280px]">
                <TextField
                  label="Email Address"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
                  icon={Mail}
                  disabled={isSaving}
                  maxLength={150}
                />
              </div>

              <div className="flex-1 min-w-[280px]">
                <TextField
                  label="Phone Number"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                  icon={Phone}
                  disabled={isSaving}
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

            <div className="space-y-6">
              {/* Google Account Link/Unlink */}
              <GoogleAccountManager 
                onSetPasswordClick={handleSetPasswordClick}
                returnUrl="/my-settings"
              />

              {/* Password Section */}
              <div className="pt-4 border-t border-border">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0 mb-4">
                    <Label className="text-sm font-medium text-foreground">
                      Change Password
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Update your account password. Leave current password empty if setting up for the first time.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-6">
                  <div className="flex-1 min-w-[280px]">
                    <TextField
                      id="current-password"
                      label="Current Password"
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={setCurrentPassword}
                      type="password"
                      icon={Lock}
                      disabled={isChangingPassword}
                      inputRef={passwordInputRef}
                    />
                  </div>
                  <div className="flex-1 min-w-[280px]">
                    <TextField
                      id="new-password"
                      label="New Password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={setNewPassword}
                      type="password"
                      icon={Lock}
                      disabled={isChangingPassword}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 mt-2">
                  <div className="flex-1 min-w-[280px]">
                    <TextField
                      id="confirm-password"
                      label="Confirm New Password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      type="password"
                      icon={Lock}
                      disabled={isChangingPassword}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleChangePassword();
                        }
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-[280px]" />
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleChangePassword}
                    disabled={!newPassword.trim() || !confirmPassword.trim() || isChangingPassword}
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Change Password
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetForm}
              disabled={isSaving || !hasChanges}
            >
              Reset Changes
            </Button>
            <Button
              type="button"
              className="min-w-[140px]"
              onClick={handleSaveProfile}
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
