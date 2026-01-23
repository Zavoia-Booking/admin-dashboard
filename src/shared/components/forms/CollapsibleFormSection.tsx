import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';
import { useIsMobile } from '../../hooks/use-mobile';

export interface CollapsibleFormSectionProps {
  icon?: LucideIcon;
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
  const isMobile = useIsMobile();
  return (
    <Collapsible open={open} onOpenChange={onOpenChange} defaultOpen={defaultOpen}>
      <div className={`space-y-4 ${className}`}>
        <CollapsibleTrigger className="w-full cursor-pointer mb-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:ring-offset-0 rounded-md focus-visible:border transition-colors">
          <div className="flex items-center justify-between gap-3 pb-2">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className={`p-2 rounded-xl ${iconBgColor}`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
              )}
              <div className="text-left">
                <h3 className="text-base font-semibold text-foreground-1">{title}</h3>
                {description && (
                  <p className="text-sm text-foreground-3 dark:text-foreground-2 mt-0.5">{description}</p>
                )}
              </div>
            </div>
            {open ? (
              <ChevronUp
                className={`${isMobile ? 'h-8 w-8' : 'h-5 w-5'} text-foreground-3 dark:text-foreground-2`}
              />
            ) : (
              <ChevronDown
                className={`${isMobile ? 'h-8 w-8' : 'h-5 w-5'} text-foreground-3 dark:text-foreground-2`}
              />
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>{children}</CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default CollapsibleFormSection;

