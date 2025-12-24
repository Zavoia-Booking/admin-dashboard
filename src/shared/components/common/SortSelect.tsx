import React, { useState, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import { Check, ArrowUpDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Command, CommandGroup, CommandItem, CommandList } from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerTitle,
  DrawerDescription,
} from "../ui/drawer";

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
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const selectedLabel =
    groups
      .flatMap((group) => group.options)
      .find((option) => option.value === value)?.label ?? "";

  const triggerButton = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      rounded="full"
      className={cn(
        "h-auto px-3 py-1.5 gap-1.5 border transition-[colors,box-shadow,background-color,color] duration-200 ease-out flex items-center justify-between",
        open
          ? "bg-info-100 border-border-strong text-foreground-1 dark:bg-neutral-900 dark:text-foreground-1 dark:border-border-strong"
          : "border-border bg-surface-hover text-foreground-1 shadow-xs hover:bg-surface-active hover:border-border-strong dark:bg-transparent dark:text-foreground-1 dark:hover:bg-neutral-900 dark:border-border-strong",
        className
      )}
    >
      <span className="flex items-center gap-2 truncate">
        <ArrowUpDown className="h-4 w-4 text-foreground-3 dark:text-foreground-1" />
        <span
          className={cn(
            "truncate text-xs font-medium dark:text-foreground-1",
            !selectedLabel && "text-muted-foreground dark:text-foreground-1"
          )}
        >
          {selectedLabel || placeholder}
        </span>
      </span>
    </Button>
  );

  const sortContent = (
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
                      "data-[selected=true]:bg-transparent data-[selected=true]:text-inherit md:data-[selected=true]:bg-info-100 md:dark:data-[selected=true]:bg-neutral-900",
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
  );

  return (
    <>
      {isMobile ? (
        <Drawer
          autoFocus={true}
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (isOpen) {
              document.documentElement.style.scrollBehavior = "auto";
            } else {
              setTimeout(() => {
                document.documentElement.style.scrollBehavior = "smooth";
              }, 100);
            }
          }}
        >
          <DrawerTrigger asChild>
            {triggerButton}
          </DrawerTrigger>
          <DrawerContent
            className="outline-none !z-[80]"
            overlayClassName="!z-[75]"
          >
            <DrawerTitle className="sr-only">{placeholder}</DrawerTitle>
            <DrawerDescription className="sr-only">
              Select sorting option
            </DrawerDescription>
            <div className="p-4 overflow-y-auto space-y-4">
              {sortContent}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            {triggerButton}
          </PopoverTrigger>
          <PopoverContent className="!w-68 px-1 py-2 scrollbar-hide" align="end">
            {sortContent}
          </PopoverContent>
        </Popover>
      )}
    </>
  );
};
