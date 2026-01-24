import React, { useEffect, useState, useRef } from "react";
import { useForm, useController } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Package,
  AlertCircle,
  Plus,
  PlusCircle,
  Tag,
  Percent,
  TrendingDown,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { BaseSlider } from "../../../../shared/components/common/BaseSlider";
import { FormFooter } from "../../../../shared/components/forms/FormFooter";
import { DeleteConfirmDialog } from "../../../../shared/components/common/DeleteConfirmDialog";
import { TextField } from "../../../../shared/components/forms/fields/TextField";
import { TextareaField } from "../../../../shared/components/forms/fields/TextareaField";
import { PriceField } from "../../../../shared/components/forms/fields/PriceField";
import {
  updateBundleAction,
  deleteBundleAction,
} from "../../../bundles/actions";
import type { UpdateBundlePayload, Bundle } from "../../../bundles/types";
import { BundlePriceType } from "../../../bundles/types";
import {
  getBundlesErrorSelector,
  getBundlesLoadingSelector,
  getBundlesDeletingSelector,
  getBundlesDeleteResponseSelector,
} from "../../../bundles/selectors";
import { getServicesListSelector } from "../../selectors";
import { getServicesAction } from "../../actions";
import { toast } from "sonner";
import { selectCurrentUser } from "../../../auth/selectors";
import type { Service } from "../../../../shared/types/service";
import type { DeleteResponse } from "../../../../shared/types/delete-response";
import { Badge } from "../../../../shared/components/ui/badge";
import { Button } from "../../../../shared/components/ui/button";
import { ManageServicesSheet } from "../../../../shared/components/common/ManageServicesSheet";
import {
  priceToStorage,
  priceFromStorage,
  getCurrencyDisplay,
} from "../../../../shared/utils/currency";

interface EditBundleSliderProps {
  isOpen: boolean;
  onClose: () => void;
  bundle: Bundle | null;
}

interface BundleFormData {
  name: string;
  description: string;
  priceType: BundlePriceType;
  fixedPriceAmountMinor?: number;
  discountPercentage?: number;
  serviceIds: number[];
}

