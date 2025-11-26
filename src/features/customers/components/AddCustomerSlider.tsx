import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UserCircle, Mail, Phone } from 'lucide-react';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import { FormFooter } from '../../../shared/components/forms/FormFooter';
import { TextField } from '../../../shared/components/forms/fields/TextField';
import { TextareaField } from '../../../shared/components/forms/fields/TextareaField';
import { Label } from '../../../shared/components/ui/label';
import { Input } from '../../../shared/components/ui/input';
import ConfirmDialog from '../../../shared/components/common/ConfirmDialog';
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
  const dispatch = useDispatch();
  const customerError = useSelector(getCustomersErrorSelector);
  const isCustomerLoading = useSelector(getCustomersLoadingSelector);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
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
      required: "First name is required",
      minLength: { value: 2, message: "First name must be at least 2 characters" },
      maxLength: { value: 50, message: "First name must be less than 50 characters" },
    },
  });

  const { field: lastNameField, fieldState: lastNameState } = useController<AddCustomerPayload, "lastName">({
    name: "lastName",
    control,
    rules: {
      maxLength: { value: 50, message: "Last name must be less than 50 characters" },
    },
  });

  const { field: emailField, fieldState: emailState } = useController<AddCustomerPayload, "email">({
    name: "email",
    control,
    rules: {
      validate: (value) => {
        if (!value || value.trim().length === 0) return true; // Optional field
        const error = requiredEmailError("Email", value);
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
          "Enter a valid phone number",
      },
    },
  });

  const { field: notesField, fieldState: notesState } = useController<AddCustomerPayload, "notes">({
    name: "notes",
    control,
    rules: {
      maxLength: { value: 500, message: "Notes must be less than 500 characters" },
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
      setShowConfirmDialog(false);
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
      toast.error("We couldn't add the customer", {
        description: "Please check your information and try again.",
        icon: undefined,
      });
      setIsSubmitting(false);
    }
  }, [customerError, isSubmitting]);

  // Watch for success and close form
  useEffect(() => {
    // Don't close if slider just opened (prevents race condition with isSubmitting reset)
    if (!isCustomerLoading && isSubmitting && !customerError && !justOpenedRef.current) {
      // Success - close form and reset
      // Don't set isSubmitting to false here - let it stay true until slider closes
      setShowConfirmDialog(false);
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
    // Prevent opening dialog if already submitting or loading
    if (isSubmitting || isCustomerLoading) {
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmCreate = () => {
    // Guard against double-clicks on Confirm button
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
    setShowConfirmDialog(false);
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
        title="Add New Customer"
        subtitle="Create a new customer manually"
        icon={UserCircle}
        iconColor="text-foreground-1"
        contentClassName="bg-surface scrollbar-hide"
        footer={
          <FormFooter
            onCancel={handleCancel}
            formId="add-customer-form"
            cancelLabel="Cancel"
            submitLabel="Add Customer"
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
                    Basic Information
                  </h3>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                    Enter the customer's basic details.
                  </p>
                </div>

                <TextField
                  value={firstNameField.value || ""}
                  onChange={firstNameField.onChange}
                  error={firstNameState.error?.message}
                  label="First Name"
                  placeholder="e.g. John"
                  required
                  maxLength={50}
                  icon={UserCircle}
                />

                <TextField
                  value={lastNameField.value || ""}
                  onChange={lastNameField.onChange}
                  error={lastNameState.error?.message}
                  label="Last Name"
                  placeholder="e.g. Doe"
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
                    Contact Information
                  </h3>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                    Optional contact details for the customer.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="e.g. john.doe@example.com"
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
                  <div className="h-5">
                    {emailState.error && (
                      <p className="text-xs text-destructive" role="alert">
                        {emailState.error.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-base font-medium">
                    Phone
                  </Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="e.g. +1234567890"
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
                  <div className="h-5">
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
                    Additional Information
                  </h3>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                    Add notes about this customer for better organization.
                  </p>
                </div>

                <TextareaField
                  value={notesField.value || ""}
                  onChange={notesField.onChange}
                  error={notesState.error?.message}
                  label="Notes"
                  placeholder="Add any notes about this customer..."
                  rows={4}
                />
              </div>
            </div>
          </div>
        </form>
      </BaseSlider>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirmCreate}
        onCancel={() => setShowConfirmDialog(false)}
        title="Add Customer"
        description={`Are you sure you want to add ${watch('firstName') || 'this customer'}?`}
        confirmTitle="Add Customer"
        cancelTitle="Cancel"
        showCloseButton={true}
      />
    </>
  );
};

export default AddCustomerSlider;

