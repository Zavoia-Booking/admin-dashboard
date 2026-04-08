import React from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, AlertCircle, CreditCard, Settings, ArrowRight, LifeBuoy } from 'lucide-react';
import { Button } from '../../ui/button';
import { selectCurrentUser, selectAuthStatus, selectAuthIsRegistration } from '../../../../features/auth/selectors';
import { UserRole } from '../../../types/auth';
import { AuthStatusEnum } from '../../../../features/auth/types';

/**
 * SubscriptionGate - Global overlay that blocks UI when subscription is not active.
 *
 * Applies to all authenticated roles. Shows nothing for:
 * - Users with active entitlements (trial or active subscription)
 * - Excluded routes: /settings/*, /my-settings/*, /support, /info, /welcome, /register, /login
 *
 * Variants by subscription status:
 * - past_due / unpaid   → warning  "Payment Issue"       (OWNER: update payment; others: contact admin)
 * - incomplete / incomplete_expired → warning "Setup Incomplete" (OWNER: complete setup; others: contact admin)
 * - expired / no_subscription / canceled → error "Subscription Required" (OWNER: manage; others: contact admin)
 */
export const SubscriptionGate: React.FC = () => {
  const { t } = useTranslation('settings');
  const currentUser = useSelector(selectCurrentUser);
  const authStatus = useSelector(selectAuthStatus);
  const isRegistration = useSelector(selectAuthIsRegistration);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  if (!currentUser) return null;
  if (authStatus !== AuthStatusEnum.AUTHENTICATED) return null;
  if (isRegistration) return null;

  // Users still in the onboarding wizard — no subscription expected yet
  if (!currentUser.wizardCompleted) return null;

  // LTD users are always entitled — defense-in-depth against backend inconsistency
  if (currentUser.entitlements?.status === 'ltd') return null;

  // Trial users and active subscribers are entitled
  const isEntitled = currentUser.entitlements?.entitled ?? false;
  if (isEntitled) return null;

  if (
    pathname.startsWith('/settings') ||
    pathname.startsWith('/my-settings') ||
    pathname.startsWith('/support') ||
    pathname.startsWith('/info') ||
    pathname.startsWith('/welcome') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth')
  ) {
    return null;
  }

  const entitlementStatus = currentUser.entitlements?.status;
  const subscriptionStatus = currentUser.subscription?.status;
  const isOwner = currentUser.role === UserRole.OWNER;

  // Determine visual variant
  const isPaymentIssue =
    entitlementStatus === 'past_due' ||
    subscriptionStatus === 'past_due' ||
    subscriptionStatus === 'unpaid';

  const isSetupIncomplete =
    subscriptionStatus === 'incomplete' ||
    subscriptionStatus === 'incomplete_expired';

  type Variant = {
    iconBg: string;
    iconColor: string;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    message: string;
    buttonLabel: string;
    buttonVariant: 'default' | 'destructive';
    onAction: () => void;
  };

  let variant: Variant;

  if (!isOwner) {
    variant = {
      iconBg: 'bg-muted',
      iconColor: 'text-foreground-3',
      icon: <Lock className="size-6" />,
      title: t('subscriptionGate.nonOwner.title'),
      subtitle: t('subscriptionGate.nonOwner.subtitle'),
      message: t('subscriptionGate.nonOwner.message'),
      buttonLabel: '',
      buttonVariant: 'default',
      onAction: () => {},
    };
  } else if (isPaymentIssue) {
    variant = {
      iconBg: 'bg-warning-bg',
      iconColor: 'text-warning',
      icon: <CreditCard className="size-6" />,
      title: t('subscriptionGate.paymentIssue.title'),
      subtitle: t('subscriptionGate.paymentIssue.subtitle'),
      message: t('subscriptionGate.paymentIssue.message'),
      buttonLabel: t('subscriptionGate.paymentIssue.button'),
      buttonVariant: 'default',
      onAction: () => navigate('/settings?tab=billing'),
    };
  } else if (isSetupIncomplete) {
    variant = {
      iconBg: 'bg-warning-bg',
      iconColor: 'text-warning',
      icon: <Settings className="size-6" />,
      title: t('subscriptionGate.setupIncomplete.title'),
      subtitle: t('subscriptionGate.setupIncomplete.subtitle'),
      message:
        subscriptionStatus === 'incomplete_expired'
          ? t('subscriptionGate.setupIncomplete.messageExpired')
          : t('subscriptionGate.setupIncomplete.messageIncomplete'),
      buttonLabel:
        subscriptionStatus === 'incomplete_expired'
          ? t('subscriptionGate.setupIncomplete.buttonExpired')
          : t('subscriptionGate.setupIncomplete.buttonIncomplete'),
      buttonVariant: 'default',
      onAction: () => navigate('/settings?tab=billing'),
    };
  } else {
    // expired / no_subscription / canceled
    variant = {
      iconBg: 'bg-error-bg',
      iconColor: 'text-error',
      icon: <Lock className="size-6" />,
      title: t('subscriptionGate.subscriptionRequired.title'),
      subtitle: t('subscriptionGate.subscriptionRequired.subtitle'),
      message: t('subscriptionGate.subscriptionRequired.message'),
      buttonLabel: t('subscriptionGate.subscriptionRequired.button'),
      buttonVariant: 'destructive',
      onAction: () => navigate('/settings?tab=billing'),
    };
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="max-w-md w-full mx-4 bg-card border border-border rounded-xl shadow-lg">
        <div className="p-6 text-center space-y-5">
          {/* Icon */}
          <div className="flex justify-center">
            <div className={`size-14 rounded-full ${variant.iconBg} flex items-center justify-center ${variant.iconColor}`}>
              {variant.icon}
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold text-foreground-1">
              {variant.title}
            </h2>
            <div className="flex items-center justify-center gap-1.5 text-foreground-3">
              <AlertCircle className="size-4" />
              <span className="text-sm font-medium">{variant.subtitle}</span>
            </div>
          </div>

          {/* Message */}
          <p className="text-sm text-foreground-2 leading-relaxed">{variant.message}</p>

          {/* Actions */}
          {isOwner ? (
            <Button
              onClick={variant.onAction}
              variant={variant.buttonVariant}
              rounded="full"
              size="lg"
              className="w-full"
            >
              {variant.buttonLabel}
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                onClick={() => navigate('/my-settings')}
                variant="outline"
                rounded="full"
                size="lg"
                className="flex-1"
              >
                <Settings className="size-4" />
                {t('subscriptionGate.nonOwner.buttonSettings')}
              </Button>
              <Button
                onClick={() => navigate('/support')}
                variant="outline"
                rounded="full"
                size="lg"
                className="flex-1"
              >
                <LifeBuoy className="size-4" />
                {t('subscriptionGate.nonOwner.buttonSupport')}
              </Button>
            </div>
          )}

          {/* Footer */}
          <p className="text-xs text-foreground-3">
            {isOwner
              ? t('subscriptionGate.ownerFooter')
              : t('subscriptionGate.nonOwner.contactAdmin')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionGate;
