import { useEffect, useState } from "react"
import { cn } from "../../../shared/lib/utils"
import { Button } from "../../../shared/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "../../../shared/components/ui/card"
import { Input } from "../../../shared/components/ui/input";
import { Label } from "../../../shared/components/ui/label";
import { Link } from "react-router-dom";
import { loginAction, forgotPasswordAction, clearAuthErrorAction } from "../actions";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import type { RootState } from "../../../app/providers/store";
import GoogleSignInButton from "../../../shared/components/auth/GoogleSignInButton"
import CredentialsForm, { type CredentialsFormHandle } from "../../../shared/components/auth/CredentialsForm"
import { useRef } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isForgotMode, setIsForgotMode] = useState(false)
  const [forgotSubmitted, setForgotSubmitted] = useState(false)
  const dispatch = useDispatch();
  const { isLoading, error: authError } = useSelector((s: RootState) => s.auth)
  const credRef = useRef<CredentialsFormHandle | null>(null);

  const handleCredentialsSubmit = ({ email, password }: { email: string; password: string }) => {
    dispatch(loginAction.request({ email, password }));
  }

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const email = (document.getElementById('forgot-email') as HTMLInputElement)?.value || ''
    dispatch(forgotPasswordAction.request({ email }))
    setForgotSubmitted(true)
  }

  useEffect(() => {
    if (authError) {
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
                <CredentialsForm ref={credRef} onSubmit={handleCredentialsSubmit} submitLabel="Login" isLoading={isLoading} />
                <div className="flex justify-end -mt-2">
                  <button
                    type="button"
                    onClick={() => { setIsForgotMode(true); setForgotSubmitted(false); }}
                    className="text-sm underline-offset-2 hover:underline"
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
            <form className="p-6 md:p-8" onSubmit={handleForgotSubmit}>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold">Forgot password</h1>
                  <p className="text-muted-foreground text-balance">
                    Enter your email and we will send you a reset link.
                  </p>
                </div>
                {!forgotSubmitted ? (
                  <>
                    <div className="grid gap-3">
                      <Label htmlFor="forgot-email">Email</Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="m@example.com"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="w-full">Reset Password</Button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsForgotMode(false)}
                      className="text-sm underline-offset-2 hover:underline"
                    >
                      Back to login
                    </button>
                  </>
                ) : (
                  <>
                    <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
                      If an account exists for the provided email, you will receive an email with instructions to reset your password.
                    </div>
                    <Button type="button" className="w-full" onClick={() => setIsForgotMode(false)}>Back to login</Button>
                  </>
                )}
              </div>
            </form>
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
