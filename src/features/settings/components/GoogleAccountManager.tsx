import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '../../../shared/components/ui/button';
import { Label } from '../../../shared/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../shared/components/ui/dialog';
import { Input } from '../../../shared/components/ui/input';
import { Loader2, Link as LinkIcon, Unlink, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { RootState } from '../../../app/providers/store';
import { unlinkGoogleAction, linkGoogleByCodeAction } from '../../auth/actions';
import { useGoogleLogin } from '@react-oauth/google';

interface GoogleAccountManagerProps {
  className?: string;
  onSetPasswordClick?: () => void;
}

const GoogleAccountManager: React.FC<GoogleAccountManagerProps> = ({ className, onSetPasswordClick }) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const linkingLoading = useSelector((state: RootState) => (state as any).auth.linkingLoading) as boolean;
  const linkingError = useSelector((state: RootState) => (state as any).auth.linkingError) as string | null;
  
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [unlinkAttempted, setUnlinkAttempted] = useState(false);

  const isGoogleLinked = !!user?.googleSub;
  // Only show "needs password" screen if user has attempted unlink AND got the specific error
  const needsPasswordFirst = unlinkAttempted && (linkingError?.includes('AUTH.E11') || linkingError?.includes('set a password first'));
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
      toast.error('Password is required to unlink your Google account');
      return;
    }

    setUnlinkAttempted(true);
    dispatch(unlinkGoogleAction.request({ password }));
  };

  const handleLinkClick = () => {
    try {
      sessionStorage.setItem('oauthMode', 'link');
      sessionStorage.setItem('oauthReturnTo', '/settings');
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
        toast.error('Unable to get code from Google');
        return;
      }
      dispatch(linkGoogleByCodeAction.request({ code: resp.code, redirectUri }));
    },
    onError: () => {
      toast.error('Google popup was closed or failed');
    },
  } as any);

  return (
    <>
      <div className={`space-y-2 ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="space-y-1 flex-1 min-w-0">
            <Label className="text-sm font-medium text-foreground">Google Account</Label>
            <p className="text-xs text-muted-foreground line-clamp-2 sm:line-clamp-none">
              {isGoogleLinked 
                ? 'Your Google account is linked for easy sign-in' 
                : 'Link your Google account for convenient access'
              }
            </p>
          </div>
          <div className="flex items-center gap-2 sm:justify-end">
            {isGoogleLinked ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-800 text-xs font-medium ring-1 ring-green-200">
                  <LinkIcon className="h-3 w-3" />
                  Linked
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUnlinkClick}
                  disabled={linkingLoading}
                  aria-busy={linkingLoading}
                  className="h-auto py-1.5 px-4 rounded-full text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  {linkingLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Unlinking
                    </>
                  ) : (
                    <>
                      <Unlink className="h-3 w-3 mr-1" />
                      Unlink
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                  <Unlink className="h-3 w-3" />
                  Not linked
                </div>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleLinkClick}
                  disabled={linkingLoading}
                  aria-busy={linkingLoading}
                  className="h-auto py-1.5 px-4 rounded-full"
                >
                  {linkingLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Linking
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-3 w-3 mr-1" />
                      Link
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Unlink Confirmation Dialog */}
      <Dialog open={showUnlinkDialog} onOpenChange={(open) => {
        if (!open && !linkingLoading) {
          setShowUnlinkDialog(false);
          setPassword('');
          setUnlinkAttempted(false);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          {needsPasswordFirst ? (
            // Show "set password first" message
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Password Required
                </DialogTitle>
                <DialogDescription className="pt-2">
                  You signed up with Google and don't have a password set yet. To unlink your Google account, you first need to set up a password so you can still access your account.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground">
                  Once you've set a password, you can come back here to unlink your Google account.
                </p>
              </div>
              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUnlinkDialog(false);
                    setPassword('');
                    setUnlinkAttempted(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowUnlinkDialog(false);
                    setPassword('');
                    setUnlinkAttempted(false);
                    onSetPasswordClick?.();
                  }}
                >
                  Set Up Password
                </Button>
              </DialogFooter>
            </>
          ) : (
            // Normal unlink flow with password confirmation
            <>
              <DialogHeader>
                <DialogTitle>Unlink Google Account</DialogTitle>
                <DialogDescription>
                  To unlink your Google account, please confirm your account password. 
                  You'll still be able to sign in with your email and password.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Current Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className={`w-full ${unlinkAttempted && linkingError ? 'border-destructive' : ''}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !linkingLoading) {
                        handleUnlinkConfirm();
                      }
                    }}
                    disabled={linkingLoading}
                  />
                  {unlinkAttempted && linkingError && (
                    <p className="text-sm text-destructive">{linkingError}</p>
                  )}
                </div>
              </div>
              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUnlinkDialog(false);
                    setPassword('');
                    setUnlinkAttempted(false);
                  }}
                  disabled={linkingLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleUnlinkConfirm}
                  disabled={!password.trim() || linkingLoading}
                >
                  {linkingLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Unlinking...
                    </>
                  ) : (
                    'Unlink Account'
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GoogleAccountManager;
