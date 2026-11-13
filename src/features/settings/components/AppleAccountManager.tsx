import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Loader2, Link as LinkIcon, Unlink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../../shared/components/ui/button';
import { Label } from '../../../shared/components/ui/label';
import { Input } from '../../../shared/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../shared/components/ui/dialog';
import {
  modalPanel,
  modalEyebrow,
  modalTitleCompact,
  modalBody,
  modalFooterRowRight,
  modalCancel,
  modalPrimary,
} from '../../../shared/components/ui/modal-tokens';
import type { RootState } from '../../../app/providers/store';
import { setAuthUserAction } from '../../auth/actions';
import { linkAppleApi, unlinkAppleApi } from '../../auth/api';
import type { AppleAccountResponse } from '../../auth/types';
import {
  appleSignIn,
  isAppleSignInAvailable,
  isAppleSignInCancel,
  prepareAppleSignIn,
} from '../../auth/lib/appleAuth';
import { getErrorMessage } from '../../../shared/utils/error';

interface AppleAccountManagerProps {
  className?: string;
  /** Opens the page's "set a password" section (Apple is the only sign-in method). */
  onSetPasswordClick?: () => void;
}

const isApiError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'response' in error && !!(error as { response?: unknown }).response;

/**
 * "Sign in with Apple" row in Account (owner) and My account (team member).
 * Connect opens Apple's sheet (iOS) or popup (web) and POSTs /auth/link/apple;
 * Disconnect POSTs /auth/unlink/apple, with the password when the account has
 * one. Driven by /auth/me's `apple` and `signInMethods`.
 */
