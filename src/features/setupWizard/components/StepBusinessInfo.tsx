import React, { useEffect } from 'react';
import { Label } from '../../../shared/components/ui/label';
import { Input } from '../../../shared/components/ui/input';
import { Textarea } from '../../../shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/components/ui/select';
import { Upload, Building2, Phone, AlertCircle } from 'lucide-react';
import type { WizardData } from '../../../shared/hooks/useSetupWizard';
import { useForm } from 'react-hook-form';
import type { StepProps } from '../types';
import { isE164, sanitizePhoneToE164Draft } from '../../auth/validation';

const industries = [  
  'Beauty & Wellness',
  'Healthcare',
  'Professional Services',
  'Fitness & Sports',
  'Education & Training',
  'Automotive',
  'Home Services',
  'Legal Services',
  'Consulting',
  'Other'
];

const currencies = ['USD', 'EUR', 'GBP', 'RON'];
const countries = [
  'Romania',
  'United States',
  'United Kingdom',
  'Europe',
  'Other'
];

const StepBusinessInfo: React.FC<StepProps> = ({ data, onUpdate }) => {
  const { register, watch, setValue, reset, formState: { errors } } = useForm<WizardData>({
    defaultValues: data,
    mode: 'onChange',
  });

  useEffect(() => {
    reset(data);
  }, [data, reset]);

  useEffect(() => {
    const subscription = watch((values) => {
      onUpdate(values as Partial<WizardData>);
    });
    return () => subscription?.unsubscribe?.();
  }, [watch, onUpdate]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Tell us about your business</h3>
          <p className="text-sm text-muted-foreground">This information helps us personalize your experience</p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="space-y-2">
          <Label htmlFor="businessInfo.name" className="text-sm font-medium">
            Business Name *
          </Label>
          <Input
            id="businessInfo.name"
            {...register('businessInfo.name' as any)}
            placeholder="e.g. Sarah's Hair Studio"
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessInfo.industry" className="text-sm font-medium">
            Industry *
          </Label>
          <Select value={watch('businessInfo.industry' as any)} onValueChange={(value) => setValue('businessInfo.industry' as any, value, { shouldDirty: true, shouldTouch: true })}>
            <SelectTrigger className="h-11 w-full">
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent>
              {industries.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This helps us suggest relevant services and templates
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessInfo.description" className="text-sm font-medium">
            Business Description
          </Label>
          <Textarea
            id="businessInfo.description"
            {...register('businessInfo.description' as any)}
            placeholder="Briefly describe what your business does..."
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Contact & Regional */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="businessInfo.email" className="text-sm font-medium">Business Email</Label>
            <Input id="businessInfo.email" type="email" placeholder="you@business.com" className="h-11" {...register('businessInfo.email' as any)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessInfo.phone" className="text-sm font-medium">Business Phone *</Label>
            <div className="relative">
              <Input 
                id="businessInfo.phone" 
                type="tel" 
                placeholder="+1 555 123 4567" 
                className={`h-11 pr-10 ${errors.businessInfo?.phone ? 'border-destructive bg-red-50' : ''}`}
                autoComplete="tel"
                inputMode="tel"
                {...register('businessInfo.phone' as any, {
                  required: 'Phone number is required',
                  validate: (value: string) => isE164(value) || 'Enter a valid phone number',
                })}
                onChange={(e) => {
                  const raw = (e.target as HTMLInputElement).value;
                  const value = sanitizePhoneToE164Draft(raw);
                  setValue('businessInfo.phone' as any, value, { shouldValidate: true, shouldDirty: true });
                }}
              />
              <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            {errors.businessInfo?.phone && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{String(errors.businessInfo.phone.message)}</span>
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessInfo.timezone" className="text-sm font-medium">Timezone</Label>
            <Input id="businessInfo.timezone" type="text" placeholder="America/New_York" className="h-11" {...register('businessInfo.timezone' as any)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessInfo.country" className="text-sm font-medium">Country/Region</Label>
            <Select value={watch('businessInfo.country' as any)} onValueChange={(value) => setValue('businessInfo.country' as any, value, { shouldDirty: true, shouldTouch: true })}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="Select country/region" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessInfo.currency" className="text-sm font-medium">Currency</Label>
            <Select value={watch('businessInfo.currency' as any)} onValueChange={(value) => setValue('businessInfo.currency' as any, value, { shouldDirty: true, shouldTouch: true })}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Socials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="businessInfo.instagramUrl" className="text-sm font-medium">Instagram</Label>
            <Input id="businessInfo.instagramUrl" type="url" placeholder="https://instagram.com/yourbrand" className="h-11" {...register('businessInfo.instagramUrl' as any)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessInfo.facebookUrl" className="text-sm font-medium">Facebook</Label>
            <Input id="businessInfo.facebookUrl" type="url" placeholder="https://facebook.com/yourbrand" className="h-11" {...register('businessInfo.facebookUrl' as any)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Business Logo (Optional)</Label>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG up to 2MB
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepBusinessInfo; 