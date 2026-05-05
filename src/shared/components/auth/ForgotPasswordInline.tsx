import { useState } from "react";
import { Button } from "../../components/ui/button";
import CredentialsForm from "./CredentialsForm";
import { useTranslation } from "react-i18next";

type Props = {
  isSubmitted: boolean;
  onSubmit: (email: string) => void;
  onBack: () => void;
  isLoading?: boolean;
};

export default function ForgotPasswordInline({ isSubmitted, onSubmit, onBack, isLoading }: Props) {
  const { t } = useTranslation('auth');
  const [, setEmail] = useState("");

  return (
    <div className="flex flex-col gap-4 w-full">
      {!isSubmitted ? (
        <>
          <CredentialsForm
            onSubmit={({ email }) => onSubmit(email)}
            submitLabel={t('forgotPassword.submitLabel')}
            isLoading={isLoading}
            onEmailChange={setEmail}
            showPasswordField={false}
          />
          <Button
            type="button"
            variant="outline"
            rounded="full"
            onClick={onBack}
            className="w-full"
          >
            {t('forgotPassword.backToLogin')}
          </Button>
        </>
      ) : (
        <>
          <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
            {t('forgotPassword.successMessage')}
          </div>
          <Button type="button" variant="outline" rounded="full" className="w-full" onClick={onBack}>
            {t('forgotPassword.backToLogin')}
          </Button>
        </>
      )}
    </div>
  );
}