const EditBundleSlider: React.FC<EditBundleSliderProps> = ({
  isOpen,
  onClose,
  bundle,
}) => {
  const text = useTranslation("services").t;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const allServices = useSelector(getServicesListSelector);
  const currentUser = useSelector(selectCurrentUser);
  const businessCurrency = currentUser?.business?.businessCurrency || "eur";
  const bundlesError = useSelector(getBundlesErrorSelector);
  const isBundlesLoading = useSelector(getBundlesLoadingSelector);
  const isDeleting = useSelector(getBundlesDeletingSelector);
  const deleteResponseFromState = useSelector(getBundlesDeleteResponseSelector);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isManageServicesOpen, setIsManageServicesOpen] = useState(false);

  // Delete handling state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteResponse, setDeleteResponse] = useState<DeleteResponse | null>(
    null,
  );
  const [hasAttemptedDelete, setHasAttemptedDelete] = useState(false);

  const prevLoadingRef = useRef(isBundlesLoading);

  // Keep track of the last valid bundle to allow exit animation when bundle becomes null
  const [activeBundle, setActiveBundle] = useState<Bundle | null>(bundle);

  useEffect(() => {
    if (bundle) {
      setActiveBundle(bundle);
    }
  }, [bundle]);

  const effectiveBundle = bundle || activeBundle;

  const getInitialFormData = (): BundleFormData => ({
    name: effectiveBundle?.name || "",
    description: effectiveBundle?.description || "",
    priceType: effectiveBundle?.priceType || BundlePriceType.SUM,
    fixedPriceAmountMinor: effectiveBundle?.fixedPriceAmountMinor,
    discountPercentage: effectiveBundle?.discountPercentage,
    serviceIds: effectiveBundle?.serviceIds || [],
  });

  const { control, handleSubmit, watch, setValue, reset, formState, trigger } =
    useForm<BundleFormData>({
      defaultValues: getInitialFormData(),
      mode: "onChange",
    });

  const priceType = watch("priceType");
  const serviceIds = watch("serviceIds");
  const fixedPriceAmountMinor = watch("fixedPriceAmountMinor");
  const discountPercentage = watch("discountPercentage");

  // Calculate sum of selected services' prices
  const selectedServices = allServices.filter((service: Service) =>
    serviceIds?.includes(service.id),
  );

  // Sum prices: services have price in decimal format, convert to cents, sum, then back to decimal
  const sumOfServicesInCents = selectedServices.reduce(
    (sum: number, service: Service) => {
      const priceInCents = priceToStorage(service.price, businessCurrency);
      return sum + priceInCents;
    },
    0,
  );

  const sumOfServicesDisplay = priceFromStorage(
    sumOfServicesInCents,
    businessCurrency,
  );

  const currencyDisplay = getCurrencyDisplay(businessCurrency);
  // Helper to get currency symbol for text display
  const getCurrencySymbol = (): string => {
    if (currencyDisplay.symbol) return currencyDisplay.symbol;
    const code = businessCurrency.toUpperCase();
    if (code === "EUR") return "€";
    if (code === "USD") return "$";
    if (code === "GBP") return "£";
    return code;
  };
  const currencySymbol = getCurrencySymbol();

  // Fetch services when slider opens
  useEffect(() => {
    if (isOpen && allServices.length === 0) {
      dispatch(getServicesAction.request());
    }
  }, [isOpen, allServices.length, dispatch]);

  // Reset form when bundle changes or slider opens
  useEffect(() => {
    if (isOpen && bundle) {
      reset(getInitialFormData());
      setIsSubmitting(false);
    }
  }, [isOpen, bundle, reset]);

  // Reset delete state when slider closes or opens
  useEffect(() => {
    if (isOpen) {
      setShowDeleteDialog(false);
      setDeleteResponse(null);
      setHasAttemptedDelete(false);
    }
  }, [isOpen]);

  // Watch for errors and show toast, reset submitting state
  useEffect(() => {
    const loadingStopped = prevLoadingRef.current && !isBundlesLoading;
    if (bundlesError && loadingStopped && isSubmitting) {
      toast.error(String(bundlesError));
      setIsSubmitting(false);
    }
    if (bundlesError && !isBundlesLoading && isSubmitting && !loadingStopped) {
      setIsSubmitting(false);
    }
    prevLoadingRef.current = isBundlesLoading;
  }, [bundlesError, isBundlesLoading, isSubmitting]);

  // Validation helpers
  const validateBundleName = (value: string): string | true => {
    const v = (value ?? "").trim();
    if (!v) return text("bundles.editBundle.validation.nameRequired");
    if (v.length < 2)
      return text("bundles.editBundle.validation.nameMinLength");
    if (v.length > 100)
      return text("bundles.editBundle.validation.nameMaxLength");
    return true;
  };

  const validateDescription = (value: string): string | true => {
    if (!value || !value.trim()) return true;
    const v = value.trim();
    if (v.length > 500)
      return text("bundles.editBundle.validation.descriptionMaxLength");
    return true;
  };

  const validateFixedPrice = (value: number | undefined): string | true => {
    if (priceType === BundlePriceType.FIXED) {
      if (value === undefined || value === null) {
        return text("bundles.editBundle.validation.fixedPriceRequired");
      }
      if (value < 0) {
        return text("bundles.editBundle.validation.fixedPriceMin");
      }
    }
    return true;
  };

  const validateDiscountPercentage = (
    value: number | undefined,
  ): string | true => {
    if (priceType === BundlePriceType.DISCOUNT) {
      if (value === undefined || value === null) {
        return text("bundles.editBundle.validation.discountRequired");
      }
      if (value < 0) {
        return text("bundles.editBundle.validation.discountMin");
      }
      if (value > 100) {
        return text("bundles.editBundle.validation.discountMax");
      }
    }
    return true;
  };

  // Controlled fields
  const { field: nameField, fieldState: nameState } = useController<
    BundleFormData,
    "name"
  >({
    name: "name",
    control,
    rules: {
      validate: validateBundleName,
    },
  });

  const { field: descriptionField, fieldState: descriptionState } =
    useController<BundleFormData, "description">({
      name: "description",
      control,
      rules: {
        validate: validateDescription,
      },
    });

  const { field: priceTypeField } = useController<BundleFormData, "priceType">({
    name: "priceType",
    control,
  });

  const { field: fixedPriceField, fieldState: fixedPriceState } = useController<
    BundleFormData,
    "fixedPriceAmountMinor"
  >({
    name: "fixedPriceAmountMinor",
    control,
    rules: {
      validate: validateFixedPrice,
    },
  });

  const { field: discountField, fieldState: discountState } = useController<
    BundleFormData,
    "discountPercentage"
  >({
    name: "discountPercentage",
    control,
    rules: {
      validate: validateDiscountPercentage,
    },
  });

  // Get current fixed price value from field (for real-time updates)
  const currentFixedPriceValue = fixedPriceField.value ?? fixedPriceAmountMinor;

  // Calculate final price based on price type
  const calculateFinalPrice = (): number => {
    if (priceType === BundlePriceType.SUM) {
      return sumOfServicesDisplay;
    } else if (
      priceType === BundlePriceType.FIXED &&
      currentFixedPriceValue !== undefined &&
      currentFixedPriceValue !== null
    ) {
      return priceFromStorage(currentFixedPriceValue, businessCurrency);
    } else if (
      priceType === BundlePriceType.DISCOUNT &&
      discountPercentage !== undefined
    ) {
      const discountAmount = sumOfServicesDisplay * (discountPercentage / 100);
      return sumOfServicesDisplay - discountAmount;
    }
    return 0;
  };

  const finalPrice = calculateFinalPrice();
  const priceDifference = finalPrice - sumOfServicesDisplay;
  const hasPriceDifference = Math.abs(priceDifference) > 0.01;

  // Check if pricing buttons should be disabled (need at least 2 services)
  const isPricingDisabled = !serviceIds || selectedServices.length < 2;

  // Validate serviceIds - minimum 2 services required
  const serviceIdsError =
    (!serviceIds || serviceIds.length < 2) &&
    (formState.isSubmitted || formState.touchedFields.serviceIds)
      ? text("bundles.editBundle.validation.servicesMinimum")
      : undefined;

  // Check if form is valid
  const isFormDisabled =
    !formState.isValid ||
    !formState.isDirty ||
    !serviceIds ||
    serviceIds.length < 2 ||
    !!serviceIdsError;

  const onSubmit = () => {
    // Prevent double submission
    if (isSubmitting || isBundlesLoading || !effectiveBundle) {
      return;
    }

    const data = watch();
    setIsSubmitting(true);

    const payload: UpdateBundlePayload = {
      id: effectiveBundle.id,
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      priceType: data.priceType,
      serviceIds: data.serviceIds,
    };

    if (data.priceType === BundlePriceType.FIXED) {
      payload.fixedPriceAmountMinor = data.fixedPriceAmountMinor;
    } else if (data.priceType === BundlePriceType.DISCOUNT) {
      payload.discountPercentage = data.discountPercentage;
    }

    dispatch(updateBundleAction.request(payload));
  };

  // Handle successful update
  useEffect(() => {
    if (!isBundlesLoading && isSubmitting && !bundlesError) {
      setIsSubmitting(false);
      onClose();
    }
  }, [isBundlesLoading, isSubmitting, bundlesError, onClose]);

  const handleApplyServices = (newServiceIds: number[]) => {
    // Ensure we have a new array reference to trigger React Hook Form's dirty detection
    const newArray = [...newServiceIds];
    setValue("serviceIds", newArray, {
      shouldValidate: true,
      shouldTouch: true,
      shouldDirty: true,
    });
    // Trigger validation to ensure form state updates
    trigger("serviceIds");
  };

  const handleCancel = () => {
    onClose();
    reset(getInitialFormData());
  };

  // Autofocus fixed price input when Fixed Price option is selected
  useEffect(() => {
    if (priceType === BundlePriceType.FIXED) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        const input = document.getElementById("fixed-price");
        if (input instanceof HTMLInputElement) {
          input.focus();
          input.select(); // Select all text for easier editing
        }
      }, 100);
    }
  }, [priceType]);

  // Autofocus discount input when Discount option is selected
  useEffect(() => {
    if (priceType === BundlePriceType.DISCOUNT) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        const input = document.getElementById("discount-percentage");
        if (input instanceof HTMLInputElement) {
          input.focus();
          input.select(); // Select all text for easier editing
        }
      }, 100);
    }
  }, [priceType]);

  // Handle delete response from Redux state
  useEffect(() => {
    if (deleteResponseFromState && hasAttemptedDelete && !isDeleting) {
      if (deleteResponseFromState.canDelete === false) {
        // Cannot delete - update dialog to show blocking info
        setDeleteResponse(deleteResponseFromState as DeleteResponse);
      } else {
        // Successfully deleted - close dialog
        setShowDeleteDialog(false);
        setDeleteResponse(null);
        setHasAttemptedDelete(false);
        onClose();
      }
    }
  }, [deleteResponseFromState, hasAttemptedDelete, isDeleting, onClose]);

  const handleDeleteClick = () => {
    // Show confirmation dialog first with optimistic state
    setDeleteResponse({
      canDelete: true,
      message: "",
    });
    setShowDeleteDialog(true);
    setHasAttemptedDelete(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteResponse?.canDelete || !effectiveBundle) return;

    setHasAttemptedDelete(true);
    dispatch(deleteBundleAction.request({ id: effectiveBundle.id }));
  };

  const handleCloseDeleteDialog = (open: boolean) => {
    if (!open) {
      setShowDeleteDialog(false);
      setDeleteResponse(null);
      setHasAttemptedDelete(false);
    }
  };

  if (!effectiveBundle) return null;

  return (
    <>
      <BaseSlider
        isOpen={isOpen}
        onClose={onClose}
        title={text("bundles.editBundle.title")}
        subtitle={text("bundles.editBundle.subtitle")}
        icon={Package}
        iconColor="text-foreground-1"
        contentClassName="bg-surface scrollbar-hide"
        footer={
          <FormFooter
            onCancel={handleCancel}
            formId="edit-bundle-form"
            cancelLabel={text("bundles.editBundle.buttons.cancel")}
            submitLabel={text("bundles.editBundle.buttons.update")}
            disabled={isFormDisabled || isSubmitting || isBundlesLoading}
            isLoading={isSubmitting || isBundlesLoading}
          />
        }
      >
        <form
          id="edit-bundle-form"
          onSubmit={(e) => {
            if (isFormDisabled || isSubmitting || isBundlesLoading) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            handleSubmit(onSubmit)(e);
          }}
          className="h-full flex flex-col cursor-default"
        >
          <div className="flex-1 overflow-y-auto p-1 py-6 pt-0 md:p-6 md:pt-0 bg-surface">
            <div className="max-w-2xl mx-auto space-y-8 cursor-default">
              {/* Bundle Information Section */}
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground-1">
                    {text("bundles.editBundle.sections.bundleInfo")}
                  </h3>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                    {text("bundles.editBundle.sections.bundleInfoDescription")}
                  </p>
                </div>

                <div className="space-y-5">
                  <TextField
                    value={nameField.value || ""}
                    onChange={nameField.onChange}
                    error={nameState.error?.message}
                    label={text("bundles.editBundle.form.name.label")}
                    placeholder={text(
                      "bundles.editBundle.form.name.placeholder",
                    )}
                    required
                    id="bundle-name"
                    maxLength={100}
                    icon={Package}
                  />

                  <TextareaField
                    value={descriptionField.value || ""}
                    onChange={descriptionField.onChange}
                    error={descriptionState.error?.message}
                    label={text("bundles.editBundle.form.description.label")}
                    placeholder={text(
                      "bundles.editBundle.form.description.placeholder",
                    )}
                    id="bundle-description"
                    rows={4}
                    maxLength={500}
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-end gap-2 mb-6">
                <div className="flex-1 h-px bg-border dark:bg-border-strong"></div>
              </div>

              {/* Services Selection Section */}
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground-1">
                    {text("bundles.editBundle.sections.services")}
                  </h3>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                    {text("bundles.editBundle.sections.servicesDescription")}
                  </p>
                </div>

                {allServices.length === 0 ? (
                  <div className="text-sm text-foreground-3 dark:text-foreground-2 text-center py-8">
                    {text("bundles.editBundle.noServices")}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Summary badges of selected services */}
                    {selectedServices.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        {selectedServices
                          .slice(0, 5)
                          .map((service: Service) => (
                            <Badge
                              key={service.id}
                              variant="secondary"
                              className="text-xs px-2 py-1 font-normal"
                            >
                              {service.name}
                            </Badge>
                          ))}
                        {selectedServices.length > 5 && (
                          <Badge
                            variant="secondary"
                            className="text-xs px-2 py-1 font-normal"
                          >
                            +{selectedServices.length - 5}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Manage services button */}
                    <div className="flex justify-start">
                      <Button
                        type="button"
                        variant="outline"
                        rounded="full"
                        onClick={() => setIsManageServicesOpen(true)}
                        className="!px-6 w-full md:w-auto border-border-strong text-foreground-1 group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-3 w-3 text-primary transition-transform duration-400 ease-out group-hover:scale-140" />
                        <span>{text("bundles.editBundle.manageServices")}</span>
                      </Button>
                    </div>

                    {/* ManageServicesSheet */}
                    <ManageServicesSheet
                      isOpen={isManageServicesOpen}
                      onClose={() => setIsManageServicesOpen(false)}
                      teamMemberName={text("bundles.editBundle.bundleLabel")}
                      allServices={allServices}
                      initialSelectedIds={serviceIds || []}
                      onApply={handleApplyServices}
                    />
                  </div>
                )}

                {serviceIdsError && (
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {serviceIdsError}
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-end gap-2 mb-6 pt-4">
                <div className="flex-1 h-px bg-border dark:bg-border-strong"></div>
              </div>

              {/* Price Type Section */}
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground-1">
                    {text("bundles.editBundle.sections.pricing")}
                  </h3>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                    {text("bundles.editBundle.sections.pricingDescription")}
                  </p>
                </div>

                {/* Modern Card-Based Price Type Selection */}
                <div className="grid grid-cols-1 gap-3">
                  {/* Sum of Services Option */}
                  <button
                    type="button"
                    disabled={isPricingDisabled}
                    onClick={() => {
                      if (isPricingDisabled) return;
                      if (priceType === BundlePriceType.SUM) return;
                      priceTypeField.onChange(BundlePriceType.SUM);
                      setValue("fixedPriceAmountMinor", undefined);
                      setValue("discountPercentage", undefined);
                    }}
                    className={`
                    relative flex items-start gap-4 p-4 rounded-xl border-1 text-left
                    ${
                      priceType === BundlePriceType.SUM
                        ? "border-border-strong shadow-sm"
                        : "border-border bg-surface"
                    }
                    ${
                      isPricingDisabled
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer hover:border-border-strong hover:bg-surface-hover"
                    }
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  >
                    <div
                      className={`
                      flex items-center justify-center h-10 w-10 rounded-full flex-shrink-0 transition-colors
                      ${
                        priceType === BundlePriceType.SUM
                          ? "bg-neutral-100 dark:bg-primary/20"
                          : "bg-surface-hover dark:bg-neutral-800"
                      }
                      ${isPricingDisabled ? "opacity-50" : ""}
                    `}
                    >
                      <PlusCircle
                        className={`
                        h-5 w-5 transition-colors
                        ${
                          priceType === BundlePriceType.SUM
                            ? "text-primary"
                            : "text-foreground-3 dark:text-foreground-2"
                        }
                        ${isPricingDisabled ? "opacity-50" : ""}
                      `}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-sm text-foreground-1">
                          {text("bundles.editBundle.form.priceType.sum")}
                        </span>
                        {priceType === BundlePriceType.SUM && (
                          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <svg
                              className="h-3 w-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">
                        {text(
                          "bundles.editBundle.form.priceType.sumDescription",
                        )}
                      </p>
                    </div>
                  </button>

                  {/* Fixed Price Option */}
                  <button
                    type="button"
                    disabled={isPricingDisabled}
                    onClick={() => {
                      if (isPricingDisabled) return;
                      if (priceType === BundlePriceType.FIXED) return;
                      priceTypeField.onChange(BundlePriceType.FIXED);
                      setValue("discountPercentage", undefined);
                    }}
                    className={`
                    relative flex items-start gap-4 p-4 rounded-xl border-1 text-left
                    ${
                      priceType === BundlePriceType.FIXED
                        ? "border-border-strong shadow-sm"
                        : "border-border bg-surface"
                    }
                    ${
                      isPricingDisabled
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer hover:border-border-strong hover:bg-surface-hover"
                    }
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  >
                    <div
                      className={`
                      flex items-center justify-center h-10 w-10 rounded-full flex-shrink-0 transition-colors
                      ${
                        priceType === BundlePriceType.FIXED
                          ? "bg-neutral-100 dark:bg-primary/20"
                          : "bg-surface-hover dark:bg-neutral-800"
                      }
                      ${isPricingDisabled ? "opacity-50" : ""}
                    `}
                    >
                      <Tag
                        className={`
                        h-5 w-5 transition-colors
                        ${
                          priceType === BundlePriceType.FIXED
                            ? "text-primary"
                            : "text-foreground-3 dark:text-foreground-2"
                        }
                        ${isPricingDisabled ? "opacity-50" : ""}
                      `}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-sm text-foreground-1">
                          {text("bundles.editBundle.form.priceType.fixed")}
                        </span>
                        {priceType === BundlePriceType.FIXED && (
                          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <svg
                              className="h-3 w-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">
                        {text(
                          "bundles.editBundle.form.priceType.fixedDescription",
                        )}
                      </p>
                    </div>
                  </button>

                  {/* Discount Option */}
                  <button
                    type="button"
                    disabled={isPricingDisabled}
                    onClick={() => {
                      if (isPricingDisabled) return;
                      if (priceType === BundlePriceType.DISCOUNT) return;
                      priceTypeField.onChange(BundlePriceType.DISCOUNT);
                      setValue("fixedPriceAmountMinor", undefined);
                    }}
                    className={`
                    relative flex items-start gap-4 p-4 rounded-xl border-1 text-left
                    ${
                      priceType === BundlePriceType.DISCOUNT
                        ? "border-border-strong shadow-sm"
                        : "border-border bg-surface"
                    }
                    ${
                      isPricingDisabled
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer hover:border-border-strong hover:bg-surface-hover"
                    }
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  >
                    <div
                      className={`
                      flex items-center justify-center h-10 w-10 rounded-full flex-shrink-0 transition-colors
                      ${
                        priceType === BundlePriceType.DISCOUNT
                          ? "bg-neutral-100 dark:bg-primary/20"
                          : "bg-surface-hover dark:bg-neutral-800"
                      }
                      ${isPricingDisabled ? "opacity-50" : ""}
                    `}
                    >
                      <Percent
                        className={`
                        h-5 w-5 transition-colors
                        ${
                          priceType === BundlePriceType.DISCOUNT
                            ? "text-primary"
                            : "text-foreground-3 dark:text-foreground-2"
                        }
                        ${isPricingDisabled ? "opacity-50" : ""}
                      `}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-sm text-foreground-1">
                          {text("bundles.editBundle.form.priceType.discount")}
                        </span>
                        {priceType === BundlePriceType.DISCOUNT && (
                          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <svg
                              className="h-3 w-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">
                        {text(
                          "bundles.editBundle.form.priceType.discountDescription",
                        )}
                      </p>
                    </div>
                  </button>
                </div>

                {/* Pricing Summary & Inputs */}
                {selectedServices.length >= 2 && (
                  <div className="space-y-4">
                    {/* Sum of Services Display (always shown when services selected) */}
                    <div className="rounded-xl border border-border bg-surface-hover/50 dark:bg-neutral-900/30 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground-2">
                          {text("bundles.editBundle.pricing.sumOfServices")}
                        </span>
                        <div className="flex items-center gap-2">
                          {currencyDisplay.icon ? (
                            <currencyDisplay.icon className="h-4 w-4 text-foreground-3" />
                          ) : (
                            <span className="text-sm text-foreground-3">
                              {currencyDisplay.symbol}
                            </span>
                          )}
                          <span className="text-lg font-semibold text-foreground-1">
                            {sumOfServicesDisplay.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs bg-secondary w-fit rounded-full px-3 py-1 text-foreground-1 dark:text-foreground-2">
                        {selectedServices.length}{" "}
                        {selectedServices.length === 1
                          ? text("bundles.editBundle.pricing.service")
                          : text("bundles.editBundle.pricing.services")}
                      </p>
                    </div>

                    {/* Sum Price Type - Show Final Price */}
                    {priceType === BundlePriceType.SUM && (
                      <div className="rounded-xl border-1 border-border-strong p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground-1">
                            {text("bundles.editBundle.pricing.finalPrice")}
                          </span>
                          <div className="flex items-center gap-2">
                            {currencyDisplay.icon ? (
                              <currencyDisplay.icon className="h-5 w-5 text-primary" />
                            ) : (
                              <span className="text-base text-primary font-medium">
                                {currencyDisplay.symbol}
                              </span>
                            )}
                            <span className="text-2xl font-bold text-primary">
                              {finalPrice.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fixed Price Type */}
                    {priceType === BundlePriceType.FIXED && (
                      <div className="space-y-4">
                        {/* Fixed Price Input */}
                        <div className="space-y-2">
                          <PriceField
                            value={fixedPriceField.value || 0}
                            onChange={fixedPriceField.onChange}
                            error={fixedPriceState.error?.message}
                            label={text(
                              "bundles.editBundle.form.fixedPrice.label",
                            )}
                            placeholder="0.00"
                            required
                            id="fixed-price"
                            min={0}
                            step={0.01}
                            icon={currencyDisplay.icon}
                            symbol={currencyDisplay.symbol}
                            iconPosition="left"
                            decimalPlaces={2}
                            currency={businessCurrency}
                            storageFormat="cents"
                            liveUpdate
                          />
                        </div>

                        {/* Final Price & Difference - Show in real-time as user types */}
                        {currentFixedPriceValue !== undefined &&
                          currentFixedPriceValue !== null && (
                            <div className="rounded-xl border-1 border-border-strong p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-foreground-1">
                                  {text(
                                    "bundles.editBundle.pricing.finalPrice",
                                  )}
                                </span>
                                <div className="flex items-center gap-2">
                                  {currencyDisplay.icon ? (
                                    <currencyDisplay.icon className="h-5 w-5 text-primary" />
                                  ) : (
                                    <span className="text-base text-primary font-medium">
                                      {currencyDisplay.symbol}
                                    </span>
                                  )}
                                  <span className="text-2xl font-bold text-primary">
                                    {finalPrice.toFixed(2)}
                                  </span>
                                </div>
                              </div>

                              {hasPriceDifference && (
                                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                  <div className="flex items-center gap-2">
                                    {priceDifference < 0 ? (
                                      <TrendingDown className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <TrendingUp className="h-4 w-4 text-orange-500" />
                                    )}
                                    <span className="text-xs font-medium text-foreground-2">
                                      {priceDifference < 0
                                        ? text(
                                            "bundles.editBundle.pricing.savings",
                                          )
                                        : text(
                                            "bundles.editBundle.pricing.increase",
                                          )}
                                    </span>
                                  </div>
                                  <span
                                    className={`text-sm font-semibold ${priceDifference < 0 ? "text-green-500 dark:text-green-400" : "text-orange-600 dark:text-orange-400"}`}
                                  >
                                    {priceDifference < 0 ? "" : "+"}
                                    {currencySymbol}
                                    {Math.abs(priceDifference).toFixed(2)}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                    )}

                    {/* Discount Price Type */}
                    {priceType === BundlePriceType.DISCOUNT && (
                      <div className="space-y-4">
                        {/* Discount Percentage Input */}
                        <div>
                          <TextField
                            value={
                              discountField.value !== undefined &&
                              discountField.value !== null
                                ? String(discountField.value)
                                : ""
                            }
                            onChange={(value) => {
                              const numValue = value
                                ? parseFloat(value)
                                : undefined;
                              discountField.onChange(numValue);
                            }}
                            error={discountState.error?.message}
                            label={text(
                              "bundles.editBundle.form.discountPercentage.label",
                            )}
                            placeholder={text(
                              "bundles.editBundle.form.discountPercentage.placeholder",
                            )}
                            required
                            id="discount-percentage"
                          />
                          <p className="text-xs text-foreground-3 dark:text-foreground-2 mt-1">
                            {text(
                              "bundles.editBundle.form.discountPercentage.help",
                            )}
                          </p>
                        </div>

                        {/* Final Price & Difference */}
                        {discountPercentage !== undefined &&
                          discountPercentage > 0 && (
                            <div className="rounded-xl border-1 border-border-strong p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-foreground-1">
                                  {text(
                                    "bundles.editBundle.pricing.finalPrice",
                                  )}
                                </span>
                                <div className="flex items-center gap-2">
                                  {currencyDisplay.icon ? (
                                    <currencyDisplay.icon className="h-5 w-5 text-primary" />
                                  ) : (
                                    <span className="text-base text-primary font-medium">
                                      {currencyDisplay.symbol}
                                    </span>
                                  )}
                                  <span className="text-2xl font-bold text-primary">
                                    {finalPrice.toFixed(2)}
                                  </span>
                                </div>
                              </div>

                              {hasPriceDifference && (
                                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                  <div className="flex items-center gap-2">
                                    <TrendingDown className="h-4 w-4 text-green-500" />
                                    <span className="text-xs font-medium text-foreground-2">
                                      {text(
                                        "bundles.editBundle.pricing.savings",
                                      )}
                                    </span>
                                  </div>
                                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                    -{currencySymbol}
                                    {Math.abs(priceDifference).toFixed(2)} (
                                    {discountPercentage}%)
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-end gap-2 mb-6 pt-4">
                <div className="flex-1 h-px bg-border dark:bg-border-strong"></div>
              </div>

              {/* Remove Bundle */}
              <div className="space-y-4 rounded-lg border border-border dark:border-border-strong bg-surface-2 p-6">
                <div className="space-y-1">
                  <h3 className="text-base font-medium text-foreground-1">
                    {text("bundles.editBundle.removeBundle.title")}
                  </h3>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                    {text("bundles.editBundle.removeBundle.description")}
                  </p>
                </div>

                <div className="flex flex-col gap-3 items-center">
                  <Button
                    type="button"
                    variant="outline"
                    rounded="full"
                    onClick={handleDeleteClick}
                    className="w-1/2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {text("bundles.editBundle.removeBundle.removing")}
                      </>
                    ) : (
                      text("bundles.editBundle.removeBundle.button")
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </BaseSlider>

      {/* Delete Confirmation Dialog */}
      {effectiveBundle && (
        <DeleteConfirmDialog
          open={showDeleteDialog}
          onOpenChange={handleCloseDeleteDialog}
          resourceType="bundle"
          resourceName={effectiveBundle.name}
          deleteResponse={deleteResponse}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
          className="z-[80]"
          overlayClassName="z-[80]"
          secondaryActions={[]}
        />
      )}
    </>
  );
};

export default EditBundleSlider;
