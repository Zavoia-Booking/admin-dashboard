import React, {
  useCallback,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Label } from "../../../shared/components/ui/label";
import { Input } from "../../../shared/components/ui/input";
import { Upload, Phone, AlertCircle, Mail, Building2 } from "lucide-react";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import LocationNameField from "../../../shared/components/common/LocationNameField";
import LocationDescriptionField from "../../../shared/components/common/LocationDescriptionField";
import type { WizardData } from "../../../shared/hooks/useSetupWizard";
import { useForm, useController } from "react-hook-form";
import { useSelector } from "react-redux";
import type { RootState } from "../../../app/providers/store";
import type { StepProps, StepHandle } from "../types";
import {
  isE164,
  sanitizePhoneToE164Draft,
} from "../../../shared/utils/validation";
import { industryApi } from "../../../shared/api/industry.api";
import IndustrySelector from "./IndustrySelector";
import type { Industry } from "../../../shared/types/industry";

const StepBusinessInfo = forwardRef<StepHandle, StepProps>(
  ({ data, onValidityChange }, ref) => {
    const [industries, setIndustries] = useState<Industry[]>([]);
    const [isLoadingIndustries, setIsLoadingIndustries] = useState(true);
    const isWizardLoading = useSelector(
      (state: RootState) => state.setupWizard.isLoading
    );

    const {
      control,
      register,
      watch,
      setValue,
      reset,
      trigger,
      setError,
      formState: { errors, isValid: formIsValid },
    } = useForm<WizardData>({
      defaultValues: data,
      mode: "onChange",
    });

    const selectedIndustryId =
      watch("businessInfo.industryId" as any) ||
      (data as any)?.businessInfo?.industryId;
    const businessDescription = watch("businessInfo.description" as any) || "";

    // Controlled business name with validation (only validate after wizard loads)
    const { field: businessNameField, fieldState: businessNameState } =
      useController<any>({
        name: "businessInfo.name" as any,
        control,
        rules: isWizardLoading
          ? {}
          : {
              required: "Business name is required",
              minLength: {
                value: 2,
                message: "Business name must be at least 2 characters",
              },
            },
      });

    const handleSelectIndustry = useCallback(
      (industryId: number) => {
        setValue("businessInfo.industryId" as any, industryId, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      },
      [setValue]
    );

    // Notify parent when validity changes
    useEffect(() => {
      if (onValidityChange) {
        const valid =
          formIsValid &&
          selectedIndustryId &&
          Number.isInteger(selectedIndustryId) &&
          selectedIndustryId > 0 &&
          Object.keys(errors).length === 0;
        onValidityChange(valid);
      }
    }, [formIsValid, selectedIndustryId, errors, onValidityChange]);

    const handleBusinessPhoneChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const sanitized = sanitizePhoneToE164Draft(raw);
        setValue("businessInfo.phone" as any, sanitized, {
          shouldValidate: true,
          shouldDirty: true,
        });
      },
      [setValue]
    );

    // Expose methods to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        getFormData: () => watch(),
        triggerValidation: async () => {
          const isValid = await trigger();

          // Additional validation for industry (not in form)
          const currentData = watch();
          const industryId = (currentData as any)?.businessInfo?.industryId;
          if (!industryId || !Number.isInteger(industryId) || industryId <= 0) {
            return false;
          }

          return isValid;
        },
        isValid: () => {
          // Check form validity
          if (!formIsValid) return false;

          // Check industry selection
          const currentData = watch();
          const industryId = (currentData as any)?.businessInfo?.industryId;
          if (!industryId || !Number.isInteger(industryId) || industryId <= 0) {
            return false;
          }

          // Check if there are any errors
          if (Object.keys(errors).length > 0) return false;

          return true;
        },
      }),
      [watch, trigger, errors, formIsValid]
    );

    useEffect(() => {
      const fetchIndustries = async () => {
        try {
          const data = await industryApi.getAll();
          // Sort: "Other" always last, rest alphabetically
          const sorted = data.sort((a, b) => {
            if (a.slug === "other") return 1;
            if (b.slug === "other") return -1;
            return a.name.localeCompare(b.name);
          });
          setIndustries(sorted);
        } catch (error) {
          console.error("Failed to fetch industries:", error);
        } finally {
          setIsLoadingIndustries(false);
        }
      };
      fetchIndustries();
    }, []);

    // Sync form with external data changes (from Redux) and surface only invalid non-empty saved values
    useEffect(() => {
      if (isWizardLoading) return;
      reset(data);
      // After reset, flag only non-empty invalids from saved draft (avoid showing required-empty errors on first load)
      setTimeout(() => {
        const name = (data as any)?.businessInfo?.name?.trim?.() || "";
        if (name !== "" && name.length < 2) {
          setError("businessInfo.name" as any, {
            type: "manual",
            message: "Business name must be at least 2 characters",
          });
        }

        const phone = (data as any)?.businessInfo?.phone || "";
        if (phone && !isE164(phone)) {
          setError("businessInfo.phone" as any, {
            type: "manual",
            message: "Enter a valid phone number",
          });
        }

        const email = (data as any)?.businessInfo?.email || "";
        const emailPattern = /[^@\s]+@[^@\s]+\.[^@\s]+/;
        if (email && !emailPattern.test(email)) {
          setError("businessInfo.email" as any, {
            type: "manual",
            message: "Enter a valid email",
          });
        }
      }, 0);
    }, [data, reset, isWizardLoading, setError]);

    // Step-level skeleton removed; wizard shell handles initial hydration skeleton

    return (
      <div className="space-y-6 cursor-default">
        <div className="grid gap-2">
          <LocationNameField
            value={(businessNameField.value as string) || ""}
            onChange={(v) => businessNameField.onChange(v)}
            error={businessNameState.error?.message as unknown as string}
            label="Business Name"
            placeholder="e.g. Sarah's Hair Studio"
            required
            icon={Building2}
          />

          {/* Contact first under Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="businessInfo.email"
                className="text-base font-medium cursor-default"
              >
                Business Email
              </Label>
              <div className="relative">
                <Input
                  id="businessInfo.email"
                  type="email"
                  placeholder="you@business.com"
                  className={`h-10 !pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                    errors.businessInfo?.email
                      ? "border-destructive bg-red-50 focus-visible:ring-red-400"
                      : "border-gray-200 hover:border-gray-300 focus:border-blue-400 focus-visible:ring-blue-400"
                  }`}
                  autoComplete="email"
                  {...register(
                    "businessInfo.email" as any,
                    isWizardLoading
                      ? {}
                      : {
                          pattern: {
                            value: /[^@\s]+@[^@\s]+\.[^@\s]+/,
                            message: "Enter a valid email",
                          },
                        }
                  )}
                />
                <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              <div className="h-5">
                {errors.businessInfo?.email && (
                  <p
                    className="mt-1 flex items-center gap-1.5 text-xs text-destructive"
                    role="alert"
                    aria-live="polite"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{String(errors.businessInfo.email.message)}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="businessInfo.phone"
                className="text-base font-medium cursor-default"
              >
                Business Phone *
              </Label>
              <div className="relative">
                <Input
                  id="businessInfo.phone"
                  type="tel"
                  placeholder="+1 555 123 4567"
                  className={`h-10 !pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                    errors.businessInfo?.phone
                      ? "border-destructive bg-red-50 focus-visible:ring-red-400"
                      : "border-gray-200 hover:border-gray-300 focus:border-blue-400 focus-visible:ring-blue-400"
                  }`}
                  autoComplete="tel"
                  inputMode="tel"
                  {...register(
                    "businessInfo.phone" as any,
                    isWizardLoading
                      ? {}
                      : {
                          required: "Phone number is required",
                          validate: (value: string) =>
                            isE164(value) || "Enter a valid phone number",
                        }
                  )}
                  onChange={handleBusinessPhoneChange}
                />
                <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              <div className="h-5">
                {errors.businessInfo?.phone && (
                  <p
                    className="mt-1 flex items-center gap-1.5 text-xs text-destructive"
                    role="alert"
                    aria-live="polite"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{String(errors.businessInfo.phone.message)}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <LocationDescriptionField
            value={businessDescription as string}
            onChange={(v) =>
              setValue("businessInfo.description" as any, v, {
                shouldDirty: true,
              })
            }
            label="Business Description"
            placeholder="Briefly describe what your business does..."
            maxLength={500}
            rows={3}
            id="businessInfo.description"
            className="cursor-default"
          />

          <div className="space-y-3 pt-4">
            <Label className="text-base font-medium cursor-defaul mb-0">
              Industry *
            </Label>
            <p className="text-sm text-muted-foreground">
              This helps us suggest relevant services and templates
            </p>
            {isLoadingIndustries ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <IndustrySelector
                industries={industries}
                selectedId={selectedIndustryId}
                onSelect={handleSelectIndustry}
              />
            )}
          </div>

          <div className="space-y-2 pt-4">
            <Label className="text-base font-medium cursor-default">
              Business Logo (Optional)
            </Label>
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
  }
);

StepBusinessInfo.displayName = "StepBusinessInfo";

export default StepBusinessInfo;
