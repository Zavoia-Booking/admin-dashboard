import React from 'react';
import { MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { cn } from '../../lib/utils';

export interface PinVerificationIndicatorProps {
  /**
   * Whether the pin has been confirmed
   */
  isPinConfirmed: boolean;
  /**
   * Whether geocoding is in progress
   */
  isGeocodingAddress?: boolean;
  /**
   * Callback when verify/move pin button is clicked
   */
  onVerifyClick: () => void;
  /**
   * Optional custom className for the container
   */
  className?: string;
}

/**
 * Reusable component for displaying location pin verification status
 * 
 * @example
 * ```tsx
 * <PinVerificationIndicator
 *   isPinConfirmed={isPinConfirmed}
 *   isGeocodingAddress={isGeocodingAddress}
 *   onVerifyClick={handleVerifyPinClick}
 * />
 * ```
 */
export const PinVerificationIndicator: React.FC<PinVerificationIndicatorProps> = ({
  isPinConfirmed,
  isGeocodingAddress = false,
  onVerifyClick,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row items-start md:justify-between gap-2 p-3 rounded-lg border',
        isPinConfirmed
          ? 'bg-success-bg/50 border-green-500'
          : 'bg-warning-bg/50 border-warning-border',
        className
      )}
    >
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0">
          {isPinConfirmed ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-primary/80 mt-0.5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4
            className={cn(
              'text-base font-medium',
              isPinConfirmed ? 'text-green-600' : 'text-primary/80'
            )}
          >
            {isPinConfirmed ? 'Location pin confirmed' : 'Location pin verification required'}
          </h4>
          <p className="text-sm text-foreground-1 mt-1">
            {isPinConfirmed
              ? 'Your location pin has been verified on the map.'
              : 'Please confirm the exact location of your pin on the map.'}
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant={isPinConfirmed ? 'outline' : 'default'}
        size="sm"
        rounded="full"
        onClick={onVerifyClick}
        disabled={isGeocodingAddress}
        className="flex-shrink-0 !min-w-42 md:!min-w-32 self-end"
      >
        {isGeocodingAddress ? (
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
        ) : (
          <>
            <MapPin className="h-4 w-4" />
            {isPinConfirmed ? 'Move Pin' : 'Verify Pin'}
          </>
        )}
      </Button>
    </div>
  );
};
