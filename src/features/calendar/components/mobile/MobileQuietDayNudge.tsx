import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "../../../../shared/components/ui/button";

interface MobileQuietDayNudgeProps {
  onBlockClick: () => void;
}

export const MobileQuietDayNudge: FC<MobileQuietDayNudgeProps> = ({ onBlockClick }) => {
  const { t } = useTranslation("calendar");

  return (
    <div className="rounded-xl border-[1.5px] border-dashed border-border bg-transparent p-3.5 flex items-center gap-3 mt-1">
      <span
        aria-hidden
        className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center"
      >
        <Plus className="h-[18px] w-[18px]" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-foreground-1 leading-tight">
          {t("page.appointments.quietDay.title")}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {t("page.appointments.quietDay.description")}
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        rounded="full"
        onClick={onBlockClick}
        className="shrink-0 h-8 px-3 text-xs font-semibold"
      >
        {t("page.appointments.quietDay.cta")}
      </Button>
    </div>
  );
};
