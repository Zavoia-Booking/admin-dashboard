import React, { useEffect, useState, useRef } from "react";
import { useForm, useController } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Package, AlertCircle, Calculator, DollarSign, Percent, TrendingDown, TrendingUp, Settings2 } from "lucide-react";
import { BaseSlider } from "../../../../shared/components/common/BaseSlider";
import { FormFooter } from "../../../../shared/components/forms/FormFooter";
import ConfirmDialog from "../../../../shared/components/common/ConfirmDialog";
import { TextField } from "../../../../shared/components/forms/fields/TextField";
import { TextareaField } from "../../../../shared/components/forms/fields/TextareaField";
import { PriceField } from "../../../../shared/components/forms/fields/PriceField";
import { createBundleAction } from "../../../bundles/actions";
import type { CreateBundlePayload } from "../../../bundles/types";
import { BundlePriceType } from "../../../bundles/types";
import {
  getBundlesErrorSelector,
  getBundlesLoadingSelector,
} from "../../../bundles/selectors";
import { getServicesListSelector } from "../../selectors";
import { getServicesAction } from "../../actions";
import { toast } from "sonner";
import { selectCurrentUser } from "../../../auth/selectors";
import type { Service } from "../../../../shared/types/service";
import { Badge } from "../../../../shared/components/ui/badge";
import { Button } from "../../../../shared/components/ui/button";
import { ManageServicesSheet } from "../../../../shared/components/common/ManageServicesSheet";
import { priceToStorage, priceFromStorage, getCurrencyDisplay } from "../../../../shared/utils/currency";

interface AddBundleSliderProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BundleFormData {
  name: string;
  description: string;
  priceType: BundlePriceType;
  fixedPriceAmountMinor?: number;
  discountPercentage?: number;
  serviceIds: number[];
}

const initialFormData: BundleFormData = {
  name: "",
  description: "",
  priceType: BundlePriceType.SUM,
  serviceIds: [],
};

