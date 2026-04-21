import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays, Lock, Plus } from "lucide-react";
import { Button } from "../../../../shared/components/ui/button";

interface MobileDayEmptyStateProps {
  onAdd: () => void;
  onBlock: () => void;
}

export const MobileDayEmptyState: FC<MobileDayEmptyStateProps> = ({ onAdd, onBlock }) => {
  const { t } = useTranslation("calendar");

  return (
    <div className="flex flex-col items-center text-center px-6 pt-12 pb-6 w-full max-w-sm mx-auto motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 motion-safe:[animation-timing-function:cubic-bezier(0.22,1,0.36,1)]">
      {/* Layered icon badge: calendar tile with a corner "+" signifying the add-to-calendar action. */}
      <div aria-hidden className="relative mb-6">
        {/* Soft halo — blurred tinted disc sitting behind the badge. */}
        <span className="absolute inset-0 -m-4 rounded-full bg-primary/10 blur-2xl opacity-60" />
        <div className="relative h-[64px] w-[64px] rounded-[20px] bg-gradient-to-br from-primary/15 to-primary/[0.04] ring-1 ring-primary/10 flex items-center justify-center">
          <CalendarDays className="h-8 w-8 text-primary" strokeWidth={1.75} />
        </div>
        <span className="absolute -bottom-1 -right-1 h-[22px] w-[22px] rounded-full bg-primary flex items-center justify-center shadow-sm ring-2 ring-white dark:ring-surface">
          <Plus className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={3} />
        </span>
      </div>

      <h3 className="text-[17px] font-semibold text-foreground-1 mb-1 tracking-tight">
        {t("page.appointments.emptyDay.title")}
      </h3>
      <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[260px] mb-7">
        {t("page.appointments.emptyDay.description")}
      </p>

      <div className="flex flex-col gap-2 w-full max-w-[320px]">
        <Button onClick={onAdd} className="h-11 gap-2 text-[15px] font-semibold shadow-sm">
          <Plus className="h-[18px] w-[18px]" strokeWidth={2.5} />
          {t("page.appointments.emptyDay.addCta")}
        </Button>
        <Button
          onClick={onBlock}
          variant="outline"
          className="h-11 gap-2 text-[15px] font-semibold"
        >
          <Lock className="h-4 w-4" strokeWidth={2} />
          {t("page.appointments.emptyDay.blockCta")}
        </Button>
      </div>
    </div>
  );
};
