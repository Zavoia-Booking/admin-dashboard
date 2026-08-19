import { useEffect, useState } from "react"
import { useSearchParams, useNavigate, useOutletContext } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { AlertCircle } from "lucide-react"
import { RegisterForm } from "../components/register-form"
import { MobileRegisterEmailForm } from "../components/MobileRegisterEmailForm"
import type { AuthOutletContext } from "../components/AuthLayout"
import { usePlatform } from "../../../shared/hooks/usePlatform"
import { validateMobileRegisterTokenApi } from "../api"
import { Button } from "../../../shared/components/ui/button"
import { Spinner } from "../../../shared/components/ui/spinner"

type TokenState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'valid'; email: string; token: string; provider?: 'google' }
  | { status: 'invalid' }

/**
 * Renders the form-side content of the /register route. The persistent
 * shell (AuthShell + AuthCard + AuthHero + toggle + heading) is provided
 * by AuthLayout, so this component only emits what should appear in the
 * form column — either the registration form, a loading spinner while a
 * welcome token is validated, an inline error if the token is invalid,
 * or the native mobile email-gate form.
 */
export default function RegisterPage() {
  const { t } = useTranslation('auth')
  const { isNative } = usePlatform()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { onRegisterEmailSentChange } = useOutletContext<AuthOutletContext>()
  const welcomeToken = searchParams.get('welcomeToken')
  const [tokenState, setTokenState] = useState<TokenState>({ status: 'idle' })

  useEffect(() => {
    // Only web validates the welcome token — mobile always sees the email-gate form.
    if (isNative || !welcomeToken) {
      setTokenState({ status: 'idle' })
      return
    }

    let cancelled = false
    setTokenState({ status: 'checking' })
    validateMobileRegisterTokenApi(welcomeToken)
      .then((result) => {
        if (cancelled) return
        setTokenState({ status: 'valid', email: result.email, token: welcomeToken, provider: result.provider })
      })
      .catch(() => {
        if (cancelled) return
        setTokenState({ status: 'invalid' })
      })
    return () => {
      cancelled = true
    }
  }, [welcomeToken, isNative])

  if (isNative) {
    return <MobileRegisterEmailForm onSentChange={onRegisterEmailSentChange} />
  }
  if (tokenState.status === 'checking') {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" color="info" />
      </div>
    )
  }
  if (tokenState.status === 'invalid') {
    return (
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <p className="text-sm text-foreground-2">{t('teamInvitation.errorInvalidToken')}</p>
        <Button
          type="button"
          rounded="full"
          className="w-full h-10 md:h-12"
          onClick={() => navigate('/register', { replace: true })}
        >
          {t('register.signUp')}
        </Button>
      </div>
    )
  }
  if (tokenState.status === 'valid') {
    return (
      <RegisterForm
        initialEmail={tokenState.email}
        welcomeToken={tokenState.token}
        lockEmail
        preferGoogle={tokenState.provider === 'google'}
      />
    )
  }
  return <RegisterForm />
}
