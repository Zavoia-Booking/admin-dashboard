import { type FC } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { getSelectedLocationId, getViewModeSelector } from "../../selectors";
import { MobileCalendarHeader } from "./MobileCalendarHeader";
import { CalendarIcon } from "lucide-react";
import { AppointmentViewMode } from "../../types";

interface MobileCalendarLayoutProps {
  onOpenSettings: () => void;
}

export const MobileCalendarLayout: FC<MobileCalendarLayoutProps> = ({
  onOpenSettings,
}) => {
  const { t } = useTranslation("calendar");
  const selectedLocationId = useSelector(getSelectedLocationId);
  const viewMode = useSelector(getViewModeSelector);

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-white dark:bg-surface">
      {/* Compact mobile header */}
      <MobileCalendarHeader onOpenSettings={onOpenSettings} />

      {/* Content area */}
      <div className="flex-1 overflow-auto px-1 py-2">
        {!selectedLocationId ? (
          <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t("page.appointments.selectLocation")}
            </p>
          </div>
        ) : (
          /* Placeholder — will be replaced by MobileViewRouter in Phase 3 */
          <div className="flex flex-col items-center justify-center h-64 px-6 text-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
              <CalendarIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {viewMode === AppointmentViewMode.MONTH
                ? "Month view"
                : viewMode === AppointmentViewMode.WEEK
                  ? "Week view"
                  : "Day view"}{" "}
              — mobile coming soon
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
