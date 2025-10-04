import { useState } from "react";
import { Button } from "../../components/ui/button";
import CredentialsForm from "./CredentialsForm";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";

type Props = {
  isSubmitted: boolean;
  onSubmit: (email: string) => void;
  onBack: () => void;
  isLoading?: boolean;
};

export default function ForgotPasswordInline({ isSubmitted, onSubmit, onBack, isLoading }: Props) {
  const [, setEmail] = useState("");

  return (
    <div className="w-full pt-6">
      <CardHeader className="space-y-1 px-6 py-4 md:px-8 md:py-6">
        <CardTitle className="text-xl md:text-2xl text-center">Forgot password</CardTitle>
        <CardDescription className="text-center text-sm">
          Enter your email and we will send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-6 md:px-8">
        {!isSubmitted ? (
          <>
            <CredentialsForm
              onSubmit={({ email }) => onSubmit(email)}
              submitLabel="Reset Password"
              isLoading={isLoading}
              onEmailChange={setEmail}
              showPasswordField={false}
            />
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="h-9 px-4 bg-white text-gray-700 border-gray-300 hover:bg-gray-50 w-full"
              >
                Back to login
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
              If an account exists for the provided email, you will receive an email with instructions to reset your password.
            </div>
          </>
        )}
      </CardContent>
      {isSubmitted && (
        <CardFooter className="flex flex-col gap-3 pt-0 md:pt-2 px-6 md:px-8 pb-4 md:pb-6">
          <Button type="button" variant="outline" className="w-full bg-white text-gray-700 border-gray-300 hover:bg-gray-50" onClick={onBack}>Back to login</Button>
        </CardFooter>
      )}
    </div>
  );
}


