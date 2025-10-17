import React from 'react';
import { Label } from '../ui/label';
import { AlertCircle } from 'lucide-react';
import { TimezoneSelect, DetectTimezoneButton } from './TimezoneSelect';

export interface TimezoneFieldProps {
  value: string;
  onChange: (timezone: string) => void;
  error?: string;
  label?: string;
  helpText?: string;
  required?: boolean;
  showAutoDetect?: boolean;
  placeholder?: string;
  id?: string;
  className?: string;
}

export const TimezoneField: React.FC<TimezoneFieldProps> = ({
  value,
  onChange,
  error,
  label = 'Timezone',
  helpText = "We'll use this to show accurate appointment times.",
  required = false,
  showAutoDetect = true,
  placeholder = 'Select timezone...',
  id = 'timezone',
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label} {required && '*'}
      </Label>
      {helpText && (
        <p className="text-xs text-muted-foreground">
          {helpText}
        </p>
      )}
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <TimezoneSelect
            value={value}
            onChange={onChange}
            error={!!error}
            placeholder={placeholder}
          />
        </div>
        {showAutoDetect && (
          <DetectTimezoneButton
            onDetect={onChange}
            className="shrink-0"
          />
        )}
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

export default TimezoneField;

