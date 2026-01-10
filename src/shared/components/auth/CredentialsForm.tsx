import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Mail, Eye, EyeOff } from "lucide-react";

export type CredentialsFormHandle = {
  reset: () => void;
  hidePassword: () => void;
};

type Props = {
  onSubmit: (values: { email: string; password: string }) => void;
  submitLabel?: string;
  isLoading?: boolean;
  defaultEmail?: string;
  autoFocusField?: "email" | "password";
  className?: string;
  onEmailChange?: (email: string) => void;
  showPasswordField?: boolean;
  emailPattern?: RegExp;
  emailErrorMessage?: string;
  passwordValidator?: (value: string) => true | string;
};

function CredentialsFormBase({
  onSubmit,
  submitLabel = "Continue",
  isLoading,
  defaultEmail,
  autoFocusField = "email",
  className,
  onEmailChange,
  showPasswordField = true,
  emailPattern = /[^@\s]+@[^@\s]+\.[^@\s]+/,
  emailErrorMessage = 'Enter a valid email',
  passwordValidator,
}: Props, ref: React.Ref<CredentialsFormHandle>) {
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultEmail) setEmail(defaultEmail);
  }, [defaultEmail]);

  const validateEmailField = (value: string): string | null => {
    if (!value) return 'Email is required';
    if (emailPattern && !emailPattern.test(value)) return emailErrorMessage;
    return null;
  };

  const validatePasswordField = (value: string): string | null => {
    if (!showPasswordField) return null;
    if (!value) return 'Password is required';
    if (passwordValidator) {
      const result = passwordValidator(value);
      if (result !== true) return typeof result === 'string' ? result : 'Invalid password';
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const emailErr = validateEmailField(email);
    const passwordErr = validatePasswordField(password);

    setEmailError(emailErr);
    setPasswordError(passwordErr);

    if (emailErr || passwordErr) return;

    onSubmit({ email, password });
  };

  useImperativeHandle(ref, () => ({
    reset: () => {
      setEmail("");
      setPassword("");
      setShowPassword(false);
    },
    hidePassword: () => setShowPassword(false),
  }));

  return (
    <form onSubmit={handleSubmit} noValidate className={className}>
      <div className="space-y-2">
        <Label htmlFor="cred-email" className="text-base font-medium text-foreground-1">
          Email {!showPasswordField && '*'}
        </Label>
        <div className="relative">
          <Input
            id="cred-email"
            type="email"
            placeholder="m@example.com"
            value={email}
            autoFocus={autoFocusField === "email"}
            onChange={(e) => {
              setEmail(e.target.value);
              onEmailChange?.(e.target.value);
            }}
            required
            disabled={!!isLoading}
            className={`!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
              emailError
                ? 'border-destructive bg-error-bg focus-visible:ring-error'
                : 'border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus'
            }`}
            aria-invalid={!!emailError}
          />
          <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
        </div>
        <div className="h-5">
          {emailError && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
              <span>{emailError}</span>
            </p>
          )}
        </div>
      </div>
      {showPasswordField && (
        <div className="mt-4 space-y-2">
          <Label htmlFor="cred-password" className="text-base font-medium text-foreground-1">Password *</Label>
          <div className="relative">
            <Input
              id="cred-password"
              type={showPassword ? "text" : "password"}
              value={password}
              autoFocus={autoFocusField === "password"}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={!!isLoading}
              className={`!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                passwordError
                  ? 'border-destructive bg-error-bg focus-visible:ring-error'
                  : 'border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus'
              }`}
              aria-invalid={!!passwordError}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary-hover p-0 border-0 bg-transparent w-4 h-4 flex items-center justify-center cursor-pointer transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="h-5">
            {passwordError && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                <span>{passwordError}</span>
              </p>
            )}
          </div>
        </div>
      )}
      <Button type="submit" className="w-full mt-8" disabled={!!isLoading}>
        {submitLabel}
      </Button>
    </form>
  );
}

const CredentialsForm = forwardRef<CredentialsFormHandle, Props>(CredentialsFormBase);

export default CredentialsForm;


