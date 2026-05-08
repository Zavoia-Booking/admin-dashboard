import React, { useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogPortal, DialogTitle } from '../../ui/dialog';
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
        {/* Warm-grey scrim with subtle blur — lets the dashboard read through
            faintly without competing with the modal. Fade-in tied to Radix
            data-state via tailwindcss-animate. */}
        <div
          className="fixed inset-0 z-[300] bg-[oklch(15%_0.004_70/0.42)] backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0"
          data-state="open"
        />
        <DialogPrimitive.Content
          ref={contentRef}
          aria-describedby={undefined}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onOpenAutoFocus={(e) => {
            // Radix auto-focuses the first focusable child by default —
            // that's the sign-out button in our DOM order. After a Cmd+R
            // refresh, the browser's :focus-visible heuristic carries over
            // and shows a ring on whichever button receives that focus,
            // which reads like a "pressed" state. Focus the Content panel
            // itself instead: it has tabindex=-1, so screen readers still
            // announce the dialog, but no visible focus ring appears. The
            // ring shows only when a keyboard user actually Tabs to a
            // button.
            e.preventDefault();
            contentRef.current?.focus();
          }}
          className={[
            'fixed left-1/2 top-1/2 z-[300] w-[calc(100%-2rem)] max-w-[520px] -translate-x-1/2 -translate-y-1/2',
            'rounded-2xl bg-neutral-50 text-neutral-900',
            'p-7 sm:p-10',
            'shadow-[0_24px_56px_oklch(15%_0.004_70/0.22),0_2px_8px_oklch(15%_0.004_70/0.10)]',
            'focus:outline-none focus-visible:outline-none',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.97] data-[state=open]:duration-250',
          ].join(' ')}
        >
          {/* Eyebrow — small caps, terracotta. Sets the editorial tone. */}
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-700">
            {eyebrow}
          </div>

          <DialogTitle className="m-0 text-[26px] sm:text-[28px] font-semibold leading-[1.15] tracking-[-0.022em] text-neutral-900">
            {title}
          </DialogTitle>

          <p className="mt-3.5 mb-7 max-w-[420px] text-[15px] leading-[1.55] text-neutral-700 [text-wrap:pretty]">
            {description}
          </p>

          {/* Footer row. Desktop: sign-out left, secondary + primary right.
              Mobile: stack with primary on top, then secondary, then sign-out. */}
          <div className="flex flex-col gap-3 border-t border-neutral-200 pt-5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="order-2 flex justify-center sm:order-1 sm:justify-start">
              <button
                type="button"
                onClick={handleSignOut}
                className="cursor-pointer appearance-none rounded-md border-0 bg-transparent px-3 py-2 text-[13px] font-medium text-neutral-600 underline-offset-[3px] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-neutral-400/40"
              >
                {t('limitedUsage.blockerSignOut')}
              </button>
            </div>

            <div className="order-1 flex flex-col-reverse gap-2 sm:order-2 sm:flex-row">
              <button
                type="button"
                onClick={handleSecondary}
                className="cursor-pointer rounded-full border border-neutral-200 bg-neutral-50 px-[22px] py-3 text-[14px] font-medium text-neutral-900 outline-none transition-colors duration-150 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-primary-500/30"
              >
                {secondaryLabel}
              </button>

              {/* Primary button: pill, inset highlight + soft drop shadow,
                  arrow icon nudges right on hover. The group/translate is the
                  one moment of motion that earns its keep. */}
              <button
                type="button"
                onClick={handlePrimary}
                className={[
                  'group inline-flex cursor-pointer items-center justify-center gap-2',
                  'rounded-full bg-primary-500 px-[22px] py-3',
                  'text-[14px] font-semibold tracking-[-0.005em] text-neutral-50',
                  'shadow-[inset_0_1px_0_oklch(100%_0_0/0.18),0_1px_2px_oklch(15%_0.004_70/0.18)]',
                  'outline-none transition-[background,transform] duration-150',
                  'hover:bg-primary-600 hover:-translate-y-[0.5px]',
                  'active:translate-y-0',
                  'focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50',
                ].join(' ')}
              >
                <span>{primaryLabel}</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="transition-transform duration-200 group-hover:translate-x-[2px]"
                  aria-hidden="true"
                >
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default SubscriptionBlocker;
