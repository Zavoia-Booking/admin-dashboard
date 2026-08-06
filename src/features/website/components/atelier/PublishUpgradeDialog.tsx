import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { cn } from "../../../../shared/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../shared/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "../../../../shared/components/ui/drawer";
import {
  modalEyebrow,
  modalTitleCompact,
  modalHelperSmall,
} from "../../../../shared/components/ui/modal-tokens";
import { Button } from "../../../../shared/components/ui/button";
import { useAtelierCompactLayout } from "./useAtelierCompactLayout";

interface PublishUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Web-only publish gate for plans without the publish capability: the draft is saved and
 * kept, going live is the Plus moment. Never rendered on native (store policy — no plan
 * or upgrade language there; publish surfaces are simply absent).
 */
export function PublishUpgradeDialog({ open, onOpenChange }: PublishUpgradeDialogProps) {
  const { t } = useTranslation("website");
  const navigate = useNavigate();
  const isAtelierCompact = useAtelierCompactLayout();

  const eyebrow = (
    <span className={cn(modalEyebrow, "mb-0")}>{t("page.publishUpgrade.eyebrow")}</span>
  );

  const footer = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => onOpenChange(false)}
        className="min-h-11"
      >
        {t("page.publishUpgrade.notNow")}
      </Button>
      <Button
        type="button"
        onClick={() => {
          onOpenChange(false);
          navigate("/account?tab=billing");
        }}
        className="min-h-11"
      >
        {t("page.publishUpgrade.cta")}
      </Button>
    </>
  );

  if (isAtelierCompact) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} autoFocus repositionInputs={false}>
        <DrawerContent
          overlayClassName="z-[79]"
          className="website-atelier z-[80] max-h-[85dvh] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
        >
          <DialogHeader className="gap-0 pt-1 text-left">
            {eyebrow}
            <DrawerTitle className={cn(modalTitleCompact, "mt-2")}>
              {t("page.publishUpgrade.title")}
            </DrawerTitle>
            <DrawerDescription className={cn(modalHelperSmall, "mt-1.5")}>
              {t("page.publishUpgrade.description")}
            </DrawerDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex-col-reverse sm:flex-col-reverse">{footer}</DialogFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="z-[79]"
        className="website-atelier z-[80] max-w-[calc(100%-2rem)] gap-0 p-6 sm:max-w-[420px]"
      >
        <DialogHeader className="gap-0">
          {eyebrow}
          <DialogTitle className={cn(modalTitleCompact, "mt-2")}>
            {t("page.publishUpgrade.title")}
          </DialogTitle>
          <DialogDescription className={cn(modalHelperSmall, "mt-1.5")}>
            {t("page.publishUpgrade.description")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 flex-wrap">{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PublishUpgradeDialog;
