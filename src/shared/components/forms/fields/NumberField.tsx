import React from 'react';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { AlertCircle } from 'lucide-react';

export interface NumberFieldProps {
  value: number | string;
  onChange: (value: number | string) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  id?: string;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
  symbol?: string; // Currency symbol (e.g., '€', '£', 'lei')
  iconPosition?: 'left' | 'right';
  helpText?: string;
}

export const NumberField: React.FC<NumberFieldProps> = ({
  value,
  onChange,
  error,
  label,
  placeholder,
  required = false,
  min,
  max,
  step,
  id,
  className = '',
  icon: Icon,
  symbol,
  iconPosition = 'left',
  helpText,
}) => {
  const hasIcon = !!Icon;
  const hasSymbol = !!symbol;
  const hasPrefix = hasIcon || hasSymbol;
  const iconPadding = hasPrefix 
    ? (iconPosition === 'left' ? '!pl-10' : '!pr-11')
    : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === '' || inputValue === '-') {
      onChange('');
      return;
    }
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      onChange(numValue);
    } else {
      onChange(inputValue);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={id} className="text-base font-medium">
          {label} {required && '*'}
        </Label>
      )}
      <div className="relative">
        {iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {Icon ? (
              <Icon className="h-4 w-4 text-foreground-3 dark:text-foreground-2" />
            ) : symbol ? (
              <span className="text-sm font-medium text-foreground-3 dark:text-foreground-2">{symbol}</span>
            ) : null}
          </div>
        )}
        <Input
          id={id}
          type="number"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          className={`${iconPadding} transition-all focus-visible:ring-1 focus-visible:ring-offset-0 ${
            error
              ? 'border-destructive bg-error-bg focus-visible:ring-error'
              : 'border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus'
          }`}
          aria-invalid={!!error}
        />
        {iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {Icon ? (
              <Icon className="h-4 w-4 text-primary" />
            ) : symbol ? (
              <span className="text-sm font-medium text-primary">{symbol}</span>
            ) : null}
          </div>
        )}
      </div>
      {helpText && !error && (
        <p className="text-xs text-foreground-3 dark:text-foreground-2">{helpText}</p>
      )}
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

export default NumberField;
