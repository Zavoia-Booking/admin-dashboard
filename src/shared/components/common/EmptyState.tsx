import { type FC } from "react";
import { Button } from "../ui/button";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  icon?: LucideIcon;
  className?: string;
}

export const EmptyState: FC<EmptyStateProps> = ({
  title,
  description,
  actionButton,
  icon: Icon,
  className = "",
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-20 text-center gap-6 ${className}`}>
      {/* Abstract cards illustration with enhanced depth */}
      <div className="relative w-full max-w-md h-44 text-left">
        {/* Subtle background glow */}
        <div className="absolute inset-0 -top-4 -bottom-4 bg-gradient-to-b from-primary/5 dark:from-primary/10 via-transparent to-transparent blur-2xl opacity-50 dark:opacity-40" />
        
        {/* back cards with better shadows */}
        <div className="absolute inset-x-10 top-2 h-28 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-border shadow-lg opacity-70 rotate-[-14deg] blur-[0.5px]" />
        <div className="absolute inset-x-6 top-10 h-30 rounded-2xl bg-neutral-50 dark:bg-neutral-900/70 border border-border shadow-xl opacity-85 rotate-[10deg] blur-[0.5px]" />

        {/* front skeleton card - customizable icon */}
        <div className="absolute inset-x-2 top-6 h-32 rounded-2xl bg-surface dark:bg-neutral-900 border border-border shadow-xl overflow-hidden">
          <div className="h-full w-full px-5 py-4 flex flex-col gap-3">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                {/* Icon placeholder */}
                <div className="h-12 w-12 rounded-lg bg-neutral-300 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                  {Icon ? (
                    <Icon className="h-6 w-6 text-neutral-400 dark:text-neutral-600" />
                  ) : (
                    <div className="h-6 w-6 rounded bg-neutral-400 dark:bg-neutral-600" />
                  )}
                </div>
                {/* Title and metadata */}
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <div className="h-4 w-36 rounded bg-neutral-300 dark:bg-neutral-800" />
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-20 rounded-full bg-neutral-300/80 dark:bg-neutral-800/80" />
                    <div className="h-2.5 w-16 rounded-full bg-neutral-300/70 dark:bg-neutral-800/70" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Badge row */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="h-5 w-20 rounded-full bg-neutral-300/90 dark:bg-neutral-800/90" />
              <div className="h-5 w-16 rounded-full bg-neutral-300/80 dark:bg-neutral-800/80" />
            </div>
          </div>
        </div>
      </div>

      {/* Copy with better spacing */}
      <div className="space-y-2 max-w-md px-4">
        <h3 className="text-lg font-semibold text-foreground-1">
          {title}
        </h3>
        <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
          {description}
        </p>
        {actionButton && (
          <div className="pt-2">
            <Button 
              onClick={actionButton.onClick}
              variant={actionButton.icon ? "default" : "outline"}
              rounded="full"
            >
              {actionButton.icon && (
                <actionButton.icon className="mr-2 h-4 w-4" />
              )}
              {actionButton.label}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

