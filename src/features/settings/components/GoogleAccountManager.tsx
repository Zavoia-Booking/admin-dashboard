import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../shared/components/ui/button';
import { Label } from '../../../shared/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../shared/components/ui/dialog';
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '../../../shared/components/ui/drawer';
import { Input } from '../../../shared/components/ui/input';
import { Loader2, Link as LinkIcon, Unlink } from 'lucide-react';
import {
  modalPanel,
  modalEyebrow,
  modalTitleCompact,
  modalBody,
  modalFooterRowRight,
  modalCancel,
  modalPrimary,
  drawerSheet,
  drawerScrim,
} from '../../../shared/components/ui/modal-tokens';
import { useIsMobile } from '../../../shared/hooks/use-mobile';
import { cn } from '../../../shared/lib/utils';
import { toast } from 'sonner';
import type { RootState } from '../../../app/providers/store';
import { unlinkGoogleAction, linkGoogleByCodeAction } from '../../auth/actions';
import { useGoogleLogin } from '@react-oauth/google';

interface GoogleAccountManagerProps {
  className?: string;
  onSetPasswordClick?: () => void;
  returnUrl?: string;
}

const GoogleAccountManager: React.FC<GoogleAccountManagerProps> = ({ className, onSetPasswordClick, returnUrl = '/account' }) => {
  const { t } = useTranslation('settings');
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const linkingLoading = useSelector((state: RootState) => (state as any).auth.linkingLoading) as boolean;
  const linkingError = useSelector((state: RootState) => (state as any).auth.linkingError) as string | null;
  const linkingErrorCode = useSelector((state: RootState) => (state as any).auth.linkingErrorCode) as string | null;
  const isMobile = useIsMobile();

  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [unlinkAttempted, setUnlinkAttempted] = useState(false);

  const isGoogleLinked = !!user?.googleSub;
  // Show the "set a password first" branch when we know the user has no password yet,
  // or when the backend rejected an unlink attempt with AUTH.E11. Comparing against the
  // raw error code (not the translated message) keeps this correct across locales.
  const userHasNoPassword = user?.hasPassword === false;
  const backendRejectedAsNoPassword = unlinkAttempted && linkingErrorCode === 'AUTH.E11';
  const needsPasswordFirst = isGoogleLinked && (userHasNoPassword || backendRejectedAsNoPassword);
  const prevGoogleLinked = useRef(isGoogleLinked);

  useEffect(() => {
    try {
      const msg = sessionStorage.getItem('postLinkToast');
      const type = sessionStorage.getItem('postLinkToastType');
      if (msg) {
        if (type === 'success') toast.success(msg);
        else if (type === 'error') toast.error(msg);
        else toast.message?.(msg as any) || toast.info(msg);
        sessionStorage.removeItem('postLinkToast');
        sessionStorage.removeItem('postLinkToastType');
      }
    } catch {}
  }, []);

  // Close dialog when unlink succeeds (googleSub becomes null)
  useEffect(() => {
    if (unlinkAttempted && prevGoogleLinked.current && !isGoogleLinked && !linkingLoading) {
      // Successfully unlinked
      setShowUnlinkDialog(false);
      setPassword('');
      setUnlinkAttempted(false);
    }
    prevGoogleLinked.current = isGoogleLinked;
  }, [isGoogleLinked, linkingLoading, unlinkAttempted]);

  const handleUnlinkClick = () => {
    setShowUnlinkDialog(true);
    setPassword('');
    setUnlinkAttempted(false);
  };

  const handleUnlinkConfirm = () => {
    if (!password.trim()) {
      toast.error(t('googleAccount.toast.passwordRequired'));
      return;
    }

    setUnlinkAttempted(true);
    dispatch(unlinkGoogleAction.request({ password }));
  };

  const handleLinkClick = () => {
    try {
      sessionStorage.setItem('oauthMode', 'link');
      sessionStorage.setItem('oauthReturnTo', returnUrl);
    } catch {}
    loginWithGoogle();
  };

  const redirectUri = (import.meta as any).env?.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/callback`;

  const loginWithGoogle = useGoogleLogin({
    flow: 'auth-code',
    ux_mode: 'redirect',
    redirect_uri: redirectUri,
    onSuccess: (resp: { code?: string }) => {
      if (!resp.code) {
        toast.error(t('googleAccount.toast.unableToGetCode'));
        return;
      }
      dispatch(linkGoogleByCodeAction.request({ code: resp.code, redirectUri }));
    },
    onError: () => {
      toast.error(t('googleAccount.toast.googleFailed'));
    },
  } as any);

  const closeUnlinkDialog = () => {
    setShowUnlinkDialog(false);
    setPassword('');
    setUnlinkAttempted(false);
  };

  // Unlink content, shared by the phone sheet and the desktop dialog.
  const sheetEyebrow = needsPasswordFirst ? t('googleAccount.passwordRequiredEyebrow') : t('googleAccount.unlinkEyebrow');
  const sheetTitle = needsPasswordFirst ? t('googleAccount.passwordRequired') : t('googleAccount.unlinkTitle');
  const sheetBody = needsPasswordFirst ? (
    <div className="space-y-3 text-left">
      <p className={modalBody}>{t('googleAccount.passwordRequiredDescription')}</p>
      <p className={modalBody}>{t('googleAccount.passwordRequiredHint')}</p>
    </div>
  ) : (
    <p className={modalBody}>{t('googleAccount.unlinkDescription')}</p>
  );
  const passwordField = needsPasswordFirst ? null : (
    <div className="mt-5 space-y-2">
      <Label htmlFor="password" className="text-[13px] font-medium text-neutral-700 dark:text-foreground-2">
        {t('googleAccount.currentPassword')}
      </Label>
      <Input
        id="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={t('googleAccount.currentPasswordPlaceholder')}
        className={`w-full ${unlinkAttempted && linkingError ? 'border-destructive' : ''}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !linkingLoading) {
            handleUnlinkConfirm();
          }
        }}
        disabled={linkingLoading}
      />
      {unlinkAttempted && linkingError && (
        <p className="text-[13px] text-destructive">{linkingError}</p>
      )}
    </div>
  );
  const cancelButton = (extraClass?: string) => (
    <button
      type="button"
      onClick={closeUnlinkDialog}
      disabled={!needsPasswordFirst && linkingLoading}
      className={cn(modalCancel, extraClass)}
    >
      {t('googleAccount.cancel')}
    </button>
  );
  const primaryButton = (extraClass?: string) =>
    needsPasswordFirst ? (
      <button
        type="button"
        onClick={() => {
          closeUnlinkDialog();
          onSetPasswordClick?.();
        }}
        className={cn(modalPrimary, extraClass)}
      >
        {t('googleAccount.setUpPassword')}
      </button>
    ) : (
      <button
        type="button"
        onClick={handleUnlinkConfirm}
        disabled={!password.trim() || linkingLoading}
        className={cn(modalPrimary, 'bg-destructive hover:bg-destructive/90 focus-visible:ring-destructive/40', extraClass)}
      >
        {linkingLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {t('googleAccount.unlinkingLong')}
          </>
        ) : (
          t('googleAccount.unlinkAccount')
        )}
      </button>
    );

  return (
    <>
      <div className={`space-y-2 ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="space-y-1 flex-1 min-w-0">
            <Label className="text-sm font-medium text-foreground">{t('googleAccount.label')}</Label>
            <p className="text-xs text-muted-foreground line-clamp-2 sm:line-clamp-none">
              {isGoogleLinked 
                ? t('googleAccount.linkedDescription') 
                : t('googleAccount.unlinkedDescription')
              }
            </p>
          </div>
          <div className="flex items-center gap-2 sm:justify-end">
            {isGoogleLinked ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success-bg text-success text-xs font-medium ring-1 ring-success-border">
                  <LinkIcon className="h-3 w-3" />
                  {t('googleAccount.linked')}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUnlinkClick}
                  disabled={linkingLoading}
                  aria-busy={linkingLoading}
                  className="!h-7 !min-h-0 py-1.5 px-4 rounded-full text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  {linkingLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      {t('googleAccount.unlinking')}
                    </>
                  ) : (
                    <>
                      <Unlink className="h-3 w-3 mr-1" />
                      {t('googleAccount.unlink')}
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-foreground-3 text-xs font-medium">
                  <Unlink className="h-3 w-3" />
                  {t('googleAccount.notLinked')}
                </div>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleLinkClick}
                  disabled={linkingLoading}
                  aria-busy={linkingLoading}
                  className="!h-7 !min-h-0 py-1.5 px-4 rounded-full"
                >
                  {linkingLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      {t('googleAccount.linking')}
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-3 w-3 mr-1" />
                      {t('googleAccount.link')}
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Unlink confirmation: bottom sheet on phones, centred dialog otherwise. */}
      {isMobile ? (
        <Drawer
          open={showUnlinkDialog}
          onOpenChange={(open) => { if (!open && !linkingLoading) closeUnlinkDialog(); }}
          dismissible={!linkingLoading}
          autoFocus
        >
          <DrawerContent className={drawerSheet} overlayClassName={drawerScrim}>
            <div className="min-h-0 flex-1 overflow-y-auto pt-4">
              <div className="space-y-3">
                <div className={modalEyebrow}>{sheetEyebrow}</div>
                <DrawerTitle className={modalTitleCompact}>{sheetTitle}</DrawerTitle>
                <DrawerDescription asChild>{sheetBody}</DrawerDescription>
              </div>
              {passwordField}
            </div>
            {/* Stacked full-width actions: thumb-reachable, primary on top. */}
            <div className="mt-6 flex flex-col gap-2">
              {primaryButton('w-full')}
              {cancelButton('w-full')}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={showUnlinkDialog} onOpenChange={(open) => { if (!open && !linkingLoading) closeUnlinkDialog(); }}>
          <DialogContent className={modalPanel}>
            <DialogHeader className={cn(needsPasswordFirst ? 'space-y-4' : 'space-y-3', '!text-left')}>
              <div className={modalEyebrow}>{sheetEyebrow}</div>
              <DialogTitle className={`${modalTitleCompact} text-left`}>{sheetTitle}</DialogTitle>
              <DialogDescription asChild>{sheetBody}</DialogDescription>
            </DialogHeader>
            {passwordField}
            <DialogFooter className={`${modalFooterRowRight} mt-7`}>
              {cancelButton()}
              {primaryButton()}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default GoogleAccountManager;
