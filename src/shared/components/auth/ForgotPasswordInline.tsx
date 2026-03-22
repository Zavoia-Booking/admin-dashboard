import { useState } from "react";
import { Button } from "../../components/ui/button";
import CredentialsForm from "./CredentialsForm";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
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
    <div className="w-full pt-6">
      <CardHeader className="space-y-1 px-6 py-4 md:px-8 md:py-6">
        <CardTitle className="text-xl md:text-2xl text-center">{t('forgotPassword.title')}</CardTitle>
        <CardDescription className="text-center text-sm">
          {t('forgotPassword.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-6 md:px-8">
        {!isSubmitted ? (
          <>
            <CredentialsForm
              onSubmit={({ email }) => onSubmit(email)}
              submitLabel={t('forgotPassword.submitLabel')}
              isLoading={isLoading}
              onEmailChange={setEmail}
              showPasswordField={false}
            />
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                rounded="full"
                onClick={onBack}
                className="h-9 px-4 w-full"
              >
                {t('forgotPassword.backToLogin')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
              {t('forgotPassword.successMessage')}
            </div>
          </>
        )}
      </CardContent>
      {isSubmitted && (
        <CardFooter className="flex flex-col gap-3 pt-0 md:pt-2 px-6 md:px-8 pb-4 md:pb-6">
          <Button type="button" variant="outline" rounded="full" className="w-full" onClick={onBack}>{t('forgotPassword.backToLogin')}</Button>
        </CardFooter>
      )}
    </div>
  );
}


