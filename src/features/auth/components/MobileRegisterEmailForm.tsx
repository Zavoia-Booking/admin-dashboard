import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useTranslation, Trans } from "react-i18next"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "../../../shared/components/ui/button"
import CredentialsForm from "../../../shared/components/auth/CredentialsForm"
import GoogleSignInButton from "../../../shared/components/auth/GoogleSignInButton"
import { mobileRegisterRequestApi } from "../api"
import { clearGoogleNativeEmailSentAction } from "../actions"
import { selectAuthIsLoading, selectMobileGoogleEmailSentTo } from "../selectors"
import i18n from "../../../shared/lib/i18n"

type Status =
  | { kind: 'form' }
  | { kind: 'sent'; email: string }

type MobileRegisterEmailFormProps = {
  /** Reports whether the "check your inbox" state is showing, so AuthLayout
   *  can drop its now-redundant subtitle. */
  onSentChange?: (sent: boolean) => void
}

/**
 * Native-only register flow: an email gate rendered into AuthCard's form
 * column. The card, title and subtitle live in AuthLayout — like LoginForm,
 * this component only emits the form-column content.
 */
export function MobileRegisterEmailForm({ onSentChange }: MobileRegisterEmailFormProps) {
  const { t } = useTranslation('auth')
  const dispatch = useDispatch()
  const [status, setStatus] = useState<Status>({ kind: 'form' })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  // Google register either logs the user straight in (PublicRoute redirects)
  // or resolves to the same email funnel — the saga reports the latter here.
  const googleLoading = useSelector(selectAuthIsLoading)
  const googleEmailSentTo = useSelector(selectMobileGoogleEmailSentTo)

  useEffect(() => () => { dispatch(clearGoogleNativeEmailSentAction()) }, [dispatch])

  const onSubmit = async ({ email }: { email: string; password: string }) => {
    setSubmitError(null)
    setSubmitting(true)
    try {
      const locale = i18n.language?.startsWith('ro') ? 'ro' : 'en'
      await mobileRegisterRequestApi({ email, locale })
      setStatus({ kind: 'sent', email })
    } catch {
      setSubmitError(t('mobileRegister.errorGeneric'))
    } finally {
      setSubmitting(false)
    }
  }

  const resetToForm = () => {
    setStatus({ kind: 'form' })
    setSubmitError(null)
    dispatch(clearGoogleNativeEmailSentAction())
  }

  const sentEmail = status.kind === 'sent' ? status.email : googleEmailSentTo

  useEffect(() => { onSentChange?.(!!sentEmail) }, [sentEmail, onSentChange])

  if (sentEmail) {
    // Left-aligned like the rest of the card's text column; the check sits
    // inline with the heading instead of a floating badge.
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" aria-hidden />
          <h2 className="text-lg font-semibold text-foreground-1">{t('mobileRegister.successTitle')}</h2>
        </div>
        <p className="text-sm text-foreground-2 leading-relaxed [&_strong]:text-foreground-1 [&_strong]:font-medium">
          <Trans
            i18nKey="mobileRegister.successDescription"
            t={t}
            values={{ email: sentEmail }}
            components={{ strong: <strong /> }}
          />
        </p>
        <Button type="button" variant="outline" rounded="full" className="w-full mt-4" onClick={resetToForm}>
          {t('mobileRegister.sendAnother')}
        </Button>
      </div>
    )
  }

  return (
    <>
      <CredentialsForm
        showPasswordField={false}
        onSubmit={onSubmit}
        submitLabel={t('mobileRegister.submit')}
        isLoading={submitting}
      />
      {submitError && (
        <p className="flex items-center justify-center gap-1.5 text-sm text-destructive" role="alert" aria-live="polite">
          <AlertCircle className="h-4 w-4" />
          <span>{submitError}</span>
        </p>
      )}
      <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
        <span className="bg-card text-muted-foreground relative z-10 px-2">
          {t('register.or')}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <GoogleSignInButton context="register" disabled={submitting || googleLoading} />
      </div>
    </>
  )
}
