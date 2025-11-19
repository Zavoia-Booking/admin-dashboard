import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';

export interface CollapsibleFormSectionProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
  iconBgColor?: string;
  iconColor?: string;
}

export const CollapsibleFormSection: React.FC<CollapsibleFormSectionProps> = ({
  icon: Icon,
  title,
  description,
  open,
  onOpenChange,
  children,
  className = '',
  iconBgColor = 'bg-primary/10 dark:bg-primary/20',
  iconColor = 'text-primary',
  defaultOpen = false,
}) => {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange} defaultOpen={defaultOpen}>
      <div className={`space-y-4 ${className}`}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between gap-3 pb-2 border-b border-border">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${iconBgColor}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div className="text-left">
                <h3 className="text-base font-semibold text-foreground-1">{title}</h3>
                {description && (
                  <p className="text-xs text-foreground-3 dark:text-foreground-2 mt-0.5">{description}</p>
                )}
              </div>
            </div>
            {open ? (
              <ChevronUp className="h-4 w-4 text-foreground-3 dark:text-foreground-2" />
            ) : (
              <ChevronDown className="h-4 w-4 text-foreground-3 dark:text-foreground-2" />
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>{children}</CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default CollapsibleFormSection;

