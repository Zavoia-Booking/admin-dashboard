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
import { Phone, AlertCircle, Building2 } from "lucide-react";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import LocationNameField from "../../../shared/components/common/LocationNameField";
import LocationDescriptionField from "../../../shared/components/common/LocationDescriptionField";
import LogoUpload from "../../../shared/components/common/LogoUpload";
import CurrencySelect from "../../../shared/components/common/CurrencySelect";
import type { WizardData } from "../../../shared/hooks/useSetupWizard";
import { useForm, useController } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
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
import { useFieldDraftValidation } from "../../../shared/hooks/useDraftValidation";
import { resetRegistrationFlag } from "../../auth/actions";
import { setLogoBufferAction, clearLogoBufferAction } from "../actions";

const StepBusinessInfo = forwardRef<StepHandle, StepProps>(
  ({ data, onValidityChange }, ref) => {
    const dispatch = useDispatch();
    const [industries, setIndustries] = useState<Industry[]>([]);
    const [isLoadingIndustries, setIsLoadingIndustries] = useState(true);
    const isWizardLoading = useSelector(
      (state: RootState) => state.setupWizard.isLoading
    );
    const logoFileBuffer = useSelector(
      (state: RootState) => state.setupWizard.logoFileBuffer
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

    // Get logo from form state - distinguish between "not set" (undefined) and "cleared" (null)
    // Prioritize: form state > Redux buffer > saved logo URL
    const watchedLogo = watch("businessInfo.logo" as any);
    const businessLogo = watchedLogo !== undefined
      ? watchedLogo
      : logoFileBuffer || ((data as any)?.businessInfo?.logo || null);

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

    // Controlled business phone with validation
    const { field: businessPhoneField, fieldState: businessPhoneState } =
      useController<WizardData, "businessInfo.phone">({
        name: "businessInfo.phone",
        control,
        rules: isWizardLoading
          ? {}
          : {
              required: "Phone number is required",
              validate: (value: string) =>
                isE164(value) || "Enter a valid phone number",
            },
      });

    // Controlled business currency with validation (required field)
    const { field: businessCurrencyField, fieldState: businessCurrencyState } =
      useController<WizardData, "businessInfo.businessCurrency">({
        name: "businessInfo.businessCurrency",
        control,
        rules: isWizardLoading
          ? {}
          : {
              required: "Currency is required for pricing display",
              validate: (value) => {
                const validCodes = ['eur', 'usd', 'ron', 'gbp', 'chf', 'sek', 'nok', 'dkk', 'pln', 'czk', 'huf', 'bgn', 'hrk', 'try'];
                return validCodes.includes(value?.toLowerCase()) || "Please select a valid currency";
              },
            },
        defaultValue: data.businessInfo?.businessCurrency || 'eur',
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

    // Per-field draft validation - only show errors for fields that actually have draft data
    const nameHasDraft = useFieldDraftValidation({
      fieldName: 'name',
      trigger,
      data,
      section: 'businessInfo',
    });
    const emailHasDraft = useFieldDraftValidation({
      fieldName: 'email',
      trigger,
      data,
      section: 'businessInfo',
    });
    const phoneHasDraft = useFieldDraftValidation({
      fieldName: 'phone',
      trigger,
      data,
      section: 'businessInfo',
    });
    const descriptionHasDraft = useFieldDraftValidation({
      fieldName: 'description',
      trigger,
      data,
      section: 'businessInfo',
    });
    const currencyHasDraft = useFieldDraftValidation({
      fieldName: 'businessCurrency',
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

    const handleLogoUpload = useCallback(
      (file: File | null) => {
        if (file === null) {
          // User clicked X - mark for deletion
          // Set to null to indicate "no logo wanted"
          setValue("businessInfo.logo" as any, null, {
            shouldDirty: true,
            shouldTouch: true,
          });
          setValue("businessInfo.logoKey" as any, null, {
            shouldDirty: true,
            shouldTouch: true,
          });
          // Clear logo buffer in Redux
          dispatch(clearLogoBufferAction());
        } else {
          // New file selected - store for preview and later upload
          setValue("businessInfo.logo" as any, file, {
            shouldDirty: true,
            shouldTouch: true,
          });
          // Store file buffer in Redux so it persists across navigation
          dispatch(setLogoBufferAction(file));
          // Don't clear logoKey yet - will be set after upload
        }
      },
      [setValue, dispatch]
    );

    // Notify parent when validity changes
    useEffect(() => {
      if (onValidityChange) {
        const valid =
          formIsValid &&
          !!selectedIndustryId &&
          Number.isInteger(selectedIndustryId) &&
          selectedIndustryId > 0 &&
          !!businessCurrencyField.value &&
          Object.keys(errors).length === 0;
        onValidityChange(valid);
      }
    }, [formIsValid, selectedIndustryId, businessCurrencyField.value, errors, onValidityChange]);

    useEffect(() => {
      dispatch(resetRegistrationFlag());
    }, [dispatch]);

    const handleBusinessPhoneChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const sanitized = sanitizePhoneToE164Draft(raw);
        businessPhoneField.onChange(sanitized);
      },
      [businessPhoneField]
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
              businessCurrency: current.businessInfo?.businessCurrency || 'eur', // Ensure default
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

          // Additional validation for currency
          const businessCurrency = currentData.businessInfo?.businessCurrency;
          if (!businessCurrency) {
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

          // Check currency selection
          const businessCurrency = currentData.businessInfo?.businessCurrency;
          if (!businessCurrency) {
            return false;
          }

          // Check if there are any errors
          if (Object.keys(errors).length > 0) return false;

          return true;
        },
      }),
      [watch, trigger, errors, formIsValid, useAccountEmail, accountEmail, businessCurrencyField.value]
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
    // Sync logo buffer with form state when component mounts
    useEffect(() => {
      if (logoFileBuffer && !watch("businessInfo.logo" as any)) {
        // Restore logo from buffer into form state
        setValue("businessInfo.logo" as any, logoFileBuffer, {
          shouldDirty: false,
          shouldTouch: false,
        });
      }
    }, [logoFileBuffer, setValue, watch]);

    // Sync form with external data changes (from Redux) and surface only invalid non-empty saved values
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
            error={(businessNameState.isTouched || businessNameState.isDirty || nameHasDraft) ? (businessNameState.error?.message as unknown as string) : undefined}
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
              emailError={!useAccountEmail && (businessEmailState.isTouched || businessEmailState.isDirty || emailHasDraft) ? (businessEmailState.error?.message as string) : undefined}
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
                    (businessPhoneState.isTouched || businessPhoneState.isDirty || phoneHasDraft) && businessPhoneState.error
                      ? "border-destructive bg-red-50 focus-visible:ring-red-400"
                      : "border-gray-200 hover:border-gray-300 focus:border-blue-400 focus-visible:ring-blue-400"
                  }`}
                  autoComplete="tel"
                  inputMode="tel"
                  value={(businessPhoneField.value as string) || ""}
                  onChange={handleBusinessPhoneChange}
                  onBlur={businessPhoneField.onBlur}
                  name={businessPhoneField.name}
                  ref={businessPhoneField.ref}
                />
                <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              <div className="h-5">
                {(businessPhoneState.isTouched || businessPhoneState.isDirty || phoneHasDraft) && businessPhoneState.error && (
                  <p
                    className="mt-1 flex items-center gap-1.5 text-xs text-destructive"
                    role="alert"
                    aria-live="polite"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{String(businessPhoneState.error.message)}</span>
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
            error={(businessDescriptionState.isTouched || businessDescriptionState.isDirty || descriptionHasDraft) ? (businessDescriptionState.error?.message as string) : undefined}
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
            <Label htmlFor="businessInfo.businessCurrency" className="text-base font-medium cursor-default">
              Currency *
            </Label>
            <p className="text-sm text-muted-foreground">
            Choose your default pricing currency. You can always change it for individual services or adjust it later in settings.            </p>
            <CurrencySelect
              id="businessInfo.businessCurrency"
              value={(businessCurrencyField.value as string) || 'eur'}
              onChange={(value) => businessCurrencyField.onChange(value)}
              error={(businessCurrencyState.isTouched || businessCurrencyState.isDirty || currencyHasDraft) ? (businessCurrencyState.error?.message as string) : undefined}
            />
          </div>

          <div className="space-y-2 pt-4">
            <Label className="text-base font-medium cursor-default">
              Business Logo (Optional)
            </Label>
            <LogoUpload
              value={businessLogo}
              onChange={handleLogoUpload}
              maxSizeMB={10}
              recommendedSizeMB={2}
              recommendedDimensions={{ width: 1024, height: 1024 }}
              allowedTypes={[
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/webp',
                'image/svg+xml',
                'image/avif',
              ]}
            />
          </div>
        </div>
      </div>
    );
  }
);

StepBusinessInfo.displayName = "StepBusinessInfo";

export default StepBusinessInfo;
