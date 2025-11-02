import React, { useState, useMemo } from "react";
import { AlertCircle, ChevronDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Command, CommandList, CommandGroup, CommandItem } from "../ui/command";
import { cn } from "../../lib/utils";

interface CurrencySelectProps {
  value: string;
  onChange: (currency: string) => void;
  error?: string | boolean;
  placeholder?: string;
  id?: string;
  className?: string;
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
}) => {
  const [open, setOpen] = useState(false);
  const hasError = !!error;
  const errorMessage = typeof error === "string" ? error : undefined;

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
              hasError
                ? "border-destructive bg-red-50 hover:bg-red-50 hover:border-destructive focus-visible:ring-red-400"
                : "border-gray-200 hover:border-gray-300 focus:border-blue-400 focus-visible:ring-blue-400"
            )}
          >
            <span className="flex items-center gap-2 min-w-0">
              <span className="truncate text-left">{displayLabel}</span>
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
          className="w-[calc(100vw-2rem)] md:w-[400px] py-4 px-1 shadow-lg border border-gray-200"
          align="start"
        >
          <Command>
            <CommandList>
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
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-3 w-full py-1.5">
                        {isSelected ? (
                          <Check className="h-4 w-4 text-green-600 shrink-0" />
                        ) : (
                          <span className="h-4 w-4 shrink-0" />
                        )}
                        <span className="text-sm">
                          <span className="text-muted-foreground inline-block">
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
        </PopoverContent>
      </Popover>
      {errorMessage && (
        <div className="h-5 mt-1">
          <p
            className="flex items-center gap-1.5 text-xs text-destructive"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{errorMessage}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default CurrencySelect;
