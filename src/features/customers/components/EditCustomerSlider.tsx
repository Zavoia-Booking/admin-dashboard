import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { UserCircle, Mail, Phone, Loader2, GitMerge } from 'lucide-react';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import { FormFooter } from '../../../shared/components/forms/FormFooter';
import { TextField } from '../../../shared/components/forms/fields/TextField';
import { TextareaField } from '../../../shared/components/forms/fields/TextareaField';
import { Label } from '../../../shared/components/ui/label';
import { Input } from '../../../shared/components/ui/input';
import { Button } from '../../../shared/components/ui/button';
import { fetchCustomerByIdAction, updateCustomerAction } from '../actions';
import type { EditCustomerPayload } from '../types';
import { useForm, useController } from 'react-hook-form';
import { 
  isE164, 
  requiredEmailError, 
  sanitizePhoneToE164Draft 
} from '../../../shared/utils/validation';
import { 
  getCustomersLoadingSelector, 
  getCustomersErrorSelector,
  getCurrentCustomerSelector,
  getIsFetchingCustomerSelector,
} from '../selectors';
import { toast } from 'sonner';

interface EditCustomerSliderProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: number | null;
  elevated?: boolean;
}

const EditCustomerSlider: React.FC<EditCustomerSliderProps> = ({ 
  isOpen, 
  onClose,
  customerId,
  elevated = false,
}) => {
  const { t } = useTranslation('customers');
  const dispatch = useDispatch();
  const customerError = useSelector(getCustomersErrorSelector);
  const isCustomerLoading = useSelector(getCustomersLoadingSelector);
  const isFetchingCustomer = useSelector(getIsFetchingCustomerSelector);
  const customer = useSelector(getCurrentCustomerSelector);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const justOpenedRef = useRef(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState,
  } = useForm<EditCustomerPayload>({
    defaultValues: {
      id: 0,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      notes: '',
    },
    mode: "onChange",
  });

  // Controlled fields with validation
  const { field: firstNameField, fieldState: firstNameState } = useController<EditCustomerPayload, "firstName">({
    name: "firstName",
    control,
    rules: {
      required: t("editCustomer.validation.firstNameRequired"),
      minLength: { value: 2, message: t("editCustomer.validation.firstNameMinLength") },
      maxLength: { value: 50, message: t("editCustomer.validation.firstNameMaxLength") },
    },
  });

  const { field: lastNameField, fieldState: lastNameState } = useController<EditCustomerPayload, "lastName">({
    name: "lastName",
    control,
    rules: {
      maxLength: { value: 50, message: t("editCustomer.validation.lastNameMaxLength") },
    },
  });

  const { field: emailField, fieldState: emailState } = useController<EditCustomerPayload, "email">({
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

  const { field: phoneField, fieldState: phoneState } = useController<EditCustomerPayload, "phone">({
    name: "phone",
    control,
    rules: {
      validate: {
        format: (value) =>
          !value ||
          value.trim().length === 0 ||
          isE164(value) ||
          t("editCustomer.validation.phoneInvalid"),
      },
    },
  });

  const { field: notesField, fieldState: notesState } = useController<EditCustomerPayload, "notes">({
    name: "notes",
    control,
    rules: {
      maxLength: { value: 500, message: t("editCustomer.validation.notesMaxLength") },
    },
  });

  // Fetch only when we do not already have this customer (e.g. opened from details uses currentCustomer)
  useEffect(() => {
    if (!isOpen || !customerId) return;
    if (customer?.id === customerId) return;
    dispatch(fetchCustomerByIdAction.request({ id: customerId }));
  }, [isOpen, customerId, customer?.id, dispatch]);

  // Initialize form with customer data when it's fetched
  useEffect(() => {
    if (customer && isOpen) {
      reset({
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName || '',
        email: customer.email || '',
        phone: customer.phone || '',
        notes: customer.notes || '',
      });
    }
  }, [customer, isOpen, reset]);

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
      toast.error(t("editCustomer.toasts.updateFailed"), {
        description: t("editCustomer.toasts.updateFailedDescription"),
        icon: undefined,
      });
      setIsSubmitting(false);
    }
  }, [customerError, isSubmitting, t]);

  // Watch for success and close form
  useEffect(() => {
    // Don't close if slider just opened (prevents race condition with isSubmitting reset)
    if (!isCustomerLoading && isSubmitting && !customerError && !justOpenedRef.current) {
      setIsSubmitting(false);
      if (customerId != null) {
        dispatch(fetchCustomerByIdAction.request({ id: customerId }));
      }
      onClose();
    }
  }, [isCustomerLoading, isSubmitting, customerError, customerId, dispatch, onClose]);

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

  const isFormDisabled = hasValidationErrors || !areRequiredFieldsFilled || !formState.isDirty;

  const onSubmit = () => {
    // Prevent double submission
    if (isSubmitting || isCustomerLoading || !customer) {
      return;
    }
    
    const formData = watch();
    const payload: EditCustomerPayload = {
      id: customer.id,
      firstName: formData.firstName,
      // Filter out empty strings for optional fields
      email: formData.email?.trim() || undefined,
      lastName: formData.lastName?.trim() || undefined,
      phone: formData.phone?.trim() || undefined,
      notes: formData.notes?.trim() || undefined,
    };
    
    setIsSubmitting(true);
    dispatch(updateCustomerAction.request(payload));
    // Don't close form here - wait for success/error response
  };

  const handleCancel = () => {
    onClose();
  };

  return (
      <BaseSlider
        isOpen={isOpen}
        onClose={onClose}
        title={customer ? t("editCustomer.title") : t("editCustomer.loading")}
        subtitle={t("editCustomer.subtitle")}
        icon={UserCircle}
        iconColor="text-foreground-1"
        contentClassName="bg-surface scrollbar-hide"
        {...(elevated && {
          backdropClassName: 'z-[80]',
          panelClassName: 'z-[90]',
        })}
        footer={
          <FormFooter
            onCancel={handleCancel}
            formId="edit-customer-form"
            cancelLabel={t("editCustomer.buttons.cancel")}
            submitLabel={t("editCustomer.buttons.update")}
            disabled={isFormDisabled || isSubmitting || isCustomerLoading || isFetchingCustomer || !customer}
            isLoading={isSubmitting || isCustomerLoading}
          />
        }
      >
        <form
          id="edit-customer-form"
          onSubmit={handleSubmit(onSubmit)}
          className="h-full flex flex-col cursor-default"
        >
          <div className="flex-1 overflow-y-auto p-1 py-6 pt-0 md:p-6 md:pt-0 bg-surface">
            {isFetchingCustomer || !customer ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : customer.status === 'merged' ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-6">
                <GitMerge className="h-8 w-8 text-foreground-3/50" />
                <p className="text-sm font-medium text-foreground-2">{t('details.merged.cannotEdit')}</p>
                <Button type="button" variant="ghost" size="sm" rounded="full" onClick={onClose}>
                  {t('details.close')}
                </Button>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-6 cursor-default">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground-1">
                    {t("editCustomer.form.basicInfoTitle")}
                  </h3>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                    {t("editCustomer.form.basicInfoDescription")}
                  </p>
                </div>

                <TextField
                  value={firstNameField.value || ""}
                  onChange={firstNameField.onChange}
                  error={firstNameState.error?.message}
                  label={t("editCustomer.form.firstNameLabel")}
                  placeholder={t("editCustomer.form.firstNamePlaceholder")}
                  required
                  maxLength={50}
                  icon={UserCircle}
                />

                <TextField
                  value={lastNameField.value || ""}
                  onChange={lastNameField.onChange}
                  error={lastNameState.error?.message}
                  label={t("editCustomer.form.lastNameLabel")}
                  placeholder={t("editCustomer.form.lastNamePlaceholder")}
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
                    {t("editCustomer.form.contactInfoTitle")}
                  </h3>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                    {t("editCustomer.form.contactInfoDescription")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-medium">
                    {t("editCustomer.form.emailLabel")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("editCustomer.form.emailPlaceholder")}
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
                    {t("editCustomer.form.phoneLabel")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      type="tel"
                      placeholder={t("editCustomer.form.phonePlaceholder")}
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
                    {t("editCustomer.form.additionalInfoTitle")}
                  </h3>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                    {t("editCustomer.form.additionalInfoDescription")}
                  </p>
                </div>

                <TextareaField
                  value={notesField.value || ""}
                  onChange={notesField.onChange}
                  error={notesState.error?.message}
                  label={t("editCustomer.form.notesLabel")}
                  placeholder={t("editCustomer.form.notesPlaceholder")}
                  rows={4}
                />
              </div>
              </div>
            )}
          </div>
        </form>
      </BaseSlider>
  );
};

export default EditCustomerSlider;

