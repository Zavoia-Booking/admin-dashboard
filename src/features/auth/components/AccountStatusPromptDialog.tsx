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
import { useTranslation } from "react-i18next";

/**
 * Dialog shown during Google login/register when the user's account
 * is disabled or scheduled for deletion. Gives them the choice to
 * reactivate / cancel deletion, or decline and stay logged out.
 */
export default function AccountStatusPromptDialog() {
  const { t, i18n } = useTranslation('auth');
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
    ? new Date(user.deletionScheduledAt).toLocaleDateString(i18n.language, {
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
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning-bg">
                <Power className="h-5 w-5 text-warning" />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-error-bg">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
            )}
            <AlertDialogTitle>
              {isDisabled ? t('accountStatus.inactive.title') : t('accountStatus.deletion.title')}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm leading-relaxed">
            {isDisabled ? (
              t('accountStatus.inactive.description')
            ) : (
              <>
                {t('accountStatus.deletion.descriptionPrefix')}
                {deletionDate ? (
                  <>
                    {" "}{t('accountStatus.deletion.descriptionOn')}{" "}<span className="font-semibold text-foreground">{deletionDate}</span>
                  </>
                ) : null}
                {t('accountStatus.deletion.descriptionSuffix')}
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-2">
          <Button
            variant="outline"
            rounded="full"
            onClick={handleDecline}
            disabled={isLoading}
          >
            {isDisabled ? t('accountStatus.inactive.decline') : t('accountStatus.deletion.decline')}
          </Button>
          <Button
            rounded="full"
            onClick={handleAccept}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Spinner size="sm" color="white" />
                {isDisabled ? t('accountStatus.inactive.loading') : t('accountStatus.deletion.loading')}
              </>
            ) : (
              isDisabled ? t('accountStatus.inactive.accept') : t('accountStatus.deletion.accept')
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
