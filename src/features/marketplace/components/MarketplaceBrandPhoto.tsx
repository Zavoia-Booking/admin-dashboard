import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { ImageIcon, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { AttentionDot } from "../../../shared/components/common/AttentionDot";
import { ImageCropDialog } from "../../../shared/components/common/ImageCropDialog";
import { Spinner } from "../../../shared/components/ui/spinner";
import { generateId } from "../../../shared/lib/id";
import { cn } from "../../../shared/lib/utils";
import { changeMarketplaceBrandPhotoAction } from "../actions";
import {
  selectMarketplaceBrandPhotoMutation,
  selectMarketplaceBrandPhotoUrl,
  selectMarketplaceListing,
} from "../selectors";

const ACCEPTED_IMAGES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif", ".jpg", ".jpeg", ".png", ".webp", ".avif"];
const MAX_SIZE_MB = 10;

/** Required to publish (see the checklist in MarketplacePublishStatusStrip), so it can be replaced but not removed. */
export function MarketplaceBrandPhoto({ canWrite, attentionRequest = 0 }: { canWrite: boolean; attentionRequest?: number }) {
  const { t } = useTranslation("marketplace");
  const dispatch = useDispatch();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const dragCounterRef = useRef(0);
  const attentionTargetRef = useRef<HTMLDivElement | null>(null);
  const lastHandledRef = useRef(attentionRequest);
  const [attentionActive, setAttentionActive] = useState(false);
  const businessId = useSelector(selectMarketplaceListing)?.businessId;
  const photoUrl = useSelector(selectMarketplaceBrandPhotoUrl);
  const mutation = useSelector(selectMarketplaceBrandPhotoMutation);
  const canChange = canWrite && !!businessId && !mutation;
  const uploadLabel = t(photoUrl ? "brandPhoto.replace" : "brandPhoto.upload");

  const uploadPhoto = (file: File) => {
    if (!canChange || !businessId) return;
    dispatch(changeMarketplaceBrandPhotoAction.request({ businessId, requestId: generateId(), file }));
  };

  const acceptFile = (file: File) => {
    if (!canChange) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(t("portfolio.errors.fileSizeExceeds", { size: MAX_SIZE_MB }));
      return;
    }
    const type = file.type && file.type !== "application/octet-stream"
      ? file.type.toLowerCase()
      : file.name.match(/\.[^.]+$/)?.[0].toLowerCase();
    if (!type || !ACCEPTED_IMAGES.includes(type)) {
      toast.error(t("portfolio.errors.unsupportedFormatGeneric", { formats: "JPG, PNG, WebP, AVIF" }));
      return;
    }
    setPendingFile(file);
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) acceptFile(file);
  };

  const handleDrag = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter") {
      dragCounterRef.current++;
      if (dragCounterRef.current === 1) setDragActive(true);
    } else if (event.type === "dragleave") {
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) setDragActive(false);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current = 0;
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) acceptFile(file);
  };

  useEffect(() => {
    if (attentionRequest === lastHandledRef.current) return;

    let retryTimer: number | null = null;
    let highlightTimer: number | null = null;
    let clearHighlightTimer: number | null = null;
    let firstFrame = 0;
    let secondFrame = 0;

    const clearScheduledAttention = () => {
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      if (highlightTimer !== null) window.clearTimeout(highlightTimer);
      if (clearHighlightTimer !== null) window.clearTimeout(clearHighlightTimer);
      if (firstFrame) window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
      retryTimer = null;
      highlightTimer = null;
      clearHighlightTimer = null;
      firstFrame = 0;
      secondFrame = 0;
    };

    setAttentionActive(false);
    const deadline = Date.now() + 5000;
    const retry = () => {
      if (Date.now() < deadline) retryTimer = window.setTimeout(attemptScroll, 50);
    };
    const attemptScroll = () => {
      const card = attentionTargetRef.current;
      // The tab panel can still be hidden right after a tab switch.
      if (!card || card.getClientRects().length === 0) {
        retry();
        return;
      }
      firstFrame = window.requestAnimationFrame(() => {
        secondFrame = window.requestAnimationFrame(() => {
          if (!card.isConnected || card.getClientRects().length === 0) {
            retry();
            return;
          }
          let ancestor: HTMLElement | null = card;
          while (ancestor) {
            if (
              ancestor.getAnimations().some(
                (animation) =>
                  animation.playState === "running" &&
                  animation.effect?.getComputedTiming().endTime !== Infinity,
              ) &&
              Date.now() < deadline
            ) {
              retry();
              return;
            }
            ancestor = ancestor.parentElement;
          }

          const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          lastHandledRef.current = attentionRequest;
          card.scrollIntoView({
            block: "center",
            inline: "nearest",
            behavior: reduceMotion ? "auto" : "smooth",
          });
          highlightTimer = window.setTimeout(() => setAttentionActive(true), 400);
          clearHighlightTimer = window.setTimeout(() => setAttentionActive(false), 2000);
        });
      });
    };
    attemptScroll();
    return clearScheduledAttention;
  }, [attentionRequest]);

  const attentionClass =
    attentionActive && "rounded-2xl ring-2 ring-primary/40 ring-offset-2 ring-offset-background animate-attention-shake";

  return (
    <section aria-labelledby="marketplace-brand-photo-title" className="overflow-hidden rounded-2xl border border-border bg-surface p-4">
      <h3 id="marketplace-brand-photo-title" className="text-base font-medium text-foreground-1">
        {t("brandPhoto.title")}
      </h3>
      <p className="mt-1 text-sm text-foreground-3 dark:text-foreground-2">{t("brandPhoto.description")}</p>
      {canWrite && (
        <input ref={inputRef} type="file" accept={ACCEPTED_IMAGES.join(",")} onChange={handleFile} disabled={!canChange} hidden />
      )}

      {!photoUrl && canWrite ? (
        <div
          ref={attentionTargetRef}
          className={cn("group relative mt-8 mb-6 aspect-[4/3] w-full max-w-sm transition-all duration-300", attentionClass)}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
        >
          <div className="absolute inset-0">
            <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-border bg-surface dark:bg-neutral-900/40 md:bg-neutral-100/40 md:dark:bg-neutral-800/20 transition-all duration-500 rotate-[4deg] translate-y-3 translate-x-2 md:rotate-[2deg] md:translate-y-2 md:translate-x-2 md:group-hover:rotate-[4deg] md:group-hover:translate-y-3"></div>
            <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-border bg-surface dark:bg-neutral-900/55 md:bg-neutral-100/60 md:dark:bg-neutral-800/40 transition-all duration-500 rotate-[-3deg] -translate-y-2 -translate-x-1 md:rotate-[-1deg] md:-translate-y-1 md:-translate-x-1 md:group-hover:rotate-[-3deg] md:group-hover:-translate-y-2"></div>

            <button
              type="button"
              disabled={!canChange}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "absolute inset-0 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40 disabled:pointer-events-none",
                dragActive
                  ? "border-primary bg-primary/10 shadow-[0_0_40px_rgba(var(--primary),0.3)] ring-2 ring-primary/20 scale-[0.98]"
                  : "border-primary/50 bg-surface-hover dark:bg-neutral-900 shadow-xl md:border-muted-foreground/20 md:bg-surface md:shadow-lg md:group-hover:border-primary/50 md:group-hover:shadow-xl md:group-hover:bg-surface-hover",
              )}
            >
              <span className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
                <span
                  className={cn(
                    "flex h-18 w-18 items-center justify-center rounded-full bg-background border shadow-sm transition-all duration-300",
                    dragActive
                      ? "border-primary text-primary scale-110 shadow-primary/20"
                      : "text-primary border-primary/50 md:text-muted-foreground md:group-hover:text-primary md:group-hover:border-primary/50",
                  )}
                >
                  <UploadCloud className="h-8 w-8" aria-hidden />
                </span>
                <span className="block space-y-2">
                  <span className="block text-lg font-bold tracking-tight text-foreground-1 transition-all duration-300">
                    {dragActive ? t("portfolio.dropToUpload") : t("brandPhoto.upload")}
                  </span>
                  <span className="block text-sm font-medium text-foreground-3 dark:text-foreground-2 transition-all duration-300">
                    {dragActive ? t("portfolio.releaseNow") : t("portfolio.dragAndDrop")}
                  </span>
                </span>
              </span>
            </button>
          </div>
          {mutation === "upload" && (
            <div className="absolute inset-0 z-20 grid place-items-center rounded-2xl bg-surface/80">
              <Spinner />
            </div>
          )}
        </div>
      ) : (
        // Same 4:3 frame as the public brand page.
        <div
          ref={!photoUrl ? attentionTargetRef : undefined}
          className={cn(
            "relative mt-4 aspect-[4/3] w-full max-w-sm overflow-hidden rounded-xl border border-border bg-surface-hover",
            !photoUrl && attentionClass,
          )}
        >
          {photoUrl ? (
            <>
              <img src={photoUrl} alt={t("brandPhoto.preview")} draggable={false} className="size-full object-cover" />
              {canWrite && (
                <button
                  type="button"
                  aria-label={uploadLabel}
                  title={uploadLabel}
                  disabled={!canChange}
                  onClick={() => inputRef.current?.click()}
                  // Same dark glass button the location photos use on top of an image.
                  className="absolute bottom-3 right-3 grid size-11 cursor-pointer place-items-center rounded-full border border-white/15 bg-black/60 text-white shadow-lg backdrop-blur-md transition-[background-color,transform] duration-150 ease-out hover:bg-black/70 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:pointer-events-none md:size-10"
                >
                  <UploadCloud className="size-5" aria-hidden />
                </button>
              )}
            </>
          ) : (
            <div className="grid size-full place-items-center text-foreground-3 dark:text-foreground-2">
              <ImageIcon className="size-6" aria-hidden />
            </div>
          )}
          {mutation === "upload" && (
            <div className="absolute inset-0 grid place-items-center bg-surface/80">
              <Spinner />
            </div>
          )}
        </div>
      )}

      {canWrite && (
        <p className="mt-2 text-xs text-foreground-3 dark:text-foreground-2">{t("brandPhoto.fileHint", { size: MAX_SIZE_MB })}</p>
      )}
      {!photoUrl && (
        <div className="mt-2 flex items-start gap-2">
          <AttentionDot className="mt-1.5" />
          <p className="text-xs leading-relaxed text-foreground-3 dark:text-foreground-2">{t("brandPhoto.required")}</p>
        </div>
      )}

      {canChange && pendingFile && (
        <ImageCropDialog
          file={pendingFile}
          variant="brand"
          onCancel={() => setPendingFile(null)}
          onConfirm={(file) => {
            setPendingFile(null);
            uploadPhoto(file);
          }}
        />
      )}
    </section>
  );
}
