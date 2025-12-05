import { useState } from 'react';
import { Briefcase, Edit2 } from 'lucide-react';
import { Badge } from '../../../../shared/components/ui/badge';
import { Button } from '../../../../shared/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../../../../shared/components/ui/popover';
import { Input } from '../../../../shared/components/ui/input';
import { Label } from '../../../../shared/components/ui/label';
import { PriceField } from '../../../../shared/components/forms/fields/PriceField';
import { getCurrencyDisplay } from '../../../../shared/utils/currency';

interface AssignedServiceRowProps {
  serviceId: number;
  serviceName: string;
  defaultPrice?: number; // price_amount_minor (cents) from backend - for comparison
  defaultDisplayPrice?: number; // displayPrice (decimal) from backend - for display
  defaultDuration?: number;
  customPrice: number | null;
  customDuration: number | null;
  onUpdateCustomPrice: (serviceId: number, price: number | null) => void;
  onUpdateCustomDuration: (serviceId: number, duration: number | null) => void;
  currency?: string;
}

export function AssignedServiceRow({
  serviceId,
  serviceName,
  defaultPrice,
  defaultDisplayPrice,
  defaultDuration,
  customPrice,
  customDuration,
  onUpdateCustomPrice,
  onUpdateCustomDuration,
  currency = 'USD',
}: AssignedServiceRowProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [durationInput, setDurationInput] = useState(
    customDuration !== null ? customDuration.toString() : (defaultDuration?.toString() || '')
  );

  // defaultPrice is already in cents (price_amount_minor from backend)
  const hasCustomPrice = customPrice !== null && customPrice !== (defaultPrice ?? 0);
  const hasCustomDuration = customDuration !== null && customDuration !== defaultDuration;
  const isCustom = hasCustomPrice || hasCustomDuration;

  // For display: use customPrice converted to decimal, or defaultDisplayPrice from backend
  const displayPrice = customPrice !== null ? customPrice / 100 : (defaultDisplayPrice ?? 0);
  const displayDuration = customDuration !== null ? customDuration : (defaultDuration || 0);

  const currencyDisplay = getCurrencyDisplay(currency);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  const handlePriceChange = (value: number | string) => {
    const priceInCents = typeof value === 'string' ? parseInt(value, 10) : value;
    // defaultPrice is already in cents (price_amount_minor from backend)
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
    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface hover:bg-surface-hover transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium text-sm">{serviceName}</span>
          {isCustom && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1">
              Custom
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-1 ml-6">
          {currencyDisplay.symbol}{displayPrice.toFixed(2)} • {formatDuration(displayDuration)}
        </div>
      </div>
      <Popover open={isEditOpen} onOpenChange={setIsEditOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="shrink-0">
            <Edit2 className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-72 p-4"
          align="end"
          onClick={(e) => e.stopPropagation()}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-0.5">{serviceName}</h4>
              <p className="text-xs text-muted-foreground">Customize pricing for this team member</p>
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
                  Duration (minutes)
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
                disabled={!isCustom}
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
    </div>
  );
}

