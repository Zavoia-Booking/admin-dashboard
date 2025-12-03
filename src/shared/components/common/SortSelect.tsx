import React from "react";
import type { LucideIcon } from "lucide-react";
import { Check, ArrowUpDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Command, CommandGroup, CommandItem, CommandList } from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

export interface SortOption {
  value: string;
  label: string;
  icon?: LucideIcon;
}

export interface SortGroup {
  label: string;
  options: SortOption[];
}

interface SortSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  groups: SortGroup[];
  placeholder?: string;
  className?: string;
}

export const SortSelect: React.FC<SortSelectProps> = ({
  value,
  onValueChange,
  groups,
  placeholder = "Sort",
  className,
}) => {
  const [open, setOpen] = React.useState(false);

  const selectedLabel =
    groups
      .flatMap((group) => group.options)
      .find((option) => option.value === value)?.label ?? "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          rounded="full"
          className={cn(
            "h-auto px-3 py-1.5 gap-1.5 border sidebar-border dark:bg-transparent dark:border-border-strong flex items-center justify-between dark:hover:bg-neutral-900",
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <ArrowUpDown className="h-4 w-4 text-foreground-3 dark:text-foreground-1" />
            <span
              className={cn(
                "truncate text-xs dark:text-foreground-1",
                !selectedLabel && "text-muted-foreground dark:text-foreground-1"
              )}
            >
              {selectedLabel || placeholder}
            </span>
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="!w-68 px-1 py-2" align="end">
        <Command>
          <CommandList className="scrollbar-hide">
            {groups.map((group, index) => (
              <div key={group.label}>
                {index > 0 && (
                  <div className="my-1 border-t border-border" />
                )}
                <CommandGroup
                  heading={
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.label}
                    </span>
                  }
                  className="px-1.5 py-1.5"
                >
                  {group.options.map((option) => {
                    const isSelected = value === option.value;
                    const Icon = option.icon;
                    return (
                      <CommandItem
                        key={option.value}
                        value={option.label}
                        onSelect={() => {
                          onValueChange(option.value);
                          setOpen(false);
                        }}
                        className={cn(
                          "cursor-pointer flex items-center gap-2 px-2 py-2 text-sm rounded-md",
                          isSelected && "bg-muted text-foreground-1 dark:bg-neutral-900 dark:text-foreground-1"
                        )}
                      >
                        {Icon && (
                          <Icon className="h-4 w-4 text-foreground-3 shrink-0" />
                        )}
                        <span className="flex-1 text-left truncate">
                          {option.label}
                        </span>
                        <Check
                          className={cn(
                            "h-4 w-4 text-primary shrink-0",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </div>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
