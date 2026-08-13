import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BaseSlider } from "../../../../shared/components/common/BaseSlider";
import { FormFooter } from "../../../../shared/components/forms/FormFooter";
import { Skeleton } from "../../../../shared/components/ui/skeleton";
import {
  ProfileTab,
  type ProfileTabRef,
} from "../../../team-member-pages/myProfile/components/ProfileTab";
import { PortfolioImagesSection } from "../../../team-member-pages/myProfile/components/PortfolioImagesSection";
import {
  getMarketplaceProfile,
  type MarketplaceProfile,
} from "../../../team-member-pages/myProfile/api";
import { getTeamMemberProfile } from "../../../team-member-pages/myAccount/api";
import { ProfilePhotoUploader } from "../../../team-member-pages/myAccount/components/ProfilePhotoUploader";

interface EditOwnerProfileSliderProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileSaved?: (profile: MarketplaceProfile) => void;
  /** Account photo saves immediately on upload — lets the parent card sync its avatar. */
  onAccountPhotoUploaded?: (url: string) => void;
}

/**
 * Owner-side editor for the same professional profile team members manage in
 * their portal — reuses ProfileTab/PortfolioImagesSection wholesale so the two
 * surfaces can't drift. Portfolio changes save immediately; the form saves via
 * the footer.
 */
export const EditOwnerProfileSlider: React.FC<EditOwnerProfileSliderProps> = ({
  isOpen,
  onClose,
  onProfileSaved,
  onAccountPhotoUploaded,
}) => {
  const { t } = useTranslation("marketplace");
  const profileTabRef = useRef<ProfileTabRef>(null);
  const saveSucceededRef = useRef(false);

  const [initialProfile, setInitialProfile] = useState<MarketplaceProfile | null>(null);
  const [account, setAccount] = useState<{
    firstName: string;
    lastName: string;
    profileImage: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [canSave, setCanSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset so the next open starts on the skeleton, not a stale mount.
      setIsLoading(true);
      return;
    }
    let cancelled = false;
    const fetchProfile = async () => {
      setIsLoading(true);
      setLoadError(false);
      try {
        const response = await getMarketplaceProfile();
        if (!cancelled) setInitialProfile(response.marketplaceProfile);
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchProfile();
    // Account photo + name — secondary like the parent card's fetch: a failure
    // just hides the photo uploader rather than blocking the whole slider.
    getTeamMemberProfile()
      .then((r) => {
        if (cancelled) return;
        setAccount({
          firstName: r.profile.firstName,
          lastName: r.profile.lastName,
          profileImage: r.profile.profileImage || null,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const handlePhotoUploaded = (url: string) => {
    setAccount((prev) => (prev ? { ...prev, profileImage: url } : prev));
    onAccountPhotoUploaded?.(url);
  };

  // Same ref-poll pattern the team-member portal uses to drive its save button.
  useEffect(() => {
    if (!isOpen) return;
    const checkState = () => {
      if (profileTabRef.current) {
        setCanSave(profileTabRef.current.canSave());
        setIsSaving(profileTabRef.current.isSaving());
      }
    };
    checkState();
    const interval = setInterval(checkState, 300);
    return () => clearInterval(interval);
  }, [isOpen, isLoading]);

  // ProfileTab calls this synchronously only on a successful save, so the flag
  // is reliable where polling ref.isDirty() right after save() would race the
  // re-render. save() toasts and never throws; on failure we stay open so the
  // user's edits aren't lost.
  const handleProfileSaved = (profile: MarketplaceProfile) => {
    saveSucceededRef.current = true;
    setInitialProfile(profile);
    onProfileSaved?.(profile);
  };

  const handleSave = async () => {
    const ref = profileTabRef.current;
    if (!ref) return;
    saveSucceededRef.current = false;
    await ref.save();
    if (saveSucceededRef.current) onClose();
  };

  return (
    <BaseSlider
      isOpen={isOpen}
      onClose={onClose}
      title={t("ownerProfile.slider.title")}
      subtitle={t("ownerProfile.slider.subtitle")}
      contentClassName="bg-surface scrollbar-hide"
      footer={
        <FormFooter
          onCancel={onClose}
          onSubmit={handleSave}
          cancelLabel={t("ownerProfile.slider.cancel")}
          submitLabel={t("ownerProfile.slider.save")}
          disabled={!canSave || isLoading || loadError}
          isLoading={isSaving}
        />
      }
    >
      <div className="h-full flex flex-col cursor-default">
        <div className="flex-1 overflow-y-auto p-1 py-6 pt-0 md:p-6 md:pt-0 bg-surface">
          <div className="max-w-2xl mx-auto cursor-default pt-2">
            {loadError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive mb-6">
                {t("ownerProfile.slider.loadError")}
              </div>
            )}

            {isLoading && (
              <div className="space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-28 w-full" />
              </div>
            )}

            {!isLoading && !loadError && (
              <div className="space-y-8">
                {account && (
                  <ProfilePhotoUploader
                    profileImage={account.profileImage}
                    displayedName={[account.firstName, account.lastName]
                      .filter(Boolean)
                      .join(" ")
                      .trim()}
                    onUploaded={handlePhotoUploaded}
                  />
                )}
                <ProfileTab
                  ref={profileTabRef}
                  initialProfile={initialProfile}
                  onProfileSaved={handleProfileSaved}
                  embedded
                />
                <PortfolioImagesSection isActive={isOpen} embedded />
              </div>
            )}
          </div>
        </div>
      </div>
    </BaseSlider>
  );
};
