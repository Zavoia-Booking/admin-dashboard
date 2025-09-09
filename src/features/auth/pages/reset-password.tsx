import { useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../../shared/components/ui/card";
import { Button } from "../../../shared/components/ui/button";
import { Input } from "../../../shared/components/ui/input";
import { Label } from "../../../shared/components/ui/label";
import { useDispatch } from "react-redux";
import { resetPasswordAction } from "../actions";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const passwordsMatch = password.length >= 8 && password === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("The link is invalid or missing reset token. Please use the link from the email.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords must match and be at least 8 characters.");
      return;
    }
    dispatch(resetPasswordAction.request({ token, password }));
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          {!submitted ? (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <h1 className="text-xl font-semibold">Reset your password</h1>
                <p className="text-sm text-muted-foreground">Enter and confirm your new password.</p>
              </div>
              {error && (
                <div className="text-sm text-red-600">{error}</div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="At least 8 characters"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={!passwordsMatch}>Reset Password</Button>
            </form>
          ) : (
            <div className="space-y-4">
              <h1 className="text-xl font-semibold">Password updated</h1>
              <p className="text-sm text-muted-foreground">Your password has been reset successfully. You can now log in with your new password.</p>
              <Button className="w-full" onClick={() => navigate("/login")}>Go to Login</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


