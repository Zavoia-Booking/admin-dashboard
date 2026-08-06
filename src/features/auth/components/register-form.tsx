import { useEffect, useState } from "react"
import { Button } from "../../../shared/components/ui/button"
import { AlertCircle, User, Mail, Eye, EyeOff } from "lucide-react"
import { Input } from "../../../shared/components/ui/input"
import { Spinner } from "../../../shared/components/ui/spinner"
import { toast } from "sonner"
import { useDispatch, useSelector } from "react-redux"
import { registerOwnerRequestAction, clearAuthErrorAction } from "../actions"
import type { RootState } from "../../../app/providers/store"
import { useForm, Controller } from "react-hook-form"
import { PasswordStrength } from "./PasswordStrength"
import { sanitizeName, validatePasswordPolicy } from "../../../shared/utils/validation"
import { Popover, PopoverTrigger, PopoverContent } from "../../../shared/components/ui/popover"
import GoogleSignInButton from "../../../shared/components/auth/GoogleSignInButton"
import { Checkbox } from "../../../shared/components/ui/checkbox"
import { openLegalPage } from "../../legal/legal-links"
import { useTranslation } from "react-i18next"

type FormValues = {
  firstName: string
  lastName: string
  email: string
  password: string
  acceptTerms: boolean
}

type RegisterFormProps = {
  /** Pre-fill the email field (e.g. from the mobile welcome link). */
  initialEmail?: string
  /** If true, the email input is rendered read-only so the pre-filled value can't be changed. */
  lockEmail?: boolean
  /** Opaque token from the mobile welcome email; submitted alongside registration to pre-verify the email. */
  welcomeToken?: string
  /** The welcome link came from native Google sign-in — nudge the user to finish with Google. */
  preferGoogle?: boolean
}

