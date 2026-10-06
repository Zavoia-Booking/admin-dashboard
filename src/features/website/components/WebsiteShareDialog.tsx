import { useEffect, useRef, useState } from "react";
import { Check, Copy, Download, ExternalLink, RefreshCw, Share2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../shared/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "../../../shared/components/ui/drawer";
import { Input } from "../../../shared/components/ui/input";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import {
  modalGhost,
  modalHelperSmall,
  modalPrimary,
  modalSecondary,
  modalTitleCompact,
} from "../../../shared/components/ui/modal-tokens";
import { useIsMobile } from "../../../shared/hooks/use-mobile";
import { openCustomerWebUrl } from "../../../shared/lib/customerWeb";
import { cn } from "../../../shared/lib/utils";
import { websiteToast as toast } from "../websiteToast";
import {
  copyWebsiteLink,
  exportWebsiteQr,
  generateWebsiteQr,
  isWebsiteSharingCancelled,
  shareWebsiteLink,
  websiteSharingCapabilities,
} from "../websiteSharing";

interface WebsiteShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCloseAutoFocus?: (event: Event) => void;
  url: string | null;
  /** Includes the auth scope revision, so logout/relogin to the same business invalidates work. */
  scopeKey: string;
  businessName?: string | null;
  hasUnpublishedChanges?: boolean;
  isAvailable: boolean;
  phone?: boolean;
}

type ShareAction = "copy" | "share" | "export" | "open";

