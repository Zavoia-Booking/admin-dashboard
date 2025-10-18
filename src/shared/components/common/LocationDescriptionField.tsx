import React from 'react';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

export interface LocationDescriptionFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  required?: boolean;
  id?: string;
  className?: string;
  showCharacterCount?: boolean;
}

export const LocationDescriptionField: React.FC<LocationDescriptionFieldProps> = ({
  value,
  onChange,
  label = 'Description',
  placeholder = 'Describe this location (optional)',
  maxLength = 500,
  rows = 3,
  required = false,
  id = 'location-description',
  className = '',
  showCharacterCount = true,
}) => {
  const currentLength = value?.length || 0;
  const isOverLimit = currentLength > maxLength;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm font-medium">
          {label} {required && '*'}
        </Label>
        {showCharacterCount && (
          <span className={`text-xs ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
            {currentLength}/{maxLength}
          </span>
        )}
      </div>
      <Textarea
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        maxLength={maxLength}
        className="resize-none border-gray-200 hover:border-gray-300 focus:border-blue-400 transition-all focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:ring-offset-0 h-28 sm:h-auto"
      />
    </div>
  );
};

export default LocationDescriptionField;