export function RegisterForm({ initialEmail, lockEmail, welcomeToken, preferGoogle }: RegisterFormProps = {}) {
  const { t, i18n } = useTranslation('auth')
  const [pwFocused, setPwFocused] = useState<boolean>(false)
  const [pwInteracted, setPwInteracted] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const dispatch = useDispatch()
  const { isLoading, error: authError } = useSelector((state: RootState) => state.auth)

  const { register, handleSubmit, formState: { errors, isValid, isSubmitting }, watch, setValue, reset, control, getValues, trigger } = useForm<FormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: initialEmail ?? '',
      password: '',
      acceptTerms: false,
    }
  })

  const firstNameField = register('firstName', {
    required: t('register.validation.fieldRequired'),
    minLength: { value: 2, message: t('register.validation.minLength', { count: 2 }) },
    maxLength: { value: 50, message: t('register.validation.maxLength', { count: 50 }) },
  })
  const lastNameField = register('lastName', {
    required: t('register.validation.fieldRequired'),
    minLength: { value: 2, message: t('register.validation.minLength', { count: 2 }) },
    maxLength: { value: 50, message: t('register.validation.maxLength', { count: 50 }) },
  })

  const passwordField = register('password', {
    required: t('register.validation.passwordRequired'),
    validate: (value) => validatePasswordPolicy(value, t),
  })

  // Validation messages are resolved (and stored) at validation time, so a
  // language switch would otherwise leave visible errors in the old language.
  useEffect(() => {
    const erroredFields = Object.keys(errors) as (keyof FormValues)[]
    if (erroredFields.length > 0) {
      trigger(erroredFields)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language])

  const onSubmit = (values: FormValues) => {
    setPwFocused(false)
    dispatch(registerOwnerRequestAction.request({
      firstName: values.firstName,
      lastName: values.lastName,
      email: lockEmail && initialEmail ? initialEmail : values.email,
      password: values.password,
      ...(welcomeToken ? { welcomeToken } : {}),
    }))
  }

  useEffect(() => {
    if (authError) {
      toast.error(authError, {
        duration: 8000,
      })
      reset({
        firstName: '',
        lastName: '',
        email: initialEmail ?? '',
        password: '',
        acceptTerms: false,
      })
      setShowPassword(false)
      setPwInteracted(false)
      setPwFocused(false)
      dispatch(clearAuthErrorAction())
    }
  }, [authError, reset, dispatch, initialEmail])

  return (
    <>
      {preferGoogle && (
        <div className="mb-3 flex items-start gap-2.5 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground-2">
          <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>{t('register.googleContinueHint')}</span>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="flex-1 space-y-2">
              <label htmlFor="firstName" className="text-base font-medium text-foreground-1">
                {t('register.firstName')}
              </label>
              <div className="relative">
                <Input
                  id="firstName"
                  placeholder={t('register.firstNamePlaceholder')}
                  type="text"
                  disabled={isLoading}
                  aria-invalid={!!errors.firstName}
                  className={`!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                    errors.firstName
                      ? 'border-destructive bg-error-bg focus-visible:ring-error'
                      : 'border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus'
                  }`}
                  autoComplete="given-name"
                  {...firstNameField}
                  onChange={(e) => {
                    const value = sanitizeName((e.target as HTMLInputElement).value)
                    setValue('firstName', value, { shouldValidate: true, shouldDirty: true })
                  }}
                />
                <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              </div>
              <div className="h-5">
                {errors.firstName && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{String(errors.firstName.message)}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <label htmlFor="lastName" className="text-base font-medium text-foreground-1">
                {t('register.lastName')}
              </label>
              <div className="relative">
                <Input
                  id="lastName"
                  placeholder={t('register.lastNamePlaceholder')}
                  type="text"
                  disabled={isLoading}
                  aria-invalid={!!errors.lastName}
                  className={`!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                    errors.lastName
                      ? 'border-destructive bg-error-bg focus-visible:ring-error'
                      : 'border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus'
                  }`}
                  autoComplete="family-name"
                  {...lastNameField}
                  onChange={(e) => {
                    const value = sanitizeName((e.target as HTMLInputElement).value)
                    setValue('lastName', value, { shouldValidate: true, shouldDirty: true })
                  }}
                />
                <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              </div>
              <div className="h-5">
                {errors.lastName && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{String(errors.lastName.message)}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-base font-medium text-foreground-1">
              {t('register.emailAddress')}
            </label>
            <div className="relative">
              <Input
                id="email"
                placeholder={t('register.emailPlaceholder')}
                type="email"
                disabled={isLoading}
                readOnly={lockEmail}
                aria-invalid={!!errors.email}
                className={`!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                  errors.email
                    ? 'border-destructive bg-error-bg focus-visible:ring-error'
                    : 'border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus'
                } ${lockEmail ? 'cursor-not-allowed opacity-80' : ''}`}
                autoComplete="email"
                {...register('email', {
                  required: t('register.validation.emailRequired'),
                  pattern: { value: /[^@\s]+@[^@\s]+\.[^@\s]+/, message: t('register.validation.emailInvalid') },
                })}
              />
              <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            </div>
            <div className="h-5">
              {errors.email && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{String(errors.email.message)}</span>
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-base font-medium text-foreground-1">
              {t('register.password')}
            </label>
            <Popover open={pwFocused} modal={false}>
              <PopoverTrigger asChild>
                <div className="relative">
                  <Input
                    id="password"
                    placeholder={t('register.passwordPlaceholder')}
                    type={showPassword ? "text" : "password"}
                    disabled={isLoading}
                    aria-invalid={!!errors.password}
                    className={`!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                      errors.password
                        ? 'border-destructive bg-error-bg focus-visible:ring-error'
                        : 'border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus'
                    }`}
                    {...passwordField}
                    onFocus={() => { setPwFocused(true); setPwInteracted(true) }}
                    onBlur={(e) => { passwordField.onBlur(e); setPwFocused(false) }}
                  />
                  <button
                    type="button"
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-primary hover:text-primary-hover p-0 border-0 bg-transparent w-4 h-4 flex items-center justify-center cursor-pointer transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
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
                <PasswordStrength password={watch('password')} variant="panel" />
              </PopoverContent>
            </Popover>
            <div className="mt-2 h-8">
              {pwInteracted ? (
                <PasswordStrength password={watch('password')} variant="bar" />
              ) : (
                <span className="invisible block text-xs leading-normal" aria-hidden="true">0</span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Controller
                name="acceptTerms"
                control={control}
                rules={{ required: t('register.validation.termsRequired') }}
                render={({ field }) => (
                  <Checkbox
                    id="acceptTerms"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                    className="mt-1"
                  />
                )}
              />
              <label htmlFor="acceptTerms" className="text-sm text-foreground-2 leading-normal cursor-pointer select-none">
                {t('register.termsAgreement')}{" "}
                <span onClick={(e) => { e.preventDefault(); openLegalPage("terms") }} className="text-primary hover:text-primary-hover underline underline-offset-2 cursor-pointer" role="link" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && openLegalPage("terms")}>
                  {t('register.termsAndConditions')}
                </span>,{" "}
                <span onClick={(e) => { e.preventDefault(); openLegalPage("cookies") }} className="text-primary hover:text-primary-hover underline underline-offset-2 cursor-pointer" role="link" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && openLegalPage("cookies")}>
                  {t('register.cookiesPolicy')}
                </span>{" "}
                {t('register.and')}{" "}
                <span onClick={(e) => { e.preventDefault(); openLegalPage("privacy") }} className="text-primary hover:text-primary-hover underline underline-offset-2 cursor-pointer" role="link" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && openLegalPage("privacy")}>
                  {t('register.privacyPolicy')}
                </span>
              </label>
            </div>
            <div className="h-5">
              {errors.acceptTerms && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{String(errors.acceptTerms.message)}</span>
                </p>
              )}
            </div>
          </div>
          <Button
            className="w-full h-10 md:h-12 mt-2"
            rounded="full"
            type="submit"
            disabled={isLoading || !isValid || isSubmitting}
          >
            {(isLoading || isSubmitting) ? (
              <div className="flex items-center justify-center gap-3">
                <Spinner size="sm" color="info" />
              </div>
            ) : (
              t('register.signUp')
            )}
          </Button>
          <div className="relative flex items-center my-2 md:my-3 w-full">
            <div className="flex-1 h-px bg-border min-w-0"></div>
            <span className="px-4 text-sm text-muted-foreground bg-card whitespace-nowrap">{t('register.or')}</span>
            <div className="flex-1 h-px bg-border min-w-0"></div>
          </div>
          <GoogleSignInButton
            context="register"
            disabled={isLoading}
            className="w-full h-10 md:h-12"
            onBeforeStart={() => {
              if (!getValues('acceptTerms')) {
                trigger('acceptTerms')
                return false
              }
              return true
            }}
          />
      </form>
    </>
  )
}
