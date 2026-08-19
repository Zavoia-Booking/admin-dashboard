import React, { useState, useEffect, useMemo } from "react";
import { AlertCircle, ChevronDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Command, CommandList, CommandGroup, CommandItem } from "../ui/command";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerTitle,
  DrawerDescription,
} from "../ui/drawer";
import { cn } from "../../lib/utils";

interface CurrencySelectProps {
  value: string;
  onChange: (currency: string) => void;
  error?: string | boolean;
  placeholder?: string;
  id?: string;
  className?: string;
  /** id of the field's visible label. Preferred over `<Label htmlFor>`: label
   *  clicks forward to the button and pop the picker from 50px away. */
  ariaLabelledBy?: string;
}

// Most commonly used currencies in Europe
const CURRENCIES = [
  { code: "eur", name: "Euro" },
  { code: "usd", name: "US Dollar" },
  { code: "ron", name: "Romanian Leu" },
  { code: "gbp", name: "British Pound" },
  { code: "chf", name: "Swiss Franc" },
  { code: "sek", name: "Swedish Krona" },
  { code: "nok", name: "Norwegian Krone" },
  { code: "dkk", name: "Danish Krone" },
  { code: "pln", name: "Polish Zloty" },
  { code: "czk", name: "Czech Koruna" },
  { code: "huf", name: "Hungarian Forint" },
  { code: "bgn", name: "Bulgarian Lev" },
  { code: "hrk", name: "Croatian Kuna" },
  { code: "try", name: "Turkish Lira" },
];

export const CurrencySelect: React.FC<CurrencySelectProps> = ({
  value,
  onChange,
  error,
  id,
  className,
  ariaLabelledBy,
}) => {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const hasError = !!error;
  const errorMessage = typeof error === "string" ? error : undefined;

  // Detect mobile viewport — same pattern as SortSelect/CountrySelect.
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const selectedCurrency = CURRENCIES.find(
    (c) => c.code.toLowerCase() === (value || "eur").toLowerCase()
  );

  const displayLabel = useMemo(() => {
    if (selectedCurrency) {
      return `${selectedCurrency.code.toUpperCase()} / ${
        selectedCurrency.name
      }`;
    }
    return "EUR / Euro";
  }, [selectedCurrency]);

  const triggerButton = (
    <Button
      id={id}
      variant="outline"
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-labelledby={ariaLabelledBy}
      className={cn(
        "w-full !min-h-0 h-12 md:h-10 justify-between items-center font-normal transition-all focus-visible:ring-1 focus-visible:ring-offset-0 cursor-pointer",
        hasError
          ? "border-destructive bg-error-bg hover:bg-error-bg hover:border-destructive focus-visible:ring-error"
          : "border-border dark:border-border-subtle bg-surface dark:bg-neutral-900 hover:bg-surface-hover hover:border-border-strong focus:border-focus focus-visible:ring-focus"
      )}
    >
      <span className="flex items-center gap-2 min-w-0">
        <span className="truncate text-left">{displayLabel}</span>
      </span>
      <ChevronDown
        className={cn(
          "h-4 w-4 text-foreground-3 transition-transform shrink-0",
          open && "rotate-180"
        )}
      />
    </Button>
  );

  // Shared between drawer and popover; the drawer lifts CommandList's 300px
  // cap so the sheet grows to fit the options — same pattern as SortSelect.
  const currencyContent = (listClassName?: string) => (
    <Command className={listClassName ? "flex min-h-0 flex-1 flex-col bg-transparent px-2 pt-1" : undefined}>
      <CommandList className={cn("scrollbar-hide", listClassName)}>
        <CommandGroup>
          {CURRENCIES.map((currency) => {
            const isSelected =
              (value || "eur").toLowerCase() ===
              currency.code.toLowerCase();
            return (
              <CommandItem
                key={currency.code}
                value={`${currency.code} ${currency.name}`}
                onSelect={() => {
                  onChange(currency.code);
                  setOpen(false);
                }}
                className={cn(
                  "cursor-pointer",
                  // No hover on touch: cmdk's active-item wash is desktop-only;
                  // mobile highlights the actually-selected row instead — same
                  // treatment as SortSelect.
                  "data-[selected=true]:bg-transparent data-[selected=true]:text-inherit md:data-[selected=true]:bg-info-100 md:dark:data-[selected=true]:bg-neutral-900",
                  isSelected && "bg-info-100 text-foreground-1 dark:bg-neutral-900 dark:text-foreground-1"
                )}
              >
                <div className="flex items-center gap-3 w-full py-1.5">
                  {isSelected ? (
                    <Check className="h-4 w-4 text-green-400 shrink-0" />
                  ) : (
                    <span className="h-4 w-4 shrink-0" />
                  )}
                  <span className="text-sm">
                    <span className="text-foreground-3 dark:text-foreground-2 inline-block">
                      {currency.code.toUpperCase()} /
                    </span>
                    <span className="pl-1">{currency.name}</span>
                  </span>
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  return (
    <div className={cn("space-y-2 pt-2", className)}>
      {isMobile ? (
        <Drawer autoFocus open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
          <DrawerContent
            className="flex max-h-[85dvh] flex-col outline-none !z-[100]"
            overlayClassName="!z-[95]"
          >
            <DrawerTitle className="sr-only">Currency</DrawerTitle>
            <DrawerDescription className="sr-only">
              Select currency
            </DrawerDescription>
            {currencyContent(
              "max-h-none min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[calc(1rem+env(safe-area-inset-bottom))]"
            )}
          </DrawerContent>
        </Drawer>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
          <PopoverContent
            className="w-[calc(100vw-2rem)] md:w-[400px] py-4 px-1 shadow-lg border border-border"
            align="start"
          >
            {currencyContent()}
          </PopoverContent>
        </Popover>
      )}
      <div className="min-h-5">
        {errorMessage && (
          <p
            className="mt-1 flex items-center gap-1.5 text-xs text-destructive"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default CurrencySelect;
