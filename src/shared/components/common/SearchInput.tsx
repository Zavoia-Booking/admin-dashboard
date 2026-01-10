import React from "react";
import { Search, X } from "lucide-react";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  debounceMs?: number;
  onChange?: (value: string) => void;
  onDebouncedChange?: (value: string) => void;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
}

/**
 * Reusable search input with built-in debounce and app-wide styling.
 * - Uses internal state + optional controlled `value`.
 * - Calls `onChange` on every keystroke.
 * - Calls `onDebouncedChange` after `debounceMs` (default 300ms).
 */
export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder,
  value,
  defaultValue,
  debounceMs = 300,
  onChange,
  onDebouncedChange,
  className,
  inputClassName,
  autoFocus,
}) => {
  const [internalValue, setInternalValue] = React.useState<string>(
    value ?? defaultValue ?? ""
  );

  // Keep internal state in sync when used as a controlled component
  React.useEffect(() => {
    if (value !== undefined && value !== internalValue) {
      setInternalValue(value);
    }
  }, [value, internalValue]);

  // Keep latest debounced callback in a ref to avoid effect thrashing on identity changes
  const debouncedCallbackRef = React.useRef<SearchInputProps["onDebouncedChange"] | undefined>(undefined);
  React.useEffect(() => {
    debouncedCallbackRef.current = onDebouncedChange;
  }, [onDebouncedChange]);

  // Debounce callback for consumers that want debounced search
  React.useEffect(() => {
    if (!debouncedCallbackRef.current) return;

    const timer = window.setTimeout(() => {
      debouncedCallbackRef.current?.(internalValue.trim());
    }, debounceMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [internalValue, debounceMs]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setInternalValue(next);
    onChange?.(next);
  };

  const handleClear = () => {
    setInternalValue("");
    onChange?.("");
    debouncedCallbackRef.current?.("");
  };

  const hasValue = internalValue.trim().length > 0;

  return (
    <div className={cn("relative w-full", className)}>
      <Input
        placeholder={placeholder}
        value={internalValue}
        onChange={handleChange}
        autoFocus={autoFocus}
        className={cn(
          "!h-11 text-base !pr-12 pl-4 !rounded-full border border-input bg-surface dark:bg-neutral-900 dark:border-border",
          inputClassName
        )}
      />
      {hasValue ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-3 flex items-center justify-center text-destructive hover:text-destructive/90 cursor-pointer"
          aria-label="Clear search"
        >
          <X className="h-5 w-5" />
        </button>
      ) : (
        <div className="absolute mr-2 inset-y-0 right-3 flex items-center justify-center pointer-events-none">
          <Search
            className="h-5 w-5 text-foreground-3 dark:text-foreground-2"
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
};


