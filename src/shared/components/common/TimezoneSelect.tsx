import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Globe, Check, MapPin, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '../ui/command';
import { cn } from '../../lib/utils';

interface TimezoneSelectProps {
  value: string;
  onChange: (timezone: string) => void;
  error?: boolean;
  placeholder?: string;
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
        'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-0 cursor-pointer whitespace-nowrap',
        className
      )}
      title="Auto-detect timezone from your browser"
    >
      <MapPin className="h-3.5 w-3.5 text-gray-400" />
      Auto-detect
    </button>
  );
};

export const TimezoneSelect: React.FC<TimezoneSelectProps> = React.memo(({
  value,
  onChange,
  error = false,
  placeholder = 'Select timezone...',
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [displayCount, setDisplayCount] = useState(30);
  const scrollTimeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);

  // Auto-detect user timezone on mount (only once)
  useEffect(() => {
    if (!value || value.trim() === '') {
      const detected = detectTimezone();
      onChange(detected);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

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

  // Get all matching timezones (no cap) - uses debounced search
  const allFilteredTimezones = useMemo(() => {
    if (!open) return [];
    const query = debouncedSearch.toLowerCase().trim().replace(/\s+/g, ''); // Remove all spaces from query
    if (!query) return allTimezones;
    
    return allTimezones.filter(tz => {
      // Normalize timezone by removing underscores and spaces for comparison
      const normalizedTz = tz.toLowerCase().replace(/[_\s]+/g, '');
      return normalizedTz.includes(query);
    });
  }, [allTimezones, debouncedSearch, open]);

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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            'w-full h-10 justify-between items-center font-normal transition-all focus-visible:ring-1 focus-visible:ring-offset-0 cursor-pointer',
            error
              ? 'border-destructive bg-red-50 hover:bg-red-50 hover:border-destructive focus-visible:ring-red-400'
              : 'border-gray-200 hover:border-gray-300 focus:border-blue-400 focus-visible:ring-blue-400',
            !value && 'text-muted-foreground'
          )}
        >
          <span className="flex items-center gap-2 min-w-0">
            <Globe className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="truncate text-left">{displayLabel}</span>
          </span>
          <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', open && 'rotate-180')} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] md:w-[420px] p-0 shadow-lg border border-gray-200 max-h-[70vh] overflow-hidden" align="start" side="bottom" sideOffset={8} avoidCollisions={false} collisionPadding={0}>
        <Command shouldFilter={false}>
          <div className="p-2 bg-popover">
            <CommandInput 
              placeholder="Search timezones..." 
              value={search}
              onValueChange={setSearch}
              className="border-0 focus:border-0 focus:ring-0 shadow-none"
            />
          </div>
          <CommandList className="max-h-[60vh] overflow-y-auto" onScroll={handleScroll}>
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
  );
});

