import React, { useState } from 'react';
import { Label } from '../../ui/label';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../../ui/command';
import { Plus, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface EntityOption {
  id: number | string;
  name: string;
  icon?: LucideIcon;
  subtitle?: string;
}

export interface EntitySelectorProps {
  value: (number | string)[];
  onChange: (value: (number | string)[]) => void;
  options: EntityOption[];
  label?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  emptyHelperText?: string;
  addButtonLabel?: string;
  addMoreButtonLabel?: string;
  icon?: LucideIcon;
  className?: string;
  required?: boolean;
  error?: string;
}

export const EntitySelector: React.FC<EntitySelectorProps> = ({
  value = [],
  onChange,
  options,
  label,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No items found.',
  emptyHelperText,
  addButtonLabel = 'Add',
  addMoreButtonLabel = 'Add More',
  icon: Icon,
  className = '',
  required = false,
  error,
}) => {
  const [open, setOpen] = useState(false);

  const selectedOptions = options.filter((option) => value.includes(option.id));

  const handleToggle = (optionId: number | string) => {
    const newValue = value.includes(optionId)
      ? value.filter((id) => id !== optionId)
      : [...value, optionId];
    onChange(newValue);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <Label className="text-base font-medium">
          {label} {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <div className="space-y-2">
        {selectedOptions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedOptions.map((option) => {
              const OptionIcon = option.icon || Icon;
              return (
                <Badge
                  key={option.id}
                  variant="secondary"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm"
                >
                  {OptionIcon && <OptionIcon className="h-3.5 w-3.5" />}
                  {option.name}
                  <button
                    type="button"
                    onClick={() => handleToggle(option.id)}
                    className="ml-1 rounded-full hover:bg-destructive/20 p-0.5 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full h-10 border-dashed border-border text-foreground-3 dark:text-foreground-2 hover:text-foreground-1 hover:border-border-strong"
            >
              <Plus className="h-4 w-4 mr-2" />
              {value.length === 0 ? addButtonLabel : addMoreButtonLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[350px] p-0 z-[80]">
            <Command>
              <CommandInput placeholder={searchPlaceholder} />
              <CommandList>
                <CommandEmpty>{emptyMessage}</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => {
                    const isSelected = value.includes(option.id);
                    const OptionIcon = option.icon || Icon;
                    return (
                      <CommandItem
                        key={option.id}
                        value={option.name}
                        onSelect={() => handleToggle(option.id)}
                        className="flex items-center gap-3 p-3"
                      >
                        <div
                          className={`h-4 w-4 rounded border-2 flex items-center justify-center ${
                            isSelected
                              ? 'bg-primary border-primary'
                              : 'border-border'
                          }`}
                        >
                          {isSelected && (
                            <div className="h-2 w-2 rounded-full bg-white" />
                          )}
                        </div>
                        {OptionIcon && (
                          <OptionIcon className="h-4 w-4 text-foreground-3 dark:text-foreground-2" />
                        )}
                        <span className="flex-1">{option.name}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {emptyHelperText && value.length === 0 && (
          <p className="text-xs text-foreground-3 dark:text-foreground-2">
            {emptyHelperText}
          </p>
        )}
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
};

export default EntitySelector;

