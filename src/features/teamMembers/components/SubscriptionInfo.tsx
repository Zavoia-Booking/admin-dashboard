import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Users, CheckCircle2, AlertTriangle, Sparkles, Ban, ArrowRight } from 'lucide-react';
import type { AuthUser } from '../../auth/types';
import type { SubscriptionSummary } from '../../settings/types';
import { WebOnly } from '../../../shared/components/common/platform/PlatformGate';

interface SubscriptionInfoProps {
  currentUser: AuthUser | null;
  subscriptionSummary: SubscriptionSummary | null;
  onClose: () => void;
}

/* Editorial design tokens: semantic CSS variables (--info-bg, --warning-bg, etc.)
   surfaced through Tailwind's bg-info-bg / text-info / border-info-border utilities.
   Matches the .profile-banner and .bv2-line-row patterns from billing/profile pages.
*/

const StatRow: React.FC<{ label: string; value: React.ReactNode; isLast?: boolean }> = ({
  label,
  value,
  isLast,
}) => (
  <div
    className={`grid grid-cols-[1fr_auto] gap-3 items-center py-3 text-[13.5px] ${
      isLast ? '' : 'border-b border-dashed border-border'
    }`}
  >
    <span className="flex items-center gap-2.5 min-w-0">
      <Users className="h-4 w-4 text-foreground-3 shrink-0" aria-hidden />
      <span className="font-medium text-foreground-1 truncate">{label}</span>
    </span>
    <span className="font-semibold text-foreground-1 tabular-nums">{value}</span>
  </div>
);

const Banner: React.FC<{
  tone: 'good' | 'warn' | 'danger' | 'info';
  icon: React.ReactNode;
  title?: string;
  children: React.ReactNode;
  action?: { label: string; onClick: () => void };
}> = ({ tone, icon, title, children, action }) => {
  const toneClasses = {
    good: 'bg-success-bg border-success-border',
    warn: 'bg-warning-bg border-warning-border',
    danger: 'bg-error-bg border-error-border',
    info: 'bg-info-bg border-info-border',
  }[tone];

  const iconColor = {
    good: 'text-success',
    warn: 'text-warning',
    danger: 'text-error',
    info: 'text-info',
  }[tone];

  const ctaTone = {
    good: 'bg-success hover:bg-success/90',
    warn: 'bg-warning hover:bg-warning/90',
    danger: 'bg-error hover:bg-error/90',
    info: 'bg-info hover:bg-info/90',
  }[tone];

  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${toneClasses}`}>
      <span className={`${iconColor} shrink-0 mt-0.5`}>{icon}</span>
      <div className="flex-1 min-w-0 space-y-2.5">
        <div>
          {title && (
            <strong className="block font-semibold text-foreground-1 text-[13.5px]">
              {title}
            </strong>
          )}
          <div className={`text-[12.5px] leading-relaxed text-foreground-2 ${title ? 'mt-0.5' : ''}`}>
            {children}
          </div>
        </div>
        {action && (
          <WebOnly>
            <button
              type="button"
              onClick={action.onClick}
              className={`inline-flex items-center gap-2 rounded-full px-4 h-9 text-[13px] font-medium text-white transition-colors ${ctaTone}`}
            >
              {action.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </WebOnly>
        )}
      </div>
    </div>
  );
};

export const SubscriptionInfo: React.FC<SubscriptionInfoProps> = ({
  currentUser,
  subscriptionSummary,
  onClose,
}) => {
  const { t } = useTranslation('teamMembers');
  const navigate = useNavigate();

  const paidSeats = currentUser?.entitlements?.paidTeamSeats ?? subscriptionSummary?.currentTeamMembersCount ?? 0;
  const usedSeats = subscriptionSummary?.usedSeats ?? 0;
  const availableSeats = paidSeats - usedSeats;
  const hasAvailableSeats = availableSeats > 0;

  const subscriptionStatus = currentUser?.subscription?.status;
  const isCancelled = subscriptionStatus === 'canceled';
  const entStatus = currentUser?.entitlements?.status;
  const isExpiredOrNoSubscription = entStatus === 'expired' || entStatus === 'no_subscription';

  const trialEndsAt = currentUser?.subscription?.trialEndsAt;
  const isTrial = !!trialEndsAt && new Date(trialEndsAt) > new Date();

  const goToBilling = () => {
    onClose();
    navigate('/account?tab=billing');
  };

  // Case 1: Trial - unlimited invitations
  if (isTrial) {
    return (
      <>
        <div className="rounded-xl border border-border bg-surface px-4">
          <StatRow label={t('subscriptionInfo.teamMembers')} value={usedSeats} isLast />
        </div>
        <Banner tone="info" icon={<Sparkles className="h-4 w-4" />}>
          {t('subscriptionInfo.trialMessage')}
        </Banner>
      </>
    );
  }

  // Case 1.5: LTD user - show LTD-specific messaging
  const isLtd = entStatus === 'ltd';
  if (isLtd && paidSeats === 0) {
    return (
      <Banner
        tone="good"
        icon={<CheckCircle2 className="h-4 w-4" />}
        title={t('subscriptionInfo.ltdActive')}
        action={{ label: t('subscriptionInfo.ltdPurchaseSeats'), onClick: goToBilling }}
      >
        {t('subscriptionInfo.ltdNoSeats')}
      </Banner>
    );
  }

  // Case 2: Expired trial or no subscription - must subscribe
  if (isExpiredOrNoSubscription) {
    return (
      <Banner
        tone="warn"
        icon={<AlertTriangle className="h-4 w-4" />}
        title={t('subscriptionInfo.subscriptionRequired')}
        action={{ label: t('subscriptionInfo.goToBilling'), onClick: goToBilling }}
      >
        {t('subscriptionInfo.subscriptionRequiredDescription')}
      </Banner>
    );
  }

  // Case 3: Cancelled - need to renew
  if (isCancelled) {
    return (
      <Banner
        tone="danger"
        icon={<Ban className="h-4 w-4" />}
        title={t('subscriptionInfo.subscriptionCancelled')}
        action={{ label: t('subscriptionInfo.renewSubscription'), onClick: goToBilling }}
      >
        {t('subscriptionInfo.subscriptionCancelledDescription')}
      </Banner>
    );
  }

  // Case 4: Active subscription
  return (
    <>
      <div className="rounded-xl border border-border bg-surface px-4">
        <StatRow label={t('subscriptionInfo.paidSeats')} value={paidSeats} />
        <StatRow
          label={t('subscriptionInfo.usedSeats')}
          value={
            <span>
              {usedSeats} <span className="text-foreground-3 font-normal">/</span> {paidSeats}
            </span>
          }
          isLast
        />
      </div>

      {hasAvailableSeats ? (
        <Banner tone="good" icon={<CheckCircle2 className="h-4 w-4" />}>
          {t('subscriptionInfo.availableSeats', { count: availableSeats })}
        </Banner>
      ) : (
        <Banner
          tone="warn"
          icon={<AlertTriangle className="h-4 w-4" />}
          title={t('subscriptionInfo.allSeatsInUse')}
        >
          {t('subscriptionInfo.allSeatsInUseDescription')}
        </Banner>
      )}
    </>
  );
};
