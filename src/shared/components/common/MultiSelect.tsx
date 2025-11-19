import React, { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty } from "../ui/command";
import { Checkbox } from "../ui/checkbox";
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
              "w-full h-10 justify-between items-center font-normal transition-all focus-visible:ring-1 focus-visible:ring-offset-0 cursor-pointer",
              "border-gray-200 hover:border-gray-300 focus:border-blue-400 focus-visible:ring-blue-400"
            )}
          >
            <span className="flex items-center gap-2 min-w-0">
              <span className="truncate text-left capitalize">{displayLabel}</span>
              {selectedOptions.length > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({selectedOptions.length})
                </span>
              )}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-gray-400 transition-transform shrink-0",
                open && "rotate-180"
              )}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[calc(100vw-2rem)] md:w-[400px] p-0 shadow-lg border border-gray-200"
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
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggle(option.id)}
                          className="shrink-0 h-3.5 w-3.5 !min-h-0 !min-w-0 !rounded-[2px] [&_svg]:h-2.5 [&_svg]:w-2.5"
                        />
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

