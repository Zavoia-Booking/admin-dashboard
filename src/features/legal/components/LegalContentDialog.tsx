import { useRef } from "react"
import { useTranslation } from "react-i18next"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../shared/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "../../../shared/components/ui/drawer"
import { useIsMobile } from "../../../shared/hooks/use-mobile"
import { LEGAL_CONFIG, CONTENT_MAP, type LegalPageType } from "./legal-content"

interface LegalContentDialogProps {
  type: LegalPageType | null
  onOpenChange: (open: boolean) => void
}

export default function LegalContentDialog({ type, onOpenChange }: LegalContentDialogProps) {
  const { t } = useTranslation("auth")
  const isMobile = useIsMobile()
  const lastTypeRef = useRef<LegalPageType>("terms")

  if (type) {
    lastTypeRef.current = type
  }

  const activeType = lastTypeRef.current
  const config = LEGAL_CONFIG[activeType]
  const ContentComponent = CONTENT_MAP[activeType]

  const content = (
    <div className="overflow-y-auto flex-1 pr-2 -mr-2">
      <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 mb-6">
        <p className="text-xs text-amber-800 dark:text-amber-200">
          {t("legal.placeholderNotice")}
        </p>
      </div>
      <ContentComponent />
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={!!type} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh] px-4 pb-6">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-xl text-foreground-1">
              {t(config.titleKey)}
            </DrawerTitle>
            <DrawerDescription className="text-xs text-foreground-3">
              {t("legal.lastUpdated", { date: "March 2026" })}
            </DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={!!type} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl text-foreground-1">
            {t(config.titleKey)}
          </DialogTitle>
          <DialogDescription className="text-xs text-foreground-3">
            {t("legal.lastUpdated", { date: "March 2026" })}
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}
