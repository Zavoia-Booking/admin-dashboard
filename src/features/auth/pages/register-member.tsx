import { useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "../../../shared/components/ui/card";
import { Button } from "../../../shared/components/ui/button";
import { Input } from "../../../shared/components/ui/input";
import { Label } from "../../../shared/components/ui/label";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { registerMemberAction } from "../actions";
import type { RootState } from "../../../app/providers/store";

type FormValues = {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterMemberPage() {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state: RootState) => state.auth);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    mode: 'onSubmit',
    defaultValues: { firstName: '', lastName: '', phone: '', password: '', confirmPassword: '' }
  });

  const [topError, setTopError] = useState<string | null>(null);

  const onSubmit = (values: FormValues) => {
    if (!token) {
      setTopError("Invalid or missing invitation token.");
      return;
    }
    if (values.password !== values.confirmPassword) {
      setTopError("Passwords do not match");
      return;
    }
    setTopError(null);
    dispatch(registerMemberAction.request({
      token,
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
      password: values.password,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Complete your profile</CardTitle>
          <CardDescription className="text-center">Set your details to join the team</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="grid gap-4">
            {(topError || errors.firstName || errors.lastName || errors.phone || errors.password || errors.confirmPassword) && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                {topError || errors.firstName?.message || errors.lastName?.message || errors.phone?.message || errors.password?.message || errors.confirmPassword?.message}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" type="text" placeholder="First name" disabled={isLoading} aria-invalid={!!errors.firstName} {...register('firstName', { required: 'First name is required' })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" type="text" placeholder="Last name" disabled={isLoading} aria-invalid={!!errors.lastName} {...register('lastName', { required: 'Last name is required' })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" placeholder="Phone number" disabled={isLoading} aria-invalid={!!errors.phone} {...register('phone', { required: 'Phone number is required' })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Create a password" disabled={isLoading} aria-invalid={!!errors.password} {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" placeholder="Confirm password" disabled={isLoading} aria-invalid={!!errors.confirmPassword} {...register('confirmPassword', { required: 'Please confirm your password' })} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isLoading}>Create account</Button>
            <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/login')}>Back to login</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}


