import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, MapPin, ChevronDown, AlertCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '../ui/drawer';
import { Button } from '../ui/button';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '../ui/command';
import { cn } from '../../lib/utils';
import { useIsMobile } from '../../hooks/use-mobile';
import { detectTimezone, getCountryTimezones } from '../../utils/timezones';

interface TimezoneSelectProps {
  value: string;
  onChange: (timezone: string) => void;
  error?: boolean | string;
  placeholder?: string;
  /** ISO 3166-1 alpha-2 country code to filter timezones (e.g., "us", "ro") */
  countryCode?: string;
}

interface DetectTimezoneButtonProps {
  onDetect: (timezone: string) => void;
  className?: string;
}

// Cache timezone list and offsets - computed once
const getTimezones = (() => {
  let cached: string[] | null = null;
  return () => {
    if (!cached) {
      cached = Intl.supportedValuesOf('timeZone');
    }
    return cached;
  };
})();

const getOffsetCache = new Map<string, string>();

const getOffset = (tz: string): string => {
  if (getOffsetCache.has(tz)) {
    return getOffsetCache.get(tz)!;
  }
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(now);
    const offset = parts.find(p => p.type === 'timeZoneName')?.value || '';
    getOffsetCache.set(tz, offset);
    return offset;
  } catch {
    return '';
  }
};

// Memoized timezone item component
const TimezoneItem = React.memo<{
  tz: string;
  isSelected: boolean;
  onSelect: (tz: string) => void;
}>(({ tz, isSelected, onSelect }) => {
  const offset = getOffset(tz);
  const displayName = tz.replace(/_/g, ' '); // Replace underscores with spaces
  
  return (
    <CommandItem
      key={tz}
      value={tz}
      onSelect={() => onSelect(tz)}
      className="cursor-pointer"
    >
      <Check
        className={cn(
          'mr-2 h-4 w-4',
          isSelected ? 'opacity-100' : 'opacity-0'
        )}
      />
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{displayName}</span>
        {offset && (
          <span className="text-xs text-muted-foreground">{offset}</span>
        )}
      </div>
    </CommandItem>
  );
});

TimezoneItem.displayName = 'TimezoneItem';

// Exported button component for detecting timezone
export const DetectTimezoneButton: React.FC<DetectTimezoneButtonProps> = ({
  onDetect,
  className,
}) => {
  const { t } = useTranslation('common');
  const handleDetect = () => {
    const detected = detectTimezone();
    onDetect(detected);
  };

  return (
    <button
      type="button"
      onClick={handleDetect}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-surface text-foreground-1 shadow-sm hover:bg-surface-hover active:bg-surface-active transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-0 cursor-pointer whitespace-nowrap',
        className
      )}
      title={t('timezoneSelect.autoDetect')}
    >
      <MapPin className="h-3.5 w-3.5 text-foreground-3 dark:text-foreground-2" />
      {t('timezoneSelect.autoDetectShort')}
    </button>
  );
};

