import React, { useState, useMemo } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty } from "../ui/command";
import { cn } from "../../lib/utils";

export interface MultiSelectOption {
  id: number | string;
  name: string;
  subtitle?: string;
}

interface MultiSelectProps {
  value: (number | string)[];
  onChange: (selectedIds: (number | string)[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  id?: string;
  className?: string;
  maxDisplay?: number;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  value = [],
  onChange,
  options,
  placeholder = "Select items",
  searchPlaceholder = "Search...",
  id,
  className,
  maxDisplay = 2,
}) => {
  const [open, setOpen] = useState(false);

  const selectedOptions = useMemo(() => {
    return options.filter((option) => value.includes(option.id));
  }, [options, value]);

  const displayLabel = useMemo(() => {
    if (selectedOptions.length === 0) {
      return placeholder;
    }
    if (selectedOptions.length === 1) {
      return selectedOptions[0].name;
    }
    if (selectedOptions.length <= maxDisplay) {
      return `${selectedOptions.length} items selected`;
    }
    return `${selectedOptions.length} items selected`;
  }, [selectedOptions, placeholder, maxDisplay]);

  const handleToggle = (optionId: number | string) => {
    const newValue = value.includes(optionId)
      ? value.filter((id) => id !== optionId)
      : [...value, optionId];
    onChange(newValue);
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={open}
            className={cn(
              "w-full h-12 md:h-10 justify-between items-center font-normal transition-all cursor-pointer",
              "border-border dark:border-border-subtle bg-surface dark:bg-neutral-900",
              "hover:border-border-strong hover:bg-surface/80",
              "focus-visible:border-focus focus-visible:ring-focus/50 focus-visible:ring-2 focus-visible:ring-offset-0"
            )}
          >
            <span className="flex items-center gap-2 min-w-0">
              <span
                className={cn(
                  "truncate text-left capitalize",
                  selectedOptions.length === 0 && "text-muted-foreground"
                )}
              >
                {displayLabel}
              </span>
              {selectedOptions.length > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({selectedOptions.length})
                </span>
              )}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform shrink-0",
                open && "rotate-180"
              )}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[calc(100vw-2rem)] md:w-[400px] p-0 shadow-lg border border-border bg-popover"
          align="start"
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>No items found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = value.some(v => String(v) === String(option.id));
                  return (
                    <CommandItem
                      key={option.id}
                      value={`${option.id} ${option.name} ${option.subtitle || ""}`}
                      onSelect={() => handleToggle(option.id)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-3 w-full py-1.5">
                        {isSelected ? (
                          <Check className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <span className="h-4 w-4 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium capitalize">{option.name}</div>
                          {option.subtitle && (
                            <div className="text-xs text-muted-foreground truncate capitalize">
                              {option.subtitle}
                            </div>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MultiSelect;

