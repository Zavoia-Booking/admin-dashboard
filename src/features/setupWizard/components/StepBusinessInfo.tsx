import React, { useEffect, useState } from 'react';
import { Label } from '../../../shared/components/ui/label';
import { Input } from '../../../shared/components/ui/input';
import { Textarea } from '../../../shared/components/ui/textarea';
import { Upload, Building2, Phone, AlertCircle } from 'lucide-react';
import type { WizardData } from '../../../shared/hooks/useSetupWizard';
import { useForm } from 'react-hook-form';
import type { StepProps } from '../types';
import { isE164, sanitizePhoneToE164Draft } from '../../auth/validation';
import { industryApi } from '../../../shared/api/industry.api';
import type { Industry } from '../../../shared/types/industry';


const StepBusinessInfo: React.FC<StepProps> = ({ data, onUpdate }) => {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [isLoadingIndustries, setIsLoadingIndustries] = useState(true);

  const { register, watch, setValue, reset, formState: { errors } } = useForm<WizardData>({
    defaultValues: data,
    mode: 'onChange',
  });

  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const data = await industryApi.getAll();
        // Sort: "Other" always last, rest alphabetically
        const sorted = data.sort((a, b) => {
          if (a.slug === 'other') return 1;
          if (b.slug === 'other') return -1;
          return a.name.localeCompare(b.name);
        });
        setIndustries(sorted);
      } catch (error) {
        console.error('Failed to fetch industries:', error);
      } finally {
        setIsLoadingIndustries(false);
      }
    };
    fetchIndustries();
  }, []);

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
    <div className="space-y-6 cursor-default">
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
          <Label htmlFor="businessInfo.name" className="text-sm font-medium cursor-default">
            Business Name *
          </Label>
          <Input
            id="businessInfo.name"
            {...register('businessInfo.name' as any)}
            placeholder="e.g. Sarah's Hair Studio"
            className="h-11"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium cursor-default">
            Industry *
          </Label>
          <p className="text-xs text-muted-foreground">
            This helps us suggest relevant services and templates
          </p>
          {isLoadingIndustries ? (
            <div className="text-sm text-muted-foreground">Loading industries...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" role="radiogroup" aria-label="Select industry">
              {industries.map((industry) => {
                const isSelected = watch('businessInfo.industry' as any) === industry.id;
                return (
                  <button
                    key={industry.id}
                    type="button"
                    onClick={() => setValue('businessInfo.industry' as any, industry.id, { shouldDirty: true, shouldTouch: true })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setValue('businessInfo.industry' as any, industry.id, { shouldDirty: true, shouldTouch: true });
                      }
                    }}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={0}
                    className={`
                      group relative flex items-center justify-center min-h-[52px] px-3 py-2 rounded-lg border text-sm font-normal transition-colors cursor-pointer
                      ${isSelected
                        ? 'border-primary bg-primary/5 text-primary shadow-xs'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      } focus:outline-none focus-visible:ring-1 focus-visible:ring-ring/30
                    `}
                  >
                    <span className="text-center leading-tight select-none">{industry.name}</span>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 shadow-sm flex items-center justify-center animate-in zoom-in-50 duration-200">
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessInfo.description" className="text-sm font-medium cursor-default">
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
            <Label htmlFor="businessInfo.email" className="text-sm font-medium cursor-default">Business Email</Label>
            <Input 
              id="businessInfo.email" 
              type="email" 
              placeholder="you@business.com" 
              className={`h-11 ${errors.businessInfo?.email ? 'border-destructive bg-red-50' : ''}`}
              autoComplete="email"
              {...register('businessInfo.email' as any, {
                pattern: { value: /[^@\s]+@[^@\s]+\.[^@\s]+/, message: 'Enter a valid email' },
              })} 
            />
            {errors.businessInfo?.email && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{String(errors.businessInfo.email.message)}</span>
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessInfo.phone" className="text-sm font-medium cursor-default">Business Phone *</Label>
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
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium cursor-default">Business Logo (Optional)</Label>
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