export const TimezoneSelect: React.FC<TimezoneSelectProps> = React.memo(({
  value,
  onChange,
  error = false,
  placeholder = 'Select timezone...',
  countryCode,
}) => {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [displayCount, setDisplayCount] = useState(30);
  const scrollTimeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);
  const hasError = !!error;
  const errorMessage = typeof error === 'string' ? error : undefined;
  const isMobile = useIsMobile();

  // Get timezones for the selected country (or all if no country specified)
  const countryTimezones = useMemo(
    () => getCountryTimezones(countryCode),
    [countryCode]
  );

  // Auto-detect user timezone on mount, or auto-select if country has single timezone
  useEffect(() => {
    // If country has exactly one timezone, auto-select it
    if (countryTimezones && countryTimezones.length === 1) {
      const singleTz = countryTimezones[0];
      if (value !== singleTz) {
        onChange(singleTz);
      }
      return;
    }

    // If country changed and current value is not in the new country's timezones, clear it
    if (countryTimezones && value && !countryTimezones.includes(value)) {
      // Try to auto-detect, but only if it's in the country's timezones
      const detected = detectTimezone();
      if (countryTimezones.includes(detected)) {
        onChange(detected);
      } else {
        // Default to first timezone in the country
        onChange(countryTimezones[0]);
      }
      return;
    }

    // Auto-detect only if no value set
    if (!value || value.trim() === '') {
      const detected = detectTimezone();
      // If country is specified, only use detected if it matches
      if (countryTimezones) {
        if (countryTimezones.includes(detected)) {
          onChange(detected);
        } else {
          onChange(countryTimezones[0]);
        }
      } else {
        onChange(detected);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryTimezones, value]); // Re-run when the country changes or the value is cleared

  // Debounce search input (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset display count when debounced search changes or popover opens
  useEffect(() => {
    if (open) {
      setDisplayCount(30);
    }
  }, [debouncedSearch, open]);

  const allTimezones = useMemo(() => getTimezones(), []);

  // Base timezones: either filtered by country or all timezones
  const baseTimezones = useMemo(() => {
    if (!countryTimezones) return allTimezones;
    // Filter to only show timezones that exist in Intl and match the country
    return allTimezones.filter(tz => countryTimezones.includes(tz));
  }, [allTimezones, countryTimezones]);

  // Get all matching timezones (no cap) - uses debounced search
  const allFilteredTimezones = useMemo(() => {
    if (!open) return [];
    const query = debouncedSearch.toLowerCase().trim().replace(/\s+/g, ''); // Remove all spaces from query
    if (!query) return baseTimezones;
    
    return baseTimezones.filter(tz => {
      // Normalize timezone by removing underscores and spaces for comparison
      const normalizedTz = tz.toLowerCase().replace(/[_\s]+/g, '');
      return normalizedTz.includes(query);
    });
  }, [baseTimezones, debouncedSearch, open]);

  // Slice to display only the current batch
  const filteredTimezones = useMemo(() => {
    return allFilteredTimezones.slice(0, displayCount);
  }, [allFilteredTimezones, displayCount]);

  // Throttled infinite scroll handler (100ms throttle)
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (scrollTimeoutRef.current) return; // Skip if already scheduled
    
    const target = e.currentTarget;
    if (!target) return;
    
    scrollTimeoutRef.current = setTimeout(() => {
      const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
      
      if (bottom && displayCount < allFilteredTimezones.length) {
        setDisplayCount(prev => Math.min(prev + 30, allFilteredTimezones.length));
      }
      
      scrollTimeoutRef.current = undefined;
    }, 100);
  }, [displayCount, allFilteredTimezones.length]);

  // Display label for selected value
  const displayLabel = useMemo(() => {
    if (!value) return placeholder;
    const displayName = value.replace(/_/g, ' '); // Replace underscores with spaces
    const offset = getOffset(value);
    return offset ? `${displayName} (${offset})` : displayName;
  }, [value, placeholder]);

  const trigger = (
    <Button
      variant="outline"
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={open}
      className={cn(
        'w-full h-10 justify-between items-center font-normal transition-all focus-visible:ring-1 focus-visible:ring-offset-0 cursor-pointer',
        hasError
          ? 'border-destructive bg-error-bg hover:bg-error-bg hover:border-destructive focus-visible:ring-error'
          : 'border-border dark:border-border-subtle bg-surface dark:bg-neutral-900 hover:bg-surface-hover hover:border-border-strong focus:border-focus focus-visible:ring-focus text-foreground-1',
        !value && 'text-muted-foreground'
      )}
    >
      <span className="flex items-center gap-2 min-w-0">
        <Globe className="h-4 w-4 text-primary shrink-0" />
        <span className="truncate text-left">{displayLabel}</span>
      </span>
      <ChevronDown className={cn('h-4 w-4 text-neutral-700 transition-transform', open && 'rotate-180')} />
    </Button>
  );

  // Shared between both containers; only the list's height behaviour differs.
  const searchAndList = (listClassName: string) => (
    <>
      <div className="shrink-0 p-2 bg-popover">
        <CommandInput
          placeholder={t('placeholders.searchTimezones')}
          value={search}
          onValueChange={setSearch}
          className="border-0 focus:border-0 focus:ring-0 shadow-none"
        />
      </div>
      <CommandList className={listClassName} onScroll={handleScroll}>
        <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
          {t('timezoneSelect.noResults')}
        </CommandEmpty>
        <CommandGroup>
          {filteredTimezones.map((tz) => (
            <TimezoneItem
              key={tz}
              tz={tz}
              isSelected={value === tz}
              onSelect={(selectedTz) => {
                onChange(selectedTz);
                setOpen(false);
                setSearch('');
              }}
            />
          ))}
          {displayCount < allFilteredTimezones.length && (
            <div className="py-2 text-center text-xs text-muted-foreground">
              {t('timezoneSelect.showingCount', {
                shown: displayCount,
                total: allFilteredTimezones.length,
              })}
            </div>
          )}
        </CommandGroup>
      </CommandList>
    </>
  );

  const errorBlock = errorMessage && (
    <div className="h-5 mt-1">
      <p
        className="flex items-center gap-1.5 text-xs text-destructive"
        role="alert"
        aria-live="polite"
      >
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span>{errorMessage}</span>
      </p>
    </div>
  );

  // A popover is positioned against the trigger and is position:fixed, so once
  // the soft keyboard is up it can sit below the fold with no way to scroll it
  // back -- fixed elements don't move when a scroll container scrolls. A bottom
  // sheet is anchored to the viewport's bottom edge instead, which under
  // Capacitor is the top of the keyboard, so the search field stays in view.
  if (isMobile) {
    return (
      <div>
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
              <DrawerTitle className="text-foreground-1">
                {t('timezoneSelect.title')}
              </DrawerTitle>
              <DrawerDescription className="sr-only">
                {t('placeholders.searchTimezones')}
              </DrawerDescription>
            </DrawerHeader>
            <Command shouldFilter={false} className="flex min-h-0 flex-1 flex-col bg-transparent">
              {searchAndList(
                'max-h-none min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[calc(0.5rem+env(safe-area-inset-bottom))]'
              )}
            </Command>
          </DrawerContent>
        </Drawer>
        {errorBlock}
      </div>
    );
  }

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent className="w-[calc(100vw-2rem)] md:w-[420px] p-0 shadow-lg border border-border max-h-[min(320px,50vh)] overflow-hidden !z-[80]" align="start" side="bottom" sideOffset={8} avoidCollisions={true} collisionPadding={16}>
          <Command shouldFilter={false}>
            {searchAndList('max-h-[min(260px,40vh)] overflow-y-auto')}
          </Command>
        </PopoverContent>
      </Popover>
      {errorBlock}
    </div>
  );
});

