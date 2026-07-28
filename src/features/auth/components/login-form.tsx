import { useEffect, useRef, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { loginAction, forgotPasswordAction, clearAuthErrorAction } from "../actions"
import { useDispatch, useSelector } from "react-redux"
import { toast } from "sonner"
import type { RootState } from "../../../app/providers/store"
import GoogleSignInButton from "../../../shared/components/auth/GoogleSignInButton"
import CredentialsForm, { type CredentialsFormHandle } from "../../../shared/components/auth/CredentialsForm"
import ForgotPasswordInline from "../../../shared/components/auth/ForgotPasswordInline"
import { Banner } from "../../../shared/components/ui/banner"
import { useTranslation } from "react-i18next"

/**
 * Renders only the form-side content of the login screen — the surrounding
 * shell (AuthShell + AuthCard + AuthHero + tab toggle + heading) lives in
 * <AuthLayout> so that the hero panel and animation persist across tab
 * switches between /login and /register.
 */
export function LoginForm() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isForgotMode = searchParams.get('forgot') === '1'
  const [forgotSubmitted, setForgotSubmitted] = useState(false)
  const [showNoAccountBanner, setShowNoAccountBanner] = useState(false)
  const dispatch = useDispatch()
  const { isLoading, error: authError } = useSelector((s: RootState) => s.auth)
  const credRef = useRef<CredentialsFormHandle | null>(null)

  // Reset the "email submitted" flag whenever we leave forgot mode so the
  // form opens fresh next time the user enters it.
  useEffect(() => {
    if (!isForgotMode) setForgotSubmitted(false)
  }, [isForgotMode])

  const handleCredentialsSubmit = ({ email, password }: { email: string; password: string }) => {
    dispatch(loginAction.request({ email, password }))
  }

  // Check for Google login error on mount
  useEffect(() => {
    const noAccountFlag = sessionStorage.getItem('googleLoginNoAccount')
    if (noAccountFlag === 'true') {
      setShowNoAccountBanner(true)
      sessionStorage.removeItem('googleLoginNoAccount')
    }
  }, [])

  useEffect(() => {
    if (authError) {
      if (authError === 'account_not_found') {
        setShowNoAccountBanner(true)
        dispatch(clearAuthErrorAction())
        return
      }
      toast.error(authError, {
        duration: 8000,
      })
      try { credRef.current?.reset(); credRef.current?.hidePassword() } catch {}
      dispatch(clearAuthErrorAction())
    }
  }, [authError, dispatch])

  if (isForgotMode) {
    return (
      <ForgotPasswordInline
        isSubmitted={forgotSubmitted}
        isLoading={isLoading}
        onSubmit={(email) => { dispatch(forgotPasswordAction.request({ email })); setForgotSubmitted(true) }}
        onBack={() => navigate('/login')}
      />
    )
  }

  return (
    <>
      {showNoAccountBanner && (
        <Banner variant="info" onDismiss={() => setShowNoAccountBanner(false)}>
          {t('login.noAccountBanner')}{' '}
          <Link to="/register" className="font-medium underline underline-offset-2">
            {t('login.registerFirst')}
          </Link>.
        </Banner>
      )}
      <CredentialsForm ref={credRef} onSubmit={handleCredentialsSubmit} submitLabel={t('login.submitLabel')} isLoading={isLoading} />
      <div className="flex justify-center mt-1">
        <button
          type="button"
          onClick={() => navigate('/login?forgot=1')}
          className="cursor-pointer text-sm text-foreground-2 hover:text-primary underline-offset-4 hover:underline transition-colors"
          aria-label={t('loginAria.forgotPassword')}
        >
          {t('login.forgotPassword')}
        </button>
      </div>
      <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
        <span className="bg-card text-muted-foreground relative z-10 px-2">
          {t('login.orContinueWith')}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <GoogleSignInButton context="login" disabled={isLoading} />
      </div>
    </>
  )
}
