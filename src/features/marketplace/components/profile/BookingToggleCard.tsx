import React from "react";
import { Switch } from "../../../../shared/components/ui/switch";
import { cn } from "../../../../shared/lib/utils";
import { Badge } from "../../../../shared/components/ui/badge";

interface BookingToggleCardProps {
  onlineBooking: boolean;
  setOnlineBooking: (value: boolean) => void;
}

export const BookingToggleCard: React.FC<BookingToggleCardProps> = ({
  onlineBooking,
  setOnlineBooking,
}) => {
  return (
    <div
      className={cn(
        "group relative rounded-2xl p-4 border hover:border-border-strong shadow-sm overflow-hidden",
        onlineBooking
          ? "border-border bg-surface dark:bg-neutral-900/40"
          : "border-border bg-muted/[0.02] dark:bg-muted/[0.04]"
      )}
    >
      <div className="relative z-10 flex items-stretch justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg text-foreground-1 tracking-tight">
                Online Appointments
              </h3>
            </div>
            <p className="text-sm text-foreground-3 max-w-[400px] leading-relaxed">
              {onlineBooking 
                ? "Customers can now discover and book your services directly through your marketplace profile."
                : "Online booking is currently disabled. Customers can see your profile but cannot book services."}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end justify-between py-1">
          <Switch
            id="allowOnlineBooking"
            checked={onlineBooking}
            onCheckedChange={setOnlineBooking}
            className="scale-110"
          />

          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 border shrink-0",
              onlineBooking
                ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400 dark:bg-green-500/20"
                : "bg-neutral-100 border-border-strong text-neutral-600 dark:bg-neutral-900/40 dark:border-border-strong dark:text-neutral-400"
            )}
          >
            <div
              className={cn(
                "h-1.5 w-1.5 rounded-full animate-pulse",
                onlineBooking ? "bg-green-500" : "bg-neutral-400"
              )}
            />
            <span>{onlineBooking ? "Enabled" : "Disabled"}</span>
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default BookingToggleCard;

