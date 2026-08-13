import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { User as UserIcon } from 'lucide-react';
import TextField from '../../../shared/components/forms/fields/TextField';
import { sanitizeName, validatePersonName } from '../../../shared/utils/validation';
import { getErrorMessage } from '../../../shared/utils/error';
import { fetchCurrentUserAction } from '../../auth/actions';
import { selectCurrentUser } from '../../auth/selectors';
import {
  getTeamMemberProfile,
  updateTeamMemberProfile,
} from '../../team-member-pages/myAccount/api';
import { ProfilePhotoUploader } from '../../team-member-pages/myAccount/components/ProfilePhotoUploader';

export interface PersonalInformationSectionRef {
  isDirty: () => boolean;
  /** Validates + saves; toasts on both outcomes. Returns false when blocked/failed. */
  save: () => Promise<boolean>;
}

interface PersonalInformationSectionProps {
  onDirtyChange?: (dirty: boolean) => void;
}

/**
 * Owner's own name + photo, reusing the self-scoped /team-member-account
 * endpoints (the same ones the team-member portal uses). Photo saves
 * immediately; names save via the page's Save changes submit.
 */
export const PersonalInformationSection = forwardRef<
  PersonalInformationSectionRef,
  PersonalInformationSectionProps
>(({ onDirtyChange }, ref) => {
  const { t } = useTranslation('settings');
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [original, setOriginal] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});
  const [touched, setTouched] = useState<{ firstName?: boolean; lastName?: boolean }>({});

  // The session payload carries names but not the profile image — hydrate it
  // (and re-baseline names) from the account profile endpoint.
  useEffect(() => {
    let cancelled = false;
    getTeamMemberProfile()
      .then((response) => {
        if (cancelled) return;
        const p = response.profile;
        setProfileImage(p.profileImage || null);
        setFirstName(p.firstName || '');
        setLastName(p.lastName || '');
        setOriginal({ firstName: p.firstName || '', lastName: p.lastName || '' });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const isDirty =
    firstName !== original.firstName || lastName !== original.lastName;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const save = async (): Promise<boolean> => {
    const nextErrors = {
      firstName: validatePersonName('firstName', firstName, t) ?? undefined,
      lastName: validatePersonName('lastName', lastName, t) ?? undefined,
    };
    setErrors(nextErrors);
    if (nextErrors.firstName || nextErrors.lastName) {
      setTouched({ firstName: true, lastName: true });
      toast.error(t('profile.toast.fixErrorsBeforeSave'));
      return false;
    }
    try {
      await updateTeamMemberProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      setOriginal({ firstName, lastName });
      // Refresh the session user so the header/avatar initials update everywhere.
      dispatch(fetchCurrentUserAction.request());
      toast.success(t('profile.personal.toast.saved'));
      return true;
    } catch (error: any) {
      toast.error(getErrorMessage(error, t('profile.personal.toast.saveFailed')));
      return false;
    }
  };

  useImperativeHandle(ref, () => ({ isDirty: () => isDirty, save }), [
    isDirty,
    firstName,
    lastName,
  ]);

  const displayedName = [firstName, lastName].filter(Boolean).join(' ').trim();

  return (
    <section
      id="account-personal-info"
      className="profile-section scroll-mt-24"
      aria-labelledby="profile-section-personal"
    >
      <header className="profile-section-header">
        <div>
          <h3 id="profile-section-personal" className="profile-section-title">
            {t('profile.personal.title')}
          </h3>
          <p className="profile-section-sub">{t('profile.personal.subtitle')}</p>
        </div>
      </header>

      <div className="profile-field-stack">
        <ProfilePhotoUploader
          profileImage={profileImage}
          displayedName={displayedName}
          onUploaded={setProfileImage}
        />

        <div className="profile-field-grid">
          <TextField
            label={t('profile.personal.firstName')}
            placeholder={t('profile.personal.firstNamePlaceholder')}
            value={firstName}
            onChange={(value) => {
              const clean = sanitizeName(value);
              setFirstName(clean);
              setErrors((prev) => ({
                ...prev,
                firstName: validatePersonName('firstName', clean, t) ?? undefined,
              }));
            }}
            onBlur={() => setTouched((prev) => ({ ...prev, firstName: true }))}
            error={touched.firstName ? errors.firstName : undefined}
            icon={UserIcon}
            required
          />
          <TextField
            label={t('profile.personal.lastName')}
            placeholder={t('profile.personal.lastNamePlaceholder')}
            value={lastName}
            onChange={(value) => {
              const clean = sanitizeName(value);
              setLastName(clean);
              setErrors((prev) => ({
                ...prev,
                lastName: validatePersonName('lastName', clean, t) ?? undefined,
              }));
            }}
            onBlur={() => setTouched((prev) => ({ ...prev, lastName: true }))}
            error={touched.lastName ? errors.lastName : undefined}
            icon={UserIcon}
            required
          />
        </div>
      </div>
    </section>
  );
});

PersonalInformationSection.displayName = 'PersonalInformationSection';
