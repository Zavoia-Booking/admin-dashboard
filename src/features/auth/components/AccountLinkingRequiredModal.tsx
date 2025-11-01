import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectAccountLinkingRequired, selectAuthIsLoading } from "../selectors";
import { sendBusinessLinkEmailAction, closeAccountLinkingRequiredModal } from "../actions";
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
import { InfoIcon, Briefcase, Mail } from "lucide-react";

export default function AccountLinkingRequiredModal() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const accountLinking = useSelector(selectAccountLinkingRequired);
  const isLoading = useSelector(selectAuthIsLoading);
  const isOpen = !!accountLinking;
  const wasLoadingRef = useRef(false);

  // Track when we're sending the email
  useEffect(() => {
    if (isLoading) {
      wasLoadingRef.current = true;
    }
  }, [isLoading]);

  // Redirect to login when email sent successfully
  useEffect(() => {
    if (!accountLinking && !isLoading && wasLoadingRef.current) {
      // Email was sent successfully (accountLinkingRequired cleared)
      navigate('/login', { replace: true });
      wasLoadingRef.current = false;
    }
  }, [accountLinking, isLoading, navigate]);

  const handleConfirm = () => {
    if (accountLinking?.email) {
      dispatch(sendBusinessLinkEmailAction.request({ email: accountLinking.email }));
    }
  };

  const handleClose = () => {
    dispatch(closeAccountLinkingRequiredModal());
  };

  if (!accountLinking) return null;

  const { email, firstName, lastName, existingRoles } = accountLinking;
  const roleType = existingRoles.customer ? "customer" : "team member";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Account Already Exists
          </DialogTitle>
          <DialogDescription>
            We found an existing account with your email
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
                  You already have a <strong>{roleType} account</strong> on our platform. 
                  We can link it to a new business owner account so you can manage your own business.
                </p>
              </div>
            </AlertDescription>
          </Alert>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex items-start gap-2">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-sm">What happens next?</p>
                <ul className="text-sm text-muted-foreground space-y-1 mt-2 list-disc list-inside">
                  <li>We'll send a confirmation email to <strong>{email}</strong></li>
                  <li>Click the link in the email to complete the synchronization</li>
                  <li>You'll be able to access both accounts with the same email</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Sending...
              </>
            ) : (
              'Send Confirmation Email'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

