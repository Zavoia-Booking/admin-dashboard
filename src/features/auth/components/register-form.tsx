import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../../../shared/components/ui/button"
import { Input } from "../../../shared/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../shared/components/ui/card"
import { Label } from "../../../shared/components/ui/label"
import { Separator } from "../../../shared/components/ui/separator"
import { toast } from "sonner"
import { useDispatch, useSelector } from "react-redux"
import { registerOwnerRequest } from "../actions"
import type { RootState } from "../../../app/providers/store"

export function RegisterForm() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const dispatch = useDispatch();
  const { isLoading, isAuthenticated, error: authError } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setError(null)
    dispatch(registerOwnerRequest({
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      email: formData.email,
      password: formData.password,
    }));
  }

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (authError) {
      toast.error(authError);
    }
  }, [authError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Create a Business Owner Account</CardTitle>
        <CardDescription className="text-center">
          Enter your details below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              placeholder="Enter your first name"
              type="text"
              value={formData.firstName}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              placeholder="Enter your last name"
              type="text"
              value={formData.lastName}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            name="phone"
            placeholder="Enter your phone number"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            disabled={isLoading}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            placeholder="Enter your email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            placeholder="Create a password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Confirm your password"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={isLoading}
            required
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isLoading}
        >
          {/*{authStore.isLoading && (*/}
          {/*  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />*/}
          {/*)}*/}
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
              // disabled={authStore.isLoading}
          >
            {/*TODO*/}
            {/*{authStore.isLoading ? (*/}
            {/*  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />*/}
            {/*) : (*/}
            {/*  <Icons.google className="mr-2 h-4 w-4" />*/}
            {/*)}*/}
            Google
          </Button>
          {/*TODO*/}
          <Button
              variant="outline"
              // disabled={authStore.isLoading}
          >
            {/*{authStore.isLoading ? (*/}
            {/*  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />*/}
            {/*) : (*/}
            {/*  <Icons.github className="mr-2 h-4 w-4" />*/}
            {/*)}*/}
            {/*GitHub*/}
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
    </Card>
  )
} 