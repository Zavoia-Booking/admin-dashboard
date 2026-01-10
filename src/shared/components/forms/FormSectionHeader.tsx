import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface FormSectionHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  iconBgColor?: string;
  iconColor?: string;
}

export const FormSectionHeader: React.FC<FormSectionHeaderProps> = ({
  icon: Icon,
  title,
  description,
  className = '',
  iconBgColor = 'bg-primary/10',
  iconColor = 'text-primary',
}) => {
  return (
    <div className={`flex items-center gap-3 pb-2 border-b border-border ${className}`}>
      <div className={`p-2 rounded-xl ${iconBgColor} ${iconColor.includes('text-') ? '' : iconColor}`}>
        <Icon className={`h-5 w-5 ${iconColor.includes('text-') ? iconColor : 'text-primary'}`} />
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground-1">{title}</h3>
        {description && (
          <p className="text-xs text-foreground-3 dark:text-foreground-2 mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
};

export default FormSectionHeader;

