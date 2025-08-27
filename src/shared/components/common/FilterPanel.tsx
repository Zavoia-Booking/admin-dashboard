import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { ChevronsUpDown, X, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

export type FilterFieldConfig =
  | {
      type: 'select';
      key: string;
      label: string;
      options: { value: string; label: string }[];
      value: string;
      placeholder?: string;
      searchable?: boolean;
    }
  | {
      type: 'text';
      key: string;
      label: string;
      value: string;
      placeholder?: string;
    };

interface FilterPanelProps {
  fields: FilterFieldConfig[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (values: Record<string, string>) => void;
  onClear: () => void;
  activeFilters?: { key: string; label: string; value: string }[];
  onBadgeRemove?: (key: string) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  fields,
  open,
  onOpenChange,
  onApply,
  onClear,
  activeFilters,
  onBadgeRemove,
}) => {
  // Local state for editing
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [popoverOpen, setPopoverOpen] = useState<Record<string, boolean>>({});

  // Sync local state with incoming field values when opened
  useEffect(() => {
    if (open) {
      const initial: Record<string, string> = {};
      fields.forEach(f => {
        initial[f.key] = f.value;
      });
      setLocalValues(initial);
    }
  }, [open, fields]);

  const handleFieldChange = (key: string, value: string) => {
    setLocalValues(prev => ({ ...prev, [key]: value }));
  };

  const handleClear = () => {
    const cleared: Record<string, string> = {};
    fields.forEach(f => {
      cleared[f.key] = f.type === 'select' ? 'all' : '';
    });
    setLocalValues(cleared);
    onClear();
  };

  const handleApply = () => {
    onApply(localValues);
    onOpenChange(false);
  };

  return (
    <div className={cn(
      'rounded-lg border border-input bg-white p-4 flex flex-col gap-4 shadow-md mb-4',
      !open && 'hidden'
    )}>
      <div className="flex flex-col sm:flex-row gap-4">
        {fields.map(field => (
          <div className="flex-1 min-w-[180px]" key={field.key}>
            <Label className="mb-1 block">{field.label}</Label>
            {field.type === 'select' ? (
              <Popover
                open={!!popoverOpen[field.key]}
                onOpenChange={open => setPopoverOpen(prev => ({ ...prev, [field.key]: open }))}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={!!popoverOpen[field.key]}
                    className="border-0 bg-muted/50 hover:bg-muted/70 h-12 text-base justify-between w-full"
                  >
                    {field.options.find(o => o.value === localValues[field.key])?.label || field.placeholder || 'Select'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[350px] p-0 z-[80]">
                  <Command>
                    {field.searchable !== false && (
                      <CommandInput placeholder={`Search ${field.label.toLowerCase()}...`} />
                    )}
                    <CommandList>
                      <CommandEmpty>No options found.</CommandEmpty>
                      <CommandGroup>
                        {field.options.map(option => (
                          <CommandItem
                            key={option.value}
                            value={option.value}
                            onSelect={() => {
                              handleFieldChange(field.key, option.value);
                              setPopoverOpen(prev => ({ ...prev, [field.key]: false }));
                            }}
                          >
                            {option.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder={field.placeholder || `Search by ${field.label.toLowerCase()}...`}
                  value={localValues[field.key] || ''}
                  onChange={e => handleFieldChange(field.key, e.target.value)}
                  className="border-0 bg-muted/50 hover:bg-muted/70 h-12 text-base font-medium pr-8 w-full placeholder:font-medium"
                  style={{ paddingLeft: '2.5rem' }}
                />
                {localValues[field.key] && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFieldChange(field.key, '')}
                    className="absolute right-1 top-1/2 h-6 w-6 p-0 -translate-y-1/2"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleClear}>
          Clear
        </Button>
        <Button size="sm" onClick={handleApply}>
          Apply Filters
        </Button>
      </div>
      {/* Active Filter Badges */}
      {activeFilters && onBadgeRemove && activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {activeFilters.map(f => (
            <Badge
              key={f.key}
              variant="secondary"
              className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
              onClick={() => onBadgeRemove(f.key)}
            >
              {f.label}: {f.value}
              <X className="h-4 w-4 ml-1" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}; 