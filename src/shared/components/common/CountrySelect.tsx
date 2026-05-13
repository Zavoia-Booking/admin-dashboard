import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, ChevronDown, Check, Globe, MapPin } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "../ui/command";
import { cn } from "../../lib/utils";

interface CountrySelectProps {
  value: string;
  onChange: (countryCode: string) => void;
  error?: string | boolean;
  placeholder?: string;
  id?: string;
  className?: string;
}

interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
}

// Common countries first, then alphabetical list of all countries
const COUNTRIES: Country[] = [
  // Most common (will be shown at top when no search)
  { code: "ro", name: "Romania" },
  { code: "de", name: "Germany" },
  { code: "gb", name: "United Kingdom" },
  { code: "us", name: "United States" },
  { code: "fr", name: "France" },
  { code: "it", name: "Italy" },
  { code: "es", name: "Spain" },
  { code: "nl", name: "Netherlands" },
  { code: "be", name: "Belgium" },
  { code: "at", name: "Austria" },
  { code: "ch", name: "Switzerland" },
  { code: "pl", name: "Poland" },
  { code: "cz", name: "Czech Republic" },
  { code: "hu", name: "Hungary" },
  { code: "bg", name: "Bulgaria" },
  { code: "pt", name: "Portugal" },
  { code: "gr", name: "Greece" },
  { code: "se", name: "Sweden" },
  { code: "dk", name: "Denmark" },
  { code: "no", name: "Norway" },
  { code: "fi", name: "Finland" },
  { code: "ie", name: "Ireland" },
  // Rest of Europe
  { code: "al", name: "Albania" },
  { code: "ad", name: "Andorra" },
  { code: "am", name: "Armenia" },
  { code: "az", name: "Azerbaijan" },
  { code: "by", name: "Belarus" },
  { code: "ba", name: "Bosnia and Herzegovina" },
  { code: "hr", name: "Croatia" },
  { code: "cy", name: "Cyprus" },
  { code: "ee", name: "Estonia" },
  { code: "ge", name: "Georgia" },
  { code: "is", name: "Iceland" },
  { code: "xk", name: "Kosovo" },
  { code: "lv", name: "Latvia" },
  { code: "li", name: "Liechtenstein" },
  { code: "lt", name: "Lithuania" },
  { code: "lu", name: "Luxembourg" },
  { code: "mt", name: "Malta" },
  { code: "md", name: "Moldova" },
  { code: "mc", name: "Monaco" },
  { code: "me", name: "Montenegro" },
  { code: "mk", name: "North Macedonia" },
  { code: "rs", name: "Serbia" },
  { code: "sk", name: "Slovakia" },
  { code: "si", name: "Slovenia" },
  { code: "ua", name: "Ukraine" },
  // Other major countries
  { code: "ca", name: "Canada" },
  { code: "au", name: "Australia" },
  { code: "nz", name: "New Zealand" },
  { code: "jp", name: "Japan" },
  { code: "kr", name: "South Korea" },
  { code: "sg", name: "Singapore" },
  { code: "ae", name: "United Arab Emirates" },
  { code: "il", name: "Israel" },
  { code: "tr", name: "Turkey" },
  { code: "br", name: "Brazil" },
  { code: "mx", name: "Mexico" },
  { code: "ar", name: "Argentina" },
  { code: "cl", name: "Chile" },
  { code: "co", name: "Colombia" },
  { code: "za", name: "South Africa" },
  { code: "in", name: "India" },
  { code: "cn", name: "China" },
  { code: "hk", name: "Hong Kong" },
  { code: "tw", name: "Taiwan" },
  { code: "th", name: "Thailand" },
  { code: "my", name: "Malaysia" },
  { code: "ph", name: "Philippines" },
  { code: "id", name: "Indonesia" },
  { code: "vn", name: "Vietnam" },
];

