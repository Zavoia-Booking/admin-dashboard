import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../../shared/components/ui/card";
import { Button } from "../../../shared/components/ui/button";
import { Input } from "../../../shared/components/ui/input";
import { Label } from "../../../shared/components/ui/label";
import { useDispatch, useSelector } from "react-redux";
import { resetPasswordAction, clearAuthErrorAction } from "../actions";
import type { RootState } from "../../../app/providers/store";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [success, setSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error: authError } = useSelector((state: RootState) => state.auth);

  const passwordsMatch = password.length >= 8 && password === confirmPassword;

  // Listen for success/failure from Redux
  useEffect(() => {
    if (submitted && !isLoading) {
      if (authError) {
        // Reset password failed
        setSuccess(false);
        setSubmitted(false);
        setLocalError(authError);
        dispatch(clearAuthErrorAction());
      } else {
        // Reset password succeeded
        setSuccess(true);
      }
    }
  }, [submitted, isLoading, authError, dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!token) {
      setLocalError("The link is invalid or missing reset token. Please use the link from the email.");
      return;
    }
    if (!passwordsMatch) {
      setLocalError("Passwords must match and be at least 8 characters.");
      return;
    }
    setSubmitted(true);
    dispatch(resetPasswordAction.request({ token, password }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-base">
      <Card className="w-full max-w-md border border-border shadow-sm">
        <CardContent className="p-6">
          {!success ? (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <h1 className="text-xl font-semibold text-foreground-1">Reset your password</h1>
                <p className="text-sm text-foreground-3">Enter and confirm your new password.</p>
              </div>
              {localError && (
                <div className="rounded-lg bg-error-bg border border-error-border p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-error flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-error">{localError}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-medium text-foreground-1">New password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="At least 8 characters"
                  disabled={isLoading}
                  className="transition-all focus-visible:ring-1 focus-visible:ring-offset-0 border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-base font-medium text-foreground-1">Confirm password *</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="transition-all focus-visible:ring-1 focus-visible:ring-offset-0 border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus"
                />
              </div>
              <Button type="submit" className="w-full" disabled={!passwordsMatch || isLoading}>
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-success-bg border border-success-border p-3 flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-semibold text-foreground-1">Password updated</h2>
                  <p className="text-sm text-foreground-2 mt-1">Your password has been reset successfully. You can now log in with your new password.</p>
                </div>
              </div>
              <Button className="w-full" onClick={() => navigate("/login")}>Go to Login</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


