import React from "react";

export interface SliderSectionHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export const SliderSectionHeader: React.FC<SliderSectionHeaderProps> = ({
  title,
  description,
  className = "",
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <h3 className="text-lg font-semibold text-foreground-1">{title}</h3>
      {description && (
        <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
};

export default SliderSectionHeader;
