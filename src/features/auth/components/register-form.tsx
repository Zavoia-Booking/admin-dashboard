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
import LegalContentDialog from "../../legal/components/LegalContentDialog"
import type { LegalPageType } from "../../legal/components/legal-content"
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
}

export function RegisterForm({ initialEmail, lockEmail, welcomeToken }: RegisterFormProps = {}) {
  const { t, i18n } = useTranslation('auth')
  const [pwFocused, setPwFocused] = useState<boolean>(false)
  const [pwInteracted, setPwInteracted] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [legalDialog, setLegalDialog] = useState<LegalPageType | null>(null)
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
                <span onClick={(e) => { e.preventDefault(); setLegalDialog("terms") }} className="text-primary hover:text-primary-hover underline underline-offset-2 cursor-pointer" role="link" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setLegalDialog("terms")}>
                  {t('register.termsAndConditions')}
                </span>,{" "}
                <span onClick={(e) => { e.preventDefault(); setLegalDialog("cookies") }} className="text-primary hover:text-primary-hover underline underline-offset-2 cursor-pointer" role="link" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setLegalDialog("cookies")}>
                  {t('register.cookiesPolicy')}
                </span>{" "}
                {t('register.and')}{" "}
                <span onClick={(e) => { e.preventDefault(); setLegalDialog("privacy") }} className="text-primary hover:text-primary-hover underline underline-offset-2 cursor-pointer" role="link" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setLegalDialog("privacy")}>
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
      <LegalContentDialog type={legalDialog} onOpenChange={(open) => !open && setLegalDialog(null)} />
    </>
  )
}