const AppleAccountManager: React.FC<AppleAccountManagerProps> = ({ className, onSetPasswordClick }) => {
  const { t } = useTranslation('settings');
  const dispatch = useDispatch();
  const store = useStore<RootState>();
  const user = useSelector((state: RootState) => state.auth.user);
  const available = isAppleSignInAvailable();

  const [connecting, setConnecting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [unlinking, setUnlinking] = useState(false);
  const [unlinkError, setUnlinkError] = useState<string | null>(null);
  const [lastMethodRejected, setLastMethodRejected] = useState(false);

  // Load Apple JS now so Connect can open Apple's popup straight away.
  useEffect(() => {
    if (!available) return;
    prepareAppleSignIn().catch((error) => {
      console.warn('Sign in with Apple could not be prepared:', error);
    });
  }, [available]);

  if (!available || !user) return null;

  const apple = user.apple;
  const linked = !!apple?.linked;
  const methods = user.signInMethods;
  const hasPassword = methods ? methods.includes('password') : user.hasPassword === true;
  const hasOtherMethod = methods ? methods.some((m) => m !== 'apple') : user.hasPassword === true || !!user.googleSub;
  const needsPasswordFirst = linked && (!hasOtherMethod || lastMethodRejected);
  const busy = connecting || unlinking;

  // Merge into the latest user (a /me refetch may have landed meanwhile).
  const applyAccount = (response: AppleAccountResponse) => {
    const current = store.getState().auth.user;
    if (!current) return;
    dispatch(setAuthUserAction({ user: { ...current, apple: response.apple, signInMethods: response.signInMethods } }));
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const credential = await appleSignIn();
      const response = await linkAppleApi(credential);
      applyAccount(response);
      toast.success(t('appleAccount.toast.connected'));
    } catch (error) {
      if (isAppleSignInCancel(error)) return;
      // API refusals (already used by another account, …) arrive as APPLE.* codes.
      toast.error(isApiError(error) ? getErrorMessage(error) : t('appleAccount.toast.appleFailed'));
    } finally {
      setConnecting(false);
    }
  };

  const resetDialog = () => {
    setPassword('');
    setUnlinkError(null);
    setLastMethodRejected(false);
  };

  const openDisconnect = () => {
    resetDialog();
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (unlinking) return;
    setDialogOpen(false);
    resetDialog();
  };

  const handleDisconnect = async () => {
    if (hasPassword && !password.trim()) {
      setUnlinkError(t('appleAccount.toast.passwordRequired'));
      return;
    }
    setUnlinking(true);
    setUnlinkError(null);
    try {
      const response = await unlinkAppleApi(hasPassword ? { password } : {});
      applyAccount(response);
      setDialogOpen(false);
      resetDialog();
      toast.success(t('appleAccount.toast.disconnected'));
    } catch (error) {
      const code = (error as { response?: { data?: { code?: string } } })?.response?.data?.code;
      if (code === 'apple_unlink_last_method') {
        setLastMethodRejected(true);
      } else if (code === 'apple_link_proof_invalid') {
        setUnlinkError(t('appleAccount.wrongPassword'));
      } else {
        setUnlinkError(getErrorMessage(error));
      }
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <>
      <div className={`space-y-2 ${className ?? ''}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="space-y-1 flex-1 min-w-0">
            <Label className="text-sm font-medium text-foreground">{t('appleAccount.label')}</Label>
            <p className="text-xs text-muted-foreground line-clamp-2 sm:line-clamp-none">
              {linked ? t('appleAccount.linkedDescription') : t('appleAccount.unlinkedDescription')}
            </p>
            {linked && apple?.isPrivateEmail && apple.email && (
              <p className="text-xs text-muted-foreground">
                {t('appleAccount.relayNote', { email: apple.email })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 sm:justify-end">
            {linked ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success-bg text-success text-xs font-medium ring-1 ring-success-border">
                  <LinkIcon className="h-3 w-3" />
                  {t('appleAccount.linked')}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openDisconnect}
                  disabled={busy}
                  aria-busy={unlinking}
                  className="!h-7 !min-h-0 py-1.5 px-4 rounded-full text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <Unlink className="h-3 w-3 mr-1" />
                  {t('appleAccount.unlink')}
                </Button>
              </>
            ) : (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-foreground-3 text-xs font-medium">
                  <Unlink className="h-3 w-3" />
                  {t('appleAccount.notLinked')}
                </div>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => { void handleConnect(); }}
                  disabled={busy}
                  aria-busy={connecting}
                  className="!h-7 !min-h-0 py-1.5 px-4 rounded-full"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      {t('appleAccount.linking')}
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-3 w-3 mr-1" />
                      {t('appleAccount.link')}
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className={modalPanel}>
          {needsPasswordFirst ? (
            <>
              <DialogHeader className="space-y-4 !text-left">
                <div className={modalEyebrow}>{t('appleAccount.passwordRequiredEyebrow')}</div>
                <DialogTitle className={`${modalTitleCompact} text-left`}>
                  {t('appleAccount.passwordRequired')}
                </DialogTitle>
                <DialogDescription asChild>
                  <div className="space-y-3 text-left">
                    <p className={modalBody}>{t('appleAccount.passwordRequiredDescription')}</p>
                    <p className={modalBody}>{t('appleAccount.passwordRequiredHint')}</p>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className={`${modalFooterRowRight} mt-7`}>
                <button type="button" onClick={closeDialog} className={modalCancel}>
                  {t('appleAccount.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDialogOpen(false);
                    resetDialog();
                    onSetPasswordClick?.();
                  }}
                  className={modalPrimary}
                >
                  {t('appleAccount.setUpPassword')}
                </button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader className="space-y-3 !text-left">
                <div className={modalEyebrow}>{t('appleAccount.unlinkEyebrow')}</div>
                <DialogTitle className={`${modalTitleCompact} text-left`}>
                  {t('appleAccount.unlinkTitle')}
                </DialogTitle>
                <DialogDescription asChild>
                  <p className={modalBody}>
                    {hasPassword ? t('appleAccount.unlinkDescriptionPassword') : t('appleAccount.unlinkDescriptionGoogle')}
                  </p>
                </DialogDescription>
              </DialogHeader>
              {hasPassword && (
                <div className="mt-5 space-y-2">
                  <Label htmlFor="apple-unlink-password" className="text-[13px] font-medium text-neutral-700 dark:text-foreground-2">
                    {t('appleAccount.currentPassword')}
                  </Label>
                  <Input
                    id="apple-unlink-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('appleAccount.currentPasswordPlaceholder')}
                    className={`w-full ${unlinkError ? 'border-destructive' : ''}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !unlinking) void handleDisconnect();
                    }}
                    disabled={unlinking}
                  />
                </div>
              )}
              {unlinkError && (
                <p className="mt-2 text-[13px] text-destructive" role="alert">{unlinkError}</p>
              )}
              <DialogFooter className={`${modalFooterRowRight} mt-7`}>
                <button type="button" onClick={closeDialog} disabled={unlinking} className={modalCancel}>
                  {t('appleAccount.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => { void handleDisconnect(); }}
                  disabled={(hasPassword && !password.trim()) || unlinking}
                  className={`${modalPrimary} bg-destructive hover:bg-destructive/90 focus-visible:ring-destructive/40`}
                >
                  {unlinking ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('appleAccount.unlinkingLong')}
                    </>
                  ) : (
                    t('appleAccount.unlinkAccount')
                  )}
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AppleAccountManager;
