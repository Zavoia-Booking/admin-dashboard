import React, { useEffect, useState } from "react";
import { useForm, useController } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  Clock,
  Sparkles,
  MapPin,
  Users,
  ClipboardPlus,
  Info,
} from "lucide-react";
import { Label } from "../../../shared/components/ui/label";
import { Switch } from "../../../shared/components/ui/switch";
import { BaseSlider } from "../../../shared/components/common/BaseSlider";
import { CollapsibleFormSection } from "../../../shared/components/forms/CollapsibleFormSection";
import { FormFooter } from "../../../shared/components/forms/FormFooter";
import { TextField } from "../../../shared/components/forms/fields/TextField";
import { TextareaField } from "../../../shared/components/forms/fields/TextareaField";
import { NumberField } from "../../../shared/components/forms/fields/NumberField";
import { PriceField } from "../../../shared/components/forms/fields/PriceField";
import { EntitySelector } from "../../../shared/components/forms/fields/EntitySelector";
import type { EntityOption } from "../../../shared/components/forms/fields/EntitySelector";
import { CategorySection } from "./CategorySection";
import ConfirmDialog from "../../../shared/components/common/ConfirmDialog";
import { getCurrencyDisplay, priceFromStorage } from "../../../shared/utils/currency";

import { getAllLocationsSelector } from "../../locations/selectors";
import { selectTeamMembers } from "../../teamMembers/selectors";
import { selectCurrentUser } from "../../auth/selectors";
import { listLocationsAction } from "../../locations/actions";
import { listTeamMembersAction } from "../../teamMembers/actions";
import { createServicesAction } from "../actions.ts";
import type { CreateServicePayload } from "../types.ts";

interface AddServiceSliderProps {
  isOpen: boolean;
  onClose: () => void;
}

// interface StaffAssignment {
//   name: string;
//   price?: number;
//   duration?: number;
// }

interface ServiceFormData {
  name: string;
  price: number;
  duration: number;
  description: string;
  isActive: boolean;
  locationIds: number[];
  teamMemberIds: number[];
  categoryId?: number | null;
  categoryName?: string;
  categoryColor?: string;
}

