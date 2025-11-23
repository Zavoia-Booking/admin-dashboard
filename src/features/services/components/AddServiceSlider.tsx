import React, { useEffect, useState, useRef, useCallback } from "react";
import { useForm, useController } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  MapPin,
  Users,
  ClipboardPlus,
  Layers2,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";
import { Label } from "../../../shared/components/ui/label";
import { Input } from "../../../shared/components/ui/input";
import { BaseSlider } from "../../../shared/components/common/BaseSlider";
import { FormFooter } from "../../../shared/components/forms/FormFooter";
import { TextField } from "../../../shared/components/forms/fields/TextField";
import { TextareaField } from "../../../shared/components/forms/fields/TextareaField";
import { PriceField } from "../../../shared/components/forms/fields/PriceField";
import { Pill } from "../../../shared/components/ui/pill";
import { CategorySection } from "./CategorySection";
import ConfirmDialog from "../../../shared/components/common/ConfirmDialog";
import {
  getCurrencyDisplay,
  priceFromStorage,
} from "../../../shared/utils/currency";
import { getAllLocationsSelector } from "../../locations/selectors";
import { selectTeamMembers } from "../../teamMembers/selectors";
import type { TeamMember } from "../../../shared/types/team-member";
import { selectCurrentUser } from "../../auth/selectors";
import { listLocationsAction } from "../../locations/actions";
import { listTeamMembersAction } from "../../teamMembers/actions";
import { createServicesAction } from "../actions.ts";
import type { CreateServicePayload } from "../types.ts";
import { listCategoriesApi } from "../../categories/api";
import type { Category } from "./CategorySection";
import {
  getServicesErrorSelector,
  getServicesLoadingSelector,
} from "../selectors.ts";
import { toast } from "sonner";
import { ServiceFormSkeleton } from "./ServiceFormSkeleton";
import { getLocationLoadingSelector } from "../../locations/selectors";

interface AddServiceSliderProps {
  isOpen: boolean;
  onClose: () => void;
}
interface ServiceFormData {
  name: string;
  price: number;
  duration: number;
  description: string;
  locationIds: number[];
  teamMemberIds: number[];
  categoryId?: number | null;
  categoryName?: string;
  categoryColor?: string;
}

const initialFormData: ServiceFormData = {
  name: "",
  price: 0,
  duration: 60,
  description: "",
  locationIds: [],
  teamMemberIds: [],
  categoryId: null,
};

