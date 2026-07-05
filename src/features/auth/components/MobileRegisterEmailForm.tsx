import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation, Trans } from "react-i18next"
import { useForm } from "react-hook-form"
import { AlertCircle, Mail, CheckCircle2 } from "lucide-react"
import { Button } from "../../../shared/components/ui/button"
import { Input } from "../../../shared/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../shared/components/ui/card"
import { Spinner } from "../../../shared/components/ui/spinner"
import { mobileRegisterRequestApi } from "../api"
import i18n from "../../../shared/lib/i18n"

type FormValues = {
  email: string
}

type Status =
  | { kind: 'form' }
  | { kind: 'sent'; email: string }

export function MobileRegisterEmailForm() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>({ kind: 'form' })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isValid }, reset } = useForm<FormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { email: '' },
  })

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null)
    setSubmitting(true)
    try {
      const locale = i18n.language?.startsWith('ro') ? 'ro' : 'en'
      await mobileRegisterRequestApi({ email: values.email, locale })
      setStatus({ kind: 'sent', email: values.email })
    } catch {
      setSubmitError(t('mobileRegister.errorGeneric'))
    } finally {
      setSubmitting(false)
    }
  }

  const resetToForm = () => {
    setStatus({ kind: 'form' })
    setSubmitError(null)
    reset()
  }

  if (status.kind === 'sent') {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="space-y-2 px-6 py-6 md:px-8 md:py-8 items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl md:text-2xl text-center">{t('mobileRegister.successTitle')}</CardTitle>
          <CardDescription className="text-center text-sm">
            <Trans
              i18nKey="mobileRegister.successDescription"
              t={t}
              values={{ email: status.email }}
              components={{ strong: <strong /> }}
            />
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-3 px-6 md:px-8 pb-6 md:pb-8">
          <Button type="button" variant="outline" rounded="full" className="w-full h-10 md:h-12" onClick={resetToForm}>
            {t('mobileRegister.sendAnother')}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="space-y-1 px-6 py-4 md:px-8 md:py-6">
        <CardTitle className="text-xl md:text-2xl text-center">{t('mobileRegister.title')}</CardTitle>
        <CardDescription className="text-center text-sm">
          {t('mobileRegister.subtitle')}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="flex flex-col gap-3 px-6 md:px-8">
          <div className="space-y-2">
            <label htmlFor="email" className="text-base font-medium text-foreground-1">
              {t('mobileRegister.emailLabel')}
            </label>
            <div className="relative">
              <Input
                id="email"
                placeholder={t('mobileRegister.emailPlaceholder')}
                type="email"
                disabled={submitting}
                aria-invalid={!!errors.email}
                className={`!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                  errors.email
                    ? 'border-destructive bg-error-bg focus-visible:ring-error'
                    : 'border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus'
                }`}
                autoComplete="email"
                inputMode="email"
                {...register('email', {
                  required: t('mobileRegister.validation.emailRequired'),
                  pattern: { value: /[^@\s]+@[^@\s]+\.[^@\s]+/, message: t('mobileRegister.validation.emailInvalid') },
                })}
              />
              <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            </div>
            <div className="h-5">
              {errors.email && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{String(errors.email.message)}</span>
                </p>
              )}
            </div>
          </div>
          {submitError && (
            <p className="flex items-center gap-1.5 text-sm text-destructive" role="alert" aria-live="polite">
              <AlertCircle className="h-4 w-4" />
              <span>{submitError}</span>
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-4 md:pt-6 px-6 md:px-8 pb-4 md:pb-6">
          <Button
            className="w-full h-10 md:h-12"
            rounded="full"
            type="submit"
            disabled={submitting || !isValid}
          >
            {submitting ? (
              <div className="flex items-center justify-center gap-3">
                <Spinner size="sm" color="info" />
                <span>{t('mobileRegister.sending')}</span>
              </div>
            ) : (
              t('mobileRegister.submit')
            )}
          </Button>
          <div className="text-center text-sm">
            {t('mobileRegister.alreadyHaveAccount')}{" "}
            <Button
              variant="link"
              className="p-0 cursor-pointer"
              type="button"
              onClick={() => navigate("/login")}
            >
              {t('mobileRegister.signIn')}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
