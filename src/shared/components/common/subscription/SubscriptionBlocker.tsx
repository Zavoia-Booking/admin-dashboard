import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AlertCircle, ArrowRight, LifeBuoy } from 'lucide-react';
import {
  Dialog,
  DialogPortal,
  DialogTitle,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils';
import { usePlatform } from '../../../hooks/usePlatform';
import {
  selectCurrentUser,
  selectIsEntitled,
} from '../../../../features/auth/selectors';
import { logoutRequestAction } from '../../../../features/auth/actions';
import { UserRole } from '../../../types/auth';

const ALWAYS_ALLOWED = new Set<string>([
  '/support',
  '/welcome',
  '/terms',
  '/cookies',
  '/privacy',
  '/verify-email',
  '/reset-password',
  '/link-business-account',
  '/auth/callback',
  '/login',
  '/register',
  '/team-invitation',
  '/info',
  '/account-info',
]);

const OWNER_ALLOWED = new Set<string>(['/account']);
const MEMBER_ALLOWED = new Set<string>(['/my-account', '/my-profile']);

/**
 * Full-screen blocker shown on web when the business is not entitled. Hard-gated
 * off on Capacitor builds — Apple/Google policy forbids surfacing subscription
 * friction in native app stores.
 */
export const SubscriptionBlocker: React.FC = () => {
  const { t } = useTranslation('common');
  const { isNative } = usePlatform();
  const isEntitled = useSelector(selectIsEntitled);
  const currentUser = useSelector(selectCurrentUser);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isOwner = currentUser?.role === UserRole.OWNER;
  const isOwnerWithoutBusiness = isOwner && !currentUser?.wizardCompleted;

  const allowedHere = useMemo(() => {
    const path = location.pathname;
    if (ALWAYS_ALLOWED.has(path)) return true;
    if (isOwner && OWNER_ALLOWED.has(path)) return true;
    if (!isOwner && MEMBER_ALLOWED.has(path)) return true;
    return false;
  }, [location.pathname, isOwner]);

  if (isNative) return null;
  if (isEntitled) return null;
  if (!currentUser) return null;
  if (isOwnerWithoutBusiness) return null;
  if (allowedHere) return null;

  const title = isOwner
    ? t('limitedUsage.blockerOwnerTitle')
    : t('limitedUsage.blockerMemberTitle');
  const description = isOwner
    ? t('limitedUsage.blockerOwnerDescription')
    : t('limitedUsage.blockerMemberDescription');
  const ctaLabel = isOwner
    ? t('limitedUsage.blockerOwnerCta')
    : t('limitedUsage.blockerMemberCta');

  const handleCta = () => {
    if (isOwner) {
      navigate('/account?tab=billing');
    } else {
      navigate('/support');
    }
  };

  const handleSignOut = () => {
    dispatch(logoutRequestAction.request());
  };

  return (
    <Dialog open modal>
      <DialogPortal>
        <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className={cn(
            'data-[state=open]:animate-in data-[state=open]:fade-in-0',
            'data-[state=open]:zoom-in-[0.97] data-[state=open]:duration-250',
            'fixed left-[50%] top-[50%] z-[300] flex w-[calc(100%-2rem)] max-w-md translate-x-[-50%] translate-y-[-50%]',
            'flex-col gap-5 rounded-2xl border border-border bg-white p-6 shadow-xl dark:bg-surface',
            'focus:outline-none focus-visible:outline-none',
          )}
        >
          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-warning/20 bg-warning/10">
              {isOwner ? (
                <AlertCircle className="h-7 w-7 text-warning" strokeWidth={2.25} />
              ) : (
                <LifeBuoy className="h-7 w-7 text-warning" strokeWidth={2.25} />
              )}
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-lg font-semibold text-foreground-1">
                {title}
              </DialogTitle>
              <p className="text-sm leading-relaxed text-foreground-3 dark:text-foreground-2">
                {description}
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleCta}
            className="btn-primary w-full rounded-full font-semibold flex items-center justify-center gap-2 h-11"
          >
            <span>{ctaLabel}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>

          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs text-foreground-3 hover:text-foreground-1 underline-offset-2 hover:underline self-center"
          >
            {t('limitedUsage.blockerSignOut')}
          </button>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default SubscriptionBlocker;
