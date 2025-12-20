import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import {
  Clock,
  AlertCircle,
  RotateCcw,
  Info,
  X,
  Settings2,
  ArrowRight,
} from "lucide-react";
import { Button } from "../../../../shared/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from "../../../../shared/components/ui/drawer";
import { Input } from "../../../../shared/components/ui/input";
import { Label } from "../../../../shared/components/ui/label";
import { PriceField } from "../../../../shared/components/forms/fields/PriceField";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "../../../../shared/components/ui/avatar";
import { getCurrencyDisplay } from "../../../../shared/utils/currency";
import { useIsMobile } from "../../../../shared/hooks/use-mobile";
import { DashedDivider } from "../../../../shared/components/common/DashedDivider";
import { getAvatarBgColor } from "../../../setupWizard/components/StepTeam";
import { cn } from "../../../../shared/lib/utils";
import { Skeleton } from "../../../../shared/components/ui/skeleton";
import { updateStaffServicesAction } from "../../actions";
import { fetchServiceStaffOverridesRequest } from "../../api";
import type { StaffOverrideData } from "../../types";

// Inner component for member override row with proper state management
interface MemberOverrideRowProps {
  member: StaffOverrideData;
  currencyDisplay: {
    symbol?: string;
    icon?: React.ComponentType<{ className?: string }>;
  };
  currency: string;
  onUpdateService: (
    userId: number,
    customPrice: number | null,
    customDuration: number | null
  ) => void;
  formatDuration: (minutes: number) => string;
}

