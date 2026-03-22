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
import { useTranslation } from "react-i18next";
import { Popover, PopoverTrigger, PopoverContent } from "../../../shared/components/ui/popover";
import { PasswordStrength } from "../components/PasswordStrength";
import { validatePasswordPolicy } from "../../../shared/utils/validation";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [success, setSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [pwFocused, setPwFocused] = useState(false);
  const [pwInteracted, setPwInteracted] = useState(false);
  const { t } = useTranslation('auth');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error: authError } = useSelector((state: RootState) => state.auth);

  const isPasswordPolicyValid = validatePasswordPolicy(password) === true;
  const passwordsMatch = password === confirmPassword;
  const canSubmit = isPasswordPolicyValid && passwordsMatch && confirmPassword.length > 0;

  useEffect(() => {
    if (submitted && !isLoading) {
      if (authError) {
        setSuccess(false);
        setSubmitted(false);
        setLocalError(authError);
        dispatch(clearAuthErrorAction());
      } else {
        setSuccess(true);
      }
    }
  }, [submitted, isLoading, authError, dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPwFocused(false);
    setLocalError(null);
    if (!token) {
      setLocalError(t('resetPassword.errorInvalidLink'));
      return;
    }
    if (!canSubmit) {
      setLocalError(t('resetPassword.errorPasswordsMismatch'));
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
                <h1 className="text-xl font-semibold text-foreground-1">{t('resetPassword.title')}</h1>
                <p className="text-sm text-foreground-3">{t('resetPassword.subtitle')}</p>
              </div>
              {localError && (
                <div className="rounded-lg bg-error-bg border border-error-border p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-error flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-error">{localError}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-medium text-foreground-1">{t('resetPassword.newPassword')}</Label>
                <Popover open={pwFocused} modal={false}>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); if (!pwInteracted) setPwInteracted(true); }}
                        onFocus={() => { setPwFocused(true); setPwInteracted(true); }}
                        onBlur={() => setPwFocused(false)}
                        required
                        placeholder={t('resetPassword.newPasswordPlaceholder')}
                        disabled={isLoading}
                        className="transition-all focus-visible:ring-1 focus-visible:ring-offset-0 border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus"
                      />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent
                    side="top"
                    align="start"
                    sideOffset={8}
                    avoidCollisions={false}
                    className="p-0 border-none bg-transparent shadow-none w-auto"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <PasswordStrength password={password} variant="panel" />
                  </PopoverContent>
                </Popover>
                <div className="min-h-[28px]">
                  {pwInteracted && password.length > 0 ? (
                    <PasswordStrength password={password} variant="bar" />
                  ) : (
                    <span className="invisible block text-xs leading-normal" aria-hidden="true">0</span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-base font-medium text-foreground-1">{t('resetPassword.confirmPassword')}</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="transition-all focus-visible:ring-1 focus-visible:ring-offset-0 border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus"
                />
                <div className="h-5">
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>{t('resetPassword.errorPasswordsMismatch')}</span>
                    </p>
                  )}
                </div>
              </div>
              <Button type="submit" rounded="full" className="w-full" disabled={!canSubmit || isLoading}>
                {isLoading ? t('resetPassword.resetting') : t('resetPassword.submit')}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-success-bg border border-success-border p-3 flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-semibold text-foreground-1">{t('resetPassword.successTitle')}</h2>
                  <p className="text-sm text-foreground-2 mt-1">{t('resetPassword.successMessage')}</p>
                </div>
              </div>
              <Button rounded="full" className="w-full" onClick={() => navigate("/login")}>{t('resetPassword.goToLogin')}</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
