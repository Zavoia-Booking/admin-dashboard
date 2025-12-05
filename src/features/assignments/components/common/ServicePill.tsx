import { useState } from 'react';
import { Briefcase, Edit2 } from 'lucide-react';
import { Pill } from '../../../../shared/components/ui/pill';
import { Badge } from '../../../../shared/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../../../../shared/components/ui/popover';
import { Input } from '../../../../shared/components/ui/input';
import { Button } from '../../../../shared/components/ui/button';
import { Label } from '../../../../shared/components/ui/label';
import { PriceField } from '../../../../shared/components/forms/fields/PriceField';
import { getCurrencyDisplay } from '../../../../shared/utils/currency';

interface ServicePillProps {
  serviceId: number;
  serviceName: string;
  defaultPrice?: number; // price_amount_minor (cents) from backend - for comparison
  defaultDisplayPrice?: number; // displayPrice (decimal) from backend - for display
  defaultDuration?: number;
  customPrice: number | null;
  customDuration: number | null;
  onUpdateCustomPrice: (serviceId: number, price: number | null) => void;
  onUpdateCustomDuration: (serviceId: number, duration: number | null) => void;
  onToggle: (serviceId: number) => void;
  currency?: string;
}

export function ServicePill({
  serviceId,
  serviceName,
  defaultPrice,
  defaultDisplayPrice,
  defaultDuration,
  customPrice,
  customDuration,
  onUpdateCustomPrice,
  onUpdateCustomDuration,
  onToggle,
  currency = 'USD',
}: ServicePillProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [durationInput, setDurationInput] = useState(
    customDuration !== null ? customDuration.toString() : (defaultDuration?.toString() || '')
  );

  const currencyDisplay = getCurrencyDisplay(currency);

  // defaultPrice is already in cents (price_amount_minor from backend) - for comparison
  const hasCustomPrice = customPrice !== null && customPrice !== (defaultPrice ?? 0);
  const hasCustomDuration = customDuration !== null && customDuration !== defaultDuration;
  // For display: use customPrice converted to decimal, or defaultDisplayPrice from backend
  const displayPrice = customPrice !== null ? customPrice / 100 : (defaultDisplayPrice ?? 0);
  const displayDuration = customDuration !== null ? customDuration : (defaultDuration || 0);

  const handlePriceChange = (value: number | string) => {
    const priceInCents = typeof value === 'string' ? parseInt(value, 10) : value;
    if (priceInCents === 0 || (defaultPrice && priceInCents === defaultPrice)) {
      onUpdateCustomPrice(serviceId, null);
    } else {
      onUpdateCustomPrice(serviceId, priceInCents);
    }
  };

  const handleSave = () => {
    // Duration
    const durationValue = parseInt(durationInput, 10);
    if (!isNaN(durationValue) && durationValue >= 0) {
      if (defaultDuration && durationValue === defaultDuration) {
        onUpdateCustomDuration(serviceId, null);
      } else {
        onUpdateCustomDuration(serviceId, durationValue);
      }
    }

    setIsEditOpen(false);
  };

  const handleReset = () => {
    onUpdateCustomPrice(serviceId, null);
    onUpdateCustomDuration(serviceId, null);
    setDurationInput(defaultDuration?.toString() || '');
    setIsEditOpen(false);
  };

  return (
    <Popover open={isEditOpen} onOpenChange={setIsEditOpen}>
      <PopoverTrigger asChild>
        <div className="relative group">
          <Pill
            selected={true}
            icon={Briefcase}
            className="w-auto justify-start items-start transition-none active:scale-100"
            showCheckmark={true}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(serviceId);
            }}
          >
            <div className="flex flex-col text-left pr-6">
              <div className="flex items-center gap-1.5">
                {serviceName}
                {(hasCustomPrice || hasCustomDuration) && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1 font-medium">
                    Custom
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {currencyDisplay.symbol}{displayPrice.toFixed(2)} • {displayDuration} min
              </div>
            </div>
          </Pill>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditOpen(true);
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-surface-active z-10"
            aria-label="Edit custom price/duration"
          >
            <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="w-72 p-4"
        align="start"
        onClick={(e) => e.stopPropagation()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-0.5">{serviceName}</h4>
            <p className="text-xs text-muted-foreground">Set custom pricing for this team member</p>
          </div>

          <div className="space-y-3">
            {/* Price */}
            <div className="space-y-1.5">
              <PriceField
                id={`price-${serviceId}`}
                label="Price"
                value={customPrice ?? 0}
                onChange={handlePriceChange}
                currency={currency}
                storageFormat="cents"
                icon={currencyDisplay.icon}
                symbol={currencyDisplay.symbol}
                placeholder={defaultDisplayPrice ? defaultDisplayPrice.toString() : undefined}
                className="h-9 text-sm"
                customLabelClassName="text-xs font-medium"
              />
              {defaultDisplayPrice && (
                <p className="text-xs text-muted-foreground">
                  Default: {currencyDisplay.symbol}{defaultDisplayPrice.toFixed(2)}
                </p>
              )}
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <Label htmlFor={`duration-${serviceId}`} className="text-xs font-medium">
                Duration
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id={`duration-${serviceId}`}
                  type="number"
                  value={durationInput}
                  onChange={(e) => setDurationInput(e.target.value)}
                  className="h-9 text-sm flex-1"
                  min="0"
                  placeholder={defaultDuration?.toString() || '0'}
                />
                <span className="text-xs text-muted-foreground font-medium">min</span>
              </div>
              {defaultDuration && (
                <p className="text-xs text-muted-foreground">
                  Default: {defaultDuration} min
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex-1"
              disabled={!hasCustomPrice && !hasCustomDuration}
            >
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="flex-1"
            >
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

