import { X, Info } from "lucide-react";
import { Button } from "./button";

interface BannerProps {
  children: React.ReactNode;
  variant?: 'info' | 'warning' | 'error';
  onDismiss?: () => void;
  className?: string;
}

export function Banner({ children, variant = 'info', onDismiss, className = '' }: BannerProps) {
  const variantStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  return (
    <div className={`relative flex items-start gap-3 p-4 border rounded-lg ${variantStyles[variant]} ${className}`}>
      <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1 text-sm">{children}</div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="h-6 w-6 p-0 hover:bg-transparent"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

