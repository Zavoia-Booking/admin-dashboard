import React from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { MapPin, Hash, Building2, Flag, Locate, AlertCircle, HelpCircle } from 'lucide-react';

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
          <Label className="text-base font-medium text-gray-700">{isLocked ? 'Selected Address' : 'Street *'}</Label>
          {isLocked && streetBase && (
            <button
              type="button"
              className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              onClick={onChangeAddressClick}
            >
              Change address
            </button>
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
                  className={`!pr-11 truncate transition-all focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:ring-offset-0 focus:border-blue-400 cursor-not-allowed bg-gray-50/80 text-gray-600 border-gray-200`}
                  readOnly
                  aria-readonly
                  aria-invalid={!!streetError}
                  onFocus={onStreetFocus}
                  onBlur={onStreetBlur}
                />
                <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
                  ? 'border-destructive bg-red-50 focus-visible:ring-red-400'
                  : 'border-gray-200 hover:border-gray-300 focus:border-blue-400 focus-visible:ring-blue-400'
              }`}
              maxLength={200}
              aria-invalid={!!streetError}
            />
            <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
            <Label className="text-base font-medium text-gray-700">Building / Number *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Building number format help"
                  className="absolute -top-2 -right-1 inline-flex items-center justify-center text-gray-500 hover:text-gray-800 p-0 focus-visible:outline-none cursor-pointer"
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
                <div className="my-3 border-t border-gray-200" />
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-foreground">Common formats:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
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
                numberError ? 'border-destructive bg-red-50 focus-visible:ring-red-400' : 'border-gray-200 hover:border-gray-300 focus:border-blue-400 focus-visible:ring-blue-400'
              }`} 
              maxLength={50}
              aria-invalid={!!numberError}
            />
            <Hash className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
          <Label className="text-base font-medium text-gray-700">City *</Label>
          <div className="relative">
            <Input 
              value={city} 
              onChange={(e) => onCityChange(e.target.value)} 
              placeholder="Enter city" 
              className={`!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                cityError ? 'border-destructive bg-red-50 focus-visible:ring-red-400' : 'border-gray-200 hover:border-gray-300 focus:border-blue-400 focus-visible:ring-blue-400'
              }`} 
              maxLength={100}
              aria-invalid={!!cityError}
            />
            <Building2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
          <Label className="text-base font-medium text-gray-700">Postcode *</Label>
          <div className="relative">
            <Input 
              value={postalCode} 
              onChange={(e) => onPostalChange(e.target.value)} 
              placeholder="Postal code" 
              className={`!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                postalError ? 'border-destructive bg-red-50 focus-visible:ring-red-400' : 'border-gray-200 hover:border-gray-300 focus:border-blue-400 focus-visible:ring-blue-400'
              }`} 
              maxLength={20}
              aria-invalid={!!postalError}
            />
            <Locate className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
          <Label className="text-base font-medium text-gray-700">Country *</Label>
          <div className="relative">
            <Input 
              value={country} 
              onChange={(e) => onCountryChange(e.target.value)} 
              placeholder="Country" 
              className={`!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
                countryError ? 'border-destructive bg-red-50 focus-visible:ring-red-400' : 'border-gray-200 hover:border-gray-300 focus:border-blue-400 focus-visible:ring-blue-400'
              }`} 
              maxLength={100}
              aria-invalid={!!countryError}
            />
            <Flag className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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


