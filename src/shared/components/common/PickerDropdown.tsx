import type { ComponentProps, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { Command, CommandGroup, CommandItem, CommandList } from "../ui/command";
import "../../styles/picker-dropdown.css";

export const pickerDropdownOpenTriggerClass =
  "!rounded-b-none !rounded-t-[22px] border-x border-t border-b border-border-strong shadow-none dark:border-border-strong";

export const pickerDropdownPanelClass =
  "add-appointment-popover-expand box-border max-h-[min(320px,50vh)] overflow-hidden rounded-t-none rounded-b-[22px] border border-t-0 border-border-strong bg-surface p-0 shadow-md dark:border-border-strong dark:bg-neutral-900";

export function PickerDropdownChevron({ open }: { open: boolean }) {
  return (
    <ChevronDown
      className={cn("h-4 w-4 shrink-0 text-foreground-3 transition-transform", open && "rotate-180")}
      aria-hidden
    />
  );
}

interface PickerDropdownListProps {
  children: ReactNode;
  heading?: string;
  label?: string;
  className?: string;
}

export function PickerDropdownList({ children, heading, label, className }: PickerDropdownListProps) {
  return (
    <Command label={label} tabIndex={label ? 0 : undefined} shouldFilter={false} className="w-full min-w-0 max-w-full">
      <CommandList className={cn("max-h-[min(260px,40vh)] w-full min-w-0 max-w-full overflow-x-hidden overflow-y-auto", className)}>
        <CommandGroup heading={heading}>{children}</CommandGroup>
      </CommandList>
    </Command>
  );
}

export function PickerDropdownItem({ last, className, ...props }: ComponentProps<typeof CommandItem> & { last?: boolean }) {
  return (
    <CommandItem
      {...props}
      className={cn("flex cursor-pointer items-center gap-2 p-3", last && "rounded-b-[18px]", className)}
    />
  );
}