const AddServiceSlider: React.FC<AddServiceSliderProps> = ({
  isOpen,
  onClose,
}) => {
  const text = useTranslation("services").t;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const allLocations = useSelector(getAllLocationsSelector);
  const allTeamMembers = useSelector(selectTeamMembers);
  const activeTeamMembers = allTeamMembers.filter(
    (member: TeamMember) => member.status === "active"
  );
  const currentUser = useSelector(selectCurrentUser);
  const businessCurrency = currentUser?.business?.businessCurrency || "eur";
  const servicesError = useSelector(getServicesErrorSelector);
  const isServicesLoading = useSelector(getServicesLoadingSelector);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    trigger,
    formState,
  } = useForm<ServiceFormData>({
    defaultValues: initialFormData,
    mode: "onChange",
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const categoriesFetchedRef = useRef(false);
  const [newlyCreatedCategories, setNewlyCreatedCategories] = useState<
    Category[]
  >([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const isLocationsLoading = useSelector(getLocationLoadingSelector);

  const locationIds = watch("locationIds");
  const teamMemberIds = watch("teamMemberIds");
  const categoryId = watch("categoryId");
  const categoryName = watch("categoryName");
  const categoryColor = watch("categoryColor");

  // Validation helpers with translations
  const validateServiceName = (value: string): string | true => {
    const v = (value ?? "").trim();
    if (!v) return text("addService.form.validation.name.required");
    if (v.length < 2) return text("addService.form.validation.name.minLength");
    if (v.length > 70) return text("addService.form.validation.name.maxLength");
    const NAME_PATTERN = /^[A-Za-zÀ-ÿ0-9\s\-'&.()]+$/;
    if (!NAME_PATTERN.test(v)) {
      return text("addService.form.validation.name.invalidChars");
    }
    return true;
  };

  const validateServiceDescription = (value: string): string | true => {
    if (!value || !value.trim()) return true; // Optional field
    const v = value.trim();
    if (v.length > 500) {
      return text("addService.form.validation.description.maxLength", {
        max: 500,
      });
    }
    if (/<script|<iframe|javascript:|onclick|onerror|onload/i.test(v)) {
      return text("addService.form.validation.description.invalidChars");
    }
    return true;
  };

  // Controlled fields with validation
  const { field: nameField, fieldState: nameState } = useController<
    ServiceFormData,
    "name"
  >({
    name: "name",
    control,
    rules: {
      validate: validateServiceName,
    },
  });

  const { field: priceField } = useController<ServiceFormData, "price">({
    name: "price",
    control,
    rules: {
      required: text("addService.form.validation.price.required"),
      min: {
        value: 0,
        message: text("addService.form.validation.price.min"),
      },
    },
  });

  const { field: durationField, fieldState: durationState } = useController<
    ServiceFormData,
    "duration"
  >({
    name: "duration",
    control,
    rules: {
      required: text("addService.form.validation.duration.required"),
      min: {
        value: 1,
        message: text("addService.form.validation.duration.min"),
      },
    },
  });

  const { field: descriptionField, fieldState: descriptionState } =
    useController<ServiceFormData, "description">({
      name: "description",
      control,
      rules: {
        validate: validateServiceDescription,
      },
    });

  // Validate category requirement (either categoryId or categoryName must be set)
  // Only show error after form submission attempt or if category field has been touched
  const categoryError =
    (formState.isSubmitted || formState.touchedFields.categoryId) &&
    !categoryId &&
    (!categoryName || !categoryName.trim())
      ? text("addService.form.validation.category.required")
      : undefined;

  // Check if category is set (required field)
  const isCategorySet =
    (categoryId !== null && categoryId !== undefined) ||
    (categoryName && categoryName.trim().length > 0);

  // Check if required fields are filled
  const nameValue = watch("name");
  const priceValue = watch("price");
  const durationValue = watch("duration");
  const areRequiredFieldsFilled =
    nameValue &&
    nameValue.trim().length > 0 &&
    priceValue !== undefined &&
    priceValue !== null &&
    durationValue !== undefined &&
    durationValue !== null &&
    durationValue > 0;

  // Form should be disabled if there are validation errors or if required fields are empty
  const isFormDisabled =
    !formState.isValid || !isCategorySet || !areRequiredFieldsFilled;

  // Fetch locations, team members, and categories when slider opens
  useEffect(() => {
    if (isOpen && !categoriesFetchedRef.current) {
      dispatch(listLocationsAction.request());
      dispatch(listTeamMembersAction.request());

      // Fetch categories only once (prevent duplicate calls from React Strict Mode)
      categoriesFetchedRef.current = true;
      setIsCategoriesLoading(true);
      listCategoriesApi()
        .then((cats) => {
          setCategories(cats);
          setIsCategoriesLoading(false);
        })
        .catch((error) => {
          console.error("Failed to fetch categories:", error);
          setCategories([]);
          setIsCategoriesLoading(false);
        });
    }
  }, [isOpen, dispatch]);

  // Reset fetch flag when slider closes
  useEffect(() => {
    if (!isOpen) {
      categoriesFetchedRef.current = false;
      setIsCategoriesLoading(false);
    }
  }, [isOpen]);

  // Show skeleton while loading
  const isLoading = isLocationsLoading || isCategoriesLoading;

  // Memoize callback to prevent infinite loops
  const handleNewlyCreatedCategoriesChange = useCallback(
    (newCategories: Category[]) => {
      setNewlyCreatedCategories(newCategories);
    },
    []
  );

  // Reset form when slider closes
  useEffect(() => {
    if (!isOpen) {
      reset(initialFormData);
      setNewlyCreatedCategories([]);
      setIsSubmitting(false);
    }
  }, [isOpen, reset]);

  // Watch for errors and show toast
  useEffect(() => {
    if (servicesError && isSubmitting) {
      toast.error("We couldn't create the service", {
        description: String(servicesError),
        icon: undefined,
      });
      setIsSubmitting(false);
    }
  }, [servicesError, isSubmitting]);

  // Watch for success and close form
  useEffect(() => {
    if (!isServicesLoading && isSubmitting && !servicesError) {
      // Success - close form and reset
      setShowConfirmDialog(false);
      onClose();
      reset(initialFormData);
      setNewlyCreatedCategories([]);
      setIsSubmitting(false);
    }
  }, [isServicesLoading, isSubmitting, servicesError, onClose, reset]);

  // no per-form location state when All locations

  const onSubmit = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmCreate = () => {
    const {
      name,
      price,
      duration,
      description,
      locationIds,
      teamMemberIds,
      categoryId,
    } = getValues();

    // Separate selected category from other new categories
    const selectedCategory = newlyCreatedCategories.find(
      (cat) => cat.id === categoryId
    );
    const isSelectedNew = !!selectedCategory;
    const otherNewCategories = newlyCreatedCategories.filter(
      (cat) => cat.id !== categoryId
    );

    const payload: CreateServicePayload = {
      name,
      price_amount_minor: price ?? 0, // Price is already in cents from PriceField
      duration,
      description,
      locations: locationIds.length > 0 ? locationIds : undefined,
      teamMembers: teamMemberIds.length > 0 ? teamMemberIds : undefined,
      category:
        categoryId && !isSelectedNew
          ? { categoryId } // Existing category
          : selectedCategory
          ? {
              categoryName: selectedCategory.name,
              categoryColor: selectedCategory.color!,
            }
          : undefined,
      additionalCategories:
        otherNewCategories.length > 0
          ? otherNewCategories.map((cat) => ({
              name: cat.name,
              color: cat.color!,
            }))
          : undefined,
    };
    setIsSubmitting(true);
    dispatch(createServicesAction.request(payload));
    setShowConfirmDialog(false);
    // Don't close form here - wait for success/error response
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
        title={text("addService.title")}
        subtitle={text("addService.subtitle")}
        icon={ClipboardPlus}
        iconColor="text-foreground-1"
        contentClassName="bg-surface scrollbar-hide"
        footer={
          <FormFooter
            onCancel={handleCancel}
            formId="add-service-form"
            cancelLabel={text("addService.buttons.cancel")}
            submitLabel={text("addService.buttons.create")}
            disabled={isFormDisabled}
          />
        }
      >
        <form
          id="add-service-form"
          onSubmit={handleSubmit(onSubmit)}
          className="h-full flex flex-col cursor-default"
        >
          <div className="flex-1 overflow-y-auto p-1 py-6 pt-0 md:p-6 md:pt-0 bg-surface">
            {isLoading ? (
              <ServiceFormSkeleton />
            ) : (
              <div className="max-w-2xl mx-auto space-y-8 cursor-default">
                {/* Essential Fields */}
                <div className="space-y-0 mb-0">
                  {/* Service Information Section */}
                  <div className="space-y-5">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-foreground-1">
                        {text("addService.sections.serviceInfo")}
                      </h3>
                      <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                        {text("addService.sections.serviceInfoDescription")}
                      </p>
                    </div>

                    <div className="space-y-5">
                      <TextField
                        value={nameField.value || ""}
                        onChange={nameField.onChange}
                        error={nameState.error?.message}
                        label={text("addService.form.name.label")}
                        placeholder={text("addService.form.name.placeholder")}
                        required
                        id="name"
                        maxLength={70}
                        icon={Layers2}
                      />

                      <TextareaField
                        value={descriptionField.value || ""}
                        onChange={descriptionField.onChange}
                        error={descriptionState.error?.message}
                        label={text("addService.form.description.label")}
                        placeholder={text(
                          "addService.form.description.placeholder"
                        )}
                        id="description"
                        rows={4}
                      />
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="flex items-end gap-2 mb-6 pt-4">
                    <div className="flex-1 h-px bg-border dark:bg-border-strong"></div>
                  </div>

                  {/* Pricing & Duration Section */}
                  <div className="space-y-4">
                    <div className="space-y-1 mb-4">
                      <h3 className="text-lg font-semibold text-foreground-1">
                        {text("addService.sections.pricingDuration")}
                      </h3>
                      <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                        {text("addService.sections.pricingDurationDescription")}
                      </p>
                    </div>

                    {/* Currency helper text - inline, no box */}
                    <p className="text-xs text-foreground-3 dark:text-foreground-2">
                      {text("addService.form.currency.info")}{" "}
                      <span className="font-medium">
                        {getCurrencyDisplay(businessCurrency).symbol}
                      </span>{" "}
                      (
                      <span
                        onClick={() => navigate("/settings")}
                        className="inline-flex items-center gap-0.5 cursor-pointer font-bold text-foreground-1 dark:text-foreground-1 hover:text-primary dark:hover:text-primary transition-colors duration-200"
                      >
                        {text("addService.form.currency.editText")}{" "}
                        {text("addService.form.currency.infoLink")}
                        <ArrowUpRight
                          className="h-3 w-3 text-primary"
                          aria-hidden="true"
                        />
                      </span>
                      ).
                    </p>

                    {/* Price & Duration on same row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Price Input */}
                      <div className="space-y-2">
                        <PriceField
                          value={priceField.value || 0}
                          onChange={priceField.onChange}
                          label={text("addService.form.price.label")}
                          placeholder="0.00"
                          required
                          id="price"
                          min={0}
                          step={0.01}
                          icon={getCurrencyDisplay(businessCurrency).icon}
                          symbol={getCurrencyDisplay(businessCurrency).symbol}
                          iconPosition="left"
                          decimalPlaces={2}
                          currency={businessCurrency}
                          storageFormat="cents"
                        />
                      </div>

                      {/* Duration Input */}
                      <div className="space-y-2">
                        <div className="space-y-2 mb-1">
                          <Label
                            htmlFor="duration"
                            className="text-base font-medium"
                          >
                            {text("addService.form.duration.label")} *
                          </Label>
                          <div className="relative">
                            {/* Clock icon on left */}
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                              <Clock className="h-4 w-4 text-foreground-3 dark:text-foreground-2" />
                            </div>
                            <Input
                              id="duration"
                              type="text"
                              inputMode="numeric"
                              placeholder={text(
                                "addService.form.duration.placeholder"
                              )}
                              value={durationField.value || ""}
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                              ) => {
                                const inputValue = e.target.value;
                                // Only allow digits
                                if (
                                  inputValue === "" ||
                                  /^\d+$/.test(inputValue)
                                ) {
                                  const numValue =
                                    inputValue === ""
                                      ? ""
                                      : parseInt(inputValue, 10);
                                  durationField.onChange(numValue);
                                }
                              }}
                              className="!pl-10 !pr-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all focus-visible:ring-1 focus-visible:ring-offset-0 border-border dark:border-border-subtle hover:border-border-strong focus:border-focus focus-visible:ring-focus"
                              aria-invalid={!!durationState.error?.message}
                            />
                            {/* "minutes" suffix */}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                              <span className="text-sm text-foreground-3 dark:text-foreground-2">
                                {text("addService.form.duration.helperText")}
                              </span>
                            </div>
                          </div>
                          <div className="h-5">
                            {durationState.error?.message && (
                              <p
                                className="flex items-center gap-1.5 text-xs text-destructive"
                                role="alert"
                                aria-live="polite"
                              >
                                <AlertCircle className="h-3.5 w-3.5" />
                                <span>{durationState.error.message}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        {/* Duration chips - directly under Duration field */}
                        <div className="flex items-center gap-2 pl-0">
                          {[15, 30, 45, 60, 120].map((minutes) => (
                            <button
                              key={minutes}
                              type="button"
                              onClick={async () => {
                                setValue("duration", minutes, {
                                  shouldValidate: true,
                                });
                                await trigger("duration");
                              }}
                              className={`flex-1 cursor-pointer px-2.5 py-1 text-xs font-medium rounded-md transition-colors duration-200 text-center focus:outline-none focus-visible:ring-3 focus-visible:ring-focus/50 focus-visible:ring-offset-0 ${
                                durationField.value === minutes
                                  ? "bg-primary text-white"
                                  : "bg-surface hover:bg-surface-hover text-foreground-3 dark:text-foreground-2 border border-border"
                              }`}
                            >
                              {text(`addService.form.durationChips.${minutes}`)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Helper text - inline, no box */}
                    <p className="text-xs text-foreground-3 dark:text-foreground-2">
                      {text("addService.form.pricingNote.text")}{" "}
                      <span
                        onClick={() => navigate("/assignments?tab=services")}
                        className="inline-flex pl-0.5 items-center gap-0.5 cursor-pointer font-bold text-foreground-1 dark:text-foreground-1 hover:text-primary dark:hover:text-primary transition-colors duration-200"
                      >
                        {text("addService.form.pricingNote.link")}
                        <ArrowUpRight
                          className="h-3 w-3 text-primary"
                          aria-hidden="true"
                        />
                      </span>
                      .
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="flex items-end gap-2 mb-6 pt-8">
                    <div className="flex-1 h-px bg-border dark:bg-border-strong"></div>
                  </div>

                  {/* Category Section */}
                  <CategorySection
                    key={isOpen ? "open" : "closed"}
                    categoryId={categoryId}
                    categoryName={categoryName}
                    categoryColor={categoryColor}
                    onCategoryIdChange={(value: number | null) => {
                      setValue("categoryId", value, { shouldTouch: true });
                      // Clear category name when selecting existing category
                      if (value) {
                        setValue("categoryName", "");
                        setValue("categoryColor", "");
                      }
                    }}
                    onCategoryNameChange={(value: string) => {
                      setValue("categoryName", value, { shouldTouch: true });
                      // Clear categoryId when creating new category
                      if (value) {
                        setValue("categoryId", null);
                      }
                    }}
                    onCategoryColorChange={(value: string) =>
                      setValue("categoryColor", value, { shouldTouch: true })
                    }
                    existingCategories={categories}
                    required
                    error={categoryError}
                    onNewCategoryCreated={(newCategory) => {
                      // Add the new category to the local categories list
                      // The category will be created on backend when service is saved
                      // For now, we just update the form state
                      setValue("categoryId", newCategory.id);
                      setValue("categoryName", newCategory.name);
                      setValue("categoryColor", newCategory.color || "");
                    }}
                    onCategoryRemoved={(removedCategoryId) => {
                      // If the removed category was selected, clear the selection
                      if (categoryId === removedCategoryId) {
                        setValue("categoryId", null);
                        setValue("categoryName", "");
                        setValue("categoryColor", "");
                      }
                    }}
                    onNewlyCreatedCategoriesChange={
                      handleNewlyCreatedCategoriesChange
                    }
                  />
                </div>

                {/* Divider */}
                <div className="flex items-end gap-2 mb-6 pt-4">
                  <div className="flex-1 h-px bg-border dark:bg-border-strong"></div>
                </div>

                {/* Locations Section */}
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground-1">
                      {text("addService.sections.locations")}
                    </h3>
                    <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                      {text("addService.sections.locationsDescription")}
                    </p>
                  </div>

                  <div className="space-y-5">
                    {allLocations.length === 0 ? (
                      <p className="text-sm text-foreground-3 dark:text-foreground-2">
                        {text("addService.form.locations.emptyMessage")}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {allLocations.map((location) => {
                          const isSelected = locationIds.includes(location.id);

                          return (
                            <Pill
                              key={location.id}
                              selected={isSelected}
                              icon={MapPin}
                              className="w-auto justify-start items-start transition-none active:scale-100"
                              showCheckmark={true}
                              onClick={() => {
                                const newIds = isSelected
                                  ? locationIds.filter(
                                      (id) => id !== location.id
                                    )
                                  : [...locationIds, location.id];
                                setValue("locationIds", newIds);
                              }}
                            >
                              <div className="flex flex-col text-left">
                                <div className="flex items-center">
                                  {location.name}
                                </div>
                                {location.address && (
                                  <div className="text-xs text-foreground-3 dark:text-foreground-2 mt-0.5">
                                    {location.address}
                                  </div>
                                )}
                              </div>
                            </Pill>
                          );
                        })}
                      </div>
                    )}
                    {allLocations.length > 0 && (
                      <p className="text-xs text-foreground-3 dark:text-foreground-2">
                        {locationIds.length === 0
                          ? text("addService.form.locations.helperTextNone")
                          : locationIds.length === 1
                          ? text("addService.form.locations.helperTextOne")
                          : text("addService.form.locations.helperTextSome", {
                              count: locationIds.length,
                            })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-end gap-2 mb-6 pt-0">
                  <div className="flex-1 h-px bg-border dark:bg-border-strong"></div>
                </div>

                {/* Team Members Section */}
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground-1">
                      {text("addService.sections.teamMembers")}
                    </h3>
                    <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                      {text("addService.sections.teamMembersDescription")}
                    </p>
                  </div>

                  <div className="space-y-5">
                    {activeTeamMembers.length === 0 ? (
                      <p className="text-sm text-foreground-3 dark:text-foreground-2">
                        {text("addService.form.teamMembers.emptyMessage")}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {activeTeamMembers.map((member: TeamMember) => {
                          const isSelected = teamMemberIds.includes(member.id);

                          return (
                            <Pill
                              key={member.id}
                              selected={isSelected}
                              icon={Users}
                              className="w-auto justify-start items-start transition-none active:scale-100"
                              showCheckmark={true}
                              onClick={() => {
                                const newIds = isSelected
                                  ? teamMemberIds.filter(
                                      (id) => id !== member.id
                                    )
                                  : [...teamMemberIds, member.id];
                                setValue("teamMemberIds", newIds);
                              }}
                            >
                              <div className="flex flex-col text-left">
                                <div className="flex items-center">
                                  {`${member.firstName} ${member.lastName}`}
                                </div>
                                {member.email && (
                                  <div className="text-xs text-foreground-3 dark:text-foreground-2 mt-0.5">
                                    {member.email}
                                  </div>
                                )}
                              </div>
                            </Pill>
                          );
                        })}
                      </div>
                    )}
                    {activeTeamMembers.length > 0 && (
                      <p className="text-xs text-foreground-3 dark:text-foreground-2">
                        {teamMemberIds.length === 0
                          ? text("addService.form.teamMembers.helperTextNone")
                          : teamMemberIds.length === 1
                          ? text("addService.form.teamMembers.helperTextOne")
                          : text("addService.form.teamMembers.helperTextSome", {
                              count: teamMemberIds.length,
                            })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      </BaseSlider>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirmCreate}
        onCancel={() => setShowConfirmDialog(false)}
        title={text("addService.confirmDialog.title")}
        description={text("addService.confirmDialog.description", {
          name: getValues("name"),
          price: priceFromStorage(
            getValues("price") || 0,
            businessCurrency
          ).toFixed(2),
          duration: getValues("duration"),
        })}
        confirmTitle={text("addService.confirmDialog.confirm")}
        cancelTitle={text("addService.confirmDialog.cancel")}
        showCloseButton={true}
      />
    </>
  );
};

export default AddServiceSlider;