export function WebsiteShareDialog({
  open,
  onOpenChange,
  onCloseAutoFocus,
  url,
  scopeKey,
  businessName,
  hasUnpublishedChanges = false,
  isAvailable,
  phone,
}: WebsiteShareDialogProps) {
  const { t } = useTranslation("website");
  const isMobile = useIsMobile();
  const isPhone = phone ?? isMobile;
  const capabilities = websiteSharingCapabilities();
  const canDistribute = Boolean(open && url && isAvailable);
  const [qrResult, setQrResult] = useState<{ image: string; url: string; scopeKey: string } | null>(null);
  const qr = qrResult?.url === url && qrResult.scopeKey === scopeKey ? qrResult.image : null;
  const [qrLoading, setQrLoading] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);
  const [qrAttempt, setQrAttempt] = useState(0);
  const [busy, setBusy] = useState<ShareAction | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const mountedRef = useRef(false);
  const actionGeneration = useRef(0);
  const liveRef = useRef({ scopeKey, url, canDistribute });
  liveRef.current = { scopeKey, url, canDistribute };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      actionGeneration.current += 1;
    };
  }, []);

  useEffect(() => {
    let abandoned = false;
    actionGeneration.current += 1;
    setBusy(null);
    setCopied(false);
    setQrResult(null);
    setQrFailed(false);
    setQrLoading(canDistribute);
    if (canDistribute && url) {
      generateWebsiteQr(url)
        .then((image) => {
          if (!abandoned && liveRef.current.scopeKey === scopeKey && liveRef.current.url === url) {
            setQrResult({ image, url, scopeKey });
          }
        })
        .catch(() => {
          if (!abandoned && mountedRef.current && liveRef.current.canDistribute &&
            liveRef.current.scopeKey === scopeKey && liveRef.current.url === url) {
            setQrFailed(true);
            toast.error(t("shareWebsite.qrFailed"), { id: `website-share-qr-${scopeKey}` });
          }
        })
        .finally(() => {
          if (!abandoned) setQrLoading(false);
        });
    }
    return () => { abandoned = true; };
  }, [canDistribute, url, scopeKey, qrAttempt]);

  const runAction = async (
    action: ShareAction,
    execute: (isCurrent: () => boolean) => Promise<void>,
  ) => {
    if (!canDistribute || !url || busy) return;
    const generation = ++actionGeneration.current;
    const actionScope = scopeKey;
    const actionUrl = url;
    const isCurrent = () => mountedRef.current &&
      actionGeneration.current === generation &&
      liveRef.current.canDistribute &&
      liveRef.current.scopeKey === actionScope && liveRef.current.url === actionUrl;
    setBusy(action);
    setCopied(false);
    try {
      await execute(isCurrent);
      if (isCurrent() && action === "copy") setCopied(true);
    } catch (error) {
      if (isCurrent() && !isWebsiteSharingCancelled(error)) {
        toast.error(t(errorKeys[action]), { id: `website-share-${action}-${scopeKey}` });
        if (action === "copy") {
          inputRef.current?.focus();
          inputRef.current?.select();
        }
      }
    } finally {
      if (isCurrent()) setBusy(null);
    }
  };

  const shareTitle = businessName?.trim() || t("shareWebsite.title");
  const errorKeys: Record<ShareAction, string> = {
    copy: "shareWebsite.copyFailed",
    share: "shareWebsite.shareFailed",
    export: "shareWebsite.exportFailed",
    open: "shareWebsite.openFailed",
  };
  const actionClass = "h-auto min-h-11 min-w-0 flex-1 whitespace-normal px-4 py-2.5 text-center has-[>svg]:px-4";
  const openActionClass = cn(modalGhost, "min-h-11 shrink-0 gap-1.5 px-0 shadow-none hover:bg-transparent has-[>svg]:px-0");
  const Title = isPhone ? DrawerTitle : DialogTitle;
  const Description = isPhone ? DrawerDescription : DialogDescription;
  const contents = (
    <>
      <DialogHeader className="relative shrink-0 gap-0 px-6 pb-4 pt-6 pr-14 text-left">
        <Title ref={titleRef} tabIndex={-1} className={cn(modalTitleCompact, "outline-none")}>
          {t("shareWebsite.title")}
        </Title>
        <Description className={cn(modalHelperSmall, "mt-2")}>
          {t(!isAvailable || !url ? "shareWebsite.unavailable" : "shareWebsite.description")}
        </Description>
        {isPhone ? (
          <Button type="button" variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label={t("shareWebsite.close")}
            className="absolute right-3 top-3 size-11 rounded-full text-foreground-3">
            <X className="size-4" aria-hidden />
          </Button>
        ) : null}
      </DialogHeader>
      <div className="min-h-0 overflow-y-auto px-6 pb-6">
        {canDistribute && url ? (
          <>
            {hasUnpublishedChanges ? (
              <p className={cn(modalHelperSmall, "mb-4")}>{t("shareWebsite.unpublishedChanges")}</p>
            ) : null}
            <div className="flex min-w-0 items-center justify-between gap-3">
              <label htmlFor={`website-share-url-${scopeKey}`} className="text-sm font-medium text-foreground-1">
                {t("shareWebsite.linkLabel")}
              </label>
              {capabilities.native ? (
                <Button type="button" variant="ghost" disabled={!capabilities.open || busy !== null} aria-busy={busy === "open"} className={openActionClass}
                  onClick={() => void runAction("open", async (current) => { if (current()) await openCustomerWebUrl(url); })}>
                  {t("shareWebsite.open")}<ExternalLink className="size-3.5" aria-hidden />
                </Button>
              ) : (
                <Button asChild variant="ghost" className={openActionClass}>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {t("shareWebsite.open")}<ExternalLink className="size-3.5" aria-hidden />
                  </a>
                </Button>
              )}
            </div>
            <Input id={`website-share-url-${scopeKey}`} ref={inputRef} value={url} readOnly
              onFocus={(event) => event.currentTarget.select()}
              className="h-12 rounded-xl shadow-none md:h-11" />
            <div className="mt-3 flex items-stretch gap-2">
              <Button type="button" disabled={!capabilities.copy || busy !== null} aria-busy={busy === "copy"} className={cn(modalPrimary, actionClass)}
                onClick={() => void runAction("copy", (current) => copyWebsiteLink(url, current))}>
                {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                {t(copied ? "shareWebsite.copied" : "shareWebsite.copy")}
              </Button>
              {capabilities.share ? (
                <Button type="button" variant={capabilities.copy ? "outline" : "default"} disabled={busy !== null} aria-busy={busy === "share"} className={cn(capabilities.copy ? modalSecondary : modalPrimary, actionClass)}
                  onClick={() => void runAction("share", (current) => shareWebsiteLink(url, shareTitle, current))}>
                  <Share2 className="size-4" aria-hidden />
                  {t("shareWebsite.share")}
                </Button>
              ) : null}
            </div>
            {!capabilities.copy ? <p className={cn(modalHelperSmall, "mt-2")}>{t("shareWebsite.manualCopy")}</p> : null}
            <span role="status" aria-live="polite" className="sr-only">{copied ? t("shareWebsite.copied") : ""}</span>
            <section aria-labelledby={`website-share-qr-${scopeKey}`} className="mt-6 grid gap-5 border-t border-border-subtle pt-5 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-center">
              <div className="mx-auto flex aspect-square w-40 max-w-full items-center justify-center overflow-hidden rounded-xl bg-white" aria-busy={qrLoading || (!qr && !qrFailed)}>
                {qr ? <img src={qr} width={160} height={160} alt={t("shareWebsite.qrAlt")} className="size-full" /> : qrFailed ? (
                  <Button type="button" variant="outline" className={cn(modalSecondary, "h-auto min-h-11 max-w-full whitespace-normal px-3 py-2 text-[13px]")} aria-label={`${t("shareWebsite.qrTitle")}: ${t("shareWebsite.retryQr")}`}
                    onClick={() => setQrAttempt((attempt) => attempt + 1)}>
                    <RefreshCw className="size-4" aria-hidden />{t("shareWebsite.retryQr")}
                  </Button>
                ) : (
                  <Skeleton className="size-full rounded-xl motion-reduce:before:animate-none!" aria-hidden />
                )}
              </div>
              {!qr && !qrFailed ? <span role="status" className="sr-only">{t("shareWebsite.qrLoading")}</span> : null}
              <div className="min-w-0 text-center sm:text-left">
                <h3 id={`website-share-qr-${scopeKey}`} className="text-sm font-semibold text-foreground-1">{t("shareWebsite.qrTitle")}</h3>
                <p className={cn(modalHelperSmall, "mt-1")}>{t("shareWebsite.qrDescription")}</p>
                <Button type="button" variant="outline" disabled={!qr || busy !== null || !capabilities.exportQr} aria-busy={busy === "export"} className={cn(modalSecondary, actionClass, "mt-4 w-full")}
                  onClick={() => { if (qr) void runAction("export", (current) => exportWebsiteQr(qr, url, shareTitle, current)); }}>
                  {capabilities.native ? <Share2 className="size-4" aria-hidden /> : <Download className="size-4" aria-hidden />}
                  {t(capabilities.native ? "shareWebsite.exportQr" : "shareWebsite.downloadQr")}
                </Button>
                {!capabilities.exportQr ? <p className={cn(modalHelperSmall, "mt-2")}>{t("shareWebsite.exportUnavailable")}</p> : null}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </>
  );

  return isPhone ? (
    <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false} autoFocus>
      <DrawerContent onOpenAutoFocus={(event) => { event.preventDefault(); titleRef.current?.focus({ preventScroll: true }); }}
        onCloseAutoFocus={onCloseAutoFocus}
        overlayClassName="!z-[79] bg-[rgb(23_22_20/45%)] backdrop-blur-[2px]"
        className="website-atelier !z-[80] !max-h-[85dvh] overflow-hidden rounded-t-[18px] border-x-0 border-b-0 bg-[var(--atelier-paper)] p-0 pb-[env(safe-area-inset-bottom)] outline-none">
        {contents}
      </DrawerContent>
    </Drawer>
  ) : (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={(event) => { event.preventDefault(); titleRef.current?.focus({ preventScroll: true }); }}
        onCloseAutoFocus={onCloseAutoFocus}
        overlayClassName="z-[79] bg-[rgb(23_22_20/45%)] backdrop-blur-[2px]"
        className="website-atelier z-[80] flex max-h-[85dvh] w-[min(480px,calc(100%-2rem))] max-w-[480px] flex-col gap-0 overflow-hidden rounded-[18px] border-0 bg-[var(--atelier-paper)] p-0">
        {contents}
      </DialogContent>
    </Dialog>
  );
}