function MemberOverrideRow({
  member,
  currencyDisplay,
  currency,
  onUpdateService,
  formatDuration,
}: MemberOverrideRowProps) {
  const { t } = useTranslation("assignments");
  const { t: tServices } = useTranslation("services");

  const [isDurationFocused, setIsDurationFocused] = useState(false);
  const [localDurationInput, setLocalDurationInput] = useState<string>("");
  const [durationError, setDurationError] = useState<string | null>(null);

  const initials = `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();
  const inheritedPrice = member.inheritedPrice;
  const inheritedDisplayPrice = member.inheritedDisplayPrice;
  const inheritedDuration = member.inheritedDuration;
  const hasCustomPrice = member.customPrice !== null;
  const hasCustomDuration = member.customDuration !== null;
  const CurrencyIcon = currencyDisplay.icon;

  const currentDurationValue = member.customDuration ?? inheritedDuration;
  const durationDisplayValue = isDurationFocused
    ? localDurationInput
    : currentDurationValue.toString();

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    if (inputValue === "" || /^\d+$/.test(inputValue)) {
      setLocalDurationInput(inputValue);
      setDurationError(null);

      if (inputValue === "") {
        onUpdateService(member.userId, member.customPrice, null);
        return;
      }

      const numValue = parseInt(inputValue, 10);
      if (numValue > 0) {
        if (numValue === inheritedDuration) {
          onUpdateService(member.userId, member.customPrice, null);
        } else {
          onUpdateService(member.userId, member.customPrice, numValue);
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

    if (localDurationInput === "0") {
      setDurationError(tServices("addService.form.validation.duration.min"));
      onUpdateService(member.userId, member.customPrice, null);
      setLocalDurationInput("");
      return;
    }

    if (localDurationInput === "" || isNaN(parseInt(localDurationInput, 10))) {
      onUpdateService(member.userId, member.customPrice, null);
      setLocalDurationInput("");
      setDurationError(null);
      return;
    }

    const finalValue = parseInt(localDurationInput, 10);
    if (finalValue < 1) {
      setDurationError(tServices("addService.form.validation.duration.min"));
      onUpdateService(member.userId, member.customPrice, null);
      setLocalDurationInput("");
      return;
    }

    if (finalValue === inheritedDuration) {
      onUpdateService(member.userId, member.customPrice, null);
    } else {
      onUpdateService(member.userId, member.customPrice, finalValue);
    }

    setLocalDurationInput("");
    setDurationError(null);
  };

  const handleDurationChipClick = (minutes: number) => {
    setLocalDurationInput(minutes.toString());
    setDurationError(null);
    if (minutes === inheritedDuration) {
      onUpdateService(member.userId, member.customPrice, null);
    } else {
      onUpdateService(member.userId, member.customPrice, minutes);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-white dark:bg-surface space-y-3 p-3">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage
            src={member.profileImage || undefined}
            alt={`${member.firstName} ${member.lastName}`}
          />
          <AvatarFallback
            className="text-xs font-medium"
            style={{ backgroundColor: getAvatarBgColor(member.email) }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-foreground-1 truncate">
            {member.firstName} {member.lastName}
          </div>
          <div className="text-xs text-foreground-3 dark:text-foreground-2 truncate">
            {member.email}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-border pt-3">
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
                  <span>{inheritedDisplayPrice.toFixed(2)}</span>
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col justify-between">
            <PriceField
              value={member.customPrice ?? inheritedPrice}
              onChange={(val) =>
                onUpdateService(
                  member.userId,
                  typeof val === "number" ? val : Number(val) || null,
                  member.customDuration
                )
              }
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
                onClick={() =>
                  onUpdateService(member.userId, null, member.customDuration)
                }
                className="restore-icon-button md:absolute md:left-0 md:bottom-0 !min-h-0 h-fit flex items-center gap-1 px-2 py-2 pt-4 rounded cursor-pointer z-10 group focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/60 focus-visible:ring-offset-0"
              >
                <span className="text-sm text-foreground-3 dark:text-foreground-2 group-hover:text-foreground-1">
                  {t("page.manageTeamMemberDrawer.buttons.revert")}
                </span>
                <RotateCcw className="h-3.5 w-3.5 text-primary" />
              </button>
            ) : (
              <div className="md:absolute md:left-0 md:bottom-0 cursor-default !min-h-0 h-fit flex items-center gap-1.5 px-2 py-2 pt-4 z-10">
                <Info className="h-3 w-3 text-foreground-3 dark:text-foreground-2" />
                <span className="text-xs text-foreground-3 dark:text-foreground-2">
                  {t("page.manageTeamMemberDrawer.fields.usingLocationDefault")}
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
                  {formatDuration(inheritedDuration)}
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
              placeholder={inheritedDuration?.toString() || "0"}
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
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-foreground-3 dark:text-foreground-2">
              min
            </div>
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
                onClick={() => handleDurationChipClick(minutes)}
                className={cn(
                  "flex-1 cursor-pointer px-2.5 py-1 text-xs font-medium rounded-md duration-200 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/60 focus-visible:ring-offset-0",
                  currentDurationValue === minutes
                    ? "bg-primary text-white"
                    : "bg-surface hover:bg-surface-hover text-foreground-3 dark:text-foreground-2 border border-border"
                )}
              >
                {minutes}m
              </button>
            ))}
          </div>

          {hasCustomDuration ? (
            <button
              type="button"
              onClick={() =>
                onUpdateService(member.userId, member.customPrice, null)
              }
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
                {t("page.manageTeamMemberDrawer.fields.usingLocationDefault")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main modal component props
interface ServiceStaffOverridesModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: number;
  serviceId: number;
  serviceName: string;
  staffWithOverrides: number;
  currency?: string;
  onSaveStart?: () => void;
  /** Current effective price for this service at this location (in cents) */
  effectivePrice?: number;
  /** Current effective duration for this service at this location (in minutes) */
  effectiveDuration?: number;
}

export function ServiceStaffOverridesModal({
  isOpen,
  onClose,
  locationId,
  serviceId,
  serviceName,
  staffWithOverrides,
  currency = "USD",
  onSaveStart,
  effectivePrice,
  effectiveDuration,
}: ServiceStaffOverridesModalProps) {
  const { t } = useTranslation("assignments");
  const dispatch = useDispatch();
  const isMobile = useIsMobile();

  const [staffOverrides, setStaffOverrides] = useState<StaffOverrideData[]>([]);
  const [originalStaffOverrides, setOriginalStaffOverrides] = useState<
    StaffOverrideData[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currencyDisplay = getCurrencyDisplay(currency);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ""}`;
    }
    return `${mins}m`;
  };

  // Fetch staff overrides when modal opens
  useEffect(() => {
    if (isOpen && locationId && staffWithOverrides > 0) {
      setIsLoading(true);

      fetchServiceStaffOverridesRequest(locationId, serviceId)
        .then((data) => {
          // If parent provides effective price/duration, use those as inherited values
          // This handles the case where local changes haven't been synced to backend yet
          const overrides = data.staffOverrides.map((member) => ({
            ...member,
            inheritedPrice: effectivePrice ?? member.inheritedPrice,
            inheritedDisplayPrice:
              effectivePrice !== undefined
                ? effectivePrice / 100
                : member.inheritedDisplayPrice,
            inheritedDuration: effectiveDuration ?? member.inheritedDuration,
          }));
          setStaffOverrides(overrides);
          setOriginalStaffOverrides(overrides);
        })
        .catch((error) => {
          console.error(
            `Failed to fetch staff overrides for service ${serviceId}:`,
            error
          );
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [
    isOpen,
    locationId,
    serviceId,
    staffWithOverrides,
    effectivePrice,
    effectiveDuration,
  ]);

  // Handle team member service updates (local only)
  const handleUpdateTeamMemberService = useCallback(
    (
      userId: number,
      customPrice: number | null,
      customDuration: number | null
    ) => {
      setStaffOverrides((prev) =>
        prev.map((member) =>
          member.userId === userId
            ? { ...member, customPrice, customDuration }
            : member
        )
      );
    },
    []
  );

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    if (staffOverrides.length !== originalStaffOverrides.length) return true;
    return staffOverrides.some((current) => {
      const original = originalStaffOverrides.find(
        (o) => o.userId === current.userId
      );
      if (!original) return true;
      return (
        current.customPrice !== original.customPrice ||
        current.customDuration !== original.customDuration
      );
    });
  }, [staffOverrides, originalStaffOverrides]);

  // Handle cancel - revert to original state
  const handleCancel = useCallback(() => {
    setStaffOverrides(originalStaffOverrides);
    onClose();
  }, [originalStaffOverrides, onClose]);

  // Handle save - dispatch all changes to backend
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    onSaveStart?.();

    try {
      const changedMembers = staffOverrides.filter((current) => {
        const original = originalStaffOverrides.find(
          (o) => o.userId === current.userId
        );
        if (!original) return true;
        return (
          current.customPrice !== original.customPrice ||
          current.customDuration !== original.customDuration
        );
      });

      for (const member of changedMembers) {
        dispatch(
          updateStaffServicesAction.request({
            locationId,
            userId: member.userId,
            services: [
              {
                serviceId,
                canPerform: true,
                customPrice: member.customPrice,
                customDuration: member.customDuration,
              },
            ],
          })
        );
      }

      setOriginalStaffOverrides(staffOverrides);
      onClose();
    } finally {
      setIsSaving(false);
    }
  }, [
    locationId,
    serviceId,
    staffOverrides,
    originalStaffOverrides,
    dispatch,
    onClose,
    onSaveStart,
  ]);

  // Render content
  const renderContent = useCallback(() => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-white dark:bg-surface space-y-3 p-3"
            >
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 min-w-0 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-9 w-full" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (staffOverrides.length === 0) {
      return (
        <div className="text-sm text-foreground-3 dark:text-foreground-2 text-center py-4">
          {t("page.locationService.teamMemberOverridesModal.emptyState")}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {staffOverrides.map((member) => (
          <MemberOverrideRow
            key={member.userId}
            member={member}
            currencyDisplay={currencyDisplay}
            currency={currency}
            onUpdateService={handleUpdateTeamMemberService}
            formatDuration={formatDuration}
          />
        ))}
      </div>
    );
  }, [
    staffOverrides,
    isLoading,
    currencyDisplay,
    currency,
    t,
    handleUpdateTeamMemberService,
  ]);

  // Mobile drawer
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DrawerContent
          className="h-auto max-h-[85vh] flex flex-col bg-popover text-popover-foreground !z-80"
          overlayClassName="!z-80"
        >
          <DrawerTitle className="sr-only">
            {t("page.locationService.teamMemberOverrides", {
              count: staffWithOverrides,
            })}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            {t("page.locationService.teamMemberOverridesModal.description")}
          </DrawerDescription>
          <div className="p-4 pt-1 md:pt-4 space-y-4 flex-1 overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="flex flex-shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface h-10 w-10">
                <Settings2 className="h-5 w-5 text-foreground-1" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <h4 className="text-lg font-medium text-foreground-1">
                  {serviceName}
                </h4>
                <p className="text-xs text-foreground-3 dark:text-foreground-2">
                  {t(
                    "page.locationService.teamMemberOverridesModal.description"
                  )}{" "}
                  <span className="font-medium">
                    {staffWithOverrides}{" "}
                    {t(
                      "page.locationService.teamMemberOverridesModal.descriptionSuffix",
                      { count: staffWithOverrides }
                    )}
                  </span>
                </p>
              </div>
            </div>
            <DashedDivider
              marginTop="mt-0"
              className="mb-2"
              paddingTop="pt-0"
              dashPattern="1 1"
            />
            {renderContent()}
          </div>
          {/* Mobile footer */}
          <div className="bg-surface shrink-0">
            <DashedDivider
              marginTop="mt-0"
              className="mb-0"
              paddingTop="pt-2"
              dashPattern="1 1"
            />
            <div className="flex justify-between gap-2 p-4">
              <Button
                type="button"
                variant="outline"
                rounded="full"
                onClick={handleCancel}
                disabled={isSaving}
                className="gap-2 h-11 cursor-pointer w-32"
              >
                {t("page.manageTeamMemberDrawer.buttons.cancel")}
              </Button>
              <Button
                type="button"
                rounded="full"
                onClick={handleSave}
                disabled={!hasChanges || isSaving || isLoading}
                className="group gap-2 h-11 cursor-pointer flex-1"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t("page.manageTeamMemberDrawer.buttons.saving")}
                  </span>
                ) : (
                  <>
                    {t("page.manageTeamMemberDrawer.buttons.save")}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop modal
  if (!isOpen) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-80 bg-black/50 animate-in fade-in-0"
        onClick={handleCancel}
      />
      <div className="fixed inset-0 z-80 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-popover overflow-hidden text-popover-foreground rounded-lg border shadow-lg max-w-2xl w-full h-[85vh] flex flex-col p-0 pointer-events-auto animate-in fade-in-0 zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex flex-col bg-surface relative p-4 px-0 md:p-6 md:pb-0">
            <div className="flex items-center gap-3 px-4 md:px-0">
              <div className="hidden md:flex flex-shrink-0 items-stretch self-stretch">
                <div className="flex items-center justify-center rounded-full border border-border-strong bg-surface aspect-square h-full min-w-[2.5rem]">
                  <Settings2 className="h-6 w-6 text-foreground-1" />
                </div>
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center cursor-default text-left">
                <h2 className="text-lg font-medium text-foreground-1 cursor-default">
                  {serviceName}
                </h2>
                <p className="text-xs text-foreground-3 dark:text-foreground-2 mt-1">
                  {t(
                    "page.locationService.teamMemberOverridesModal.description"
                  )}{" "}
                  <span className="font-medium">
                    {staffWithOverrides}{" "}
                    {t(
                      "page.locationService.teamMemberOverridesModal.descriptionSuffix",
                      { count: staffWithOverrides }
                    )}
                  </span>
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                className="hidden md:flex absolute right-4 top-4 h-8 w-8 rounded-md hover:bg-surface-hover active:bg-surface-active"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <DashedDivider
              marginTop="mt-3"
              className="pt-0 md:pt-3"
              dashPattern="1 1"
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {renderContent()}
          </div>

          {/* Desktop footer */}
          <div className="flex flex-col bg-surface shrink-0">
            <DashedDivider
              marginTop="mt-0"
              className="mb-0"
              paddingTop="pt-4"
              dashPattern="1 1"
            />
            <div className="px-6 pb-2 flex justify-end">
              <div className="flex justify-between gap-4 w-2/3 mt-4 mb-3 md:mb-2">
                <Button
                  type="button"
                  variant="outline"
                  rounded="full"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="gap-2 h-11 cursor-pointer w-1/3"
                >
                  {t("page.manageTeamMemberDrawer.buttons.cancel")}
                </Button>
                <Button
                  type="button"
                  rounded="full"
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving || isLoading}
                  className="group gap-2 h-11 cursor-pointer w-2/3"
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t("page.manageTeamMemberDrawer.buttons.saving")}
                    </span>
                  ) : (
                    <>
                      {t("page.manageTeamMemberDrawer.buttons.save")}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