const initialFormData: ServiceFormData = {
  name: "",
  price: 0,
  duration: 0,
  description: "",
  isActive: true,
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
  const allLocations = useSelector(getAllLocationsSelector);
  const allTeamMembers = useSelector(selectTeamMembers);
  const currentUser = useSelector(selectCurrentUser);
  const businessCurrency = currentUser?.business?.businessCurrency || 'eur';
  const { control, handleSubmit, watch, setValue, reset, getValues } =
    useForm<ServiceFormData>({
      defaultValues: initialFormData,
      mode: "onChange",
    });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [categoryExpanded, setCategoryExpanded] = useState(false);
  const [teamMembersExpanded, setTeamMembersExpanded] = useState(false);
  const [locationsExpanded, setLocationsExpanded] = useState(false);

  const locationIds = watch("locationIds");
  const teamMemberIds = watch("teamMemberIds");
  const categoryId = watch("categoryId");
  const categoryName = watch("categoryName");
  const categoryColor = watch("categoryColor");

  // Validation helpers with translations
  const validateServiceName = (value: string): string | true => {
    const v = (value ?? '').trim();
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
      return text("addService.form.validation.description.maxLength", { max: 500 });
    }
    if (/<script|<iframe|javascript:|onclick|onerror|onload/i.test(v)) {
      return text("addService.form.validation.description.invalidChars");
    }
    return true;
  };

  // Controlled fields with validation
  const { field: nameField, fieldState: nameState } = useController<ServiceFormData, "name">({
    name: "name",
    control,
    rules: {
      validate: validateServiceName,
    }
  });

  const { field: priceField, fieldState: priceState } = useController<ServiceFormData, "price">({
    name: "price",
    control,
    rules: {
      required: text("addService.form.validation.price.required"),
      min: {
        value: 0,
        message: text("addService.form.validation.price.min")
      }
    }
  });

  const { field: durationField, fieldState: durationState } = useController<ServiceFormData, "duration">({
    name: "duration",
    control,
    rules: {
      required: text("addService.form.validation.duration.required"),
      min: {
        value: 1,
        message: text("addService.form.validation.duration.min")
      }
    }
  });

  const { field: descriptionField, fieldState: descriptionState } = useController<ServiceFormData, "description">({
    name: "description",
    control,
    rules: {
      validate: validateServiceDescription,
    },
  });

  // Fetch locations and team members when slider opens
  useEffect(() => {
    if (isOpen) {
      dispatch(listLocationsAction.request());
      dispatch(listTeamMembersAction.request());
    }
  }, [isOpen, dispatch]);

  // Reset form when slider closes
  useEffect(() => {
    if (!isOpen) {
      reset(initialFormData);
      setCategoryExpanded(false);
      setTeamMembersExpanded(false);
      setLocationsExpanded(false);
    }
  }, [isOpen, reset]);

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
      isActive,
      locationIds,
      teamMemberIds,
      categoryId,
      categoryName,
      categoryColor,
    } = getValues();
    const payload: CreateServicePayload = {
      name,
      price_amount_minor: price || 0, // Price is already in cents from PriceField
      duration,
      description,
      isActive,
      locations: locationIds.length > 0 ? locationIds : undefined,
      teamMembers: teamMemberIds.length > 0 ? teamMemberIds : undefined,
      category: categoryId
        ? { categoryId }
        : categoryName && categoryColor
        ? { categoryName, categoryColor }
        : undefined,
    };
    dispatch(createServicesAction.request(payload));
    setShowConfirmDialog(false);
    onClose();
    reset(initialFormData);
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
          />
        }
      >
        <form
          id="add-service-form"
          onSubmit={handleSubmit(onSubmit)}
          className="h-full flex flex-col cursor-default"
        >
          <div className="flex-1 overflow-y-auto p-6 pt-0 bg-surface">
            <div className="max-w-2xl mx-auto space-y-8 cursor-default">
              {/* Essential Fields */}
              <div className="space-y-0">
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
                    />

                    <TextareaField
                      value={descriptionField.value || ""}
                      onChange={descriptionField.onChange}
                      error={descriptionState.error?.message}
                      label={text("addService.form.description.label")}
                      placeholder={text("addService.form.description.placeholder")}
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
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground-1">
                      {text("addService.sections.pricingDuration")}
                    </h3>
                    <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                      {text("addService.sections.pricingDurationDescription")}
                    </p>
                  </div>

                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                      <PriceField
                        value={priceField.value || 0}
                        onChange={priceField.onChange}
                        error={priceState.error?.message}
                        label={text("addService.form.price.label")}
                        placeholder="0.00"
                        required
                        id="price"
                        min={0}
                        step={0.01}
                        icon={getCurrencyDisplay(businessCurrency).icon}
                        symbol={getCurrencyDisplay(businessCurrency).symbol}
                        iconPosition="left"
                        helpText={text("addService.form.price.helpText", { currency: businessCurrency.toUpperCase() })}
                        decimalPlaces={2}
                        currency={businessCurrency}
                        storageFormat="cents"
                      />

                      <NumberField
                        value={durationField.value || 0}
                        onChange={durationField.onChange}
                        error={durationState.error?.message}
                        label={text("addService.form.duration.label")}
                        placeholder="30"
                        required
                        id="duration"
                        min={1}
                        step={1}
                        icon={Clock}
                        iconPosition="left"
                        helpText="Duration in minutes"
                      />
                    </div>
                    <div className="rounded-md bg-info-100 border border-border-subtle p-3">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-foreground-2 dark:text-foreground-2 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">
                            {text("addService.form.currency.info")}
                          </p>
                          <p className="text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">
                            {text("addService.form.pricingNote")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional Fields Section */}
              <div className="space-y-5 pt-2">
                <div className="flex items-center gap-3 my-6">
                  <div className="h-px flex-1 bg-border-subtle"></div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground-3 dark:text-foreground-2 px-3 py-1.5 rounded-full bg-surface-hover/50 border border-border-subtle">
                    Optional
                  </span>
                  <div className="h-px flex-1 bg-border-subtle"></div>
                </div>

                {/* Locations Section */}
                <CollapsibleFormSection
                  icon={MapPin}
                  title="Locations"
                  description="Select locations where this service is available"
                  open={locationsExpanded}
                  onOpenChange={setLocationsExpanded}
                >
                <EntitySelector
                  value={locationIds}
                  onChange={(value) => setValue("locationIds", value as number[])}
                  options={allLocations.map((loc): EntityOption => ({
                    id: loc.id,
                    name: loc.name,
                    icon: MapPin,
                  }))}
                  label="Available Locations"
                  searchPlaceholder="Search locations..."
                  emptyMessage="No locations found."
                  emptyHelperText="If no locations are selected, service will be available at all locations"
                  addButtonLabel="Add Locations"
                  addMoreButtonLabel="Add More Locations"
                  icon={MapPin}
                />
              </CollapsibleFormSection>

                {/* Team Members Section */}
                <CollapsibleFormSection
                  icon={Users}
                  title="Team Members"
                  description="Select team members who can provide this service"
                  open={teamMembersExpanded}
                  onOpenChange={setTeamMembersExpanded}
                >
                <EntitySelector
                  value={teamMemberIds}
                  onChange={(value) => setValue("teamMemberIds", value as number[])}
                  options={allTeamMembers.map((member: any): EntityOption => ({
                    id: member.id,
                    name: `${member.firstName} ${member.lastName}`,
                    icon: Users,
                  }))}
                  label="Assigned Team Members"
                  searchPlaceholder="Search team members..."
                  emptyMessage="No team members found."
                  emptyHelperText="If no team members are selected, service will be available to all team members"
                  addButtonLabel="Add Team Members"
                  addMoreButtonLabel="Add More Team Members"
                  icon={Users}
                />
              </CollapsibleFormSection>

                {/* Category Section */}
                <CategorySection
                  categoryId={categoryId}
                  categoryName={categoryName}
                  categoryColor={categoryColor}
                  onCategoryIdChange={(value) => setValue("categoryId", value)}
                  onCategoryNameChange={(value) => setValue("categoryName", value)}
                  onCategoryColorChange={(value) => setValue("categoryColor", value)}
                  expanded={categoryExpanded}
                  onExpandedChange={setCategoryExpanded}
                  mode="add"
                />
              </div>

              {/* Service Settings Section */}
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground-1">
                    {text("addService.sections.settings")}
                  </h3>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                    Control service availability
                  </p>
                </div>

                <div className="flex items-center justify-between p-5 rounded-lg border border-border-subtle bg-surface-hover/30 transition-colors duration-200">
                  <div className="space-y-1.5 flex-1 pr-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Label className="text-base font-medium cursor-pointer text-foreground-1">
                        {text("addService.form.status.label")}
                      </Label>
                      {watch("isActive") && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success-bg text-success border border-success-border">
                          <Sparkles className="h-3 w-3" />
                          Active
                        </span>
                      )}
                      {!watch("isActive") && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface border border-border text-foreground-3 dark:text-foreground-2">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">
                      {watch("isActive") === true
                        ? text("addService.form.status.activeDescription")
                        : text("addService.form.status.inactiveDescription")}
                    </p>
                  </div>
                  <Switch
                    checked={watch("isActive") === true}
                    onCheckedChange={(checked) =>
                      setValue("isActive", checked ? true : false)
                    }
                    className="ml-4 flex-shrink-0"
                  />
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
        title={text("addService.confirmDialog.title")}
        description={text("addService.confirmDialog.description", {
          name: getValues("name"),
          price: priceFromStorage(getValues("price") || 0, businessCurrency).toFixed(2),
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
