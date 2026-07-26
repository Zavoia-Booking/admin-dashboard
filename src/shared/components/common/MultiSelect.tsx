import React, { useState, useMemo } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { Button } from "../ui/button";
import { Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty } from "../ui/command";
import { cn } from "../../lib/utils";
import { useIsMobile } from "../../hooks/use-mobile";

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
  /** Heading for the mobile bottom sheet; falls back to `placeholder`. */
  title?: string;
  emptyLabel?: string;
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
  title,
  emptyLabel = "No items found.",
  id,
  className,
  maxDisplay = 2,
}) => {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

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

  const trigger = (
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
  );

  // Shared between both containers; only the list's height behaviour differs.
  const searchAndList = (listClassName?: string) => (
    <>
      <div className="shrink-0">
        <CommandInput placeholder={searchPlaceholder} />
      </div>
      <CommandList className={listClassName}>
        <CommandEmpty>{emptyLabel}</CommandEmpty>
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
    </>
  );

  // A popover is positioned against the trigger and is position:fixed, so once
  // the soft keyboard is up it can sit below the fold with no way to scroll it
  // back -- fixed elements don't move when a scroll container scrolls. A bottom
  // sheet is anchored to the viewport's bottom edge instead, which under
  // Capacitor is the top of the keyboard, so the search field stays in view.
  if (isMobile) {
    return (
      <div className={className}>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>{trigger}</DrawerTrigger>
          <DrawerContent
            className="flex max-h-[85dvh] flex-col bg-white dark:bg-surface border-border !z-[80]"
            overlayClassName="!z-[75]"
            // Open showing the list; the keyboard only appears if the user
            // actually taps the search field. Focus is parked on the panel
            // rather than simply suppressed, so it does not stay on the trigger
            // -- which Radix puts inside an aria-hidden subtree while the
            // drawer is open, hiding the focused element from assistive tech.
            tabIndex={-1}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              (event.currentTarget as HTMLElement | null)?.focus?.();
            }}
          >
            <DrawerHeader className="shrink-0 pb-1 text-left">
              <DrawerTitle className="text-foreground-1">{title ?? placeholder}</DrawerTitle>
              <DrawerDescription className="sr-only">{searchPlaceholder}</DrawerDescription>
            </DrawerHeader>
            <Command className="flex min-h-0 flex-1 flex-col bg-transparent">
              {searchAndList(
                "max-h-none min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
              )}
            </Command>
          </DrawerContent>
        </Drawer>
      </div>
    );
  }

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          className="w-[calc(100vw-2rem)] md:w-[400px] p-0 shadow-lg border border-border bg-popover"
          align="start"
        >
          <Command>{searchAndList()}</Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MultiSelect;

