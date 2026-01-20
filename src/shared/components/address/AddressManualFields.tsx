import React from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { MapPin, Hash, Building2, Flag, Locate, AlertCircle, HelpCircle, Navigation, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

type Props = {
  streetBase: string; // Full address display for locked mode
  actualStreet: string; // Just the street name for manual mode
  streetNumber: string;
  city: string;
  postalCode: string;
  country: string;
  showStreetTip?: boolean;
  streetError?: string | null;
  numberError?: string | null;
  cityError?: string | null;
  postalError?: string | null;
  countryError?: string | null;
  onStreetChange: (v: string) => void;
  onNumberChange: (v: string) => void;
  onCityChange: (v: string) => void;
  onPostalChange: (v: string) => void;
  onCountryChange: (v: string) => void;
  isLocked: boolean;
  onChangeAddressClick: () => void;
  onStreetFocus: () => void;
  onStreetBlur: () => void;
};

const AddressManualFields: React.FC<Props> = ({
  streetBase,
  actualStreet,
  streetNumber,
  city,
  postalCode,
  country,
  showStreetTip,
  streetError,
  numberError,
  cityError,
  postalError,
  countryError,
  onStreetChange,
  onNumberChange,
  onCityChange,
  onPostalChange,
  onCountryChange,
  isLocked,
  onChangeAddressClick,
  onStreetFocus,
  onStreetBlur,
}) => {
  return (
    <div className="mt-2 space-y-3">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium text-foreground-1">{isLocked ? 'Selected Address' : 'Street *'}</Label>
          {isLocked && streetBase && (
            <Button
              variant="ghost"
              rounded="full"
              size="sm"
              type="button"
              onClick={onChangeAddressClick}
              className={cn(
                "shrink-0 !min-h-0 h-7 !px-3 border border-border mb-2 flex items-center gap-1 w-fit",
                "border-border-strong text-primary bg-info-100/20 dark:bg-muted-foreground/10 dark:text-primary",
                "hover:border-border-strong hover:text-primary dark:hover:text-primary hover:bg-info-100/20 dark:hover:bg-muted-foreground/10"
              )}
            >
              <span className="text-xs text-foreground-1">
                Change address
              </span>
              <ChevronRight className="h-3 w-3 pt-0.5 translate-x-0.5" />
            </Button>
          )}
        </div>
        {isLocked && streetBase ? (
          <Tooltip open={!!showStreetTip}>
            <TooltipTrigger asChild>
              <div className="relative">
                <Input
                  value={streetBase}
                  onChange={(e) => onStreetChange(e.target.value)}
                  placeholder="Enter street name"
                  className={`!pr-11 truncate transition-all focus-visible:ring-1 focus-visible:ring-focus focus-visible:ring-offset-0 focus:border-focus cursor-not-allowed bg-surface-hover text-foreground-2 border-border`}
                  readOnly
                  aria-readonly
                  aria-invalid={!!streetError}
                  onFocus={onStreetFocus}
                  onBlur={onStreetBlur}
                />
                <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              </div>
            </TooltipTrigger>
            <TooltipContent 
              side="bottom" 
              align="center" 
              sideOffset={6}
              className="text-sm text-center leading-snug max-w-[90vw] md:max-w-md !text-wrap [text-wrap:wrap]"
            >
              {streetBase}
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="relative">
            <Input
              value={actualStreet}
              onChange={(e) => onStreetChange(e.target.value)}
              placeholder="e.g. Main Street"
              className={`!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                streetError
                  ? 'border-destructive bg-error-bg focus-visible:ring-error'
                  : 'border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus'
              }`}
              maxLength={200}
              aria-invalid={!!streetError}
            />
            <Navigation className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          </div>
        )}
        <div className="h-5">
          {streetError && !isLocked && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{streetError}</span>
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="relative">
            <Label className="text-base font-medium text-foreground-1">Building / Number *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Building number format help"
                  className="absolute -top-2 -right-1 inline-flex items-center justify-center text-foreground-3 dark:text-foreground-1 hover:text-foreground-1 p-0 focus-visible:outline-none cursor-pointer"
                >
                  <HelpCircle className="h-5 w-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                sideOffset={6}
                side="top"
                align="start"
                avoidCollisions={true}
                className="whitespace-normal text-sm leading-relaxed w-[calc(100vw-2rem)] max-w-[360px] [transform:translateX(calc(-50vw+50%))!important] md:[transform:none!important]"
              >
                <p>
                  You can include <span className="font-medium">building number</span>, <span className="font-medium">apartment</span>, <span className="font-medium">floor</span>, or <span className="font-medium">suite</span> details here.
                </p>
                <div className="my-3 border-t border-border" />
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-foreground">Common formats:</div>
                  <div className="text-xs text-muted-foreground dark:text-foreground-2 space-y-1">
                    <div>• "556, Apt 12"</div>
                    <div>• "Building 3, Floor 2"</div>
                    <div>• "Suite 205"</div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="relative">
            <Input 
              value={streetNumber} 
              onChange={(e) => onNumberChange(e.target.value)} 
              placeholder="e.g. Bl. 556, Apt. 12" 
              className={`!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                numberError ? 'border-destructive bg-error-bg focus-visible:ring-error' : 'border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus'
              }`} 
              maxLength={50}
              aria-invalid={!!numberError}
            />
            <Hash className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          </div>
          <div className="h-5">
            {numberError && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{numberError}</span>
              </p>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-base font-medium text-foreground-1">City *</Label>
          <div className="relative">
            <Input 
              value={city} 
              onChange={(e) => onCityChange(e.target.value)} 
              placeholder="Enter city" 
              className={`!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                cityError ? 'border-destructive bg-error-bg focus-visible:ring-error' : 'border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus'
              }`} 
              maxLength={100}
              aria-invalid={!!cityError}
            />
            <Building2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          </div>
          <div className="h-5">
            {cityError && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{cityError}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-base font-medium text-foreground-1">Postcode *</Label>
          <div className="relative">
            <Input 
              value={postalCode} 
              onChange={(e) => onPostalChange(e.target.value)} 
              placeholder="Postal code" 
              className={`!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                postalError ? 'border-destructive bg-error-bg focus-visible:ring-error' : 'border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus'
              }`} 
              maxLength={20}
              aria-invalid={!!postalError}
            />
            <Locate className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          </div>
          <div className="h-5">
            {postalError && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{postalError}</span>
              </p>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-base font-medium text-foreground-1">Country *</Label>
          <div className="relative">
            <Input 
              value={country} 
              onChange={(e) => onCountryChange(e.target.value)} 
              placeholder="Country" 
              className={`!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                countryError ? 'border-destructive bg-error-bg focus-visible:ring-error' : 'border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus'
              }`} 
              maxLength={100}
              aria-invalid={!!countryError}
            />
            <Flag className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          </div>
          <div className="h-5">
            {countryError && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{countryError}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressManualFields;


