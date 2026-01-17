import React from "react";
import { Switch } from "../../../../shared/components/ui/switch";
import { cn } from "../../../../shared/lib/utils";
import { Loader2 } from "lucide-react";
import { Badge } from "../../../../shared/components/ui/badge";
import { useTranslation } from "react-i18next";

interface VisibilityToggleCardProps {
  isVisible: boolean;
  onToggleVisibility: (isVisible: boolean) => void;
  isUpdatingVisibility: boolean;
}

export const VisibilityToggleCard: React.FC<VisibilityToggleCardProps> = ({
  isVisible,
  onToggleVisibility,
  isUpdatingVisibility,
}) => {
  const { t } = useTranslation("marketplace");
  
  return (
    <div
      className={cn(
        "group relative rounded-2xl p-4 border hover:border-border-strong shadow-sm overflow-hidden",
        isVisible
          ? "border-border bg-white dark:bg-surface"
          : "border-border bg-surface dark:bg-surface opacity-80"
      )}
    >
      <div className="relative z-10 flex items-stretch justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg text-foreground-1 tracking-tight">
                {isVisible ? t("visibility.public") : t("visibility.private")}
              </h3>

              {isUpdatingVisibility && (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              )}
            </div>
            <p className="text-sm text-foreground-3 dark:text-foreground-2 max-w-[400px] leading-relaxed">
              {isVisible
                ? t("visibility.publicDescription")
                : t("visibility.privateDescription")}{" "}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end justify-between py-1">
          <Switch
            checked={isVisible}
            onCheckedChange={onToggleVisibility}
            disabled={isUpdatingVisibility}
            className="scale-110"
          />

          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 border shrink-0",
              isVisible
                ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400 dark:bg-green-500/20"
                : "bg-muted/30 dark:bg-muted/20 border-border text-foreground-3 dark:text-foreground-2"
            )}
          >
            <div
              className={cn(
                "h-1.5 w-1.5 rounded-full animate-pulse",
                isVisible ? "bg-green-500" : "bg-neutral-400"
              )}
            />
            <span>{isVisible ? t("visibility.active") : t("visibility.hidden")}</span>
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default VisibilityToggleCard;
