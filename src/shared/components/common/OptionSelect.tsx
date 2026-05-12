import React, { useState, useMemo } from "react";
import { AlertCircle, ChevronDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Command, CommandList, CommandGroup, CommandItem } from "../ui/command";
import { cn } from "../../lib/utils";

export interface OptionSelectOption {
  value: string;
  label: string;
}

export interface OptionSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: OptionSelectOption[];
  label?: string;
  placeholder?: string;
  error?: string | boolean;
  id?: string;
  className?: string;
}

export const OptionSelect: React.FC<OptionSelectProps> = ({
  value,
  onChange,
  options,
  label,
  placeholder = "Select...",
  error,
  id,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const hasError = !!error;
  const errorMessage = typeof error === "string" ? error : undefined;

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  );

  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <div className={cn("space-y-2 pt-2", className)}>
      {label && (
        <Label className="text-base font-medium mb-0" htmlFor={id}>{label}</Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={open}
            className={cn(
              "w-full !min-h-0 h-12 md:h-10 justify-between items-center font-normal transition-all focus-visible:ring-1 focus-visible:ring-offset-0 cursor-pointer",
              hasError
                ? "border-destructive bg-error-bg hover:bg-error-bg hover:border-destructive focus-visible:ring-error"
                : "border-border dark:border-border-subtle bg-surface dark:bg-neutral-900 hover:bg-surface-hover hover:border-border-strong focus:border-focus focus-visible:ring-focus"
            )}
          >
            <span className="flex items-center gap-2 min-w-0">
              <span className={cn("truncate text-left", !selectedOption && "text-muted-foreground")}>
                {displayLabel}
              </span>
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-foreground-3 transition-transform shrink-0",
                open && "rotate-180"
              )}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] min-w-[8rem] max-w-[400px] py-4 px-1 shadow-lg border border-border"
          align="start"
        >
          <Command>
            <CommandList>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = value === option.value;
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-3 w-full py-1.5">
                        {isSelected ? (
                          <Check className="h-4 w-4 text-green-400 shrink-0" />
                        ) : (
                          <span className="h-4 w-4 shrink-0" />
                        )}
                        <span className="text-sm">{option.label}</span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <div className="h-5">
        {errorMessage && (
          <p
            className="mt-1 flex items-center gap-1.5 text-xs text-destructive"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{errorMessage}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default OptionSelect;
