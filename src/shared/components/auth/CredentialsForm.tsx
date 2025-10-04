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
};

function CredentialsFormBase({
  onSubmit,
  submitLabel = "Continue",
  isLoading,
  defaultEmail,
  autoFocusField = "email",
  className,
  onEmailChange,
}: Props, ref: React.Ref<CredentialsFormHandle>) {
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (defaultEmail) setEmail(defaultEmail);
  }, [defaultEmail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    <form onSubmit={handleSubmit} className={className}>
      <div className="grid gap-3">
        <Label htmlFor="cred-email">Email</Label>
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
            className="h-10 md:h-12 bg-gray-50 border border-gray-200 pr-10 focus:border-blue-500 focus:outline-none transition-colors"
          />
          <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
      </div>
      <div className="mt-3 grid gap-3">
        <Label htmlFor="cred-password">Password</Label>
        <div className="relative">
          <Input
            id="cred-password"
            type={showPassword ? "text" : "password"}
            value={password}
            autoFocus={autoFocusField === "password"}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={!!isLoading}
            className="h-10 md:h-12 bg-gray-50 border border-gray-200 pr-10 focus:border-blue-500 focus:outline-none transition-colors"
          />
          <button
            type="button"
            className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0 border-0 bg-transparent w-4 h-4 flex items-center justify-center cursor-pointer"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <Button type="submit" className="w-full mt-8" disabled={!!isLoading}>
        {submitLabel}
      </Button>
    </form>
  );
}

const CredentialsForm = forwardRef<CredentialsFormHandle, Props>(CredentialsFormBase);

export default CredentialsForm;


