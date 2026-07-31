import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { UserCircle, Mail, Phone } from 'lucide-react';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import { FormFooter } from '../../../shared/components/forms/FormFooter';
import { TextField } from '../../../shared/components/forms/fields/TextField';
import { TextareaField } from '../../../shared/components/forms/fields/TextareaField';
import { Label } from '../../../shared/components/ui/label';
import { Input } from '../../../shared/components/ui/input';
import { addCustomerAction } from '../actions';
import type { AddCustomerPayload } from '../types';
import { useForm, useController } from 'react-hook-form';
import { 
  isE164, 
  requiredEmailError, 
  sanitizePhoneToE164Draft 
} from '../../../shared/utils/validation';
import { getCustomersLoadingSelector, getCustomersErrorSelector } from '../selectors';
import { toast } from 'sonner';

interface AddCustomerSliderProps {
  isOpen: boolean;
  onClose: () => void;
}

const defaultValues: AddCustomerPayload = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  notes: '',
};

const AddCustomerSlider: React.FC<AddCustomerSliderProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const { t } = useTranslation('customers');
  const dispatch = useDispatch();
  const customerError = useSelector(getCustomersErrorSelector);
  const isCustomerLoading = useSelector(getCustomersLoadingSelector);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const justOpenedRef = useRef(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
  } = useForm<AddCustomerPayload>({
    defaultValues,
    mode: "onChange",
  });

  // Controlled fields with validation
  const { field: firstNameField, fieldState: firstNameState } = useController<AddCustomerPayload, "firstName">({
    name: "firstName",
    control,
    rules: {
      required: t("addCustomer.validation.firstNameRequired"),
      minLength: { value: 2, message: t("addCustomer.validation.firstNameMinLength") },
      maxLength: { value: 50, message: t("addCustomer.validation.firstNameMaxLength") },
    },
  });

  const { field: lastNameField, fieldState: lastNameState } = useController<AddCustomerPayload, "lastName">({
    name: "lastName",
    control,
    rules: {
      maxLength: { value: 50, message: t("addCustomer.validation.lastNameMaxLength") },
    },
  });

  const { field: emailField, fieldState: emailState } = useController<AddCustomerPayload, "email">({
    name: "email",
    control,
    rules: {
      validate: (value) => {
        if (!value || value.trim().length === 0) return true; // Optional field
        const error = requiredEmailError('email', value, t);
        return error === null ? true : error;
      },
    },
  });

  const { field: phoneField, fieldState: phoneState } = useController<AddCustomerPayload, "phone">({
    name: "phone",
    control,
    rules: {
      validate: {
        format: (value) =>
          !value ||
          value.trim().length === 0 ||
          isE164(value) ||
          t("addCustomer.validation.phoneInvalid"),
      },
    },
  });

  const { field: notesField, fieldState: notesState } = useController<AddCustomerPayload, "notes">({
    name: "notes",
    control,
    rules: {
      maxLength: { value: 500, message: t("addCustomer.validation.notesMaxLength") },
    },
  });

  // Reset when slider closes
  useEffect(() => {
    if (!isOpen) {
      reset(defaultValues);
      // Do NOT reset isSubmitting here - keep it true during closing animation
      // to prevent button from being re-enabled
    }
  }, [isOpen, reset]);

  // When slider opens, reset submission state for a fresh form
  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      justOpenedRef.current = true;
      // Clear the flag after a brief delay to allow effects to run
      setTimeout(() => {
        justOpenedRef.current = false;
      }, 0);
    }
  }, [isOpen]);

  // Watch for errors and show toast
  useEffect(() => {
    if (customerError && isSubmitting) {
      toast.error(t("addCustomer.toasts.addFailed"), {
        // Prefer the specific server reason (e.g. "email already exists") over
        // the generic retry hint — the saga already localized it.
        description: customerError || t("addCustomer.toasts.addFailedDescription"),
        icon: undefined,
      });
      setIsSubmitting(false);
    }
  }, [customerError, isSubmitting, t]);

  // Watch for success and close form
  useEffect(() => {
    // Don't close if slider just opened (prevents race condition with isSubmitting reset)
    if (!isCustomerLoading && isSubmitting && !customerError && !justOpenedRef.current) {
      // Success - close form and reset
      // Don't set isSubmitting to false here - let it stay true until slider closes
      onClose();
    }
  }, [isCustomerLoading, isSubmitting, customerError, onClose]);

  // Check if required fields are filled
  const firstNameValue = watch("firstName");
  
  const areRequiredFieldsFilled = 
    firstNameValue && 
    firstNameValue.trim().length > 0;

  // Only check for actual validation errors
  const hasValidationErrors = 
    !!firstNameState.error || 
    !!lastNameState.error ||
    !!emailState.error || 
    !!phoneState.error || 
    !!notesState.error;

  const isFormDisabled = hasValidationErrors || !areRequiredFieldsFilled;

  const onSubmit = () => {
    // Prevent double submission
    if (isSubmitting || isCustomerLoading) {
      return;
    }
    
    const formData = watch();
    const payload: AddCustomerPayload = {
      ...formData,
      // Filter out empty strings for optional fields
      email: formData.email?.trim() || undefined,
      lastName: formData.lastName?.trim() || undefined,
      phone: formData.phone?.trim() || undefined,
      notes: formData.notes?.trim() || undefined,
    };
    
    setIsSubmitting(true);
    dispatch(addCustomerAction.request(payload));
    // Don't close form here - wait for success/error response
  };

  const handleCancel = () => {
    onClose();
    reset(defaultValues);
  };

  return (
    <>
      <BaseSlider
        isOpen={isOpen}
        onClose={onClose}
        title={t("addCustomer.title")}
        subtitle={t("addCustomer.subtitle")}
        icon={UserCircle}
        iconColor="text-foreground-1"
        contentClassName="bg-surface scrollbar-hide"
        footer={
          <FormFooter
            onCancel={handleCancel}
            formId="add-customer-form"
            cancelLabel={t("addCustomer.buttons.cancel")}
            submitLabel={t("addCustomer.buttons.add")}
            disabled={isFormDisabled || isSubmitting || isCustomerLoading}
            isLoading={isSubmitting || isCustomerLoading}
          />
        }
      >
        <form
          id="add-customer-form"
          onSubmit={handleSubmit(onSubmit)}
          className="h-full flex flex-col cursor-default"
        >
          <div className="flex-1 overflow-y-auto p-1 py-6 pt-0 md:p-6 md:pt-0 bg-surface">
            <div className="max-w-2xl mx-auto space-y-6 cursor-default">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground-1">
                    {t("addCustomer.form.basicInfoTitle")}
                  </h3>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                    {t("addCustomer.form.basicInfoDescription")}
                  </p>
                </div>

                <TextField
                  value={firstNameField.value || ""}
                  onChange={firstNameField.onChange}
                  error={firstNameState.error?.message}
                  label={t("addCustomer.form.firstNameLabel")}
                  placeholder={t("addCustomer.form.firstNamePlaceholder")}
                  required
                  maxLength={50}
                  icon={UserCircle}
                />

                <TextField
                  value={lastNameField.value || ""}
                  onChange={lastNameField.onChange}
                  error={lastNameState.error?.message}
                  label={t("addCustomer.form.lastNameLabel")}
                  placeholder={t("addCustomer.form.lastNamePlaceholder")}
                  maxLength={50}
                />
              </div>

              {/* Divider */}
              <div className="flex items-end gap-2 mb-6 pt-4">
                <div className="flex-1 h-px bg-border dark:bg-border-strong"></div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground-1">
                    {t("addCustomer.form.contactInfoTitle")}
                  </h3>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                    {t("addCustomer.form.contactInfoDescription")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-medium">
                    {t("addCustomer.form.emailLabel")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("addCustomer.form.emailPlaceholder")}
                      value={emailField.value || ""}
                      onChange={emailField.onChange}
                      className={`!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                        emailState.error
                          ? 'border-destructive bg-error-bg focus-visible:ring-error'
                          : 'border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus'
                      }`}
                      autoComplete="email"
                      aria-invalid={!!emailState.error}
                    />
                    <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  </div>
                  <div className="min-h-5">
                    {emailState.error && (
                      <p className="text-xs text-destructive" role="alert">
                        {emailState.error.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-base font-medium">
                    {t("addCustomer.form.phoneLabel")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      type="tel"
                      placeholder={t("addCustomer.form.phonePlaceholder")}
                      value={phoneField.value || ""}
                      onChange={(e) => {
                        const sanitized = sanitizePhoneToE164Draft(e.target.value || "");
                        phoneField.onChange(sanitized);
                      }}
                      className={`!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                        phoneState.error
                          ? 'border-destructive bg-error-bg focus-visible:ring-error'
                          : 'border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus'
                      }`}
                      autoComplete="tel"
                      aria-invalid={!!phoneState.error}
                    />
                    <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  </div>
                  <div className="min-h-5">
                    {phoneState.error && (
                      <p className="text-xs text-destructive" role="alert">
                        {phoneState.error.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-end gap-2 mb-6 pt-4">
                <div className="flex-1 h-px bg-border dark:bg-border-strong"></div>
              </div>

              {/* Additional Information Section */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground-1">
                    {t("addCustomer.form.additionalInfoTitle")}
                  </h3>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                    {t("addCustomer.form.additionalInfoDescription")}
                  </p>
                </div>

                <TextareaField
                  value={notesField.value || ""}
                  onChange={notesField.onChange}
                  error={notesState.error?.message}
                  label={t("addCustomer.form.notesLabel")}
                  placeholder={t("addCustomer.form.notesPlaceholder")}
                  rows={4}
                />
              </div>
            </div>
          </div>
        </form>
      </BaseSlider>
    </>
  );
};

export default AddCustomerSlider;

