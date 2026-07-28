import React, { useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogPortal, DialogTitle } from '../../ui/dialog';
import {
  modalScrim,
  modalPanelLarge,
  modalEyebrow,
  modalTitleLarge,
  modalBody,
  modalFooterRow,
  modalGhost,
  modalSecondary,
  modalPrimary,
  ModalArrow,
} from '../../ui/modal-tokens';
import { usePlatform } from '../../../hooks/usePlatform';
import { selectCurrentUser } from '../../../../features/auth/selectors';
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
  const currentUser = useSelector(selectCurrentUser);
  // Wait until /me has populated entitlements before deciding to block.
  // During the brief window between session refresh (which seeds a partial
  // user from JWT claims) and the /me response, `entitlements` is undefined —
  // treat that as "still loading" rather than "not entitled" to avoid a
  // flash of the blocker on cold load.
  const entitlementsLoaded = currentUser?.entitlements !== undefined;
  const isEntitled = currentUser?.entitlements?.entitled === true;
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isOwner = currentUser?.role === UserRole.OWNER;
  const isOwnerWithoutBusiness = isOwner && !currentUser?.wizardCompleted;
  const contentRef = useRef<HTMLDivElement>(null);

  const allowedHere = useMemo(() => {
    const path = location.pathname;
    if (ALWAYS_ALLOWED.has(path)) return true;
    if (isOwner && OWNER_ALLOWED.has(path)) return true;
    if (!isOwner && MEMBER_ALLOWED.has(path)) return true;
    return false;
  }, [location.pathname, isOwner]);

  if (isNative) return null;
  if (!currentUser) return null;
  if (!entitlementsLoaded) return null;
  if (isEntitled) return null;
  if (isOwnerWithoutBusiness) return null;
  if (allowedHere) return null;

  const eyebrow = isOwner
    ? t('limitedUsage.blockerEyebrowOwner')
    : t('limitedUsage.blockerEyebrowMember');
  const title = isOwner
    ? t('limitedUsage.blockerOwnerTitle')
    : t('limitedUsage.blockerMemberTitle');
  const description = isOwner
    ? t('limitedUsage.blockerOwnerDescription')
    : t('limitedUsage.blockerMemberDescription');
  const primaryLabel = isOwner
    ? t('limitedUsage.blockerOwnerCta')
    : t('limitedUsage.blockerMemberCta');
  const secondaryLabel = isOwner
    ? t('limitedUsage.blockerOwnerSecondaryCta')
    : t('limitedUsage.blockerMemberSecondaryCta');

  const handlePrimary = () => {
    navigate(isOwner ? '/account?tab=billing' : '/support');
  };

  const handleSecondary = () => {
    navigate(isOwner ? '/account' : '/my-account');
  };

  const handleSignOut = () => {
    dispatch(logoutRequestAction.request());
  };

  return (
    <Dialog open modal>
      <DialogPortal>
        <div className={modalScrim} data-state="open" />
        <DialogPrimitive.Content
          ref={contentRef}
          aria-describedby={undefined}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onOpenAutoFocus={(e) => {
            // Focus the Content panel itself (tabindex=-1) instead of letting
            // Radix auto-focus the first button — prevents a stale :focus-visible
            // ring from appearing after Cmd+R.
            e.preventDefault();
            contentRef.current?.focus();
          }}
          className={`${modalPanelLarge} sm:max-w-[560px]`}
        >
          <div className={modalEyebrow}>{eyebrow}</div>

          <DialogTitle className={modalTitleLarge}>{title}</DialogTitle>

          <p className={`mt-3.5 mb-7 max-w-[420px] ${modalBody}`}>{description}</p>

          {/* Footer row. Desktop: sign-out left, secondary + primary right.
              Mobile: stack with primary on top, then secondary, then sign-out. */}
          <div className={modalFooterRow}>
            <div className="order-2 flex justify-center sm:order-1 sm:justify-start">
              <button type="button" onClick={handleSignOut} className={`${modalGhost} whitespace-nowrap`}>
                {t('limitedUsage.blockerSignOut')}
              </button>
            </div>

            <div className="order-1 flex flex-col-reverse gap-2 sm:order-2 sm:shrink-0 sm:flex-row">
              <button type="button" onClick={handleSecondary} className={`${modalSecondary} shrink-0 whitespace-nowrap`}>
                {secondaryLabel}
              </button>

              <button type="button" onClick={handlePrimary} className={`${modalPrimary} shrink-0 whitespace-nowrap`}>
                <span>{primaryLabel}</span>
                <ModalArrow />
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default SubscriptionBlocker;
