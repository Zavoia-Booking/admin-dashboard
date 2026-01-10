import { useState, useEffect, useRef } from "react";
import {
  Clock,
  AlertCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Switch } from "../../../../shared/components/ui/switch";
import { Badge } from "../../../../shared/components/ui/badge";
import { Input } from "../../../../shared/components/ui/input";
import { Label } from "../../../../shared/components/ui/label";
import { PriceField } from "../../../../shared/components/forms/fields/PriceField";
import { highlightMatches } from "../../../../shared/utils/highlight";
import { priceFromStorage } from "../../../../shared/utils/currency";
import { useIsMobile } from "../../../../shared/hooks/use-mobile";
import { cn } from "../../../../shared/lib/utils";
import type { StaffService } from "../../types";
import type { CurrencyDisplay } from "../../../../shared/components/common/ManageServicesSheet/types";

interface StaffServiceItemProps {
  service: StaffService;
  searchTerm: string;
  currencyDisplay: CurrencyDisplay;
  currency: string;
  onToggleCanPerform: (serviceId: number, canPerform: boolean) => void;
  onSetCustomPrice: (serviceId: number, price: number | null) => void;
  onSetCustomDuration: (serviceId: number, duration: number | null) => void;
  onErrorChange?: (serviceId: number, hasError: boolean) => void;
}

