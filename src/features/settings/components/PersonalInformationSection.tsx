import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { User as UserIcon } from 'lucide-react';
import TextField from '../../../shared/components/forms/fields/TextField';
import { sanitizeName, validatePersonName } from '../../../shared/utils/validation';
import { selectCurrentUser } from '../../auth/selectors';
import { getTeamMemberProfile } from '../../team-member-pages/myAccount/api';
import { ProfilePhotoUploader } from '../../team-member-pages/myAccount/components/ProfilePhotoUploader';

type NameChanges = { firstName?: string; lastName?: string };

export interface PersonalInformationSectionRef {
  getChanges: () => NameChanges;
  validate: (changes: NameChanges) => boolean;
  showErrors: (fields: NameChanges) => void;
  acceptSaved: (changes: NameChanges) => void;
}

interface PersonalInformationSectionProps {
  onDirtyChange?: (dirty: boolean) => void;
}

/**
 * The account endpoint supplies the owner’s photograph and names. The photo
 * uploads immediately. Name edits are part of the business profile save.
 */
export const PersonalInformationSection = forwardRef<
  PersonalInformationSectionRef,
  PersonalInformationSectionProps
>(({ onDirtyChange }, ref) => {
  const { t } = useTranslation('settings');
  const user = useSelector(selectCurrentUser);

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [original, setOriginal] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });
  const initialNames = useRef(original);
  const savedNames = useRef<Partial<typeof original>>({});
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
        const names = {
          firstName: p.firstName || '', lastName: p.lastName || '', ...savedNames.current,
        };
        setFirstName(value => value === initialNames.current.firstName ? names.firstName : value);
        setLastName(value => value === initialNames.current.lastName ? names.lastName : value);
        setOriginal(names);
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

  const getChanges = (): NameChanges => {
    const changes: NameChanges = {};
    if (firstName !== original.firstName) changes.firstName = firstName.trim();
    if (lastName !== original.lastName) changes.lastName = lastName.trim();
    return changes;
  };

  const showErrors = (fields: NameChanges) => {
    setErrors(fields);
    setTouched({ firstName: !!fields.firstName, lastName: !!fields.lastName });
  };

  const validate = (changes: NameChanges) => {
    const fields: NameChanges = {};
    if (changes.firstName !== undefined) {
      fields.firstName = validatePersonName('firstName', changes.firstName, t) ?? undefined;
    }
    if (changes.lastName !== undefined) {
      fields.lastName = validatePersonName('lastName', changes.lastName, t) ?? undefined;
    }
    showErrors(fields);
    return !fields.firstName && !fields.lastName;
  };

  const acceptSaved = (changes: NameChanges) => {
    Object.assign(savedNames.current, changes);
    setOriginal(previous => ({ ...previous, ...changes }));
    const { firstName: acceptedFirst, lastName: acceptedLast } = changes;
    if (acceptedFirst !== undefined) {
      setFirstName(value => value.trim() === acceptedFirst ? acceptedFirst : value);
    }
    if (acceptedLast !== undefined) {
      setLastName(value => value.trim() === acceptedLast ? acceptedLast : value);
    }
  };

  useImperativeHandle(ref, () => ({ getChanges, validate, showErrors, acceptSaved }));

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
            reserveErrorSpace={false}
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
            reserveErrorSpace={false}
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
