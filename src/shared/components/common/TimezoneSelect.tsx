import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Globe, Check, MapPin, ChevronDown, AlertCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '../ui/command';
import { cn } from '../../lib/utils';

interface TimezoneSelectProps {
  value: string;
  onChange: (timezone: string) => void;
  error?: boolean | string;
  placeholder?: string;
  /** ISO 3166-1 alpha-2 country code to filter timezones (e.g., "us", "ro") */
  countryCode?: string;
}

// Country code to IANA timezone mapping
// Maps ISO 3166-1 alpha-2 codes to arrays of IANA timezone identifiers
const COUNTRY_TIMEZONES: Record<string, string[]> = {
  // Europe
  ro: ['Europe/Bucharest'],
  de: ['Europe/Berlin', 'Europe/Busingen'],
  gb: ['Europe/London'],
  fr: ['Europe/Paris'],
  it: ['Europe/Rome'],
  es: ['Europe/Madrid', 'Atlantic/Canary', 'Africa/Ceuta'],
  nl: ['Europe/Amsterdam'],
  be: ['Europe/Brussels'],
  at: ['Europe/Vienna'],
  ch: ['Europe/Zurich'],
  pl: ['Europe/Warsaw'],
  cz: ['Europe/Prague'],
  hu: ['Europe/Budapest'],
  bg: ['Europe/Sofia'],
  pt: ['Europe/Lisbon', 'Atlantic/Madeira', 'Atlantic/Azores'],
  gr: ['Europe/Athens'],
  se: ['Europe/Stockholm'],
  dk: ['Europe/Copenhagen'],
  no: ['Europe/Oslo'],
  fi: ['Europe/Helsinki'],
  ie: ['Europe/Dublin'],
  al: ['Europe/Tirane'],
  ad: ['Europe/Andorra'],
  am: ['Asia/Yerevan'],
  az: ['Asia/Baku'],
  by: ['Europe/Minsk'],
  ba: ['Europe/Sarajevo'],
  hr: ['Europe/Zagreb'],
  cy: ['Asia/Nicosia', 'Asia/Famagusta'],
  ee: ['Europe/Tallinn'],
  ge: ['Asia/Tbilisi'],
  is: ['Atlantic/Reykjavik'],
  xk: ['Europe/Belgrade'], // Kosovo uses same as Serbia
  lv: ['Europe/Riga'],
  li: ['Europe/Vaduz'],
  lt: ['Europe/Vilnius'],
  lu: ['Europe/Luxembourg'],
  mt: ['Europe/Malta'],
  md: ['Europe/Chisinau'],
  mc: ['Europe/Monaco'],
  me: ['Europe/Podgorica'],
  mk: ['Europe/Skopje'],
  rs: ['Europe/Belgrade'],
  sk: ['Europe/Bratislava'],
  si: ['Europe/Ljubljana'],
  ua: ['Europe/Kiev', 'Europe/Kyiv', 'Europe/Simferopol'],
  // Americas
  us: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu', 'America/Phoenix', 'America/Detroit', 'America/Indiana/Indianapolis', 'America/Boise', 'America/Juneau', 'America/Adak'],
  ca: ['America/Toronto', 'America/Vancouver', 'America/Edmonton', 'America/Winnipeg', 'America/Halifax', 'America/St_Johns', 'America/Regina', 'America/Whitehorse', 'America/Yellowknife'],
  mx: ['America/Mexico_City', 'America/Tijuana', 'America/Cancun', 'America/Monterrey', 'America/Hermosillo', 'America/Chihuahua', 'America/Mazatlan'],
  br: ['America/Sao_Paulo', 'America/Rio_Branco', 'America/Manaus', 'America/Cuiaba', 'America/Fortaleza', 'America/Recife', 'America/Belem', 'America/Bahia', 'America/Noronha'],
  ar: ['America/Argentina/Buenos_Aires', 'America/Argentina/Cordoba', 'America/Argentina/Mendoza'],
  cl: ['America/Santiago', 'Pacific/Easter'],
  co: ['America/Bogota'],
  // Asia-Pacific
  au: ['Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane', 'Australia/Perth', 'Australia/Adelaide', 'Australia/Darwin', 'Australia/Hobart'],
  nz: ['Pacific/Auckland', 'Pacific/Chatham'],
  jp: ['Asia/Tokyo'],
  kr: ['Asia/Seoul'],
  sg: ['Asia/Singapore'],
  hk: ['Asia/Hong_Kong'],
  tw: ['Asia/Taipei'],
  cn: ['Asia/Shanghai', 'Asia/Urumqi'],
  in: ['Asia/Kolkata'],
  th: ['Asia/Bangkok'],
  my: ['Asia/Kuala_Lumpur'],
  ph: ['Asia/Manila'],
  id: ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'],
  vn: ['Asia/Ho_Chi_Minh'],
  // Middle East & Africa
  ae: ['Asia/Dubai'],
  il: ['Asia/Jerusalem'],
  tr: ['Europe/Istanbul'],
  za: ['Africa/Johannesburg'],
};

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

// Utility function to detect timezone
const detectTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

// Exported button component for detecting timezone
export const DetectTimezoneButton: React.FC<DetectTimezoneButtonProps> = ({
  onDetect,
  className,
}) => {
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
      title="Auto-detect timezone from your browser"
    >
      <MapPin className="h-3.5 w-3.5 text-foreground-3 dark:text-foreground-2" />
      Auto-detect
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
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [displayCount, setDisplayCount] = useState(30);
  const scrollTimeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);
  const hasError = !!error;
  const errorMessage = typeof error === 'string' ? error : undefined;

  // Get timezones for the selected country (or all if no country specified)
  const countryTimezones = useMemo(() => {
    if (!countryCode) return null;
    const code = countryCode.toLowerCase();
    return COUNTRY_TIMEZONES[code] || null;
  }, [countryCode]);

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
  }, [countryTimezones]); // Re-run when country changes

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

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={open}
            className={cn(
              'w-full h-10 justify-between items-center font-normal transition-all focus-visible:ring-1 focus-visible:ring-offset-0 cursor-pointer',
              hasError
                ? 'border-destructive bg-error-bg hover:bg-error-bg hover:border-destructive focus-visible:ring-error'
                : 'border-border bg-info-100 hover:bg-info-100 hover:border-border focus:border-focus focus-visible:ring-focus text-neutral-900',
              !value && 'text-muted-foreground'
            )}
          >
            <span className="flex items-center gap-2 min-w-0">
              <Globe className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate text-left">{displayLabel}</span>
            </span>
            <ChevronDown className={cn('h-4 w-4 text-neutral-700 transition-transform', open && 'rotate-180')} />
          </Button>
        </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] md:w-[420px] p-0 shadow-lg border border-border max-h-[min(320px,50vh)] overflow-hidden !z-[80]" align="start" side="bottom" sideOffset={8} avoidCollisions={true} collisionPadding={16}>
        <Command shouldFilter={false}>
          <div className="p-2 bg-popover">
            <CommandInput 
              placeholder="Search timezones..." 
              value={search}
              onValueChange={setSearch}
              className="border-0 focus:border-0 focus:ring-0 shadow-none"
            />
          </div>
          <CommandList className="max-h-[min(260px,40vh)] overflow-y-auto" onScroll={handleScroll}>
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">No timezone found.</CommandEmpty>
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
                  Showing {displayCount} of {allFilteredTimezones.length} timezones...
                </div>
              )}
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
});

