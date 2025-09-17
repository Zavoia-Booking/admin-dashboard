import { useState, useEffect } from "react";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";

type Props = {
  onSubmit: (values: { email: string; password: string }) => void;
  submitLabel?: string;
  isLoading?: boolean;
  defaultEmail?: string;
  autoFocusField?: "email" | "password";
  className?: string;
  onEmailChange?: (email: string) => void;
};

export default function CredentialsForm({
  onSubmit,
  submitLabel = "Continue",
  isLoading,
  defaultEmail,
  autoFocusField = "email",
  className,
  onEmailChange,
}: Props) {
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (defaultEmail) setEmail(defaultEmail);
  }, [defaultEmail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="grid gap-3">
        <Label htmlFor="cred-email">Email</Label>
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
        />
      </div>
      <div className="mt-3 grid gap-3">
        <Label htmlFor="cred-password">Password</Label>
        <Input
          id="cred-password"
          type="password"
          value={password}
          autoFocus={autoFocusField === "password"}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={!!isLoading}
        />
      </div>
      <Button type="submit" className="w-full mt-4" disabled={!!isLoading}>
        {submitLabel}
      </Button>
    </form>
  );
}


