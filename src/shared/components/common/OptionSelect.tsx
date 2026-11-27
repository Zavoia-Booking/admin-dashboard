import React, { useId, useState, useMemo } from "react";
import { ChevronDown, Check } from "lucide-react";
import { InlineError } from "../ui/inline-error";
import { ResponsivePopover } from "../ui/responsive-popover";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Command, CommandList, CommandGroup, CommandItem } from "../ui/command";
import { cn } from "../../lib/utils";
import { useIsMobile } from "../../hooks/use-mobile";

export interface OptionSelectOption {
  value: string;
  label: string;
}

export interface OptionSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: OptionSelectOption[];
  label?: string;
  placeholder?: string;
  error?: string | boolean;
  reserveErrorSpace?: boolean;
  id?: string;
  className?: string;
}

export const OptionSelect: React.FC<OptionSelectProps> = ({
  value,
  onChange,
  options,
  label,
  placeholder = "Select...",
  error,
  reserveErrorSpace = true,
  id,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;
  const hasError = !!error;
  const errorMessage = typeof error === "string" ? error : undefined;

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  );

  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <div className={cn("space-y-2 pt-2", className)}>
      {label && (
        <Label className="text-base font-medium mb-0" htmlFor={fieldId}>{label}</Label>
      )}
      <ResponsivePopover
        open={open}
        onOpenChange={setOpen}
        title={label ?? placeholder}
        contentClassName="w-[var(--radix-popover-trigger-width)] min-w-[8rem] max-w-[400px] py-4 px-1 shadow-lg border border-border"
        drawerBodyClassName="px-2"
        trigger={
          <Button
            id={fieldId}
            type="button"
            variant="outline"
            role={isMobile ? undefined : "combobox"}
            aria-haspopup={isMobile ? "dialog" : "listbox"}
            aria-expanded={open}
            aria-invalid={hasError || undefined}
            aria-describedby={errorMessage ? errorId : undefined}
            className={cn(
              "w-full !min-h-0 h-12 md:h-10 justify-between items-center font-normal transition-all focus-visible:ring-1 focus-visible:ring-offset-0 cursor-pointer",
              hasError
                ? "border-destructive bg-error-bg hover:bg-error-bg hover:border-destructive focus-visible:ring-error"
                : "border-border dark:border-border-subtle bg-surface dark:bg-neutral-900 hover:bg-surface-hover hover:border-border-strong focus:border-focus focus-visible:ring-focus"
            )}
          >
            <span className="flex items-center gap-2 min-w-0">
              <span className={cn("truncate text-left", !selectedOption && "text-muted-foreground")}>
                {displayLabel}
              </span>
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-foreground-3 transition-transform shrink-0",
                open && "rotate-180"
              )}
            />
          </Button>
        }
      >
        <Command className={isMobile ? "bg-transparent" : undefined}>
          <CommandList className={isMobile ? "max-h-none overflow-visible" : undefined}>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = value === option.value;
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "cursor-pointer",
                      isMobile && (isSelected
                        ? "bg-info-100 text-foreground-1 dark:bg-neutral-900"
                        : "data-[selected=true]:bg-transparent dark:data-[selected=true]:bg-transparent data-[selected=true]:text-inherit"),
                    )}
                  >
                    <div className="flex items-center gap-3 w-full py-1.5">
                      {isSelected ? (
                        <Check className="h-4 w-4 text-green-400 shrink-0" />
                      ) : (
                        <span className="h-4 w-4 shrink-0" />
                      )}
                      <span className="text-sm">{option.label}</span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </ResponsivePopover>
      <InlineError id={errorId} message={errorMessage} reserveSpace={reserveErrorSpace} />
    </div>
  );
};

export default OptionSelect;
