import React from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, AlertCircle, CreditCard, Settings } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { selectCurrentUser, selectAuthStatus, selectAuthIsRegistration } from '../../../../features/auth/selectors';
import { UserRole } from '../../../types/auth';
import { AuthStatusEnum } from '../../../../features/auth/types';

/**
 * SubscriptionGate - Global overlay that blocks UI when subscription is not active.
 *
 * Applies to all authenticated roles. Shows nothing for:
 * - Users with active entitlements (trial or active subscription)
 * - Excluded routes: /settings/*, /info, /welcome, /register, /login
 *
 * Variants by subscription status:
 * - past_due / unpaid   → amber  "Payment Issue"       (OWNER: update payment; others: contact admin)
 * - incomplete / incomplete_expired → amber "Setup Incomplete" (OWNER: complete setup; others: contact admin)
 * - expired / no_subscription / canceled → red "Subscription Required" (OWNER: manage; others: contact admin)
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

  // LTD users are always entitled — defense-in-depth against backend inconsistency
  if (currentUser.entitlements?.status === 'ltd') return null;

  const isEntitled = currentUser.entitlements?.entitled ?? false;
  if (isEntitled) return null;

  if (
    pathname.startsWith('/settings') ||
    pathname.startsWith('/info') ||
    pathname.startsWith('/welcome') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/login')
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

  // Variant config
  type Variant = {
    bg: string;
    border: string;
    iconBg: string;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    message: string;
    buttonLabel: string;
    buttonClass: string;
    onAction: () => void;
  };

  let variant: Variant;

  if (!isOwner) {
    // Non-owner: generic message, no action button
    variant = {
      bg: 'bg-black/80',
      border: 'border-gray-200',
      iconBg: 'bg-gray-100 dark:bg-gray-800',
      icon: <Lock className="h-8 w-8 text-gray-500 dark:text-gray-400" />,
      title: t('subscriptionGate.nonOwner.title'),
      subtitle: t('subscriptionGate.nonOwner.subtitle'),
      message: t('subscriptionGate.nonOwner.message'),
      buttonLabel: '',
      buttonClass: '',
      onAction: () => {},
    };
  } else if (isPaymentIssue) {
    variant = {
      bg: 'bg-amber-950/80',
      border: 'border-amber-200',
      iconBg: 'bg-amber-100 dark:bg-amber-950/30',
      icon: <CreditCard className="h-8 w-8 text-amber-600 dark:text-amber-400" />,
      title: t('subscriptionGate.paymentIssue.title'),
      subtitle: t('subscriptionGate.paymentIssue.subtitle'),
      message: t('subscriptionGate.paymentIssue.message'),
      buttonLabel: t('subscriptionGate.paymentIssue.button'),
      buttonClass: 'bg-amber-600 hover:bg-amber-700',
      onAction: () => navigate('/settings?tab=billing'),
    };
  } else if (isSetupIncomplete) {
    variant = {
      bg: 'bg-amber-950/80',
      border: 'border-amber-200',
      iconBg: 'bg-amber-100 dark:bg-amber-950/30',
      icon: <Settings className="h-8 w-8 text-amber-600 dark:text-amber-400" />,
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
      buttonClass: 'bg-amber-600 hover:bg-amber-700',
      onAction: () => navigate('/settings?tab=billing'),
    };
  } else {
    // expired / no_subscription / canceled
    variant = {
      bg: 'bg-black/80',
      border: 'border-red-200',
      iconBg: 'bg-red-100 dark:bg-red-950/30',
      icon: <Lock className="h-8 w-8 text-red-600 dark:text-red-400" />,
      title: t('subscriptionGate.subscriptionRequired.title'),
      subtitle: t('subscriptionGate.subscriptionRequired.subtitle'),
      message: t('subscriptionGate.subscriptionRequired.message'),
      buttonLabel: t('subscriptionGate.subscriptionRequired.button'),
      buttonClass: 'bg-red-600 hover:bg-red-700',
      onAction: () => navigate('/settings?tab=billing'),
    };
  }

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center backdrop-blur-sm ${variant.bg}`}>
      <Card className={`max-w-md w-full ${variant.border} shadow-lg`}>
        <CardContent className="pt-6 pb-8 px-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className={`h-16 w-16 rounded-full ${variant.iconBg} flex items-center justify-center`}>
              {variant.icon}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {variant.title}
            </h2>
            <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">{variant.subtitle}</span>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-400 text-base">{variant.message}</p>

          {isOwner && (
            <div className="pt-4">
              <Button
                onClick={variant.onAction}
                className={`w-full text-white font-semibold py-6 text-base ${variant.buttonClass}`}
                size="lg"
              >
                {variant.buttonLabel}
              </Button>
            </div>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-500">
            {isOwner
              ? t('subscriptionGate.ownerFooter')
              : t('subscriptionGate.nonOwner.contactAdmin')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionGate;
