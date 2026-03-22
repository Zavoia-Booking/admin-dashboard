import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectAccountLinkingRequired, selectAuthIsLoading, selectAuthError } from "../selectors";
import { sendBusinessLinkEmailAction, closeAccountLinkingRequiredModal, clearAuthErrorAction } from "../actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../shared/components/ui/dialog";
import { Button } from "../../../shared/components/ui/button";
import { Alert, AlertDescription } from "../../../shared/components/ui/alert";
import { Spinner } from "../../../shared/components/ui/spinner";
import { InfoIcon, Briefcase, Mail, AlertTriangle } from "lucide-react";
import { useTranslation, Trans } from "react-i18next";

export default function AccountLinkingRequiredModal() {
  const { t } = useTranslation('auth');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const accountLinking = useSelector(selectAccountLinkingRequired);
  const isLoading = useSelector(selectAuthIsLoading);
  const authError = useSelector(selectAuthError);
  const isOpen = !!accountLinking;
  const wasLoadingRef = useRef(false);
  const wasOpenRef = useRef(false);

  // Clear error when modal closes
  useEffect(() => {
    if (!isOpen && authError) {
      dispatch(clearAuthErrorAction());
    }
  }, [isOpen, authError, dispatch]);

  // Track when modal was open and we started loading
  useEffect(() => {
    if (isOpen && isLoading) {
      wasLoadingRef.current = true;
      wasOpenRef.current = true;
    }
  }, [isOpen, isLoading]);

  // Redirect to login when email sent successfully
  useEffect(() => {
    if (!accountLinking && !isLoading && wasLoadingRef.current && wasOpenRef.current) {
      // Email was sent successfully (accountLinkingRequired cleared)
      navigate('/login', { replace: true });
      wasLoadingRef.current = false;
      wasOpenRef.current = false;
    }
  }, [accountLinking, isLoading, navigate]);

  const handleConfirm = () => {
    if (accountLinking?.email) {
      dispatch(sendBusinessLinkEmailAction.request({ 
        email: accountLinking.email,
        tx_id: accountLinking.tx_id 
      }));
    }
  };

  const handleClose = () => {
    dispatch(closeAccountLinkingRequiredModal());
  };

  if (!accountLinking) return null;

  const { email, firstName, lastName, existingRoles } = accountLinking;
  const roleType = existingRoles.customer ? t('accountLinkingRequired.roleCustomer') : t('accountLinkingRequired.roleTeamMember');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            {t('accountLinkingRequired.title')}
          </DialogTitle>
          <DialogDescription>
            {t('accountLinkingRequired.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>
                  <strong>{firstName} {lastName}</strong> ({email})
                </p>
                <p className="text-sm">
                  <Trans
                    i18nKey="accountLinkingRequired.existingAccountInfo"
                    ns="auth"
                    values={{ role: roleType }}
                    components={{ strong: <strong /> }}
                  />
                </p>
              </div>
            </AlertDescription>
          </Alert>

          {authError ? (
            <Alert className="border-warning-border bg-warning-bg">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning">
                {authError}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-start gap-2">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-sm">{t('accountLinkingRequired.whatHappensNext')}</p>
                  <ul className="text-sm text-muted-foreground space-y-1 mt-2 list-disc list-inside">
                    <li><Trans i18nKey="accountLinkingRequired.stepSendEmail" ns="auth" values={{ email }} components={{ strong: <strong /> }} /></li>
                    <li>{t('accountLinkingRequired.stepClickLink')}</li>
                    <li>{t('accountLinkingRequired.stepAccessBoth')}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" rounded="full" onClick={handleClose} disabled={isLoading}>
            {t('accountLinkingRequired.cancel')}
          </Button>
          <Button rounded="full" onClick={handleConfirm} disabled={isLoading} className="relative">
            <span className={isLoading ? 'invisible' : ''}>
              {t('accountLinkingRequired.sendConfirmationEmail')}
            </span>
            {isLoading && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Spinner size="sm" color="white" />
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

