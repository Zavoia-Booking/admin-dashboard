import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { Loader2, UploadCloud } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../../../../shared/components/ui/avatar';
import { getErrorMessage } from '../../../../shared/utils/error';
import { fetchCurrentUserAction } from '../../../auth/actions';
import { uploadTeamMemberProfileImage } from '../api';
// Same cross-feature import MyAccountContent uses — the button styles live there.
import '../../../settings/components/Profile.css';

interface ProfilePhotoUploaderProps {
  profileImage: string | null;
  /** Full name used for the avatar alt text and initials fallback. */
  displayedName: string;
  onUploaded?: (url: string) => void;
}

/**
 * Account photo avatar + upload button, self-scoped via
 * /team-member-account/upload-profile-image (saves immediately). Shared by the
 * settings Personal information section and the owner's marketplace profile
 * slider so the two surfaces can't drift.
 */
export const ProfilePhotoUploader: React.FC<ProfilePhotoUploaderProps> = ({
  profileImage,
  displayedName,
  onUploaded,
}) => {
  const { t } = useTranslation('settings');
  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const initials =
    displayedName
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t('profile.toast.invalidImage'));
      return;
    }
    const maxSizeMB = 10;
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(t('profile.toast.fileTooLarge', { max: maxSizeMB }));
      return;
    }

    try {
      setIsUploading(true);
      const response = await uploadTeamMemberProfileImage(file);
      // Refresh the session user so the header/avatar initials update everywhere.
      dispatch(fetchCurrentUserAction.request());
      toast.success(t('profile.personal.toast.photoUploaded'));
      onUploaded?.(response.profileImage);
    } catch (error: any) {
      toast.error(getErrorMessage(error, t('profile.personal.toast.photoUploadFailed')));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16">
        {profileImage && <AvatarImage src={profileImage} alt={displayedName} />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="profile-btn-ghost profile-btn-compact self-start"
        >
          {isUploading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <UploadCloud className="h-3 w-3" />
          )}
          {profileImage
            ? t('profile.personal.changePhoto')
            : t('profile.personal.uploadPhoto')}
        </button>
        <p className="text-[13px] text-foreground-3 leading-[1.5]">
          {t('profile.personal.photoHint')}
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};