const AddBundleSlider: React.FC<AddBundleSliderProps> = ({
  isOpen,
  onClose,
}) => {
  const text = useTranslation("services").t;
  const dispatch = useDispatch();
  const allServices = useSelector(getServicesListSelector);
  const currentUser = useSelector(selectCurrentUser);
  const businessCurrency = currentUser?.business?.businessCurrency || "eur";
  const bundlesError = useSelector(getBundlesErrorSelector);
  const isBundlesLoading = useSelector(getBundlesLoadingSelector);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isManageServicesOpen, setIsManageServicesOpen] = useState(false);
  const prevLoadingRef = useRef(isBundlesLoading);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState,
  } = useForm<BundleFormData>({
    defaultValues: initialFormData,
    mode: "onChange",
  });

  const priceType = watch("priceType");
  const serviceIds = watch("serviceIds");
  const fixedPriceAmountMinor = watch("fixedPriceAmountMinor");
  const discountPercentage = watch("discountPercentage");

  // Calculate sum of selected services' prices
  const selectedServices = allServices.filter((service: Service) => 
    serviceIds?.includes(service.id)
  );
  
  // Sum prices: services have price in decimal format, convert to cents, sum, then back to decimal
  const sumOfServicesInCents = selectedServices.reduce((sum: number, service: Service) => {
    const priceInCents = priceToStorage(service.price, businessCurrency);
    return sum + priceInCents;
  }, 0);
  
  const sumOfServicesDisplay = priceFromStorage(sumOfServicesInCents, businessCurrency);
  
  // Calculate final price based on price type
  // Note: This will be updated after fixedPriceField is declared to use real-time values
  
  const currencyDisplay = getCurrencyDisplay(businessCurrency);
  // Helper to get currency symbol for text display
  const getCurrencySymbol = (): string => {
    if (currencyDisplay.symbol) return currencyDisplay.symbol;
    // If we have an icon, we'll use a generic symbol based on currency
    const code = businessCurrency.toUpperCase();
    if (code === 'EUR') return '€';
    if (code === 'USD') return '$';
    if (code === 'GBP') return '£';
    return code;
  };
  const currencySymbol = getCurrencySymbol();

  // Fetch services when slider opens
  useEffect(() => {
    if (isOpen && allServices.length === 0) {
      dispatch(getServicesAction.request());
    }
  }, [isOpen, allServices.length, dispatch]);

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

  // Reset form when slider closes
  useEffect(() => {
    if (!isOpen) {
      reset(initialFormData);
      setIsSubmitting(false);
    }
  }, [isOpen, reset]);

  // Validation helpers
  const validateBundleName = (value: string): string | true => {
    const v = (value ?? "").trim();
    if (!v) return "Bundle name is required";
    if (v.length < 2) return "Bundle name must be at least 2 characters";
    if (v.length > 100) return "Bundle name must not exceed 100 characters";
    return true;
  };

  const validateDescription = (value: string): string | true => {
    if (!value || !value.trim()) return true;
    const v = value.trim();
    if (v.length > 500) return "Description must not exceed 500 characters";
    return true;
  };

  const validateFixedPrice = (value: number | undefined): string | true => {
    if (priceType === BundlePriceType.FIXED) {
      if (value === undefined || value === null) {
        return "Fixed price is required";
      }
      if (value < 0) {
        return "Fixed price must be greater than or equal to 0";
      }
    }
    return true;
  };

  const validateDiscountPercentage = (
    value: number | undefined
  ): string | true => {
    if (priceType === BundlePriceType.DISCOUNT) {
      if (value === undefined || value === null) {
        return "Discount percentage is required";
      }
      if (value < 0) {
        return "Discount percentage must be at least 0";
      }
      if (value > 100) {
        return "Discount percentage must not exceed 100";
      }
    }
    return true;
  };

  // ServiceIds validation is handled separately in the form validation

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

  const { field: fixedPriceField, fieldState: fixedPriceState } =
    useController<BundleFormData, "fixedPriceAmountMinor">({
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
  // This uses the field value directly so it updates as the user types
  const currentFixedPriceValue = fixedPriceField.value ?? fixedPriceAmountMinor;
  
  // Calculate final price based on price type (updated to use currentFixedPriceValue for real-time updates)
  const calculateFinalPrice = (): number => {
    if (priceType === BundlePriceType.SUM) {
      return sumOfServicesDisplay;
    } else if (priceType === BundlePriceType.FIXED && currentFixedPriceValue !== undefined && currentFixedPriceValue !== null) {
      return priceFromStorage(currentFixedPriceValue, businessCurrency);
    } else if (priceType === BundlePriceType.DISCOUNT && discountPercentage !== undefined) {
      const discountAmount = sumOfServicesDisplay * (discountPercentage / 100);
      return sumOfServicesDisplay - discountAmount;
    }
    return 0;
  };
  
  const finalPrice = calculateFinalPrice();
  const priceDifference = finalPrice - sumOfServicesDisplay;
  const hasPriceDifference = Math.abs(priceDifference) > 0.01; // Account for floating point precision

  // Validate serviceIds - minimum 2 services required
  const serviceIdsError =
    (!serviceIds || serviceIds.length < 2) &&
    (formState.isSubmitted || formState.touchedFields.serviceIds)
      ? text("bundles.addBundle.validation.servicesMinimum")
      : undefined;

  // Check if form is valid
  const isFormDisabled =
    !formState.isValid ||
    !serviceIds ||
    serviceIds.length < 2 ||
    !!serviceIdsError;

  const onSubmit = () => {
    // Prevent opening dialog if already submitting or loading
    if (isSubmitting || isBundlesLoading) {
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmCreate = () => {
    // Guard against double-clicks on Confirm button
    if (isSubmitting || isBundlesLoading) {
      return;
    }

    const data = watch();
    setIsSubmitting(true);

    const payload: CreateBundlePayload = {
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

    dispatch(createBundleAction.request(payload));
    setShowConfirmDialog(false);
    // Don't close form here - wait for success/error response
  };

  // Handle successful creation
  useEffect(() => {
    if (!isBundlesLoading && isSubmitting && !bundlesError) {
      setIsSubmitting(false);
      onClose();
      // Optionally refresh bundles list here when implemented
    }
  }, [isBundlesLoading, isSubmitting, bundlesError, onClose]);

  const handleApplyServices = (newServiceIds: number[]) => {
    setValue("serviceIds", newServiceIds, { shouldValidate: true, shouldTouch: true });
  };

  const handleCancel = () => {
    onClose();
    reset(initialFormData);
  };

  return (
    <>
      <BaseSlider
      isOpen={isOpen}
      onClose={onClose}
      title={text("bundles.addBundle.title")}
      subtitle={text("bundles.addBundle.subtitle")}
      icon={Package}
      iconColor="text-foreground-1"
      contentClassName="bg-surface scrollbar-hide"
      footer={
        <FormFooter
          onCancel={handleCancel}
          formId="add-bundle-form"
          cancelLabel={text("bundles.addBundle.buttons.cancel")}
          submitLabel={text("bundles.addBundle.buttons.create")}
          disabled={isFormDisabled || isSubmitting || isBundlesLoading}
          isLoading={isSubmitting || isBundlesLoading}
        />
      }
    >
      <form
        id="add-bundle-form"
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
                  {text("bundles.addBundle.sections.bundleInfo")}
                </h3>
                <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                  {text("bundles.addBundle.sections.bundleInfoDescription")}
                </p>
              </div>

              <div className="space-y-5">
                <TextField
                  value={nameField.value || ""}
                  onChange={nameField.onChange}
                  error={nameState.error?.message}
                  label={text("bundles.addBundle.form.name.label")}
                  placeholder={text("bundles.addBundle.form.name.placeholder")}
                  required
                  id="bundle-name"
                  maxLength={100}
                  icon={Package}
                />

                <TextareaField
                  value={descriptionField.value || ""}
                  onChange={descriptionField.onChange}
                  error={descriptionState.error?.message}
                  label={text("bundles.addBundle.form.description.label")}
                  placeholder={text(
                    "bundles.addBundle.form.description.placeholder"
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
                  {text("bundles.addBundle.sections.services")}
                </h3>
                <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                  {text("bundles.addBundle.sections.servicesDescription")}
                </p>
              </div>

              {allServices.length === 0 ? (
                <div className="text-sm text-foreground-3 dark:text-foreground-2 text-center py-8">
                  {text("bundles.addBundle.noServices")}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary badges of selected services */}
                  {selectedServices.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedServices.slice(0, 5).map((service: Service) => (
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
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsManageServicesOpen(true)}
                      className="w-1/2"
                    >
                      <Settings2 className="h-4 w-4 mr-2" />
                      {text("bundles.addBundle.manageServices")}
                    </Button>
                  </div>

                  {/* ManageServicesSheet */}
                  <ManageServicesSheet
                    isOpen={isManageServicesOpen}
                    onClose={() => setIsManageServicesOpen(false)}
                    teamMemberName={text("bundles.addBundle.bundleLabel")}
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
                  {text("bundles.addBundle.sections.pricing")}
                </h3>
                <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                  {text("bundles.addBundle.sections.pricingDescription")}
                </p>
              </div>

              {/* Pricing Summary & Inputs */}
              {selectedServices.length > 0 && (
                <div className="space-y-4">
                  {/* Sum of Services Display (always shown when services selected) */}
                  <div className="rounded-xl border border-border bg-surface-hover/50 dark:bg-neutral-900/30 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground-2">
                        {text("bundles.addBundle.pricing.sumOfServices")}
                      </span>
                      <div className="flex items-center gap-2">
                        {currencyDisplay.icon ? (
                          <currencyDisplay.icon className="h-4 w-4 text-foreground-3" />
                        ) : (
                          <span className="text-sm text-foreground-3">{currencyDisplay.symbol}</span>
                        )}
                        <span className="text-lg font-semibold text-foreground-1">
                          {sumOfServicesDisplay.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-foreground-3 dark:text-foreground-2">
                      {selectedServices.length} {selectedServices.length === 1 ? text("bundles.addBundle.pricing.service") : text("bundles.addBundle.pricing.services")}
                    </p>
                  </div>

                  {/* Sum Price Type - Show Final Price */}
                  {priceType === BundlePriceType.SUM && (
                    <div className="rounded-xl border-2 border-primary/20 bg-primary/5 dark:bg-primary/10 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground-1">
                          {text("bundles.addBundle.pricing.finalPrice")}
                        </span>
                        <div className="flex items-center gap-2">
                          {currencyDisplay.icon ? (
                            <currencyDisplay.icon className="h-5 w-5 text-primary" />
                          ) : (
                            <span className="text-base text-primary font-medium">{currencyDisplay.symbol}</span>
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
                          label={text("bundles.addBundle.form.fixedPrice.label")}
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
                      {currentFixedPriceValue !== undefined && currentFixedPriceValue !== null && (
                        <div className="rounded-xl border-2 border-primary/20 bg-primary/5 dark:bg-primary/10 p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-foreground-1">
                              {text("bundles.addBundle.pricing.finalPrice")}
                            </span>
                            <div className="flex items-center gap-2">
                              {currencyDisplay.icon ? (
                                <currencyDisplay.icon className="h-5 w-5 text-primary" />
                              ) : (
                                <span className="text-base text-primary font-medium">{currencyDisplay.symbol}</span>
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
                                    ? text("bundles.addBundle.pricing.savings")
                                    : text("bundles.addBundle.pricing.increase")}
                                </span>
                              </div>
                              <span className={`text-sm font-semibold ${priceDifference < 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                {priceDifference < 0 ? '' : '+'}
                                {currencySymbol}{Math.abs(priceDifference).toFixed(2)}
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
                            discountField.value !== undefined && discountField.value !== null
                              ? String(discountField.value)
                              : ""
                          }
                          onChange={(value) => {
                            const numValue = value ? parseFloat(value) : undefined;
                            discountField.onChange(numValue);
                          }}
                          error={discountState.error?.message}
                          label={text(
                            "bundles.addBundle.form.discountPercentage.label"
                          )}
                          placeholder={text(
                            "bundles.addBundle.form.discountPercentage.placeholder"
                          )}
                          required
                        />
                        <p className="text-xs text-foreground-3 dark:text-foreground-2 mt-1">
                          {text(
                            "bundles.addBundle.form.discountPercentage.help"
                          )}
                        </p>
                      </div>

                      {/* Final Price & Difference */}
                      {discountPercentage !== undefined && discountPercentage > 0 && (
                        <div className="rounded-xl border-2 border-primary/20 bg-primary/5 dark:bg-primary/10 p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-foreground-1">
                              {text("bundles.addBundle.pricing.finalPrice")}
                            </span>
                            <div className="flex items-center gap-2">
                              {currencyDisplay.icon ? (
                                <currencyDisplay.icon className="h-5 w-5 text-primary" />
                              ) : (
                                <span className="text-base text-primary font-medium">{currencyDisplay.symbol}</span>
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
                                  {text("bundles.addBundle.pricing.savings")}
                                </span>
                              </div>
                              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                -{currencySymbol}{Math.abs(priceDifference).toFixed(2)} ({discountPercentage}%)
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Modern Card-Based Price Type Selection */}
              <div className="grid grid-cols-1 gap-3">
                {/* Sum of Services Option */}
                <button
                  type="button"
                  onClick={() => {
                    priceTypeField.onChange(BundlePriceType.SUM);
                    setValue("fixedPriceAmountMinor", undefined);
                    setValue("discountPercentage", undefined);
                  }}
                  className={`
                    relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left
                    ${
                      priceType === BundlePriceType.SUM
                        ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm"
                        : "border-border bg-surface hover:border-border-strong hover:bg-surface-hover"
                    }
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                  `}
                >
                  <div
                    className={`
                      flex items-center justify-center h-10 w-10 rounded-lg flex-shrink-0 transition-colors
                      ${
                        priceType === BundlePriceType.SUM
                          ? "bg-primary/10 dark:bg-primary/20"
                          : "bg-surface-hover dark:bg-neutral-800"
                      }
                    `}
                  >
                    <Calculator
                      className={`
                        h-5 w-5 transition-colors
                        ${
                          priceType === BundlePriceType.SUM
                            ? "text-primary"
                            : "text-foreground-3 dark:text-foreground-2"
                        }
                      `}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`
                          font-semibold text-sm transition-colors
                          ${
                            priceType === BundlePriceType.SUM
                              ? "text-foreground-1"
                              : "text-foreground-1"
                          }
                        `}
                      >
                        {text("bundles.addBundle.form.priceType.sum")}
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
                      {text("bundles.addBundle.form.priceType.sumDescription")}
                    </p>
                  </div>
                </button>

                {/* Fixed Price Option */}
                <button
                  type="button"
                  onClick={() => {
                    priceTypeField.onChange(BundlePriceType.FIXED);
                    setValue("discountPercentage", undefined);
                  }}
                  className={`
                    relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left
                    ${
                      priceType === BundlePriceType.FIXED
                        ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm"
                        : "border-border bg-surface hover:border-border-strong hover:bg-surface-hover"
                    }
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                  `}
                >
                  <div
                    className={`
                      flex items-center justify-center h-10 w-10 rounded-lg flex-shrink-0 transition-colors
                      ${
                        priceType === BundlePriceType.FIXED
                          ? "bg-primary/10 dark:bg-primary/20"
                          : "bg-surface-hover dark:bg-neutral-800"
                      }
                    `}
                  >
                    <DollarSign
                      className={`
                        h-5 w-5 transition-colors
                        ${
                          priceType === BundlePriceType.FIXED
                            ? "text-primary"
                            : "text-foreground-3 dark:text-foreground-2"
                        }
                      `}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`
                          font-semibold text-sm transition-colors
                          ${
                            priceType === BundlePriceType.FIXED
                              ? "text-foreground-1"
                              : "text-foreground-1"
                          }
                        `}
                      >
                        {text("bundles.addBundle.form.priceType.fixed")}
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
                      {text("bundles.addBundle.form.priceType.fixedDescription")}
                    </p>
                  </div>
                </button>

                {/* Discount Option */}
                <button
                  type="button"
                  onClick={() => {
                    priceTypeField.onChange(BundlePriceType.DISCOUNT);
                    setValue("fixedPriceAmountMinor", undefined);
                  }}
                  className={`
                    relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left
                    ${
                      priceType === BundlePriceType.DISCOUNT
                        ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm"
                        : "border-border bg-surface hover:border-border-strong hover:bg-surface-hover"
                    }
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                  `}
                >
                  <div
                    className={`
                      flex items-center justify-center h-10 w-10 rounded-lg flex-shrink-0 transition-colors
                      ${
                        priceType === BundlePriceType.DISCOUNT
                          ? "bg-primary/10 dark:bg-primary/20"
                          : "bg-surface-hover dark:bg-neutral-800"
                      }
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
                      `}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`
                          font-semibold text-sm transition-colors
                          ${
                            priceType === BundlePriceType.DISCOUNT
                              ? "text-foreground-1"
                              : "text-foreground-1"
                          }
                        `}
                      >
                        {text("bundles.addBundle.form.priceType.discount")}
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
                      {text("bundles.addBundle.form.priceType.discountDescription")}
                    </p>
                  </div>
                </button>
              </div>
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
        title={text("bundles.addBundle.confirmDialog.title")}
        description={text("bundles.addBundle.confirmDialog.description", {
          name: watch("name"),
          serviceCount: serviceIds?.length || 0,
        })}
        confirmTitle={text("bundles.addBundle.confirmDialog.confirm")}
        cancelTitle={text("bundles.addBundle.confirmDialog.cancel")}
        showCloseButton={true}
      />
    </>
  );
};

export default AddBundleSlider;

