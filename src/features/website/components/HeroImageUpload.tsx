import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ImagePlus, UploadCloud, X } from "lucide-react";
import { Button } from "../../../shared/components/ui/button";
import { Spinner } from "../../../shared/components/ui/spinner";
import { cn } from "../../../shared/lib/utils";
import { deleteWebsiteHeroAction, uploadWebsiteHeroAction } from "../actions";
import {
  selectWebsiteHeroMutating,
  selectWebsiteConflict,
  selectWebsitePublishing,
  selectWebsiteSaving,
  selectWebsiteSaveFailure,
  selectWebsiteUnpublishing,
} from "../selectors";

const MAX_SIZE_MB = 10;
const RECOMMENDED_SIZE_MB = 5;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
];

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

interface HeroImageUploadProps {
  heroImageUrl: string | null;
  canWrite: boolean;
  /** The Atelier inspector retains the same upload behavior with a compact visual treatment. */
  variant?: "default" | "atelier";
}

/**
 * Single hero/cover image for the Website. Saved immediately on change through the
 * versioned hero endpoints: every mutation sends the current draft version, and a
 * success advances only the saved baseline (unsaved text/layout edits are preserved).
 */
export function HeroImageUpload({ heroImageUrl, canWrite, variant = "default" }: HeroImageUploadProps) {
  const { t } = useTranslation("website");
  const dispatch = useDispatch();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragCounterRef = useRef(0);
  const [dragActive, setDragActive] = useState(false);
  const isHeroMutating = useSelector(selectWebsiteHeroMutating);
  const conflict = useSelector(selectWebsiteConflict);
  const isSaving = useSelector(selectWebsiteSaving);
  const saveFailure = useSelector(selectWebsiteSaveFailure);
  const isPublishing = useSelector(selectWebsitePublishing);
  const isUnpublishing = useSelector(selectWebsiteUnpublishing);
  // Publish counts as busy in this surface. The serialized mutation lane protects ordering,
  // but blocking a second gesture keeps the image control predictable while it is queued.
  // A failed save may have committed without returning its response. Until the GET-first
  // recovery resolves that ambiguity, Redux cannot prove the latest server version for a
  // hero command.
  const saveRecoveryRequired = !!saveFailure && saveFailure.kind !== "cancelled";
  const busy =
    isHeroMutating ||
    isSaving ||
    isPublishing ||
    isUnpublishing ||
    !!conflict ||
    saveRecoveryRequired;

  const validateFile = (file: File): boolean => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    let mime = file.type;
    if ((!mime || mime === "application/octet-stream") && extension && EXT_TO_MIME[extension]) {
      mime = EXT_TO_MIME[extension];
    }
    if (!mime || !ALLOWED_TYPES.includes(mime)) {
      toast.error(t("portfolio.errors.unsupportedFormatGeneric", { formats: "JPG, PNG, WEBP, or AVIF" }));
      return false;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(t("portfolio.errors.fileSizeExceeds", { size: MAX_SIZE_MB }));
      return false;
    }
    if (file.size > RECOMMENDED_SIZE_MB * 1024 * 1024) {
      toast.warning(t("portfolio.errors.fileSizeWarning"));
    }
    return true;
  };

  const handleFile = (file: File | undefined | null) => {
    if (!file || busy) return;
    if (!validateFile(file)) return;
    dispatch(uploadWebsiteHeroAction.request({ file }));
  };

  const handleRemove = () => {
    if (busy) return;
    dispatch(deleteWebsiteHeroAction.request());
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrag = (event: React.DragEvent) => {
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

  const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current = 0;
    setDragActive(false);
    if (!canWrite) return;
    handleFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div className={variant === "atelier" ? "atelier-hero-image-upload" : undefined}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={handleInputChange}
        disabled={!canWrite || busy}
      />

      {heroImageUrl ? (
        // The default dashboard keeps a compact asset row. Atelier expands this same state into
        // the artifact's cover specimen and paired actions without changing upload behavior.
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border border-border bg-surface p-2 shadow-sm",
            variant === "atelier" && "atelier-hero-cover-card",
          )}
        >
          <div className="atelier-hero-cover-preview relative h-12 w-[4.5rem] shrink-0 overflow-hidden rounded-lg border border-border bg-muted/40">
            <img
              src={heroImageUrl}
              alt={t("businessPage.branding.hero.alt")}
              loading="eager"
              decoding="async"
              draggable={false}
              className="h-full w-full object-cover"
            />
            {busy && (
              <div className="absolute inset-0 z-10 grid place-items-center bg-black/40 backdrop-blur-sm">
                <Spinner size="sm" color="white" />
              </div>
            )}
          </div>

          <div className="atelier-hero-cover-footer contents">
            <div className="atelier-hero-cover-copy min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-foreground-1">
                {t("businessPage.branding.hero.label")}
              </p>
              {variant !== "atelier" ? (
                <p className="truncate text-xs text-foreground-3">
                  {t("businessPage.branding.hero.description")}
                </p>
              ) : null}
            </div>

            {canWrite && (
              <div className="atelier-hero-cover-actions flex shrink-0 items-center gap-0.5">
                {variant === "atelier" ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => inputRef.current?.click()}
                      disabled={busy}
                      className="atelier-hero-cover-action"
                    >
                      {t("businessPage.branding.hero.replace")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handleRemove}
                      disabled={busy}
                      className="atelier-hero-cover-action atelier-hero-cover-remove"
                    >
                      {t("businessPage.branding.hero.remove")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => inputRef.current?.click()}
                      disabled={busy}
                      className="min-h-11 text-foreground-2 xl:h-8 xl:min-h-0"
                    >
                      <UploadCloud className="h-3.5 w-3.5" />
                      {t("businessPage.branding.hero.replace")}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={handleRemove}
                      disabled={busy}
                      aria-label={t("businessPage.branding.hero.remove")}
                      title={t("businessPage.branding.hero.remove")}
                      className="size-11 text-foreground-3 hover:bg-destructive/10 hover:text-destructive xl:size-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={!canWrite || busy}
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          data-drag-active={dragActive || undefined}
          data-uploading={isHeroMutating || undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl border border-dashed px-3.5 py-3 text-left outline-none transition-[border-color,background-color,box-shadow] duration-200",
            variant === "atelier" && "atelier-hero-dropzone",
            canWrite && !busy
              ? "cursor-pointer"
              : isHeroMutating
                ? "cursor-wait"
                : "cursor-not-allowed opacity-60",
            dragActive
              ? "border-primary bg-primary/10 ring-2 ring-primary/20"
              : "border-border-strong/40 bg-muted/10 hover:border-primary/50 hover:bg-surface-hover focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-focus",
          )}
        >
          {variant === "atelier" ? (
            <>
              <span className="atelier-hero-dropzone-copy">
                <span className="atelier-hero-dropzone-title">
                  {isHeroMutating
                    ? t("businessPage.branding.hero.uploading")
                    : dragActive
                      ? t("businessPage.branding.hero.dropCta")
                      : t("businessPage.branding.hero.uploadCta")}
                </span>
                <span className="atelier-hero-dropzone-description">
                  {t("businessPage.branding.hero.description")}
                </span>
              </span>
              {isHeroMutating ? (
                <Spinner
                  size="sm"
                  color="muted"
                  className="atelier-hero-dropzone-loader !h-auto !w-auto"
                  dotClassName="!size-1.5"
                />
              ) : (
                <span className="atelier-hero-dropzone-action" aria-hidden>
                  <UploadCloud className="h-3.5 w-3.5" />
                  {t("businessPage.branding.hero.chooseImage")}
                </span>
              )}
            </>
          ) : (
            <>
              <div
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-lg border bg-background shadow-sm transition-[color,border-color,transform] duration-200",
                  dragActive
                    ? "scale-105 border-primary text-primary"
                    : "border-primary/40 text-primary",
                )}
              >
                {isHeroMutating ? <Spinner size="sm" /> : <ImagePlus className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground-1">
                  {isHeroMutating
                    ? t("businessPage.branding.hero.uploading")
                    : dragActive
                      ? t("businessPage.branding.hero.dropCta")
                      : t("businessPage.branding.hero.uploadCta")}
                </p>
                <p className="truncate text-xs text-foreground-3 dark:text-foreground-2">
                  {isHeroMutating
                    ? t("businessPage.branding.hero.uploadingHint")
                    : t("businessPage.branding.hero.hint")}
                </p>
              </div>
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default HeroImageUpload;
