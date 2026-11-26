import { useDispatch, useSelector } from "react-redux";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, AlertCircle } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import type { RootState } from "../../../app/providers/store";
import { closeAccountLinkingRequiredModal, ownerUpgradeAction } from "../actions";
import { selectAccountLinkingRequired, selectAuthIsLoading } from "../selectors";
import { cn } from "../../../shared/lib/utils";
import {
  modalScrim,
  modalPanelLarge,
  modalEyebrow,
  modalTitleCompact,
  modalBody,
  modalBodyMuted,
  modalCancel,
  drawerSheet,
  drawerScrim,
  drawerFormBody,
} from "../../../shared/components/ui/modal-tokens";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "../../../shared/components/ui/drawer";
import { useIsMobile } from "../../../shared/hooks/use-mobile";
import CredentialsForm from "../../../shared/components/auth/CredentialsForm";

/**
 * Shown for the 409 `account_exists_needs_business_owner_account` (web and
 * native): an existing customer / team member confirms their password and gets
 * owner access to the same account right here — no email. On success the
 * session is set with isRegistration, so PublicRoute opens the setup wizard.
 */
export default function AccountLinkingRequiredModal() {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const dispatch = useDispatch();
  const accountLinking = useSelector(selectAccountLinkingRequired);
  const isLoading = useSelector(selectAuthIsLoading);
  const upgradeError = useSelector((s: RootState) => s.auth.ownerUpgradeError);
  const isMobile = useIsMobile();

  if (!accountLinking) return null;

  const { email, existingRoles, tx_id } = accountLinking;
  const roleType = existingRoles.customer ? t('accountLinkingRequired.roleCustomer') : t('accountLinkingRequired.roleTeamMember');

  const handleClose = () => {
    if (!isLoading) dispatch(closeAccountLinkingRequiredModal());
  };

  // Content shared by the phone sheet and the desktop / tablet dialog.
  const description = <p className={cn(modalBody, "mt-3")}>{t('accountLinkingRequired.description')}</p>;
  const body = (
    <>
      <p className={cn(modalBodyMuted, "mt-4")}>
        <Trans
          i18nKey="accountLinkingRequired.passwordInfo"
          ns="auth"
          values={{ role: roleType }}
          components={{ strong: <strong className="font-semibold text-neutral-700 dark:text-foreground-2" /> }}
        />
      </p>

      {upgradeError && (
        <p
          className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/20 bg-error-bg px-3 py-2.5 text-[13px] text-destructive"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{upgradeError}</span>
        </p>
      )}

      <CredentialsForm
        className="mt-6"
        onSubmit={({ password }) => {
          dispatch(ownerUpgradeAction.request({ email, password, ...(tx_id ? { tx_id } : {}) }));
        }}
        defaultEmail={email}
        emailReadOnly
        autoFocusField="password"
        submitLabel={t('accountLinkingRequired.confirm')}
        isLoading={isLoading}
      />

      <button
        type="button"
        onClick={handleClose}
        disabled={isLoading}
        className={cn(modalCancel, "mt-3 w-full")}
      >
        {t('accountLinkingRequired.cancel')}
      </button>
    </>
  );

  // Phones: a bottom sheet that follows the keyboard, so the password field
  // and its button stay visible while typing.
  if (isMobile) {
    return (
      <Drawer
        open
        onOpenChange={(open) => { if (!open) handleClose(); }}
        dismissible={!isLoading}
        autoFocus
      >
        <DrawerContent className={drawerSheet} overlayClassName={drawerScrim}>
          <div className={drawerFormBody}>
            <div className={modalEyebrow}>{t('accountLinkingRequired.eyebrow')}</div>
            <DrawerTitle className={modalTitleCompact}>{t('accountLinkingRequired.title')}</DrawerTitle>
            <DrawerDescription asChild>{description}</DrawerDescription>
            {body}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={modalScrim} />
        <DialogPrimitive.Content className={cn(modalPanelLarge, "text-left")}>
          <div className={cn(modalEyebrow, "pr-8")}>{t('accountLinkingRequired.eyebrow')}</div>
          <DialogPrimitive.Title className={cn(modalTitleCompact, "pr-8")}>
            {t('accountLinkingRequired.title')}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description asChild>{description}</DialogPrimitive.Description>

          {body}

          {/* Rendered last so the password field is the first focusable on open; kept top-right via absolute. */}
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            aria-label={tc('aria.close')}
            className={cn(
              "absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg",
              "text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800",
              "dark:text-foreground-3 dark:hover:bg-surface-hover dark:hover:text-foreground-1",
              "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
