import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../../../shared/components/ui/button"
import { AlertCircle, User, Mail, Eye, EyeOff } from "lucide-react"
import { Input } from "../../../shared/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../shared/components/ui/card"
import { Spinner } from "../../../shared/components/ui/spinner"
import { toast } from "sonner"
import { useDispatch, useSelector } from "react-redux"
import { registerOwnerRequestAction, clearAuthErrorAction } from "../actions"
import type { RootState } from "../../../app/providers/store"
import { useForm } from "react-hook-form"
import { PasswordStrength } from "./PasswordStrength"
import { sanitizeName, validatePasswordPolicy } from "../../../shared/utils/validation"
import { Popover, PopoverTrigger, PopoverContent } from "../../../shared/components/ui/popover"
import GoogleSignInButton from "../../../shared/components/auth/GoogleSignInButton"

type FormValues = {
  firstName: string
  lastName: string
  email: string
  password: string
}

export function RegisterForm() {
  const navigate = useNavigate()
  const [pwFocused, setPwFocused] = useState<boolean>(false)
  const [pwInteracted, setPwInteracted] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const dispatch = useDispatch();
  const { isLoading, error: authError } = useSelector((state: RootState) => state.auth);

  const { register, handleSubmit, formState: { errors, isValid, isSubmitting }, watch, setValue, reset } = useForm<FormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    }
  })
  
  const firstNameField = register('firstName', {
    required: 'This field is required',
    minLength: { value: 2, message: 'Must be at least 2 characters' },
    maxLength: { value: 50, message: 'Must be under 50 characters' },
  });
  const lastNameField = register('lastName', {
    required: 'This field is required',
    minLength: { value: 2, message: 'Must be at least 2 characters' },
    maxLength: { value: 50, message: 'Must be under 50 characters' },
  });

  const passwordField = register('password', {
    required: 'Password is required',
    validate: (value) => validatePasswordPolicy(value),
  })

  const onSubmit = (values: FormValues) => {
    dispatch(registerOwnerRequestAction.request({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
    }))
  }

  useEffect(() => {
    if (authError) {
      toast.error(authError, {
        duration: 8000,
        position: 'top-center',
      });
      
      // Reset form to initial state
      reset();
      
      // Reset password visibility state
      setShowPassword(false);
      
      // Reset password interaction state
      setPwInteracted(false);
      setPwFocused(false);
      
      // Clear the error from Redux state so it can trigger again
      dispatch(clearAuthErrorAction());
    }
  }, [authError, reset, dispatch]);

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="space-y-1 px-6 py-4 md:px-8 md:py-6">
        <CardTitle className="text-xl md:text-2xl text-center">Create a Business Owner Account</CardTitle>
        <CardDescription className="text-center text-sm">
          Enter your details below to create your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="flex flex-col gap-3 px-6 md:px-8">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="flex-1 space-y-2">
              <label htmlFor="firstName" className="text-base font-medium text-foreground-1">
                First Name *
              </label>
              <div className="relative">
                <Input
                  id="firstName"
                  placeholder="eg. John"
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
                    const value = sanitizeName((e.target as HTMLInputElement).value);
                    setValue('firstName', value, { shouldValidate: true, shouldDirty: true });
                  }}
                />
                <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              </div>
              <div className="h-5">
                {errors.firstName && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{String(errors.firstName.message)}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <label htmlFor="lastName" className="text-base font-medium text-foreground-1">
                Last Name *
              </label>
              <div className="relative">
                <Input
                  id="lastName"
                  placeholder="eg. Francisco"
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
                    const value = sanitizeName((e.target as HTMLInputElement).value);
                    setValue('lastName', value, { shouldValidate: true, shouldDirty: true });
                  }}
                />
                <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              </div>
              <div className="h-5">
                {errors.lastName && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{String(errors.lastName.message)}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-base font-medium text-foreground-1">
              Email Address *
            </label>
            <div className="relative">
              <Input
                id="email"
                placeholder="eg. johnfrans@gmail.com"
                type="email"
                disabled={isLoading}
                aria-invalid={!!errors.email}
                className={`!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                  errors.email
                    ? 'border-destructive bg-error-bg focus-visible:ring-error'
                    : 'border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus'
                }`}
                autoComplete="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /[^@\s]+@[^@\s]+\.[^@\s]+/, message: 'Enter a valid email' },
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
          <div className="space-y-2">
            <label htmlFor="password" className="text-base font-medium text-foreground-1">
              Password *
            </label>
            <Popover open={pwFocused} modal={false}>
              <PopoverTrigger asChild>
                <div className="relative">
                  <Input
                    id="password"
                    placeholder="Enter your password"
                    type={showPassword ? "text" : "password"}
                    disabled={isLoading}
                    aria-invalid={!!errors.password}
                    className={`!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                      errors.password
                        ? 'border-destructive bg-error-bg focus-visible:ring-error'
                        : 'border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus'
                    }`}
                    {...passwordField}
                    onFocus={() => { setPwFocused(true); setPwInteracted(true); }}
                    onBlur={(e) => { passwordField.onBlur(e); setPwFocused(false); }}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary-hover p-0 border-0 bg-transparent w-4 h-4 flex items-center justify-center cursor-pointer transition-colors"
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
            {pwInteracted && (
              <div className="mt-2">
                <PasswordStrength password={watch('password')} variant="bar" />
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-4 md:pt-6 px-6 md:px-8 pb-4 md:pb-6">
            <Button
                className="w-full h-10 md:h-12"
                type="submit"
                disabled={isLoading || !isValid || isSubmitting}
            >
              {(isLoading || isSubmitting) ? (
                <div className="flex items-center justify-center gap-3">
                  <Spinner size="sm" color="info" />
                </div>
              ) : (
                "Sign Up"
              )}
            </Button>
          <div className="relative flex items-center my-4 md:my-6 w-full">
            <div className="flex-1 h-px bg-border min-w-0"></div>
            <span className="px-4 text-sm text-muted-foreground bg-card whitespace-nowrap">Or</span>
            <div className="flex-1 h-px bg-border min-w-0"></div>
          </div>
          <div className="grid grid-cols-1 gap-4 w-full">
            {/* Reusable Google sign-in button */}
            <GoogleSignInButton context="register" disabled={isLoading} className="w-full h-10 md:h-12" />
          </div>
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Button
              variant="link"
              className="p-0 cursor-pointer"
              type="button"
              onClick={() => navigate("/login")}
            >
              Sign in
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
} 