import React from "react";
import { cn } from "../../lib/utils";

interface SliderContentDividerProps {
  className?: string;
}

export const SliderContentDivider: React.FC<SliderContentDividerProps> = ({ className }) => (
  <div className={cn("flex items-end gap-2 mb-6 pt-4", className)}>
    <div className="flex-1 h-px bg-border dark:bg-border-strong" />
  </div>
);

export default SliderContentDivider;
