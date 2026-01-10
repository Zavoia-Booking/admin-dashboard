import React from 'react';
import { Button } from '../ui/button';

export interface AssignmentStat {
  label: string;
  value: number;
}

export interface AssignmentsCardProps {
  /**
   * Array of statistics to display (e.g., Team Members count, Locations count)
   * Leave empty or undefined for no statistics grid
   */
  stats?: AssignmentStat[];
  /**
   * Description text to show above the button
   */
  description: string;
  /**
   * Label for the button (e.g., "Go to Assignments")
   */
  buttonLabel?: string;
  /**
   * Click handler for the button
   */
  onButtonClick: () => void;
  /**
   * Optional CSS classes for the button
   */
  buttonClassName?: string;
}

/**
 * Reusable card component for displaying assignment-related information
 * Used in EditServiceSlider, EditLocationSlider, and TeamMemberProfileSlider
 */
export const AssignmentsCard: React.FC<AssignmentsCardProps> = ({
  stats = [],
  description,
  buttonLabel = 'Go to Assignments',
  onButtonClick,
  buttonClassName,
}) => {
  return (
    <div className="rounded-lg border border-border dark:border-border-strong bg-surface-2 p-6">
      <div className="space-y-4">
        {/* Statistics Grid - only show if stats are provided */}
        {stats && stats.length > 0 && (
          <>
            <div className={`grid gap-4 ${
              stats.length === 2 ? 'grid-cols-2' : 
              stats.length === 3 ? 'grid-cols-3' : 
              stats.length === 4 ? 'grid-cols-2 md:grid-cols-4' :
              'grid-cols-1'
            }`}>
              {stats.map((stat, index) => (
                <div key={index} className="space-y-1">
                  <p className="text-xs text-foreground-3 dark:text-foreground-2 uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-semibold text-foreground-1">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Divider - only show after stats if stats exist */}
            <div className="h-px bg-border dark:bg-border-strong"></div>
          </>
        )}

        {/* Description and action */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground-2 dark:text-foreground-1 leading-relaxed mb-3">
              {description}
            </p>
            <Button
              type="button"
              variant="outline"
              rounded="full"
              onClick={onButtonClick}
              className={`w-full sm:w-auto ${buttonClassName || ''}`}
            >
              {buttonLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

