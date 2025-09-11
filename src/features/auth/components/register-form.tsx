import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../../../shared/components/ui/button"
import { AlertCircle } from "lucide-react"
import { Input } from "../../../shared/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../shared/components/ui/card"
import { Label } from "../../../shared/components/ui/label"
import { Separator } from "../../../shared/components/ui/separator"
import { toast } from "sonner"
import { useDispatch, useSelector } from "react-redux"
import { registerOwnerRequestAction } from "../actions"
import type { RootState } from "../../../app/providers/store"
import { useForm } from "react-hook-form"
import { PasswordStrength } from "./PasswordStrength"
import { nameRules, sanitizeName, phoneRules, emailRules, sanitizePhoneToE164Draft, validatePasswordPolicy } from "../validation"
import { Popover, PopoverTrigger, PopoverContent } from "../../../shared/components/ui/popover"

type FormValues = {
  firstName: string
  lastName: string
  phone: string
  email: string
  password: string
  confirmPassword: string
}

export function RegisterForm() {
  const navigate = useNavigate()
  const [error, setTopError] = useState<string | null>(null)
  const [pwFocused, setPwFocused] = useState<boolean>(false)
  const dispatch = useDispatch();
  const { isLoading, isAuthenticated, error: authError } = useSelector((state: RootState) => state.auth);

  const { register, handleSubmit, formState: { errors, isValid, isSubmitting }, watch, setValue } = useForm<FormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
    }
  })
  
  const firstNameField = register('firstName', nameRules as any);
  const lastNameField = register('lastName', nameRules as any);

  const passwordField = register('password', {
    required: 'Password is required',
    validate: (value) => validatePasswordPolicy(value),
  })

  const onSubmit = (values: FormValues) => {
    if (values.password !== values.confirmPassword) {
      setTopError("Passwords do not match");
      return;
    }
    setTopError(null)
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
      toast.error(authError);
    }
  }, [authError]);

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Create a Business Owner Account</CardTitle>
        <CardDescription className="text-center">
          Enter your details below to create your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="grid gap-4">
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="Enter your first name"
                type="text"
                disabled={isLoading}
                aria-invalid={!!errors.firstName}
                className={errors.firstName ? 'border-destructive focus-visible:ring-destructive bg-[#FFFAFA]' : undefined}
                autoComplete="given-name"
                {...firstNameField}
                onChange={(e) => {
                  const value = sanitizeName((e.target as HTMLInputElement).value);
                  setValue('firstName', value, { shouldValidate: true, shouldDirty: true });
                }}
              />
              {errors.firstName && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{String(errors.firstName.message)}</span>
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Enter your last name"
                type="text"
                disabled={isLoading}
                aria-invalid={!!errors.lastName}
                className={errors.lastName ? 'border-destructive focus-visible:ring-destructive bg-[#FFFAFA]' : undefined}
                autoComplete="family-name"
                {...lastNameField}
                onChange={(e) => {
                  const value = sanitizeName((e.target as HTMLInputElement).value);
                  setValue('lastName', value, { shouldValidate: true, shouldDirty: true });
                }}
              />
              {errors.lastName && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{String(errors.lastName.message)}</span>
                </p>
              )}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="Enter your phone number"
              type="tel"
              disabled={isLoading}
              aria-invalid={!!errors.phone}
              className={errors.phone ? 'border-destructive focus-visible:ring-destructive bg-[#FFFAFA]' : undefined}
              autoComplete="tel"
              {...register('phone', phoneRules as any)}
              inputMode="tel"
              onChange={(e) => {
                const raw = (e.target as HTMLInputElement).value;
                const value = sanitizePhoneToE164Draft(raw);
                setValue('phone', value, { shouldValidate: true, shouldDirty: true });
              }}
            />
            {errors.phone && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{String(errors.phone.message)}</span>
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="Enter your email"
              type="email"
              disabled={isLoading}
              aria-invalid={!!errors.email}
              className={errors.email ? 'border-destructive focus-visible:ring-destructive bg-[#FFFAFA]' : undefined}
              autoComplete="email"
              {...register('email', emailRules as any)}
            />
            {errors.email && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{String(errors.email.message)}</span>
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Popover open={pwFocused} onOpenChange={setPwFocused}>
              <PopoverTrigger asChild>
                <Input
                  id="password"
                  placeholder="Create a password"
                  type="password"
                  disabled={isLoading}
                  aria-invalid={!!errors.password}
                  className={errors.password ? 'border-destructive focus-visible:ring-destructive bg-[#FFFAFA]' : undefined}
                  onFocus={() => setPwFocused(true)}
                  {...passwordField}
                  onBlur={(e) => { passwordField.onBlur(e); setPwFocused(false); }}
                />
              </PopoverTrigger>
              <PopoverContent side="top" align="start" sideOffset={8} className="p-0 border-none bg-transparent shadow-none w-auto">
                <PasswordStrength password={watch('password')} variant="panel" />
              </PopoverContent>
            </Popover>
            <PasswordStrength password={watch('password')} />
            {errors.password && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{String(errors.password.message)}</span>
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              placeholder="Confirm your password"
              type="password"
              disabled={isLoading}
              aria-invalid={!!errors.confirmPassword}
              className={errors.confirmPassword ? 'border-destructive focus-visible:ring-destructive bg-[#FFFAFA]' : undefined}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value, formValues) => value === (formValues as any)?.password || 'Passwords do not match',
              })}
            />
            {errors.confirmPassword && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{String(errors.confirmPassword.message)}</span>
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
              className="w-full"
              type="submit"
              disabled={isLoading || !isValid || isSubmitting}
          >
            Create Account
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button
                variant="outline"
            >
              Google
            </Button>
            <Button
                variant="outline"
            >
            </Button>
          </div>
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Button
              variant="link"
              className="p-0"
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