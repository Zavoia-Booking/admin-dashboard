import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { Button } from "../../../../shared/components/ui/button";
import { Skeleton } from "../../../../shared/components/ui/skeleton";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../../shared/components/ui/avatar";
import { SectionDivider } from "../../../../shared/components/common/SectionDivider";
import { selectCurrentUser } from "../../../auth/selectors";
import {
  getMarketplaceProfile,
  getMyStats,
  getPortfolioImages,
  type MarketplaceProfile,
  type MyStatsData,
} from "../../../team-member-pages/myProfile/api";
import { getTeamMemberProfile } from "../../../team-member-pages/myAccount/api";
import { EditOwnerProfileSlider } from "./EditOwnerProfileSlider";

interface OwnerProfessionalProfileSectionProps {
  /** The parent's dimming is CSS-only; a real disabled also blocks keyboard activation. */
  canWrite: boolean;
}

/**
 * The owner is bookable staff like any team member; this section surfaces the
 * same professional profile team members manage in their portal, edited here
 * via a slider. Owner-only by construction — the whole /marketplace route is.
 */
export const OwnerProfessionalProfileSection: React.FC<OwnerProfessionalProfileSectionProps> = ({
  canWrite,
}) => {
  const { t } = useTranslation("marketplace");
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);

  const [profile, setProfile] = useState<MarketplaceProfile | null>(null);
  // The account photo (and reliable name) live on /team-member-account/profile —
  // the session user doesn't carry profileImage, so the avatar needs this fetch.
  const [account, setAccount] = useState<{
    firstName: string;
    lastName: string;
    profileImage: string | null;
  } | null>(null);
  const [photosCount, setPhotosCount] = useState<number>(0);
  const [stats, setStats] = useState<MyStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isSliderOpen, setIsSliderOpen] = useState(false);

  const refreshSecondary = useCallback(() => {
    getPortfolioImages()
      .then((images) => setPhotosCount(images.length))
      .catch(() => {});
    getMyStats()
      .then((response) => setStats(response.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchProfile = async () => {
      try {
        const response = await getMarketplaceProfile();
        if (cancelled) return;
        setProfile(response.marketplaceProfile);
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchProfile();
    refreshSecondary();
    // Account photo + name — secondary, so a failure just leaves the avatar on
    // its initials fallback rather than blocking the card.
    getTeamMemberProfile()
      .then((r) => {
        if (cancelled) return;
        setAccount({
          firstName: r.profile.firstName,
          lastName: r.profile.lastName,
          profileImage: r.profile.profileImage,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [refreshSecondary]);

  const handleSliderClose = () => {
    setIsSliderOpen(false);
    // Portfolio edits save immediately inside the slider — re-sync the count.
    refreshSecondary();
  };

  // Prefer the freshly-fetched account name; fall back to the session copy only
  // until it loads (account.firstName === '' is a real "no name", not a miss, so
  // ?? — which ignores only null/undefined — is deliberate here).
  const accountName = [
    account?.firstName ?? user?.firstName,
    account?.lastName ?? user?.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  const photo = account?.profileImage ?? user?.profileImage ?? null;
  const displayName = profile?.displayName?.trim() || accountName;
  const isNameless = !accountName;
  const initials =
    displayName
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  const metaParts: string[] = [];
  if (stats && stats.totalReviews > 0 && stats.averageRating != null) {
    metaParts.push(
      `${stats.averageRating.toFixed(1)} · ${t("ownerProfile.reviews", { count: stats.totalReviews })}`,
    );
  }
  if (photosCount > 0) {
    metaParts.push(t("ownerProfile.photos", { count: photosCount }));
  }

  const hasProfile = profile !== null;

  return (
    <div className="space-y-6 scroll-mt-24" id="marketplace-owner-profile-section">
      <SectionDivider
        title={t("ownerProfile.sectionTitle")}
        className="uppercase tracking-wider text-foreground-2"
      />

      <div className="rounded-2xl p-4 border transition-all duration-300 bg-white dark:bg-surface border-border flex flex-col gap-4">
        <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
          {t("ownerProfile.helper")}
        </p>

        {isLoading ? (
          <div className="flex items-center gap-4 pt-4 border-t border-border">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
        ) : loadError ? (
          <div className="pt-4 border-t border-border text-sm text-destructive">
            {t("ownerProfile.loadError")}
          </div>
        ) : isNameless ? (
          // A professional profile is meaningless without a name, and the name
          // lives in Account — not here — so nudge them there rather than into
          // the profile editor.
          <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <Avatar className="h-12 w-12">
                {photo && <AvatarImage src={photo} alt="" />}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="text-base font-medium text-foreground-1 truncate">
                  {t("ownerProfile.noName.title")}
                </h3>
                <p className="text-sm text-foreground-3 dark:text-foreground-2">
                  {t("ownerProfile.noName.body")}
                </p>
              </div>
            </div>
            <Button
              variant="default"
              rounded="full"
              className="cursor-pointer shrink-0 self-start sm:self-center"
              onClick={() => navigate("/account?scrollTo=personal")}
              disabled={!canWrite}
            >
              {t("ownerProfile.noName.cta")}
            </Button>
          </div>
        ) : (
          <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <Avatar className="h-12 w-12">
                {photo && <AvatarImage src={photo} alt={displayName} />}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="text-base font-medium text-foreground-1 truncate">
                  {hasProfile ? displayName : t("ownerProfile.emptyTitle")}
                </h3>
                <p className="text-sm text-foreground-3 dark:text-foreground-2 truncate">
                  {hasProfile
                    ? profile?.professionalTitle || t("ownerProfile.noTitleYet")
                    : t("ownerProfile.emptyBody")}
                </p>
                {hasProfile && metaParts.length > 0 && (
                  <p className="text-sm text-foreground-3 dark:text-foreground-2 flex items-center gap-1.5 mt-1">
                    {stats && stats.totalReviews > 0 && (
                      <Star
                        className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    {metaParts.join(" · ")}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant={hasProfile ? "outline" : "default"}
              rounded="full"
              className="cursor-pointer shrink-0 self-start sm:self-center"
              onClick={() => setIsSliderOpen(true)}
              disabled={!canWrite}
            >
              {hasProfile
                ? t("ownerProfile.editCta")
                : t("ownerProfile.setupCta")}
            </Button>
          </div>
        )}
      </div>

      <EditOwnerProfileSlider
        isOpen={isSliderOpen}
        onClose={handleSliderClose}
        onProfileSaved={setProfile}
        onAccountPhotoUploaded={(url) =>
          setAccount((prev) => ({
            firstName: prev?.firstName ?? user?.firstName ?? "",
            lastName: prev?.lastName ?? user?.lastName ?? "",
            profileImage: url,
          }))
        }
      />
    </div>
  );
};
