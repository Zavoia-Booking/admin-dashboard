import { useDispatch, useSelector } from "react-redux";
import { selectAccountStatusPrompt, selectAuthIsLoading, selectCurrentUser } from "../selectors";
import { acceptAccountStatusPromptAction, declineAccountStatusPromptAction } from "../actions";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
} from "../../../shared/components/ui/alert-dialog";
import { Button } from "../../../shared/components/ui/button";
import { Spinner } from "../../../shared/components/ui/spinner";
import { Power, Trash2 } from "lucide-react";

/**
 * Dialog shown during Google login/register when the user's account
 * is disabled or scheduled for deletion. Gives them the choice to
 * reactivate / cancel deletion, or decline and stay logged out.
 */
export default function AccountStatusPromptDialog() {
  const dispatch = useDispatch();
  const prompt = useSelector(selectAccountStatusPrompt);
  const isLoading = useSelector(selectAuthIsLoading);
  const user = useSelector(selectCurrentUser);

  if (!prompt) return null;

  const isDisabled = prompt.type === "disabled";

  const handleAccept = () => {
    dispatch(acceptAccountStatusPromptAction());
  };

  const handleDecline = () => {
    dispatch(declineAccountStatusPromptAction());
  };

  const deletionDate = user?.deletionScheduledAt
    ? new Date(user.deletionScheduledAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            {isDisabled ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Power className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
            )}
            <AlertDialogTitle>
              {isDisabled ? "Account Inactive" : "Account Scheduled for Deletion"}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm leading-relaxed">
            {isDisabled ? (
              "Your account is currently inactive. Would you like to reactivate it and continue to your dashboard?"
            ) : (
              <>
                Your account is scheduled to be permanently deleted
                {deletionDate ? (
                  <>
                    {" "}on <span className="font-semibold text-foreground">{deletionDate}</span>
                  </>
                ) : null}
                . Would you like to cancel the deletion and keep your account?
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-2">
          <Button
            variant="outline"
            onClick={handleDecline}
            disabled={isLoading}
          >
            {isDisabled ? "No, stay inactive" : "Continue with deletion"}
          </Button>
          <Button
            onClick={handleAccept}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Spinner size="sm" color="white" />
                {isDisabled ? "Reactivating..." : "Cancelling..."}
              </>
            ) : (
              isDisabled ? "Reactivate" : "Keep my account"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
