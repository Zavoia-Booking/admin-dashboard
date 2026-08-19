import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, CalendarCheck, CalendarPlus, CalendarX2, Users } from "lucide-react";
import { Button } from "../../shared/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "../../shared/components/ui/drawer";
import { subscribePushPrimer, recordPrimerDecline } from "./primer";
import { requestPushPermissionAndRegister } from "./service";

/**
 * The push-permission soft ask. Opened only by maybeShowPushPrimer() at value
 * moments; accepting fires the real OS prompt, declining (button or dismiss)
 * costs an ask-policy strike but never spends an OS prompt attempt.
 */
export default function PushPrimerSheet() {
  const { t } = useTranslation("notifications");
  const [open, setOpen] = useState(false);
  const acceptedRef = useRef(false);

  useEffect(() => subscribePushPrimer(setOpen), []);
  // TEMP preview hook — remove
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__pushPrimerPreview = setOpen;
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (!next && open && !acceptedRef.current) recordPrimerDecline();
    if (!next) acceptedRef.current = false;
    setOpen(next);
  };

  const handleEnable = () => {
    acceptedRef.current = true;
    setOpen(false);
    // Fire the OS prompt after the sheet starts closing so the system dialog
    // isn't stacked on top of it.
    window.setTimeout(() => {
      void requestPushPermissionAndRegister();
    }, 250);
  };

  const benefits = [
    { icon: CalendarPlus, label: t("pushPrimer.benefitBookings") },
    { icon: CalendarX2, label: t("pushPrimer.benefitCancellations") },
    { icon: CalendarCheck, label: t("pushPrimer.benefitConfirmations") },
    { icon: Users, label: t("pushPrimer.benefitTeam") },
  ];

  return (
    <Drawer autoFocus open={open} onOpenChange={handleOpenChange}>
      <DrawerContent
        className="flex flex-col outline-none !z-[100]"
        overlayClassName="!z-[95]"
      >
        <div className="px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3">
          <div className="flex items-center gap-2.5">
            <Bell className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            <DrawerTitle className="text-lg font-semibold text-foreground-1">
              {t("pushPrimer.title")}
            </DrawerTitle>
          </div>
          <DrawerDescription className="mt-1.5 text-sm leading-relaxed text-foreground-2">
            {t("pushPrimer.subtitle")}
          </DrawerDescription>

          <ul className="mt-4 space-y-3">
            {benefits.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0 text-foreground-3" aria-hidden />
                <span className="text-sm text-foreground-1">{label}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 space-y-2">
            <Button rounded="full" className="w-full" onClick={handleEnable}>
              {t("pushPrimer.enable")}
            </Button>
            <Button
              variant="ghost"
              rounded="full"
              className="w-full text-foreground-2"
              onClick={() => handleOpenChange(false)}
            >
              {t("pushPrimer.notNow")}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
