import React from 'react';
import { cn } from '../../lib/utils';

export interface DashedDividerProps {
  /**
   * Top margin (spacing before the divider)
   * @default "mt-4"
   */
  marginTop?: string;
  /**
   * Top padding (spacing after the divider)
   * @default "pt-4"
   */
  paddingTop?: string;
  /**
   * Dash pattern: "dash gap" in pixels
   * @default "1 1"
   */
  dashPattern?: string;
  /**
   * Stroke width in pixels
   * @default "1"
   */
  strokeWidth?: number | string;
  /**
   * Color class (e.g., "text-border-strong", "text-border")
   * @default "text-border-strong"
   */
  color?: string;
  /**
   * Additional className for the container
   */
  className?: string;
}

export const DashedDivider: React.FC<DashedDividerProps> = ({
  marginTop = 'mt-4',
  paddingTop = 'pt-4',
  dashPattern = '1 1',
  strokeWidth = 1,
  color = 'text-border-strong',
  className = '',
}) => {
  return (
    <div className={cn(marginTop, paddingTop, className)}>
      <svg 
        className="w-full h-px" 
        aria-hidden="true" 
        preserveAspectRatio="none" 
        viewBox="0 0 100 1"
      >
        <line
          x1="0"
          y1="0.5"
          x2="100"
          y2="0.5"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={dashPattern}
          className={color}
        />
      </svg>
    </div>
  );
};

export default DashedDivider;

