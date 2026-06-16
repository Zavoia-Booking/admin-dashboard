import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ImagePlus, UploadCloud, X } from "lucide-react";
import { Button } from "../../../../shared/components/ui/button";
import { Spinner } from "../../../../shared/components/ui/spinner";
import { cn } from "../../../../shared/lib/utils";
import { uploadHeroImageApi, deleteHeroImageApi } from "../../api";
import { setListingHeroAction } from "../../actions";

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
}

/**
 * Single hero/cover image for the business page. Mirrors the per-location
 * portfolio upload logic (validation + R2 upload + Redux sync) but for one
 * business-level image saved immediately on change.
 */
export function HeroImageUpload({ heroImageUrl, canWrite }: HeroImageUploadProps) {
  const { t } = useTranslation("marketplace");
  const dispatch = useDispatch();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragCounterRef = useRef(0);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const busy = isUploading || isRemoving;

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

  const handleFile = async (file: File | undefined | null) => {
    if (!file || busy) return;
    if (!validateFile(file)) return;
    setIsUploading(true);
    try {
      const result = await uploadHeroImageApi(file);
      dispatch(setListingHeroAction(result));
    } catch (error) {
      console.error("[Hero] Upload failed:", error);
      toast.error(t("portfolio.errors.uploadFailed", { name: file.name }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (busy) return;
    setIsRemoving(true);
    try {
      const result = await deleteHeroImageApi();
      dispatch(setListingHeroAction(result));
    } catch (error) {
      console.error("[Hero] Delete failed:", error);
      toast.error(t("portfolio.errors.deleteFailed"));
    } finally {
      setIsRemoving(false);
    }
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

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current = 0;
    setDragActive(false);
    if (!canWrite) return;
    handleFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={handleInputChange}
        disabled={!canWrite || busy}
      />

      {heroImageUrl ? (
        <div className="relative w-full h-48 md:h-64 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm group/hero">
          <img
            src={heroImageUrl}
            alt={t("businessPage.branding.hero.alt")}
            draggable={false}
            className="w-full h-full object-cover"
          />
          {isRemoving && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <Spinner size="sm" color="white" />
            </div>
          )}
          {/* Hover scrim for action affordance (desktop) */}
          <div className="absolute inset-0 bg-black/40 hidden md:block md:opacity-0 md:group-hover/hero:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {canWrite && !busy && (
            <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                rounded="full"
                onClick={() => inputRef.current?.click()}
                className="!min-h-0 !h-8 px-3 backdrop-blur-md bg-black/60 hover:bg-black/70 border border-white/15 text-white shadow-xl active:scale-95 transition-all duration-200 opacity-100 md:opacity-0 md:group-hover/hero:opacity-100"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span className="text-[11px] font-semibold">{t("businessPage.branding.hero.replace")}</span>
              </Button>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                rounded="full"
                onClick={handleRemove}
                aria-label={t("businessPage.branding.hero.remove")}
                title={t("businessPage.branding.hero.remove")}
                className="!min-h-8 !min-w-8 backdrop-blur-md bg-black/60 hover:bg-black/70 border border-white/15 text-white shadow-xl active:scale-95 transition-all duration-200 opacity-100 md:opacity-0 md:group-hover/hero:opacity-100"
              >
                <X className="!h-3.5 !w-3.5" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={canWrite ? 0 : -1}
          aria-disabled={!canWrite}
          onClick={() => canWrite && !busy && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (!canWrite || busy) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          className={cn(
            "relative w-full h-48 md:h-64 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 text-center px-6 transition-all duration-300 cursor-pointer outline-none",
            dragActive
              ? "border-primary bg-primary/10 ring-2 ring-primary/20 scale-[0.99]"
              : "border-border-strong/40 bg-muted/10 hover:border-primary/50 hover:bg-surface-hover focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-focus",
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center rounded-full bg-background border shadow-sm transition-all duration-300 h-14 w-14",
              dragActive
                ? "border-primary text-primary scale-110"
                : "text-primary border-primary/40",
            )}
          >
            {isUploading ? <Spinner size="sm" /> : <ImagePlus className="h-6 w-6" />}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground-1">
              {isUploading
                ? t("businessPage.branding.hero.uploading")
                : dragActive
                  ? t("portfolio.dropToUpload")
                  : t("businessPage.branding.hero.uploadCta")}
            </p>
            <p className="text-xs text-foreground-3 dark:text-foreground-2">
              {t("businessPage.branding.hero.hint")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default HeroImageUpload;
