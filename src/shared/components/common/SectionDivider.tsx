import { cn } from "../../lib/utils";

interface SectionDividerProps {
  title: string;
  className?: string;
}

export const SectionDivider = ({ title, className }: SectionDividerProps) => (
  <div className={cn("flex items-end gap-2 mb-6 mt-8 px-1", className)}>
    <p className="text-sm font-medium text-foreground-3 dark:text-foreground-1 whitespace-nowrap">
      {title}
    </p>
    <div className="flex-1 h-px bg-border dark:bg-border-strong"></div>
  </div>
);

export default SectionDivider;

