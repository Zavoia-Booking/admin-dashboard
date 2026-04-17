import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { AlertCircle } from "lucide-react"
import { RegisterForm } from "../components/register-form"
import { MobileRegisterEmailForm } from "../components/MobileRegisterEmailForm"
import { usePlatform } from "../../../shared/hooks/usePlatform"
import { validateMobileRegisterTokenApi } from "../api"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "../../../shared/components/ui/card"
import { Button } from "../../../shared/components/ui/button"
import { Spinner } from "../../../shared/components/ui/spinner"

type TokenState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'valid'; email: string; token: string }
  | { status: 'invalid' }

export default function RegisterPage() {
  const { t } = useTranslation('auth')
  const { isNative } = usePlatform()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
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
        setTokenState({ status: 'valid', email: result.email, token: welcomeToken })
      })
      .catch(() => {
        if (cancelled) return
        setTokenState({ status: 'invalid' })
      })
    return () => {
      cancelled = true
    }
  }, [welcomeToken, isNative])

  let content: React.ReactNode
  if (isNative) {
    content = <MobileRegisterEmailForm />
  } else if (tokenState.status === 'checking') {
    content = (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" color="info" />
      </div>
    )
  } else if (tokenState.status === 'invalid') {
    content = (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="space-y-2 px-6 py-6 md:px-8 md:py-8 items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl md:text-2xl text-center">{t('teamInvitation.errorTitle')}</CardTitle>
          <CardDescription className="text-center text-sm">
            {t('teamInvitation.errorInvalidToken')}
          </CardDescription>
        </CardHeader>
        <CardContent />
        <CardFooter className="flex flex-col gap-3 px-6 md:px-8 pb-6 md:pb-8">
          <Button type="button" rounded="full" className="w-full h-10 md:h-12" onClick={() => navigate('/register', { replace: true })}>
            {t('register.signUp')}
          </Button>
        </CardFooter>
      </Card>
    )
  } else if (tokenState.status === 'valid') {
    content = <RegisterForm initialEmail={tokenState.email} welcomeToken={tokenState.token} lockEmail />
  } else {
    content = <RegisterForm />
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-4 md:p-10">
      <div className="w-full max-w-sm md:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
        {content}
      </div>
    </div>
  )
}
