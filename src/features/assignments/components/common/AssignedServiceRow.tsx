import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, Clock, Info, X } from 'lucide-react';
import { Badge } from '../../../../shared/components/ui/badge';
import { Button } from '../../../../shared/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../../../../shared/components/ui/popover';
import { Input } from '../../../../shared/components/ui/input';
import { Label } from '../../../../shared/components/ui/label';
import { PriceField } from '../../../../shared/components/forms/fields/PriceField';
import { getCurrencyDisplay } from '../../../../shared/utils/currency';
import { getReadableTextColor } from '../../../../shared/utils/color';

interface AssignedServiceRowProps {
  serviceId: number;
  serviceName: string;
  defaultPrice?: number; // price_amount_minor (cents) from backend - for comparison
  defaultDisplayPrice?: number; // displayPrice (decimal) from backend - for display
  defaultDuration?: number;
  categoryName?: string | null;
  categoryColor?: string | null;
  customPrice: number | null;
  customDuration: number | null;
  onUpdateCustomPrice: (serviceId: number, price: number | null) => void;
  onUpdateCustomDuration: (serviceId: number, duration: number | null) => void;
  currency?: string;
  teamMemberName?: string;
}

export function AssignedServiceRow({
  serviceId,
  serviceName,
  defaultPrice,
  defaultDisplayPrice,
  defaultDuration,
  categoryName,
  categoryColor,
  customPrice,
  customDuration,
  onUpdateCustomPrice,
  onUpdateCustomDuration,
  currency = 'USD',
  teamMemberName,
}: AssignedServiceRowProps) {
  const { t } = useTranslation('assignments');
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // LOCAL state for popover form - initialized when popover opens
  // This prevents parent re-renders while typing
  const [localPrice, setLocalPrice] = useState<number>(0);
  const [localDuration, setLocalDuration] = useState<string>('');
  
  // Store initial values when popover opens (for Reset button)
  const [initialPrice, setInitialPrice] = useState<number | null>(null);
  const [initialDuration, setInitialDuration] = useState<number | null>(null);

  // Capture values when popover opens
  const handlePopoverOpenChange = (open: boolean) => {
    if (open) {
      // Initialize local state from props
      // customPrice can be 0 (valid value), so check for null/undefined explicitly
      const priceValue = customPrice !== null && customPrice !== undefined 
        ? customPrice 
        : (defaultPrice ?? 0);
      const durationValue = customDuration !== null && customDuration !== undefined
        ? customDuration
        : (defaultDuration ?? 0);
      
      setLocalPrice(priceValue);
      setLocalDuration(durationValue.toString());
      
      // Store initial values for reset
      setInitialPrice(customPrice);
      setInitialDuration(customDuration);
    }
    setIsEditOpen(open);
  };

  // Props-based values for display outside popover
  const hasCustomPrice = customPrice !== null && customPrice !== (defaultPrice ?? 0);
  const hasCustomDuration = customDuration !== null && customDuration !== defaultDuration;
  const isCustom = hasCustomPrice || hasCustomDuration;

  // For display outside popover
  const displayPrice = customPrice !== null ? customPrice / 100 : (defaultDisplayPrice ?? 0);
  const displayDuration = customDuration !== null ? customDuration : (defaultDuration || 0);

  // For "Original price" pill
  const defaultDisplayValue =
    defaultDisplayPrice !== undefined
      ? defaultDisplayPrice
      : defaultPrice !== undefined
      ? defaultPrice / 100
      : null;

  const categoryBg = categoryColor || undefined;
  const categoryTextColor = categoryBg ? getReadableTextColor(categoryBg) : undefined;

  const currencyDisplay = getCurrencyDisplay(currency);
  const CurrencyIcon = currencyDisplay.icon;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  // Local price change - only updates local state, not parent
  const handleLocalPriceChange = (value: number | string) => {
    const cents = typeof value === 'number' ? value : Number(value);
    setLocalPrice(cents || 0);
  };

  // Restore original price
  const handleRestoreOriginalPrice = () => {
    setLocalPrice(defaultPrice ?? 0);
  };

  // Restore original duration
  const handleRestoreOriginalDuration = () => {
    setLocalDuration(defaultDuration?.toString() || '0');
  };

  // Save - sync local state to parent
  const handleSave = () => {
      onUpdateCustomPrice(serviceId, localPrice);

    // Duration: if matches default, set null; otherwise set custom value
    const durationValue = parseInt(localDuration, 10);
    if (!isNaN(durationValue) && durationValue >= 0) {
      if (defaultDuration && durationValue === defaultDuration) {
        onUpdateCustomDuration(serviceId, null);
      } else {
        onUpdateCustomDuration(serviceId, durationValue);
      }
    }

    setIsEditOpen(false);
  };

  // Reset to initial values (what was saved when popover opened)
  const handleReset = () => {
    const priceValue = initialPrice ?? defaultPrice ?? 0;
    const durationValue = initialDuration ?? defaultDuration ?? 0;
    
    setLocalPrice(priceValue);
    setLocalDuration(durationValue.toString());
  };

  // Check if local values differ from initial (for Reset button state)
  const hasLocalChanges = (() => {
    const initialPriceValue = initialPrice ?? defaultPrice ?? 0;
    const initialDurationValue = initialDuration ?? defaultDuration ?? 0;
    const currentDurationValue = parseInt(localDuration, 10) || 0;
    
    return localPrice !== initialPriceValue || currentDurationValue !== initialDurationValue;
  })();

  return (
    <div
      className={`group flex items-start cursor-default gap-3 px-3 py-3.5 w-full hover:bg-surface-active ${
        isCustom ? "pl-0" : ""
      }`}
    >
      {isCustom ? (
        <div className="w-[3px] h-20 bg-primary/60 rounded-full"></div>
      ) : null}
      <div className="flex-1 min-w-0">
        {/* Title row */}
        <div className="flex items-center gap-2 mb-0.5">
          <div className="truncate font-medium text-sm text-foreground-1 max-w-[75%]">
            {serviceName}
          </div>
          {isCustom && (
            <Badge
              variant="secondary"
              className="text-[10px] bg-info/20 text-foreground-1 hover:bg-info/20 h-4 px-1 rounded-full shrink-0"
            >
              {t('page.serviceRow.badge.custom')}
            </Badge>
          )}
        </div>
        {/* Meta row: category + duration + price */}
        <div className="flex items-center gap-3">
          {/* Category (if any) */}
          {categoryName ? (
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border border-border-subtle shrink-0"
              style={{
                backgroundColor: categoryBg,
                borderColor: categoryBg || undefined,
                color: categoryTextColor,
              }}
            >
              <span className="truncate max-w-[100px]">{categoryName}</span>
            </span>
          ) : null}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Duration */}
          <div className="inline-flex items-center min-w-16 justify-start gap-1 text-[11px] text-foreground-3 shrink-0">
            <Clock className="h-3 w-3" />
            <span>{formatDuration(displayDuration)}</span>
          </div>

          {/* Price */}
          <div className="flex items-center min-w-18 justify-start gap-0 text-sm font-semibold text-foreground-1 shrink-0">
            {CurrencyIcon ? (
              <>
                <CurrencyIcon className="h-3.5 w-3.5" />
                <span>{displayPrice.toFixed(2)}</span>
              </>
            ) : (
              <div className="flex items-center gap-0.5">
                <span>{currencyDisplay.symbol || ""}</span>
                <span>{displayPrice.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
        {isCustom && defaultDisplayValue !== null && (
          <div className="mt-2 text-[11px] w-fit text-foreground-3 border-t border-border pt-2">
            {t('page.serviceRow.default')} {currencyDisplay.symbol}
            <span className="text-foreground-1 ml-[2px]">
              {defaultDisplayValue.toFixed(2)}
            </span>
            <span className="text-foreground-3 ml-1">
              {defaultDuration && ` • ${formatDuration(defaultDuration)}`}
            </span>
          </div>
        )}
      </div>
      <Popover open={isEditOpen} onOpenChange={handlePopoverOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 pt-4 text-foreground-3 hover:text-primary group-hover:text-primary hover:bg-surface-active"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-72 p-4 relative"
          align="end"
          onClick={(e) => e.stopPropagation()}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <button
            type="button"
            onClick={() => setIsEditOpen(false)}
            className="absolute top-2 right-0 rounded-md text-foreground-3 hover:text-primary cursor-pointer"
            aria-label={t('page.serviceRow.popover.close')}
          >
            <X className="h-5 w-5" />
          </button>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <h4 className="text-lg font-semibold text-foreground-1 mb-4">
                {serviceName}
              </h4>
              <div className="flex items-start gap-1.5 text-xs text-foreground-3 leading-relaxed">
                <Info className="h-3.5 w-5 mt-0.5 text-primary" />
                <p>
                  {t('page.serviceRow.popover.helperText')}{" "}
                  <span className="font-medium text-foreground-1">
                    {serviceName}
                  </span>{" "}
                  {t('page.serviceRow.popover.whenOfferedBy')}{" "}
                  <span className="font-medium text-foreground-1">
                    {teamMemberName || t('page.serviceRow.popover.thisTeamMember')}
                  </span>
                  .
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Price - uses LOCAL state */}
              <div className="space-y-1.5">
                {/* Label row with pill */}
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor={`price-${serviceId}`}
                    className="text-xs font-medium"
                  >
                    {t('page.serviceRow.fields.price')}
                  </Label>
                  {/* Show original price pill when there's a custom price set (different from default) */}
                  {hasCustomPrice && defaultDisplayValue !== null && (
                    <div
                      onClick={handleRestoreOriginalPrice}
                      className="flex items-center w-fit rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-info/20 text-foreground-3 border border-border cursor-pointer hover:bg-info/30"
                    >
                      {t('page.serviceRow.fields.originalPrice')}{" "}
                      <span className="ml-1 flex items-center gap-0.5 text-foreground-2">
                        <span>{currencyDisplay.symbol}</span>
                        <span>{defaultDisplayValue.toFixed(2)}</span>
                      </span>
                    </div>
                  )}
                </div>
                <PriceField
                  id={`price-${serviceId}`}
                  label=""
                  value={localPrice}
                  onChange={handleLocalPriceChange}
                  currency={currency}
                  storageFormat="cents"
                  icon={currencyDisplay.icon}
                  symbol={currencyDisplay.symbol}
                  hideInlineError={true}
                  placeholder="0.00"
                  className="text-sm"
                />
              </div>

              {/* Duration - uses LOCAL state */}
              <div className="space-y-1.5 mt-8 mb-6">
                {/* Label row with pill */}
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor={`duration-${serviceId}`}
                    className="text-xs font-medium"
                  >
                    {t('page.serviceRow.fields.duration')}
                  </Label>
                  {/* Show original duration pill when there's a custom duration set (different from default) */}
                  {hasCustomDuration && defaultDuration && (
                    <div
                      onClick={handleRestoreOriginalDuration}
                      className="flex items-center w-fit rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-info/20 text-foreground-3 border border-border cursor-pointer hover:bg-info/30"
                    >
                      {t('page.serviceRow.fields.originalDuration')}{" "}
                      <span className="ml-1 text-foreground-2">
                        {formatDuration(defaultDuration)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Clock className="h-3.5 w-3.5 text-foreground-3" />
                  </div>
                  <Input
                    id={`duration-${serviceId}`}
                    type="text"
                    inputMode="numeric"
                    value={localDuration}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      if (inputValue === "" || /^\d+$/.test(inputValue)) {
                        setLocalDuration(inputValue);
                      }
                    }}
                    placeholder={defaultDuration?.toString() || "0"}
                    className="h-9 text-sm flex-1 !pl-9 !pr-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-border hover:border-border-strong focus:border-focus focus-visible:ring-1 focus-visible:ring-focus focus-visible:ring-offset-0"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <span className="text-xs text-foreground-3">{t('page.serviceRow.fields.minSuffix')}</span>
                  </div>
                </div>
                {/* Quick duration chips */}
                <div className="grid grid-cols-5 gap-1 pt-1">
                  {[15, 30, 45, 60, 120].map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => setLocalDuration(String(minutes))}
                      className={`w-full px-2 py-1 text-[11px] cursor-pointer font-medium rounded-md border text-center transition-colors ${
                        Number(localDuration) === minutes
                          ? "bg-primary text-white border-primary"
                          : "bg-surface text-foreground-3 border-border hover:bg-surface-hover"
                      }`}
                    >
                      {minutes}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-6 pt-6 border-t border-border">
              <Button
                variant="outline"
                rounded="full"
                size="sm"
                onClick={handleReset}
                className="flex-1"
                disabled={!hasLocalChanges}
              >
                {t('page.serviceRow.buttons.reset')}
              </Button>
              <Button
                rounded="full"
                size="sm"
                onClick={handleSave}
                className="flex-2"
                disabled={!hasLocalChanges}
              >
                {t('page.serviceRow.buttons.save')}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
