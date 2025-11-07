import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "../../../shared/components/ui/card";
import { Button } from "../../../shared/components/ui/button";
import { Input } from "../../../shared/components/ui/input";
import { Label } from "../../../shared/components/ui/label";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { checkTeamInvitationAction, completeTeamInvitationAction, setTokensAction } from "../actions";
import { 
  selectTeamInvitationStatus, 
  selectTeamInvitationData,
  selectIsMemberRegistrationLoading,
  selectMemberRegistrationError
} from "../selectors";
import { Spinner } from "../../../shared/components/ui/spinner";

type FormValues = {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
};

export default function TeamInvitationPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const invitationStatus = useSelector(selectTeamInvitationStatus);
  const invitationData = useSelector(selectTeamInvitationData);
  const isRegistrationLoading = useSelector(selectIsMemberRegistrationLoading);
  const registrationError = useSelector(selectMemberRegistrationError);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    mode: 'onSubmit',
    defaultValues: { firstName: '', lastName: '', phone: '', password: '' }
  });

  const [topError, setTopError] = useState<string | null>(null);

  // Check invitation on mount (tokens are cleared before this runs)
  useEffect(() => {
    // First, clear any stale auth state to prevent axios interceptor from adding auth headers
    dispatch(setTokensAction({ accessToken: null, csrfToken: null }));
    
    // Then check the invitation
    if (!token) {
      setTopError("Invalid or missing invitation token.");
      return;
    }
    dispatch(checkTeamInvitationAction.request({ token }));
  }, [dispatch, token]);


  const onSubmit = (values: FormValues) => {
    if (!invitationData?.token) {
      setTopError("Invalid invitation data.");
      return;
    }
    setTopError(null);
    dispatch(completeTeamInvitationAction.request({
      token: invitationData.token,
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
      password: values.password,
    }));
  };

  // Loading state while checking invitation
  if (invitationStatus === 'checking' || invitationStatus === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <Spinner size="lg" />
              <p className="text-sm text-muted-foreground">Verifying invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (invitationStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-destructive">Invalid Invitation</CardTitle>
            <CardDescription className="text-center">
              This invitation link is invalid or has expired. Please contact your administrator for a new invitation.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate('/login')}>Go to Login</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Success state - registration completed
  if (invitationStatus === 'completed') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Registration Complete!</CardTitle>
            <CardDescription className="text-center mt-2">
              Your account has been successfully created. You can now log in to access your dashboard.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate('/login')} className="w-full">
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Accepted - user already existed and was added to business
  if (invitationStatus === 'accepted') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <CardTitle className="text-2xl text-center">You're All Set!</CardTitle>
            <CardDescription className="text-center mt-2">
              You've been successfully added to the business. Please log in to access your dashboard.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate('/login')} className="w-full">
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Registration form (status === 'needs_registration')
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Complete your profile</CardTitle>
          <CardDescription className="text-center">
            You've been invited to join <strong>{invitationData?.business.name}</strong>
          </CardDescription>
          {invitationData?.email && (
            <p className="text-sm text-center text-muted-foreground mt-2">
              Email: {invitationData.email}
            </p>
          )}
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="grid gap-4">
            {(topError || registrationError || errors.firstName || errors.lastName || errors.phone || errors.password) && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                {topError || 
                  (registrationError ? "Something went wrong. Please try again or contact your administrator." : null) ||
                  errors.firstName?.message || 
                  errors.lastName?.message || 
                  errors.phone?.message || 
                  errors.password?.message}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName" 
                  type="text" 
                  placeholder="First name" 
                  disabled={isRegistrationLoading} 
                  aria-invalid={!!errors.firstName} 
                  {...register('firstName', { required: 'First name is required' })} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName" 
                  type="text" 
                  placeholder="Last name" 
                  disabled={isRegistrationLoading} 
                  aria-invalid={!!errors.lastName} 
                  {...register('lastName', { required: 'Last name is required' })} 
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="Phone number" 
                disabled={isRegistrationLoading} 
                aria-invalid={!!errors.phone} 
                {...register('phone', { required: 'Phone number is required' })} 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Create a password" 
                disabled={isRegistrationLoading} 
                aria-invalid={!!errors.password} 
                {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })} 
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 mt-4">
            <Button type="submit" className="w-full" disabled={isRegistrationLoading}>
              {isRegistrationLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <Spinner size="sm" color="info" />
                </div>
              ) : (
                "Complete Registration"
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate('/login')}
              disabled={isRegistrationLoading}
            >
              Back to login
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