export function StaffServiceItem({
  service,
  searchTerm,
  currencyDisplay,
  currency,
  onToggleCanPerform,
  onSetCustomPrice,
  onSetCustomDuration,
  onErrorChange,
}: StaffServiceItemProps) {
  const { t } = useTranslation("assignments");
  const { t: tServices } = useTranslation("services");
  const isMobile = useIsMobile();
  const [isDurationFocused, setIsDurationFocused] = useState(false);
  const [localDurationInput, setLocalDurationInput] = useState<string>("");
  const [durationError, setDurationError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const CurrencyIcon = currencyDisplay.icon;
  const expandedContentRef = useRef<HTMLDivElement>(null);
  const onErrorChangeRef = useRef(onErrorChange);
  const prevErrorRef = useRef<string | null>(null);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ""}`;
    }
    return `${mins}m`;
  };

  // Get the current duration value to display
  const currentDurationValue =
    service.customDuration ?? service.inheritedDuration;

  // Get display value for duration input (show local input when focused, otherwise show current value)
  const durationDisplayValue = isDurationFocused
    ? localDurationInput
    : currentDurationValue.toString();

  // Get effective price and duration for display
  const effectiveDisplayPrice =
    service.customPrice !== null
      ? priceFromStorage(service.customPrice, currency)
      : service.inheritedDisplayPrice;
  const effectiveDuration = currentDurationValue;

  // Check if price/duration differ from defaults
  const hasCustomPrice = service.customPrice !== null;
  const hasCustomDuration = service.customDuration !== null;
  const hasAnyCustom = hasCustomPrice || hasCustomDuration;

  // Update ref when callback changes
  useEffect(() => {
    onErrorChangeRef.current = onErrorChange;
  }, [onErrorChange]);

  // Notify parent of error state changes (only when error state actually changes)
  useEffect(() => {
    const hasError = !!durationError;
    const prevHasError = !!prevErrorRef.current;

    // Only call callback if error state actually changed
    if (hasError !== prevHasError && onErrorChangeRef.current) {
      onErrorChangeRef.current(service.serviceId, hasError);
    }

    prevErrorRef.current = durationError;
  }, [durationError, service.serviceId]);

  useEffect(() => {
    if (!service.canPerform) return;

    const el = expandedContentRef.current;
    if (!el) return;

    const innerContent = el.firstElementChild as HTMLElement;
    if (!innerContent) return;

    if (isExpanded) {
      // Expanding: 0 → measured height
      // First, get the target height
      const fullHeight = innerContent.scrollHeight;

      // Set to 0 initially (in case it wasn't)
      el.style.height = "0px";

      // Force a reflow to ensure the 0 height is applied
      el.offsetHeight;

      // Now animate to the full height
      requestAnimationFrame(() => {
        el.style.height = `${fullHeight}px`;
      });
    } else {
      // Collapsing: measured height → 0
      // First set the current height explicitly
      const currentHeight = innerContent.scrollHeight;
      el.style.height = `${currentHeight}px`;

      // Force a reflow
      el.offsetHeight;

      // Now animate to 0
      requestAnimationFrame(() => {
        el.style.height = "0px";
      });
    }
  }, [isExpanded, service.canPerform]);

  // Event handlers
  const handleToggleCanPerform = (checked: boolean) => {
    onToggleCanPerform(service.serviceId, checked);
  };

  const handlePriceChange = (val: number | string) => {
    onSetCustomPrice(
      service.serviceId,
      typeof val === "number" ? val : Number(val) || null
    );
  };

  const handlePriceRevert = () => {
    onSetCustomPrice(service.serviceId, null);
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Only allow digits
    if (inputValue === "" || /^\d+$/.test(inputValue)) {
      setLocalDurationInput(inputValue);
      // Clear error when user types
      setDurationError(null);

      // If empty, set to null (revert to inherited)
      if (inputValue === "") {
        onSetCustomDuration(service.serviceId, null);
        return;
      }

      // Parse to integer
      const numValue = parseInt(inputValue, 10);

      // Only validate if it's a complete value
      if (numValue > 0) {
        // If the value equals inherited, set to null to revert
        if (numValue === service.inheritedDuration) {
          onSetCustomDuration(service.serviceId, null);
        } else {
          onSetCustomDuration(service.serviceId, numValue);
        }
      }
    }
  };

  const handleDurationFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsDurationFocused(true);
    setLocalDurationInput(currentDurationValue.toString());
    e.target.select();
  };

  const handleDurationBlur = () => {
    setIsDurationFocused(false);

    // Validate on blur - check if final value is 0
    if (localDurationInput === "0") {
      setDurationError(tServices("addService.form.validation.duration.min"));
      // Revert to inherited value if user tried to set 0
      onSetCustomDuration(service.serviceId, null);
      setLocalDurationInput("");
      return;
    }

    // If empty or invalid, revert to inherited
    if (localDurationInput === "" || isNaN(parseInt(localDurationInput, 10))) {
      onSetCustomDuration(service.serviceId, null);
      setLocalDurationInput("");
      setDurationError(null);
      return;
    }

    // Final validation - ensure value is at least 1
    const finalValue = parseInt(localDurationInput, 10);
    if (finalValue < 1) {
      setDurationError(tServices("addService.form.validation.duration.min"));
      onSetCustomDuration(service.serviceId, null);
      setLocalDurationInput("");
      return;
    }

    // If the value equals inherited, set to null to revert
    if (finalValue === service.inheritedDuration) {
      onSetCustomDuration(service.serviceId, null);
    } else {
      onSetCustomDuration(service.serviceId, finalValue);
    }

    // Clean up local state
    setLocalDurationInput("");
    setDurationError(null);
  };

  const handleDurationChipClick = (minutes: number) => {
    setLocalDurationInput(minutes.toString());
    setDurationError(null);
    onSetCustomDuration(service.serviceId, minutes);
  };

  const handleDurationRevert = () => {
    onSetCustomDuration(service.serviceId, null);
  };

  // Handle row click to toggle expand
  const handleRowClick = (e: React.MouseEvent) => {
    // Don't expand if clicking on switch or restore buttons
    const target = e.target as HTMLElement;
    if (
      target.closest('button[type="button"]') ||
      target.closest('[role="switch"]') ||
      target.closest(".restore-icon-button")
    ) {
      return;
    }

    if (service.canPerform) {
      setIsExpanded(!isExpanded);
    }
  };

  // Desktop collapsed row
  const renderDesktopCollapsedRow = () => (
    <div
      className={cn(
        "flex items-center gap-4 px-2 py-4 select-none group",
        service.canPerform &&
          "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 rounded-lg"
      )}
      onClick={handleRowClick}
      tabIndex={service.canPerform ? 0 : undefined}
      onKeyDown={(e) => {
        if (service.canPerform && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          handleRowClick(e as any);
        }
      }}
    >
      {/* Toggle switch */}
      <Switch
        className="cursor-pointer shrink-0"
        checked={service.canPerform}
        onCheckedChange={handleToggleCanPerform}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Service name */}
      <div className="font-semibold text-base text-foreground-1 truncate flex-1">
        <div
          className={`${isExpanded ? "max-w-full" : "max-w-3/4"} truncate`}
        >
          {highlightMatches(service.serviceName, searchTerm)}
        </div>
      </div>

      {/* Custom badge */}
      {service.isCustom && (
        <Badge
          variant="secondary"
          className="text-xs cursor-pointer px-2 py-0.5 rounded-full font-medium flex items-center gap-1.5 bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800 shrink-0"
        >
          <div className="h-2 w-2 rounded-full bg-purple-500" />
          <span className="text-neutral-900 dark:text-foreground-1">
            {t("page.locationTeamMembers.badge.custom")}
          </span>
        </Badge>
      )}

      {/* One-line summary: price • duration */}
      {!isExpanded && service.canPerform && (
        <div
          className={cn("text-sm shrink-0 flex items-center", hasAnyCustom)}
        >
          <div className="min-w-18 flex items-center">
            {CurrencyIcon ? (
              <CurrencyIcon className="h-3 w-3 mr-0.5 text-foreground-3 dark:text-foreground-2" />
            ) : (
              <span className="mr-0.5 font-semibold text-foreground-3 dark:text-foreground-2">{currencyDisplay.symbol}</span>
            )}
            <span className="mr-2.5 font-semibold text-foreground-3 dark:text-foreground-2">{effectiveDisplayPrice.toFixed(2)}</span>
          </div>
          <Clock className="h-3 w-3 ml-1 text-foreground-3 dark:text-foreground-2" />
          <span className="ml-1 min-w-10 font-semibold text-foreground-3 dark:text-foreground-2">
            {formatDuration(effectiveDuration)}
          </span>
        </div>
      )}

      {/* Expand/collapse icon */}
      {service.canPerform && (
        <div className="shrink-0 flex items-center gap-2">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-foreground-3 dark:text-foreground-2 group-hover:text-primary group-focus-visible:text-primary transition-colors" />
          ) : (
            <ChevronDown className="h-4 w-4 text-foreground-3 dark:text-foreground-2 group-hover:text-primary group-focus-visible:text-primary transition-colors" />
          )}
        </div>
      )}
    </div>
  );

  // Mobile collapsed row
  const renderMobileCollapsedRow = () => (
    <div
      className={cn(
        "flex flex-col gap-3 px-3 py-3 select-none group",
        service.canPerform &&
          "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 rounded-lg"
      )}
      onClick={handleRowClick}
      tabIndex={service.canPerform ? 0 : undefined}
      onKeyDown={(e) => {
        if (service.canPerform && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          handleRowClick(e as any);
        }
      }}
    >
      {/* First row: Switch | Service name | ChevronDown */}
      <div className="flex items-center gap-3">
        <Switch
          className="cursor-pointer shrink-0"
          checked={service.canPerform}
          onCheckedChange={handleToggleCanPerform}
          onClick={(e) => e.stopPropagation()}
        />

        <div className="font-semibold text-base text-foreground-1 truncate flex-1">
          {highlightMatches(service.serviceName, searchTerm)}
        </div>

        {service.canPerform && (
          <div className="shrink-0 flex items-center">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-foreground-3 dark:text-foreground-2 group-hover:text-primary group-focus-visible:text-primary transition-colors" />
            ) : (
              <ChevronDown className="h-4 w-4 text-foreground-3 dark:text-foreground-2 group-hover:text-primary group-focus-visible:text-primary transition-colors" />
            )}
          </div>
        )}
      </div>

      {/* Second row: Custom badge | Price | Duration */}
      {!isExpanded && service.canPerform && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
          <div className="flex items-center gap-1">
            {CurrencyIcon ? (
              <CurrencyIcon className="h-3 w-3 text-foreground-3 dark:text-foreground-2" />
            ) : (
              <span className="text-sm font-semibold text-foreground-3 dark:text-foreground-2">{currencyDisplay.symbol}</span>
            )}
            <span className="text-sm font-semibold text-foreground-3 dark:text-foreground-2">{effectiveDisplayPrice.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-foreground-3 dark:text-foreground-2" />
            <span className="text-sm font-semibold text-foreground-3 dark:text-foreground-2">
              {formatDuration(effectiveDuration)}
            </span>
          </div>
          </div>
          {service.isCustom && (
            <Badge
              variant="secondary"
              className="text-xs cursor-pointer px-2 py-0.5 rounded-full font-medium flex items-center gap-1.5 bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800 shrink-0"
            >
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="text-neutral-900 dark:text-foreground-1">
                {t("page.locationTeamMembers.badge.custom")}
              </span>
            </Badge>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        "rounded-lg border",
        service.canPerform
          ? "border-border bg-white dark:bg-surface hover:border-border-strong"
          : "border-border bg-surface dark:bg-surface opacity-80 hover:border-border-strong"
      )}
    >
      {/* Collapsed row - desktop or mobile */}
      {isMobile ? renderMobileCollapsedRow() : renderDesktopCollapsedRow()}

      {/* FIXED: Expanded content with proper CSS transition */}
      {service.canPerform && (
        <div
          ref={expandedContentRef}
          className={cn(
            "overflow-hidden transition-all duration-200 ease-in-out",
            !isExpanded && "h-0"
          )}
          style={isExpanded ? undefined : { height: 0 }}
        >
          <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
            {/* Pricing controls */}
            <div className="grid grid-cols-1 gap-3">
              {/* Price */}
              <div className="space-y-1.5 border-r border-border pr-2 relative">
                <div className="flex items-center min-h-6 justify-between">
                  <Label className="text-xs font-medium">
                    {t("page.manageTeamMemberDrawer.fields.price")}
                  </Label>
                  {hasCustomPrice && (
                    <div className="flex items-center w-fit rounded-full cursor-default px-2.5 py-0.5 text-[11px] font-medium bg-info/20 text-foreground-3 dark:text-foreground-1 dark:bg-info/60 border border-border dark:border-border-subtle">
                      {t("page.locationService.fields.serviceDefault")}{" "}
                      <span className="ml-1 flex items-center gap-0.5 text-foreground-2 dark:text-foreground-1">
                        {CurrencyIcon ? (
                          <CurrencyIcon className="h-2.5 w-2.5 -mt-0.5" />
                        ) : (
                          <span>{currencyDisplay.symbol}</span>
                        )}
                        <span>{service.inheritedDisplayPrice.toFixed(2)}</span>
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-between">
                  <PriceField
                    value={service.customPrice ?? service.inheritedPrice}
                    onChange={handlePriceChange}
                    currency={currency}
                    storageFormat="cents"
                    icon={currencyDisplay.icon}
                    symbol={currencyDisplay.symbol}
                    hideInlineError
                    className="text-sm"
                  />
                  {hasCustomPrice ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePriceRevert();
                      }}
                      className="restore-icon-button !min-h-0 h-fit flex items-center gap-1 px-2 py-2 pt-4 rounded cursor-pointer z-10 group focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/60 focus-visible:ring-offset-0"
                    >
                      <span className="text-sm text-foreground-3 dark:text-foreground-2 group-hover:text-foreground-1">
                        {t("page.manageTeamMemberDrawer.buttons.revert")}
                      </span>
                      <RotateCcw className="h-3.5 w-3.5 text-primary" />
                    </button>
                  ) : (
                    <div className=" cursor-default !min-h-0 h-fit flex items-center gap-1.5 px-2 py-2 pt-4 z-10">
                      <Info className="h-3 w-3 text-foreground-3 dark:text-foreground-2" />
                      <span className="text-xs text-foreground-3 dark:text-foreground-2">
                        {t(
                          "page.manageTeamMemberDrawer.fields.usingLocationDefault"
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-1.5 min-h-46">
                <div className="flex items-center min-h-6 justify-between">
                  <Label className="text-xs font-medium">
                    {t("page.manageTeamMemberDrawer.fields.duration")}
                  </Label>
                  {hasCustomDuration && (
                    <div className="flex items-center w-fit cursor-default rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-info/20 dark:bg-info/60 text-foreground-3 dark:text-foreground-1 border border-border dark:border-border-subtle">
                      {t("page.locationService.fields.serviceDefault")}{" "}
                      <span className="ml-1 text-foreground-2 dark:text-foreground-1">
                        {formatDuration(service.inheritedDuration)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Clock className="h-4 w-4 text-foreground-3 dark:text-foreground-2" />
                  </div>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder={service.inheritedDuration?.toString() || "0"}
                    value={durationDisplayValue}
                    onChange={handleDurationChange}
                    onFocus={handleDurationFocus}
                    onBlur={handleDurationBlur}
                    className={cn(
                      "h-12 text-sm !pl-10",
                      hasCustomDuration ? "!pr-10" : "!pr-20",
                      "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus-visible:ring-2 focus-visible:ring-offset-0",
                      durationError
                        ? "border-destructive bg-error-bg focus-visible:ring-error/20 dark:focus-visible:ring-error/40"
                        : "border-border dark:border-border-subtle hover:border-border-strong focus:border-focus focus-visible:ring-focus/50"
                    )}
                    aria-invalid={!!durationError}
                  />
                </div>

                {/* Error message */}
                <p
                  className="flex items-center gap-1.5 h-4 text-xs text-destructive"
                  role="alert"
                  aria-live="polite"
                >
                  {durationError && <AlertCircle className="h-3.5 w-3.5" />}
                  {durationError && <span>{durationError}</span>}
                </p>

                {/* Quick duration chips */}
                <div className="flex items-center gap-2 pl-0">
                  {[15, 30, 45, 60, 120].map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDurationChipClick(minutes);
                      }}
                      className={`flex-1 cursor-pointer px-2.5 py-1 text-xs font-medium rounded-md duration-200 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/60 focus-visible:ring-offset-0 ${
                        currentDurationValue === minutes
                          ? "bg-primary text-white"
                          : "bg-surface hover:bg-surface-hover text-foreground-3 dark:text-foreground-2 border border-border"
                      }`}
                    >
                      {minutes}m
                    </button>
                  ))}
                </div>
                {hasCustomDuration ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDurationRevert();
                    }}
                    className="restore-icon-button !min-h-0 h-fit flex items-center gap-1 px-2 py-2 pt-4 rounded cursor-pointer z-10 group focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/60 focus-visible:ring-offset-0"
                  >
                    <span className="text-sm text-foreground-3 dark:text-foreground-2 group-hover:text-foreground-1">
                      {t("page.manageTeamMemberDrawer.buttons.revert")}
                    </span>
                    <RotateCcw className="h-3.5 w-3.5 text-primary" />
                  </button>
                ) : (
                  <div className="!min-h-0 h-fit flex items-center gap-1.5 px-2 py-2 pt-4 z-10 cursor-default">
                    <Info className="h-3 w-3 text-foreground-3 dark:text-foreground-2" />
                    <span className="text-xs text-foreground-3 dark:text-foreground-2">
                      {t(
                        "page.manageTeamMemberDrawer.fields.usingLocationDefault"
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disabled state message */}
      {/* {!service.canPerform && (
        <p className="text-xs cursor-default text-foreground-3 dark:text-foreground-2 italic px-3 pb-3">
          {t("page.manageTeamMemberDrawer.disabledMessage")}
        </p>
      )} */}
    </div>
  );
}
