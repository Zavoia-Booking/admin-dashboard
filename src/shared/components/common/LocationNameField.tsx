import React from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { AlertCircle, MapPin, Monitor } from 'lucide-react';

export interface LocationNameFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  isRemote?: boolean;
  required?: boolean;
  maxLength?: number;
  id?: string;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>; // optional override icon
}

export const LocationNameField: React.FC<LocationNameFieldProps> = ({
  value,
  onChange,
  error,
  label = 'Location Name',
  placeholder = 'Main Location',
  isRemote = false,
  required = false,
  maxLength = 70,
  id = 'location-name',
  className = '',
  icon,
}) => {
  const Icon = icon ?? (isRemote ? Monitor : MapPin);
  const displayLabel = isRemote && label === 'Location Name' ? 'Online Location Name' : label;

  return (
    <div className={`space-y-2 ${className} pt-2`}>
      <Label htmlFor={id} className="text-base font-medium">
        {displayLabel} {required && '*'}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          className={`!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
            error
              ? 'border-destructive bg-error-bg focus-visible:ring-error'
              : 'border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus'
          }`}
          aria-invalid={!!error}
        />
        <Icon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
      </div>
      <div className="h-5">
        {error && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{error}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default LocationNameField;

