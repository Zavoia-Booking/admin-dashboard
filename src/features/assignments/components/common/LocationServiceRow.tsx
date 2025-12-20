import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Clock,
  Edit2,
  AlertCircle,
  ChevronRight,
  Settings2,
  ArrowRight,
} from "lucide-react";
import { Badge } from "../../../../shared/components/ui/badge";
import { Button } from "../../../../shared/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../shared/components/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "../../../../shared/components/ui/drawer";
import { Input } from "../../../../shared/components/ui/input";
import { Label } from "../../../../shared/components/ui/label";
import { PriceField } from "../../../../shared/components/forms/fields/PriceField";
import { getCurrencyDisplay } from "../../../../shared/utils/currency";
import { getReadableTextColor } from "../../../../shared/utils/color";
import { useIsMobile } from "../../../../shared/hooks/use-mobile";
import { DashedDivider } from "../../../../shared/components/common/DashedDivider";
import { cn } from "../../../../shared/lib/utils";
import { ServiceStaffOverridesModal } from "./ServiceStaffOverridesModal";
import type { LocationService } from "../../types";

interface LocationServiceRowProps {
  service: LocationService;
  onSaveOverride: (
    serviceId: number,
    customPrice: number | null,
    customDuration: number | null
  ) => void;
  currency?: string;
  locationName?: string;
  locationId?: number;
  onSaveStart?: () => void;
}

