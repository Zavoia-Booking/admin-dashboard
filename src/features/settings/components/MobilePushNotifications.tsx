import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '../../../shared/components/ui/switch';
import { getErrorMessage } from '../../../shared/utils/error';
import {
  getMobilePushPreference,
  updateMobilePushPreference,
  type MobilePushPreference,
} from '../api';

type Scope = 'mine' | 'team';

const SCOPE_OPTIONS: { value: Scope; titleKey: string; descKey: string }[] = [
  {
    value: 'mine',
    titleKey: 'profile.mobilePush.scope.mine.title',
    descKey: 'profile.mobilePush.scope.mine.description',
  },
  {
    value: 'team',
    titleKey: 'profile.mobilePush.scope.team.title',
    descKey: 'profile.mobilePush.scope.team.description',
  },
];

function preferenceToScope(pref: MobilePushPreference): Scope {
  return pref === 'all_notifications' ? 'team' : 'mine';
}

function toPreference(on: boolean, scope: Scope): MobilePushPreference {
  if (!on) return 'no_notifications';
  return scope === 'team' ? 'all_notifications' : 'my_notifications';
}

const MobilePushNotifications: React.FC = () => {
  const { t } = useTranslation('settings');
  const [preference, setPreference] = useState<MobilePushPreference | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const save = async (next: MobilePushPreference) => {
    if (next === preference || saving) return;
    const previous = preference;
    setPreference(next);
    setSaving(true);
    try {
      await updateMobilePushPreference(next);
      toast.success(t('profile.mobilePush.saved'));
    } catch (error: any) {
      setPreference(previous);
      toast.error(getErrorMessage(error, t('profile.mobilePush.saveFailed')));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="profile-mobile-push" aria-busy="true">
        <div className="profile-mobile-push-head">
          <div className="profile-mobile-push-head-text">
            <span className="profile-mobile-push-skeleton-line" style={{ width: '52%', height: 15 }} />
            <span className="profile-mobile-push-skeleton-line" style={{ width: '68%' }} />
          </div>
          <span className="profile-mobile-push-skeleton-pill" aria-hidden />
        </div>
      </div>
    );
  }

  const isOn = preference !== null && preference !== 'no_notifications';
  const scope: Scope = preference ? preferenceToScope(preference) : 'mine';

  return (
    <div className="profile-mobile-push">
      {/* ── Integrated header: title + description + toggle ── */}
      <div className="profile-mobile-push-head">
        <div className="profile-mobile-push-head-text">
          <h3 id="profile-section-mobile-push" className="profile-section-title">
            {t('profile.mobilePush.title')}
          </h3>
          <p className="profile-section-sub">{t('profile.mobilePush.description')}</p>
        </div>

        <div className="profile-mobile-push-master-control">
          {saving && (
            <span className="profile-mobile-push-master-spinner" aria-hidden>
              <Loader2 className="size-3.5 animate-spin" />
            </span>
          )}
          <Switch
            id="mobile-push-master"
            aria-labelledby="profile-section-mobile-push"
            checked={isOn}
            onCheckedChange={(checked) => save(toPreference(checked, scope))}
            disabled={saving}
          />
        </div>
      </div>

      {/* Scope cards — only rendered when the master toggle is on */}
      {isOn && (
        <div className="profile-mobile-push-scope">
          <div
            className="profile-mobile-push-scope-grid"
            role="radiogroup"
            aria-label={t('profile.mobilePush.scope.label')}
          >
            {SCOPE_OPTIONS.map(({ value, titleKey, descKey }) => {
              const id = `mobile-push-scope-${value}`;
              const selected = scope === value;
              return (
                <label
                  key={value}
                  htmlFor={id}
                  className={`profile-mobile-push-scope-card${selected ? ' selected' : ''}`}
                >
                  <input
                    type="radio"
                    id={id}
                    name="mobile-push-scope"
                    value={value}
                    checked={selected}
                    onChange={() => save(toPreference(true, value))}
                    disabled={saving}
                    className="sr-only"
                  />
                  <span className="profile-mobile-push-scope-card-head">
                    <span className="profile-mobile-push-scope-card-title">{t(titleKey)}</span>
                    <span className="profile-mobile-push-scope-card-radio" aria-hidden="true" />
                  </span>
                  <span className="profile-mobile-push-scope-card-desc">{t(descKey)}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobilePushNotifications;
