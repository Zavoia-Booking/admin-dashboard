import React, {
  useCallback,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { Label } from "../../../shared/components/ui/label";
import { Input } from "../../../shared/components/ui/input";
import { Upload, Phone, AlertCircle, Building2 } from "lucide-react";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import LocationNameField from "../../../shared/components/common/LocationNameField";
import LocationDescriptionField from "../../../shared/components/common/LocationDescriptionField";
import type { WizardData } from "../../../shared/hooks/useSetupWizard";
import { useForm, useController } from "react-hook-form";
import { useSelector } from "react-redux";
import type { RootState } from "../../../app/providers/store";
import type { StepProps, StepHandle, WizardFieldPath } from "../types";
import {
  isE164,
  sanitizePhoneToE164Draft,
  requiredEmailError,
  validateBusinessName,
  validateDescription,
} from "../../../shared/utils/validation";
import { industryApi } from "../../../shared/api/industry.api";
import IndustrySelector from "./IndustrySelector";
import type { Industry } from "../../../shared/types/industry";
import { selectCurrentUser } from "../../auth/selectors";
import ContactInformationToggle from "../../../shared/components/common/ContactInformationToggle";
import { useDraftValidation } from "../../../shared/hooks/useDraftValidation";

const StepBusinessInfo = forwardRef<StepHandle, StepProps>(
  ({ data, onValidityChange }, ref) => {
    const [industries, setIndustries] = useState<Industry[]>([]);
    const [isLoadingIndustries, setIsLoadingIndustries] = useState(true);
    const isWizardLoading = useSelector(
      (state: RootState) => state.setupWizard.isLoading
    );
    const currentUser = useSelector(selectCurrentUser);
    const accountEmail = (currentUser?.email || "").trim();
    
    // Initialize toggle state from draft data to avoid flash on load
    const [useAccountEmail, setUseAccountEmail] = useState<boolean>(() => {
      const draftToggleState = data.useAccountEmail;
      // If draft has explicit state, use it; otherwise default to true
      return typeof draftToggleState === 'boolean' ? draftToggleState : true;
    });

    const {
      control,
      register,
      watch,
      setValue,
      reset,
      trigger,
      formState: { errors, isValid: formIsValid },
    } = useForm<WizardData>({
      defaultValues: data,
      mode: "onChange",
    });

    const selectedIndustryId =
      watch("businessInfo.industryId" satisfies WizardFieldPath) ||
      data.businessInfo?.industryId;

    // Controlled business name with validation (only validate after wizard loads)
    const { field: businessNameField, fieldState: businessNameState } =
      useController<WizardData, "businessInfo.name">({
        name: "businessInfo.name",
        control,
        rules: isWizardLoading
          ? {}
          : {
              validate: (value) => {
                const error = validateBusinessName(value);
                return error === null ? true : error;
              },
            },
      });

    // Controlled email with conditional validation based on toggle
    const { field: businessEmailField, fieldState: businessEmailState } =
      useController<WizardData, "businessInfo.email">({
        name: "businessInfo.email",
        control,
        rules: isWizardLoading
          ? {}
          : {
              validate: (value) => {
                if (useAccountEmail) return true; // When toggle is ON, validation is skipped
                const error = requiredEmailError("Business email", value);
                return error === null ? true : error;
              },
            },
      });

    // Controlled business description with validation (optional field)
    const { field: businessDescriptionField, fieldState: businessDescriptionState } =
      useController<WizardData, "businessInfo.description">({
        name: "businessInfo.description",
        control,
        rules: {
          validate: (value) => {
            if (!value || !value.trim()) return true; // Optional field
            const error = validateDescription(value, 500);
            return error === null ? true : error;
          },
        },
      });

    // Trigger validation on draft load to show errors for invalid saved data
    const showDraftErrors = useDraftValidation({
      trigger,
      data,
      section: 'businessInfo',
    });

    const handleSelectIndustry = useCallback(
      (industryId: number) => {
        setValue("businessInfo.industryId" satisfies WizardFieldPath, industryId, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      },
      [setValue]
    );

    // Sync toggle state when account email is available and toggle is ON
    useEffect(() => {
      if (isWizardLoading || !useAccountEmail || !accountEmail) return;
      
      // If toggle is ON, sync form email with account email
      const currentEmail = watch("businessInfo.email" satisfies WizardFieldPath);
      if (currentEmail !== accountEmail) {
        setValue("businessInfo.email" satisfies WizardFieldPath, accountEmail, {
          shouldDirty: false,
          shouldValidate: false, // Don't trigger validation here
        });
      }
    }, [useAccountEmail, accountEmail, isWizardLoading, watch, setValue]);

    // Handle toggle changes: when ON, mirror the account email into the form; when OFF, clear it
    const handleUseAccountEmailChange = useCallback((checked: boolean) => {
      setUseAccountEmail(checked);
      if (checked) {
        setValue("businessInfo.email" satisfies WizardFieldPath, accountEmail, {
          shouldDirty: false,  // Don't mark as dirty - this prevents isDirty reset
          shouldValidate: true,
        });
      } else {
        // Clear the email field when toggling OFF
        setValue("businessInfo.email" satisfies WizardFieldPath, "", {
          shouldDirty: false,
          shouldValidate: true,
        });
      }
      // Save toggle state (will be included in getFormData)
    }, [accountEmail, setValue]);

    // Notify parent when validity changes
    useEffect(() => {
      if (onValidityChange) {
        const valid =
          formIsValid &&
          !!selectedIndustryId &&
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
        setValue("businessInfo.phone" satisfies WizardFieldPath, sanitized, {
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
        getFormData: () => {
          const current = watch();
          const effectiveEmail = useAccountEmail && accountEmail
            ? accountEmail
            : (current.businessInfo?.email || "");
          const result: Partial<WizardData> = {
            ...current,
            businessInfo: {
              ...current.businessInfo,
              email: effectiveEmail,
            },
            useAccountEmail, // Include toggle state in saved data
          };
          return result;
        },
        triggerValidation: async () => {
          const isValid = await trigger();

          // Additional validation for industry (not in form)
          const currentData = watch();
          const industryId = currentData.businessInfo?.industryId;
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
          const industryId = currentData.businessInfo?.industryId;
          if (!industryId || !Number.isInteger(industryId) || industryId <= 0) {
            return false;
          }

          // Check if there are any errors
          if (Object.keys(errors).length > 0) return false;

          return true;
        },
      }),
      [watch, trigger, errors, formIsValid, useAccountEmail, accountEmail]
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

    // Reset form ONLY once when wizard finishes loading
    const hasInitialized = useRef(false);
    useEffect(() => {
      if (isWizardLoading || hasInitialized.current) return;
      reset(data);
      hasInitialized.current = true;
    }, [isWizardLoading, data, reset]);

    // Step-level skeleton removed; wizard shell handles initial hydration skeleton

    return (
      <div className="space-y-6 cursor-default">
        <div className="grid gap-2">
          <LocationNameField
            value={(businessNameField.value as string) || ""}
            onChange={(v) => businessNameField.onChange(v)}
            error={(businessNameState.isTouched || businessNameState.isDirty || showDraftErrors) ? (businessNameState.error?.message as unknown as string) : undefined}
            label="Business Name"
            placeholder="e.g. Sarah's Salon & Spa"
            required
            icon={Building2}
          />

          {/* Contact first under Name */}
          <div className="grid grid-cols-1 gap-4">
            <ContactInformationToggle
              useInheritedContact={useAccountEmail}
              onToggleChange={handleUseAccountEmailChange}
              inheritedEmail={accountEmail}
              inheritedLabel="your account"
              localEmail={(businessEmailField.value as string) || ""}
              localPhone={""}
              onEmailChange={(email) => businessEmailField.onChange(email)}
              onPhoneChange={() => {}}
              emailError={!useAccountEmail && (businessEmailState.isTouched || businessEmailState.isDirty || showDraftErrors) ? (businessEmailState.error?.message as string) : undefined}
              className=""
              id="business-email-toggle"
              showEmail={true}
              showPhone={false}
              title="Business email *"
              emailLabel=""
              helperTextOn="Your account email will be used for business contact."
              helperTextOff="Provide a separate email for business contact."
            />
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
                    "businessInfo.phone" satisfies WizardFieldPath,
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
            value={(businessDescriptionField.value as string) || ""}
            onChange={(v) => businessDescriptionField.onChange(v)}
            label="Business Description"
            placeholder="Tell customers what makes your business special..."
            maxLength={500}
            rows={3}
            id="businessInfo.description"
            className="cursor-default"
            error={(businessDescriptionState.isTouched || businessDescriptionState.isDirty || showDraftErrors) ? (businessDescriptionState.error?.message as string) : undefined}
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
