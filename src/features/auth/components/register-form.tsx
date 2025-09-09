import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../../../shared/components/ui/button"
import { Input } from "../../../shared/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../shared/components/ui/card"
import { Label } from "../../../shared/components/ui/label"
import { Separator } from "../../../shared/components/ui/separator"
import { toast } from "sonner"
import { useDispatch, useSelector } from "react-redux"
import { registerOwnerRequestAction } from "../actions"
import type { RootState } from "../../../app/providers/store"
import { useForm } from "react-hook-form"

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
  const dispatch = useDispatch();
  const { isLoading, isAuthenticated, error: authError } = useSelector((state: RootState) => state.auth);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    mode: 'onSubmit',
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
    }
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
          {(error || errors.firstName || errors.lastName || errors.email || errors.password || errors.confirmPassword) && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {error || errors.firstName?.message || errors.lastName?.message || errors.email?.message || errors.password?.message || errors.confirmPassword?.message}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="Enter your first name"
                type="text"
                disabled={isLoading}
                aria-invalid={!!errors.firstName}
                {...register('firstName', { required: 'First name is required' })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Enter your last name"
                type="text"
                disabled={isLoading}
                aria-invalid={!!errors.lastName}
                {...register('lastName', { required: 'Last name is required' })}
              />
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
              {...register('phone', { required: 'Phone number is required' })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="Enter your email"
              type="email"
              disabled={isLoading}
              aria-invalid={!!errors.email}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /[^@\s]+@[^@\s]+\.[^@\s]+/, message: 'Enter a valid email' },
              })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              placeholder="Create a password"
              type="password"
              disabled={isLoading}
              aria-invalid={!!errors.password}
              {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              placeholder="Confirm your password"
              type="password"
              disabled={isLoading}
              aria-invalid={!!errors.confirmPassword}
              {...register('confirmPassword', { required: 'Please confirm your password' })}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
              className="w-full"
              type="submit"
              disabled={isLoading}
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