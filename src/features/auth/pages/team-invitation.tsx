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
import { InfoPage } from "../../../shared/components/common/InfoPage";
import { PasswordStrength } from "../components/PasswordStrength";
import { validatePasswordPolicy, isE164, sanitizePhoneToE164Draft } from "../../../shared/utils/validation";
import { Popover, PopoverTrigger, PopoverContent } from "../../../shared/components/ui/popover";
import { useTranslation, Trans } from "react-i18next";

type FormValues = {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
};

export default function TeamInvitationPage() {
  const { t } = useTranslation('auth');
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const invitationStatus = useSelector(selectTeamInvitationStatus);
  const invitationData = useSelector(selectTeamInvitationData);
  const isRegistrationLoading = useSelector(selectIsMemberRegistrationLoading);
  const registrationError = useSelector(selectMemberRegistrationError);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: { firstName: '', lastName: '', phone: '', password: '' }
  });

  const [topError, setTopError] = useState<string | null>(null);
  const [pwFocused, setPwFocused] = useState(false);
  const [pwInteracted, setPwInteracted] = useState(false);

  const passwordValue = watch('password');

  useEffect(() => {
    dispatch(setTokensAction({ accessToken: null, csrfToken: null }));
    
    if (!token) {
      setTopError(t('teamInvitation.errorInvalidToken'));
      return;
    }
    dispatch(checkTeamInvitationAction.request({ token }));
  }, [dispatch, token, t]);

  const onSubmit = (values: FormValues) => {
    setPwFocused(false);
    if (!invitationData?.token) {
      setTopError(t('teamInvitation.errorInvalidData'));
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

  if (invitationStatus === 'checking' || invitationStatus === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-muted to-background">
        <Spinner size="lg" color="info" />
        <p className="text-sm text-muted-foreground">{t('teamInvitation.verifying')}</p>
      </div>
    );
  }

  if (invitationStatus === 'error') {
    return (
      <InfoPage
        title={t('teamInvitation.errorTitle')}
        description={t('teamInvitation.errorDescription')}
        buttons={[
          { label: t('teamInvitation.goToLogin'), onClick: () => navigate('/login') },
        ]}
      />
    );
  }

  if (invitationStatus === 'completed') {
    return (
      <InfoPage
        title={t('teamInvitation.completedTitle')}
        description={t('teamInvitation.completedDescription')}
        buttons={[
          { label: t('teamInvitation.goToLogin'), onClick: () => navigate('/login') },
        ]}
      />
    );
  }

  if (invitationStatus === 'accepted') {
    return (
      <InfoPage
        title={t('teamInvitation.acceptedTitle')}
        description={t('teamInvitation.acceptedDescription')}
        buttons={[
          { label: t('teamInvitation.goToLogin'), onClick: () => navigate('/login') },
        ]}
      />
    );
  }

  const isPasswordValid = validatePasswordPolicy(passwordValue, t) === true;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-muted to-background">
      <Card className="w-full max-w-md border-0 shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">{t('teamInvitation.formTitle')}</CardTitle>
          <CardDescription className="text-center">
            <Trans
              i18nKey="teamInvitation.formDescription"
              ns="auth"
              values={{ business: invitationData?.business.name }}
              components={{ strong: <strong /> }}
            />
          </CardDescription>
          {invitationData?.email && (
            <p className="text-sm text-center text-muted-foreground mt-2">
              {t('teamInvitation.emailLabel', { email: invitationData.email })}
            </p>
          )}
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="grid gap-4">
            {(topError || registrationError) && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                {topError || t('teamInvitation.errorGeneric')}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">{t('teamInvitation.firstName')}</Label>
                <Input 
                  id="firstName" 
                  type="text" 
                  placeholder={t('teamInvitation.firstNamePlaceholder')}
                  disabled={isRegistrationLoading} 
                  aria-invalid={!!errors.firstName} 
                  className={errors.firstName ? 'border-destructive' : ''}
                  {...register('firstName', { required: t('teamInvitation.validation.firstNameRequired') })} 
                />
                <div className="min-h-[18px]">
                  {errors.firstName && (
                    <p className="text-xs text-destructive">{errors.firstName.message}</p>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">{t('teamInvitation.lastName')}</Label>
                <Input 
                  id="lastName" 
                  type="text" 
                  placeholder={t('teamInvitation.lastNamePlaceholder')}
                  disabled={isRegistrationLoading} 
                  aria-invalid={!!errors.lastName}
                  className={errors.lastName ? 'border-destructive' : ''}
                  {...register('lastName', { required: t('teamInvitation.validation.lastNameRequired') })} 
                />
                <div className="min-h-[18px]">
                  {errors.lastName && (
                    <p className="text-xs text-destructive">{errors.lastName.message}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">{t('teamInvitation.phone')}</Label>
              <Input
                id="phone"
                type="tel"
                placeholder={t('teamInvitation.phonePlaceholder')}
                disabled={isRegistrationLoading}
                aria-invalid={!!errors.phone}
                className={errors.phone ? 'border-destructive' : ''}
                {...register('phone', {
                  required: t('teamInvitation.validation.phoneRequired'),
                  validate: (value) => isE164(value) || t('teamInvitation.validation.phoneInvalid'),
                  onChange: (e) => {
                    e.target.value = sanitizePhoneToE164Draft(e.target.value);
                  },
                })}
              />
              <div className="min-h-[18px]">
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">{t('teamInvitation.password')}</Label>
              <Popover open={pwFocused} modal={false}>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder={t('teamInvitation.passwordPlaceholder')}
                      disabled={isRegistrationLoading} 
                      aria-invalid={!!errors.password}
                      className={`transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                        errors.password
                          ? 'border-destructive bg-error-bg focus-visible:ring-error'
                          : 'border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus'
                      }`}
                      {...register('password', {
                        required: t('teamInvitation.validation.passwordRequired'),
                        validate: (value) => validatePasswordPolicy(value, t),
                      })}
                      onFocus={() => { setPwFocused(true); setPwInteracted(true); }}
                      onBlur={(e) => { register('password').onBlur(e); setPwFocused(false); }}
                    />
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
                  <PasswordStrength password={passwordValue} variant="panel" />
                </PopoverContent>
              </Popover>
              <div className="min-h-[28px]">
                {pwInteracted && passwordValue.length > 0 ? (
                  <PasswordStrength password={passwordValue} variant="bar" />
                ) : (
                  errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 mt-4">
            <Button
              type="submit"
              rounded="full"
              className="w-full relative"
              disabled={isRegistrationLoading || !isPasswordValid}
            >
              <span className={isRegistrationLoading ? 'invisible' : ''}>
                {t('teamInvitation.completeRegistration')}
              </span>
              {isRegistrationLoading && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Spinner size="sm" color="white" />
                </span>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              rounded="full"
              className="w-full" 
              onClick={() => navigate('/login')}
              disabled={isRegistrationLoading}
            >
              {t('teamInvitation.backToLogin')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
