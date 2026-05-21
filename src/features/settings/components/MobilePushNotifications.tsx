import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from '../../../shared/components/ui/radio-group';
import { translateMessageCode } from '../../../shared/utils/error';
import {
  getMobilePushPreference,
  updateMobilePushPreference,
  type MobilePushPreference,
} from '../api';

const OPTIONS: MobilePushPreference[] = [
  'my_notifications',
  'all_notifications',
  'no_notifications',
];

/**
 * Lets the business owner choose which mobile push notifications they receive on
 * the Zavoia mobile app. The preference is persisted via the API and selecting an
 * option saves it immediately.
 */
const MobilePushNotifications: React.FC = () => {
  const { t } = useTranslation('settings');
  const [preference, setPreference] = useState<MobilePushPreference | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingValue, setSavingValue] = useState<MobilePushPreference | null>(null);

  useEffect(() => {
    let active = true;
    getMobilePushPreference()
      .then((res) => {
        if (active) setPreference(res.preference);
      })
      .catch(() => {
        if (active) toast.error(t('profile.mobilePush.loadFailed'));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [t]);

  const handleChange = async (next: string) => {
    const value = next as MobilePushPreference;
    if (value === preference || savingValue) return;

    const previous = preference;
    setPreference(value);
    setSavingValue(value);
    try {
      await updateMobilePushPreference(value);
      toast.success(t('profile.mobilePush.saved'));
    } catch (error: any) {
      setPreference(previous);
      const message = error?.response?.data?.message || error?.message;
      toast.error(
        message
          ? translateMessageCode(Array.isArray(message) ? message[0] : message)
          : t('profile.mobilePush.saveFailed'),
      );
    } finally {
      setSavingValue(null);
    }
  };

  if (isLoading) {
    return (
      <div className="profile-radio-loading">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{t('profile.mobilePush.loading')}</span>
      </div>
    );
  }

  return (
    <RadioGroup
      className="profile-radio-list"
      value={preference ?? undefined}
      onValueChange={handleChange}
    >
      {OPTIONS.map((option) => {
        const id = `mobile-push-${option}`;
        const selected = preference === option;
        return (
          <label
            key={option}
            htmlFor={id}
            className={`profile-radio-option${selected ? ' profile-radio-option-selected' : ''}`}
          >
            <RadioGroupItem value={option} id={id} className="mt-0.5 shrink-0" />
            <div className="profile-radio-text">
              <div className="profile-radio-title">
                {t(`profile.mobilePush.options.${option}.title`)}
                {savingValue === option && (
                  <Loader2 className="h-3 w-3 animate-spin text-foreground-3" />
                )}
              </div>
              <div className="profile-radio-desc">
                {t(`profile.mobilePush.options.${option}.description`)}
              </div>
            </div>
          </label>
        );
      })}
    </RadioGroup>
  );
};

export default MobilePushNotifications;
