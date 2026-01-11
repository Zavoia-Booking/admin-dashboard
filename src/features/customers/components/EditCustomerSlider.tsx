import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UserCircle, Mail, Phone, Loader2 } from 'lucide-react';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import { FormFooter } from '../../../shared/components/forms/FormFooter';
import { TextField } from '../../../shared/components/forms/fields/TextField';
import { TextareaField } from '../../../shared/components/forms/fields/TextareaField';
import { Label } from '../../../shared/components/ui/label';
import { Input } from '../../../shared/components/ui/input';
import { Button } from '../../../shared/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../shared/components/ui/alert-dialog';
import { fetchCustomerByIdAction, updateCustomerAction, removeCustomerAction, clearCurrentCustomerAction } from '../actions';
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
  getIsRemovingCustomerSelector
} from '../selectors';
import { toast } from 'sonner';

interface EditCustomerSliderProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: number | null;
}

const EditCustomerSlider: React.FC<EditCustomerSliderProps> = ({ 
  isOpen, 
  onClose,
  customerId 
}) => {
  const dispatch = useDispatch();
  const customerError = useSelector(getCustomersErrorSelector);
  const isCustomerLoading = useSelector(getCustomersLoadingSelector);
  const isFetchingCustomer = useSelector(getIsFetchingCustomerSelector);
  const isRemoving = useSelector(getIsRemovingCustomerSelector);
  const customer = useSelector(getCurrentCustomerSelector);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const justOpenedRef = useRef(false);
  const prevIsRemovingRef = useRef(false);

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
      required: "First name is required",
      minLength: { value: 2, message: "First name must be at least 2 characters" },
      maxLength: { value: 50, message: "First name must be less than 50 characters" },
    },
  });

  const { field: lastNameField, fieldState: lastNameState } = useController<EditCustomerPayload, "lastName">({
    name: "lastName",
    control,
    rules: {
      maxLength: { value: 50, message: "Last name must be less than 50 characters" },
    },
  });

  const { field: emailField, fieldState: emailState } = useController<EditCustomerPayload, "email">({
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

  const { field: phoneField, fieldState: phoneState } = useController<EditCustomerPayload, "phone">({
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

  const { field: notesField, fieldState: notesState } = useController<EditCustomerPayload, "notes">({
    name: "notes",
    control,
    rules: {
      maxLength: { value: 500, message: "Notes must be less than 500 characters" },
    },
  });

  // Fetch customer data when slider opens
  useEffect(() => {
    if (isOpen && customerId) {
      dispatch(fetchCustomerByIdAction.request({ id: customerId }));
    }
  }, [isOpen, customerId, dispatch]);

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

  // Reset when slider closes
  useEffect(() => {
    if (!isOpen) {
      // Clear the current customer to prevent stale data
      dispatch(clearCurrentCustomerAction());
      // Do NOT reset isSubmitting here - keep it true during closing animation
      // to prevent button from being re-enabled
    }
  }, [isOpen, dispatch]);

  // When slider opens, reset submission state for a fresh form
  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      setShowRemoveDialog(false);
      justOpenedRef.current = true;
      prevIsRemovingRef.current = false;
      // Clear the flag after a brief delay to allow effects to run
      setTimeout(() => {
        justOpenedRef.current = false;
      }, 0);
    }
  }, [isOpen]);

  // Watch for errors and show toast
  useEffect(() => {
    if (customerError && isSubmitting) {
      toast.error("We couldn't update the customer", {
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

  const handleRemoveClick = () => {
    setShowRemoveDialog(true);
  };

  const handleConfirmRemove = () => {
    if (!customer) return;
    prevIsRemovingRef.current = true;
    dispatch(removeCustomerAction.request({ id: customer.id }));
    setShowRemoveDialog(false);
  };

  // Watch for remove success and close slider
  useEffect(() => {
    if (prevIsRemovingRef.current && !isRemoving && !customerError) {
      // Successfully removed
      prevIsRemovingRef.current = false;
      onClose();
    }
  }, [isRemoving, customerError, onClose]);

  return (
    <>
      <BaseSlider
        isOpen={isOpen}
        onClose={onClose}
        title={customer ? "Edit Customer" : "Loading..."}
        subtitle="Update customer information"
        icon={UserCircle}
        iconColor="text-foreground-1"
        contentClassName="bg-surface scrollbar-hide"
        footer={
          <FormFooter
            onCancel={handleCancel}
            formId="edit-customer-form"
            cancelLabel="Cancel"
            submitLabel="Update Customer"
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
            ) : (
              <div className="max-w-2xl mx-auto space-y-6 cursor-default">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground-1">
                    Basic Information
                  </h3>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                    Update the customer's basic details.
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

              {/* Divider */}
              <div className="flex items-end gap-2 mb-6 pt-4">
                <div className="flex-1 h-px bg-border dark:bg-border-strong"></div>
              </div>

              {/* Remove Customer */}
              <div className="space-y-4 rounded-lg border border-border dark:border-border-strong bg-surface-2 p-6">
                <div className="space-y-1">
                  <h3 className="text-base font-medium text-foreground-1">
                    Remove Customer
                  </h3>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                    This will remove the customer from your customer list.
                  </p>
                </div>
                
                <div className="flex flex-col gap-3 items-center">
                  <Button 
                    type="button"
                    variant="outline"
                    rounded="full"
                    onClick={handleRemoveClick}
                    className="w-1/2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={isRemoving}
                  >
                    {isRemoving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Removing...
                      </>
                    ) : (
                      'Remove Customer'
                    )}
                  </Button>
                </div>
              </div>
              </div>
            )}
          </div>
        </form>
      </BaseSlider>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {customer?.firstName} {customer?.lastName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmRemove}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isRemoving}
            >
              {isRemoving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove Customer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditCustomerSlider;

