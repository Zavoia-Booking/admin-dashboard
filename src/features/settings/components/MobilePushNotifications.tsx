import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { PermissionState } from '@capacitor/core';
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings';
import { Switch } from '../../../shared/components/ui/switch';
import { Button } from '../../../shared/components/ui/button';
import { getErrorMessage } from '../../../shared/utils/error';
import { isNativeApp } from '../../../app/config/env';
import {
  getPushPermissionState,
  requestPushPermissionAndRegister,
} from '../../push-notifications/service';
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
  // OS-level permission is a separate layer from the backend preference: the
  // preference decides what the backend sends, the OS permission decides
  // whether the device shows anything. Denied OS permission makes the toggle
  // a placebo, so it is surfaced explicitly.
  const [osState, setOsState] = useState<PermissionState | null>(null);

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

  useEffect(() => {
    if (!isNativeApp()) return;
    let active = true;
    const refresh = () => {
      void getPushPermissionState()
        .then((state) => {
          if (active) setOsState(state);
        })
        .catch(() => {});
    };
    refresh();
    // Re-check when the app returns from OS settings.
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const save = async (next: MobilePushPreference) => {
    if (next === preference || saving) return;
    const previous = preference;
    setPreference(next);
    setSaving(true);
    try {
      await updateMobilePushPreference(next);
      toast.success(t('profile.mobilePush.saved'));
      // Turning push ON with the OS prompt still unspent: this is the most
      // user-initiated context possible, so fire the system dialog here.
      if (
        next !== 'no_notifications' &&
        (osState === 'prompt' || osState === 'prompt-with-rationale')
      ) {
        const result = await requestPushPermissionAndRegister();
        setOsState(result);
      }
    } catch (error: any) {
      setPreference(previous);
      toast.error(getErrorMessage(error, t('profile.mobilePush.saveFailed')));
    } finally {
      setSaving(false);
    }
  };

  const openOsSettings = () => {
    void NativeSettings.open({
      optionAndroid: AndroidSettings.AppNotification,
      optionIOS: IOSSettings.AppNotification,
    }).catch(() => {});
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

      {/* OS permission hard-denied: the preference alone can't deliver
          anything, so say it and hand over a user-initiated settings path. */}
      {osState === 'denied' && isOn && (
        <div className="profile-banner profile-banner-warn mt-3">
          <AlertTriangle className="profile-banner-icon h-4 w-4" aria-hidden />
          <div className="profile-banner-body">
            {t('profile.mobilePush.osDenied')}
            <div className="mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                rounded="full"
                className="!min-h-0"
                onClick={openOsSettings}
              >
                {t('profile.mobilePush.osDeniedCta')}
              </Button>
            </div>
          </div>
        </div>
      )}

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
