import { useEffect, useState } from "react"
import { cn } from "../../../shared/lib/utils"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "../../../shared/components/ui/card"
import { Link } from "react-router-dom";
import { loginAction, forgotPasswordAction, clearAuthErrorAction } from "../actions";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import type { RootState } from "../../../app/providers/store";
import GoogleSignInButton from "../../../shared/components/auth/GoogleSignInButton"
import CredentialsForm, { type CredentialsFormHandle } from "../../../shared/components/auth/CredentialsForm"
import { useRef } from "react";
import ForgotPasswordInline from "../../../shared/components/auth/ForgotPasswordInline";
import { Banner } from "../../../shared/components/ui/banner";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isForgotMode, setIsForgotMode] = useState(false)
  const [forgotSubmitted, setForgotSubmitted] = useState(false)
  const [showNoAccountBanner, setShowNoAccountBanner] = useState(false)
  const dispatch = useDispatch();
  const { isLoading, error: authError } = useSelector((s: RootState) => s.auth)
  const credRef = useRef<CredentialsFormHandle | null>(null);

  const handleCredentialsSubmit = ({ email, password }: { email: string; password: string }) => {
    dispatch(loginAction.request({ email, password }));
  }

  // Check for Google login error on mount
  useEffect(() => {
    const noAccountFlag = sessionStorage.getItem('googleLoginNoAccount');
    if (noAccountFlag === 'true') {
      setShowNoAccountBanner(true);
      sessionStorage.removeItem('googleLoginNoAccount');
    }
  }, []);

  // inline forgot password handled by ForgotPasswordInline component

  useEffect(() => {
    if (authError) {
      // Check if it's the special account_not_found error
      if (authError === 'account_not_found') {
        setShowNoAccountBanner(true);
        dispatch(clearAuthErrorAction());
        return;
      }
      
      // Show error toast, then reset form and clear error
      toast.error(authError, {
        duration: 8000,
        position: 'top-center',
        style: {
          background: '#fef2f2',
          color: '#991b1b',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
          fontSize: '14px',
          fontWeight: '300',
          padding: '16px',
        } as React.CSSProperties,
      })
      // Reset credentials form state (clear fields, hide password)
      try { credRef.current?.reset(); credRef.current?.hidePassword(); } catch {}
      dispatch(clearAuthErrorAction())
    }
  }, [authError, dispatch])

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          {!isForgotMode ? (
            <div className="p-6 md:p-8">
              <div className="flex flex-col gap-6">
                <CardHeader className="p-0">
                  <CardTitle className="text-xl md:text-2xl text-center">Welcome back</CardTitle>
                  <CardDescription className="text-center text-sm">Login to your account</CardDescription>
                </CardHeader>
                {showNoAccountBanner && (
                  <Banner variant="info" onDismiss={() => setShowNoAccountBanner(false)}>
                    No account found with this email. Please{' '}
                    <Link to="/register" className="font-medium underline underline-offset-2">
                      register first
                    </Link>.
                  </Banner>
                )}
                <CredentialsForm ref={credRef} onSubmit={handleCredentialsSubmit} submitLabel="Login" isLoading={isLoading} />
                <div className="flex justify-center mt-1">
                  <button
                    type="button"
                    onClick={() => { setIsForgotMode(true); setForgotSubmitted(false); }}
                    className="text-sm text-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
                    aria-label="Forgot your password?"
                  >
                    Forgot your password?
                  </button>
                </div>
                <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                  <span className="bg-card text-muted-foreground relative z-10 px-2">
                    Or continue with
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <GoogleSignInButton context="login" disabled={isLoading} />
                </div>
                <div className="text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <Link to="/register" className="underline underline-offset-4">
                    Sign up
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <ForgotPasswordInline
              isSubmitted={forgotSubmitted}
              isLoading={isLoading}
              onSubmit={(email) => { dispatch(forgotPasswordAction.request({ email })); setForgotSubmitted(true); }}
              onBack={() => setIsForgotMode(false)}
            />
          )}
          <div className="bg-muted relative hidden md:block">
            <img
              src="/placeholder.svg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
        <CardFooter className="px-6 md:px-8 pb-6">
          <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4 w-full">
            By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
            and <a href="#">Privacy Policy</a>.
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