// Try to detect country from browser locale
const detectCountry = (): string | null => {
  try {
    // Try navigator.language first (e.g., "en-US", "ro-RO")
    const locale = navigator.language || (navigator as any).userLanguage;
    if (locale) {
      const parts = locale.split("-");
      if (parts.length >= 2) {
        const countryCode = parts[1].toLowerCase();
        // Verify it's in our list
        if (COUNTRIES.some(c => c.code === countryCode)) {
          return countryCode;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
};

// Exported button component for detecting country
interface DetectCountryButtonProps {
  onDetect: (countryCode: string) => void;
  className?: string;
}

export const DetectCountryButton: React.FC<DetectCountryButtonProps> = ({
  onDetect,
  className,
}) => {
  const { t } = useTranslation('common');
  const handleDetect = () => {
    const detected = detectCountry();
    if (detected) {
      onDetect(detected);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDetect}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-surface text-foreground-1 shadow-sm hover:bg-surface-hover active:bg-surface-active transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-0 cursor-pointer whitespace-nowrap',
        className
      )}
      title={t('countrySelect.autoDetect')}
    >
      <MapPin className="h-3.5 w-3.5 text-foreground-3 dark:text-foreground-2" />
      {t('countrySelect.autoDetectShort')}
    </button>
  );
};

export const CountrySelect: React.FC<CountrySelectProps> = ({
  value,
  onChange,
  error,
  placeholder = "Select country...",
  id,
  className,
}) => {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const hasError = !!error;
  const errorMessage = typeof error === "string" ? error : undefined;

  // Auto-detect country on mount if no value
  useEffect(() => {
    if (!value || value.trim() === '') {
      const detected = detectCountry();
      if (detected) {
        onChange(detected);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  const selectedCountry = useMemo(() => 
    COUNTRIES.find(c => c.code.toLowerCase() === (value || "").toLowerCase()),
    [value]
  );

  const filteredCountries = useMemo(() => {
    if (!debouncedSearch.trim()) return COUNTRIES;
    const query = debouncedSearch.toLowerCase().trim();
    return COUNTRIES.filter(
      c => c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query)
    );
  }, [debouncedSearch]);

  const displayLabel = useMemo(() => {
    if (selectedCountry) {
      return `${selectedCountry.name} (${selectedCountry.code.toUpperCase()})`;
    }
    return placeholder;
  }, [selectedCountry, placeholder]);

  const handleSelect = useCallback((countryCode: string) => {
    onChange(countryCode);
    setOpen(false);
    setSearch("");
  }, [onChange]);

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
                ? "border-destructive bg-error-bg hover:bg-error-bg hover:border-destructive focus-visible:ring-error"
                : "border-border dark:border-border-subtle bg-surface dark:bg-neutral-900 hover:bg-surface-hover hover:border-border-strong focus:border-focus focus-visible:ring-focus text-foreground-1",
              !value && "text-muted-foreground"
            )}
          >
            <span className="flex items-center gap-2 min-w-0">
              <Globe className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate text-left">{displayLabel}</span>
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-neutral-700 transition-transform shrink-0",
                open && "rotate-180"
              )}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[calc(100vw-2rem)] md:w-[420px] p-0 shadow-lg border border-border max-h-[min(320px,50vh)] overflow-hidden !z-[80]"
          align="start"
          side="bottom"
          sideOffset={8}
          avoidCollisions={true}
          collisionPadding={16}
        >
          <Command shouldFilter={false}>
            <div className="p-2 bg-popover">
              <CommandInput
                placeholder={t('placeholders.searchCountries')}
                value={search}
                onValueChange={setSearch}
                className="border-0 focus:border-0 focus:ring-0 shadow-none"
              />
            </div>
            <CommandList className="max-h-[min(260px,40vh)] overflow-y-auto">
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                No country found.
              </CommandEmpty>
              <CommandGroup>
                {filteredCountries.map((country) => {
                  const isSelected = (value || "").toLowerCase() === country.code.toLowerCase();
                  return (
                    <CommandItem
                      key={country.code}
                      value={country.code}
                      onSelect={() => handleSelect(country.code)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{country.name}</span>
                        <span className="text-xs text-muted-foreground">{country.code.toUpperCase()}</span>
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

export default CountrySelect;
