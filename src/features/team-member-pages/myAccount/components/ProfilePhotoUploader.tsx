import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { ImageCropDialog } from '../../../../shared/components/common/ImageCropDialog';
import { Camera, Loader2, UploadCloud, User } from 'lucide-react';
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
  /** "crest": the account page's round photo with a camera button. */
  appearance?: 'avatar' | 'crest';
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
  appearance = 'avatar',
}) => {
  const { t } = useTranslation('settings');
  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | null>(null);

  const initials =
    displayedName
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
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

    setPendingImage(file);
  };

  const uploadSelectedPhoto = async (file: File) => {
    setPendingImage(null);
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
    }
  };

  return (
    <div className={`flex items-center ${appearance === 'crest' ? 'gap-4.5' : 'gap-4'}`}>
      {appearance === 'crest' ? (
        <div className="profile-hero-crest">
          <div className="profile-hero-crest-frame">
            {profileImage ? <img src={profileImage} alt={displayedName} /> : <User aria-hidden />}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="profile-hero-crest-edit"
            aria-label={
              isUploading
                ? t('profile.basicInfo.uploading')
                : profileImage
                  ? t('profile.personal.changePhoto')
                  : t('profile.personal.uploadPhoto')
            }
          >
            {isUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      ) : (
        <Avatar className="h-16 w-16 border border-border">
          {profileImage && <AvatarImage src={profileImage} alt={displayedName} />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      )}
      <div className="flex flex-col gap-1.5">
        {appearance !== 'crest' && (
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
        )}
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
      {pendingImage && (
        <ImageCropDialog
          file={pendingImage}
          variant="profile"
          onCancel={() => setPendingImage(null)}
          onConfirm={uploadSelectedPhoto}
        />
      )}
    </div>
  );
};
