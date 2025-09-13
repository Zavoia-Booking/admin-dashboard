import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../../../shared/components/ui/button"
import { AlertCircle, User, Mail, Phone, Eye, EyeOff } from "lucide-react"
import { Input } from "../../../shared/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../shared/components/ui/card"
import { Spinner } from "../../../shared/components/ui/spinner"
import { toast } from "sonner"
import { useDispatch, useSelector } from "react-redux"
import { registerOwnerRequestAction, clearAuthErrorAction } from "../actions"
import type { RootState } from "../../../app/providers/store"
import { useForm } from "react-hook-form"
import { PasswordStrength } from "./PasswordStrength"
import { sanitizeName, isE164, sanitizePhoneToE164Draft, validatePasswordPolicy } from "../validation"
import { Popover, PopoverTrigger, PopoverContent } from "../../../shared/components/ui/popover"

type FormValues = {
  firstName: string
  lastName: string
  phone: string
  email: string
  password: string
}

export function RegisterForm() {
  const navigate = useNavigate()
  const [pwFocused, setPwFocused] = useState<boolean>(false)
  const [pwInteracted, setPwInteracted] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const dispatch = useDispatch();
  const { isLoading, isAuthenticated, error: authError } = useSelector((state: RootState) => state.auth);

  const { register, handleSubmit, formState: { errors, isValid, isSubmitting }, watch, setValue, reset } = useForm<FormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
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
      phone: values.phone,
      email: values.email,
      password: values.password,
    }))
  }

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/welcome');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (authError) {
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
        } as React.CSSProperties
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
      <CardHeader className="space-y-1 px-6 py-6 md:px-8 md:py-8">
        <CardTitle className="text-2xl md:text-3xl text-center">Create a Business Owner Account</CardTitle>
        <CardDescription className="text-center text-sm md:text-base">
          Enter your details below to create your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="flex flex-col gap-4 px-6 md:px-8">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            <div className="flex-1 grid gap-2">
              <label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                First Name
              </label>
              <div className="relative">
                <Input
                  id="firstName"
                  placeholder="eg. John"
                  type="text"
                  disabled={isLoading}
                  aria-invalid={!!errors.firstName}
                  className={`h-12 bg-gray-50 border border-gray-200 pr-10 focus:border-blue-500 focus:outline-none transition-colors ${errors.firstName ? 'border-destructive bg-[#FFFAFA]' : ''}`}
                  autoComplete="given-name"
                  {...firstNameField}
                  onChange={(e) => {
                    const value = sanitizeName((e.target as HTMLInputElement).value);
                    setValue('firstName', value, { shouldValidate: true, shouldDirty: true });
                  }}
                />
                <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              {errors.firstName && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{String(errors.firstName.message)}</span>
                </p>
              )}
            </div>
            <div className="flex-1 grid gap-2">
              <label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                Last Name
              </label>
              <div className="relative">
                <Input
                  id="lastName"
                  placeholder="eg. Francisco"
                  type="text"
                  disabled={isLoading}
                  aria-invalid={!!errors.lastName}
                  className={`h-12 bg-gray-50 border border-gray-200 pr-10 focus:border-blue-500 focus:outline-none transition-colors ${errors.lastName ? 'border-destructive bg-[#FFFAFA]' : ''}`}
                  autoComplete="family-name"
                  {...lastNameField}
                  onChange={(e) => {
                    const value = sanitizeName((e.target as HTMLInputElement).value);
                    setValue('lastName', value, { shouldValidate: true, shouldDirty: true });
                  }}
                />
                <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              {errors.lastName && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{String(errors.lastName.message)}</span>
                </p>
              )}
            </div>
          </div>
          <div className="grid gap-2">
            <label htmlFor="phone" className="text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <div className="relative">
              <Input
                id="phone"
                placeholder="eg. +1 (555) 123-4567"
                type="tel"
                disabled={isLoading}
                aria-invalid={!!errors.phone}
                className={`h-12 bg-gray-50 border border-gray-200 pr-10 focus:border-blue-500 focus:outline-none transition-colors ${errors.phone ? 'border-destructive bg-[#FFFAFA]' : ''}`}
                autoComplete="tel"
                {...register('phone', {
                  required: 'Phone number is required',
                  validate: (value: string) => isE164(value) || 'Enter a valid phone number',
                })}
                inputMode="tel"
                onChange={(e) => {
                  const raw = (e.target as HTMLInputElement).value;
                  const value = sanitizePhoneToE164Draft(raw);
                  setValue('phone', value, { shouldValidate: true, shouldDirty: true });
                }}
              />
              <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            {errors.phone && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{String(errors.phone.message)}</span>
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
            </label>
            <div className="relative">
              <Input
                id="email"
                placeholder="eg. johnfrans@gmail.com"
                type="email"
                disabled={isLoading}
                aria-invalid={!!errors.email}
                className={`h-12 bg-gray-50 border border-gray-200 pr-10 focus:border-blue-500 focus:outline-none transition-colors ${errors.email ? 'border-destructive bg-[#FFFAFA]' : ''}`}
                autoComplete="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /[^@\s]+@[^@\s]+\.[^@\s]+/, message: 'Enter a valid email' },
                })}
              />
              <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            {errors.email && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{String(errors.email.message)}</span>
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
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
                    className={`h-12 bg-gray-50 border border-gray-200 pr-10 focus:border-blue-500 focus:outline-none transition-colors ${errors.password ? 'border-destructive bg-[#FFFAFA]' : ''}`}
                    {...passwordField}
                    onFocus={() => { setPwFocused(true); setPwInteracted(true); }}
                    onBlur={(e) => { passwordField.onBlur(e); setPwFocused(false); }}
                  />
                  <button
                    type="button"
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0 border-0 bg-transparent w-4 h-4 flex items-center justify-center cursor-pointer"
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
              <div className="mt-3">
                <PasswordStrength password={watch('password')} variant="bar" />
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pt-8 px-6 md:px-8 pb-6 md:pb-8">
            <Button
                className="w-full h-12 bg-white text-black hover:bg-gray-100 border border-gray-300 font-medium rounded-lg disabled:bg-gray-200 disabled:text-gray-500 disabled:border-gray-200 disabled:cursor-not-allowed disabled:hover:bg-gray-200 transition-colors cursor-pointer"
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
          <div className="relative flex items-center my-6 w-full">
            <div className="flex-1 h-px bg-gray-300 min-w-0"></div>
            <span className="px-4 text-sm text-gray-400 bg-white whitespace-nowrap">Or</span>
            <div className="flex-1 h-px bg-gray-300 min-w-0"></div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Button
              variant="outline"
              className="w-full h-12 bg-white text-gray-700 border-gray-300 hover:bg-gray-50 flex items-center justify-center gap-3 cursor-pointer"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </Button>
          </div>
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Button
              variant="link"
              className="p-0 cursor-pointer"
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