export function LocationServiceRow({
  service,
  onSaveOverride,
  currency = "USD",
  locationName,
  locationId,
  onSaveStart,
}: LocationServiceRowProps) {
  const { t } = useTranslation("assignments");
  const { t: tServices } = useTranslation("services");
  const isMobile = useIsMobile();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTeamMembersPopoverOpen, setIsTeamMembersPopoverOpen] = useState(false);

  // Local state for popover form
  const [localPrice, setLocalPrice] = useState<number>(0);
  const [localDuration, setLocalDuration] = useState<string>("");
  const [initialPrice, setInitialPrice] = useState<number | null>(null);
  const [initialDuration, setInitialDuration] = useState<number | null>(null);
  const [isDurationFocused, setIsDurationFocused] = useState(false);
  const [localDurationInput, setLocalDurationInput] = useState<string>("");
  const [durationError, setDurationError] = useState<string | null>(null);

  const currencyDisplay = getCurrencyDisplay(currency);
  const CurrencyIcon = currencyDisplay.icon;

  // Determine if location has overrides
  const hasLocationOverride =
    service.customPrice !== null || service.customDuration !== null;

  // Compute effective values (custom or default)
  const effectivePrice = service.customPrice ?? service.defaultPrice;
  const effectiveDisplayPrice = effectivePrice / 100;
  const effectiveDuration = service.customDuration ?? service.defaultDuration;

  const categoryBg = service.category?.color || undefined;
  const categoryTextColor = categoryBg
    ? getReadableTextColor(categoryBg)
    : undefined;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ""}`;
    }
    return `${mins}m`;
  };

  // Handle popover open - initialize local state
  const handlePopoverOpenChange = (open: boolean) => {
    if (open) {
      const priceValue = service.customPrice ?? service.defaultPrice;
      const durationValue = service.customDuration ?? service.defaultDuration;

      setLocalPrice(priceValue);
      setLocalDuration(durationValue.toString());
      setLocalDurationInput(durationValue.toString());
      setInitialPrice(service.customPrice);
      setInitialDuration(service.customDuration);
      setDurationError(null);
      setIsDurationFocused(false);
    }
    setIsEditOpen(open);
  };

  // Save overrides directly to backend
  const handleSave = () => {
    // Validate duration before saving
    const durationValue = parseInt(localDuration, 10);
    if (isNaN(durationValue) || durationValue < 1) {
      setDurationError(tServices("addService.form.validation.duration.min"));
      return;
    }

    const newDuration =
      durationValue === service.defaultDuration ? null : durationValue;

    // If price equals default, set to null (revert)
    const newPrice = localPrice === service.defaultPrice ? null : localPrice;

    // Close popover immediately, then save to backend
    setIsEditOpen(false);
    onSaveOverride(service.serviceId, newPrice, newDuration);
  };

  // Revert to defaults (only updates local state, doesn't save)
  const handleRevert = () => {
    setLocalPrice(service.defaultPrice);
    setLocalDuration(service.defaultDuration.toString());
    setLocalDurationInput(service.defaultDuration.toString());
    setDurationError(null);
  };

  // Get current duration value for display
  const currentDurationValue =
    parseInt(localDuration, 10) || service.defaultDuration;

  // Get display value for duration input (show local input when focused, otherwise show current value)
  const durationDisplayValue = isDurationFocused
    ? localDurationInput
    : currentDurationValue.toString();

  // Event handlers
  const handlePriceChange = (val: number | string) => {
    setLocalPrice(typeof val === "number" ? val : Number(val) || 0);
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Only allow digits
    if (inputValue === "" || /^\d+$/.test(inputValue)) {
      setLocalDurationInput(inputValue);
      setLocalDuration(inputValue);
      // Clear error when user types
      setDurationError(null);
    }
  };

  const handleDurationFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsDurationFocused(true);
    setLocalDurationInput(currentDurationValue.toString());
    e.target.select();
  };

  const handleDurationBlur = () => {
    setIsDurationFocused(false);

    // Validate on blur
    if (localDurationInput === "0") {
      setDurationError(tServices("addService.form.validation.duration.min"));
      setLocalDuration(service.defaultDuration.toString());
      setLocalDurationInput(service.defaultDuration.toString());
      return;
    }

    // If empty or invalid, revert to default
    if (localDurationInput === "" || isNaN(parseInt(localDurationInput, 10))) {
      setLocalDuration(service.defaultDuration.toString());
      setLocalDurationInput(service.defaultDuration.toString());
      setDurationError(null);
      return;
    }

    // Final validation - ensure value is at least 1
    const finalValue = parseInt(localDurationInput, 10);
    if (finalValue < 1) {
      setDurationError(tServices("addService.form.validation.duration.min"));
      setLocalDuration(service.defaultDuration.toString());
      setLocalDurationInput(service.defaultDuration.toString());
      return;
    }

    // Update local duration
    setLocalDuration(localDurationInput);
    setLocalDurationInput("");
    setDurationError(null);
  };

  const handleDurationChipClick = (minutes: number) => {
    setLocalDurationInput(minutes.toString());
    setLocalDuration(minutes.toString());
    setDurationError(null);
  };

  // Check if local values differ from initial
  const hasLocalChanges = (() => {
    const initialPriceValue = initialPrice ?? service.defaultPrice;
    const initialDurationValue = initialDuration ?? service.defaultDuration;
    const currentDurationValue = parseInt(localDuration, 10) || 0;
    return (
      localPrice !== initialPriceValue ||
      currentDurationValue !== initialDurationValue
    );
  })();

  // Render form content
  const renderFormContent = () => (
    <>
      <div className="space-y-1.5 mb-2">
        <h4 className="text-lg font-semibold text-foreground-1 mb-1">
          {service.serviceName}
        </h4>
        <div className="text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">
          <p>
            {t("page.locationService.popover.helperText", {
              locationName:
                locationName || t("page.locationService.popover.thisLocation"),
            })}
          </p>
        </div>
      </div>
      <DashedDivider
        marginTop="mt-0"
        className="mb-4"
        paddingTop="pt-0"
        dashPattern="1 1"
      />

      <div className="space-y-3 mb-1">
        {/* Price */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between min-h-6">
            <Label
              htmlFor={`loc-price-${service.serviceId}`}
              className="text-xs font-medium"
            >
              {t("page.locationService.fields.price")}
            </Label>
            {localPrice !== service.defaultPrice && (
              <div className="flex items-center w-fit rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-info/20 text-foreground-3 dark:text-foreground-1 dark:bg-info/60 border border-border dark:border-border-subtle">
                {t("page.locationService.fields.serviceDefault")}{" "}
                <span className="ml-1 flex items-center gap-0.5 text-foreground-2 dark:text-foreground-1">
                  {CurrencyIcon ? (
                    <CurrencyIcon className="h-2.5 w-2.5 -mr-0.5" />
                  ) : (
                    <span>{currencyDisplay.symbol}</span>
                  )}
                  <span>{service.defaultDisplayPrice.toFixed(2)}</span>
                </span>
              </div>
            )}
          </div>
          <PriceField
            id={`loc-price-${service.serviceId}`}
            label=""
            value={localPrice}
            onChange={handlePriceChange}
            currency={currency}
            storageFormat="cents"
            icon={currencyDisplay.icon}
            symbol={currencyDisplay.symbol}
            hideInlineError={true}
            placeholder="0.00"
            className="text-sm"
          />
        </div>

        {/* Duration */}
        <div className="space-y-1.5 mt-8 mb-0">
          <div className="flex items-center justify-between min-h-6">
            <Label
              htmlFor={`loc-duration-${service.serviceId}`}
              className="text-xs font-medium"
            >
              {t("page.locationService.fields.duration")}
            </Label>
            {currentDurationValue !== service.defaultDuration && (
              <div className="flex items-center w-fit rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-info/20 dark:bg-info/60 text-foreground-3 dark:text-foreground-1 border border-border dark:border-border-subtle">
                {t("page.locationService.fields.serviceDefault")}{" "}
                <span className="ml-1 text-foreground-2 dark:text-foreground-1">
                  {formatDuration(service.defaultDuration)}
                </span>
              </div>
            )}
          </div>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Clock className="h-4 w-4 text-foreground-3 dark:text-foreground-2" />
            </div>
            <Input
              id={`loc-duration-${service.serviceId}`}
              type="text"
              inputMode="numeric"
              placeholder={service.defaultDuration?.toString() || "0"}
              value={durationDisplayValue}
              onChange={handleDurationChange}
              onFocus={handleDurationFocus}
              onBlur={handleDurationBlur}
              className={cn(
                "h-12 text-sm flex-1 !pl-10 !pr-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all focus-visible:ring-2 focus-visible:ring-offset-0",
                durationError
                  ? "border-destructive bg-error-bg focus-visible:ring-error/20 dark:focus-visible:ring-error/40"
                  : "border-border dark:border-border-subtle hover:border-border-strong focus:border-focus focus-visible:ring-focus/50"
              )}
              aria-invalid={!!durationError}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <span className="text-sm text-foreground-3 dark:text-foreground-2">
                {t("page.locationService.fields.minSuffix")}
              </span>
            </div>
          </div>
          {/* Quick duration chips */}
          <div className="flex items-center gap-2 pl-0">
            {[15, 30, 45, 60, 120].map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => handleDurationChipClick(minutes)}
                className={`flex-1 cursor-pointer px-2.5 py-1 text-xs font-medium rounded-md transition-colors duration-200 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/60 focus-visible:ring-offset-0 ${
                  currentDurationValue === minutes
                    ? "bg-primary text-white"
                    : "bg-surface hover:bg-surface-hover text-foreground-3 dark:text-foreground-2 border border-border"
                }`}
              >
                {minutes}m
              </button>
            ))}
          </div>
          {/* Error message */}
          <div className="h-5">
            {durationError && (
              <p
                className="flex items-center gap-1.5 text-xs text-destructive"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{durationError}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-surface shrink-0">
        <DashedDivider
          marginTop="mt-0"
          className="mb-0"
          paddingTop="pt-0"
          dashPattern="1 1"
        />
        <div className="flex justify-between gap-2 mt-0 pt-6">
          <Button
            variant="outline"
            rounded="full"
            size="sm"
            onClick={handleRevert}
            className="w-32 h-11 cursor-pointer"
            disabled={!hasLocationOverride}
          >
            {t("page.locationService.buttons.revert")}
          </Button>
          <Button
            rounded="full"
            size="sm"
            onClick={handleSave}
            className="group flex-1 h-11 cursor-pointer"
            disabled={!hasLocalChanges || !!durationError}
          >
            {t("page.locationService.buttons.save")}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
          </Button>
        </div>
      </div>
    </>
  );

  // Main row content - redesigned with two zones
  return (
    <div
      className={cn(
        "group flex items-start rounded-lg gap-4 px-4 py-4 md:py-3 pt-0 w-full border border-border-strong md:border-border bg-white dark:bg-surface hover:border-border-strong",
        hasLocationOverride &&
          "border-l-3 border-l-primary/60 md:border-l-primary/60 hover:border-l-primary/80"
      )}
    >
      {/* Zone 1: Identity & Context (Left Side) */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Row 1: Service Name + Edit Button */}
        <div className="flex items-center justify-between mb-0 gap-2 md:gap-48 min-w-0">
          <span className="font-medium text-sm text-foreground-1 truncate">
            {service.serviceName}
          </span>

          {/* Edit button - aligned with service name */}
          {isMobile ? (
            <Drawer
              open={isEditOpen}
              onOpenChange={handlePopoverOpenChange}
              autoFocus
            >
              <DrawerTrigger asChild>
                <Button
                  variant="ghost"
                  rounded="full"
                  size="sm"
                  className="shrink-0 !min-h-0 h-7 !min-w-26 !px-2 mt-2 mb-2 border border-border-strong text-foreground-1 md:dark:text-foreground-2 text-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-xs text-foreground-1">
                    {t("page.locationService.buttons.customize")}
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </DrawerTrigger>
              <DrawerContent
                className="h-auto max-h-[85vh] flex flex-col bg-popover text-popover-foreground !z-80"
                overlayClassName="!z-80"
              >
                <DrawerTitle className="sr-only">
                  {service.serviceName}
                </DrawerTitle>
                <DrawerDescription className="sr-only">
                  {t("page.locationService.popover.helperText")}{" "}
                  {service.serviceName}
                </DrawerDescription>
                <div className="p-4 pt-1 md:pt-4 space-y-4">{renderFormContent()}</div>
              </DrawerContent>
            </Drawer>
          ) : (
            <Popover open={isEditOpen} onOpenChange={handlePopoverOpenChange}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  rounded="full"
                  size="sm"
                  className="shrink-0 !min-h-0 h-7 !min-w-26 !px-2 mt-2 mb-2 border border-border group-hover:border-border-strong text-foreground-3 dark:text-foreground-2 hover:text-primary dark:hover:text-primary dark:group-hover:text-primary group-hover:text-primary group-hover:bg-info-100/20 dark:hover:bg-muted-foreground/10 dark:group-hover:bg-muted-foreground/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-xs text-foreground-3 group-hover:text-foreground-1">
                    {t("page.locationService.buttons.customize")}
                  </span>
                  <ChevronRight className="h-3 w-3 pt-0.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-72 p-4 relative"
                align="end"
                onClick={(e) => e.stopPropagation()}
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <div className="space-y-4">{renderFormContent()}</div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Row 2: Category Pill + Price & Duration */}
        <div
          className={cn(
            "flex items-center justify-between gap-2",
            hasLocationOverride && "md:mb-2 mb-3"
          )}
        >
          <div>
            {service.category?.name && (
              <span
                className="inline-flex items-center max-w-28 rounded-full px-2 py-0.5 text-[10px] font-medium border border-border-subtle overflow-hidden"
                style={{
                  backgroundColor: categoryBg,
                  borderColor: categoryBg || undefined,
                  color: categoryTextColor,
                }}
              >
                <span className="truncate">{service.category.name}</span>
              </span>
            )}
          </div>

          {/* Price & Duration - Big, bold, easy to read */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center justify-start gap-0.5 min-w-18">
              {CurrencyIcon ? (
                <CurrencyIcon className="h-3 w-3 text-foreground-1" />
              ) : (
                <span className="text-sm text-foreground-1">
                  {currencyDisplay.symbol}
                </span>
              )}
              <span className="text-sm font-semibold text-foreground-1">
                {effectiveDisplayPrice.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 min-w-20">
              <Clock className="h-3 w-3 text-foreground-1" />
              <span className="text-sm font-semibold text-foreground-1">
                {formatDuration(effectiveDuration)}
              </span>
            </div>
          </div>
        </div>

        {/* Row 3: Default values (only if custom) */}
        {hasLocationOverride && (
          <div className="">
            <DashedDivider
              marginTop="mt-0"
              className="mb-2"
              paddingTop="pt-0"
              dashPattern="1 1"
            />
            <div className="flex items-center justify-between mt-4 md:mt-0">
              <p className="text-xs flex text-foreground-3 dark:text-foreground-2">
                <span className="font-medium">
                  {t("page.locationService.fields.defaultLabel")}:
                </span>{" "}
                <span className="text-foreground-3 dark:text-foreground-2 -mr-0.5 ml-1 flex items-center">
                  {CurrencyIcon ? (
                    <CurrencyIcon className="h-3 w-3" />
                  ) : (
                    <span className="mr-0.5">{currencyDisplay.symbol}</span>
                  )}
                </span>
                <span className="text-foreground-3 mr-1.5 dark:text-foreground-2">
                  {service.defaultDisplayPrice.toFixed(2)}
                </span>{" "}
                •{" "}
                <span className="text-foreground-3 ml-0.5 dark:text-foreground-2">
                  {formatDuration(service.defaultDuration)}
                </span>
              </p>
              <Badge
                variant="secondary"
                className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1.5 bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800 shrink-0"
              >
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <span className="text-neutral-900 dark:text-foreground-1">
                  {t("page.locationService.badge.custom")}
                </span>
              </Badge>
            </div>
          </div>
        )}

        {/* Row 4: Team member overrides info */}
        {service.staffWithOverrides > 0 && locationId && (
          <div className="mt-4 md:mt-2 group">
            <Button
              variant="ghost"
              rounded="full"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsTeamMembersPopoverOpen(true);
              }}
              className="h-auto bg-info-100 dark:bg-surface dark:border text-xs !min-h-0 h-6 py-3.5 text-primary md:text-foreground-1 md:text-foreground-3 md:dark:text-foreground-2 md:hover:bg-info-100 dark:hover:bg-surface group-hover:bg-info-100 dark:group-hover:bg-surface dark:group-hover:border-border-strong dark:group-hover:text-primary group-hover:text-primary hover:text-primary"
            >
              <span className="text-xs text-foreground-1 md:text-foreground-3 group-hover:text-foreground-1 md:dark:text-foreground-2 dark:group-hover:text-foreground-1">
                {t("page.locationService.teamMemberOverrides", {
                  count: service.staffWithOverrides,
                })}
              </span>
                <ChevronRight className="h-3 w-3 pt-0.5" />
            </Button>

            <ServiceStaffOverridesModal
              isOpen={isTeamMembersPopoverOpen}
              onClose={() => setIsTeamMembersPopoverOpen(false)}
              locationId={locationId}
              serviceId={service.serviceId}
              serviceName={service.serviceName}
              staffWithOverrides={service.staffWithOverrides}
              currency={currency}
              onSaveStart={onSaveStart}
              effectivePrice={effectivePrice}
              effectiveDuration={effectiveDuration}
            />
          </div>
        )}
      </div>
    </div>
  );
}
