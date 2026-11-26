import { useEffect, useRef, useState, type ComponentProps, type CSSProperties } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import Cropper, { type Area, type Point, type Size } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { useTranslation } from "react-i18next";
import { X, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "../../lib/utils";
import {
  areaBackground,
  centerCrop,
  cornerFill,
  cropGeometry,
  exportCrop,
  isSvgFile,
  loadImage,
  rasterizeSvg,
  type CropVariant,
} from "../../lib/imageCrop";
import {
  modalBody,
  modalCancel,
  modalFooterRowRight,
  modalGhost,
  modalPanelLarge,
  modalPrimary,
  modalScrim,
  modalTitleCompact,
} from "../ui/modal-tokens";
import { Spinner } from "../ui/spinner";
import { BaseSlider } from "./BaseSlider";

interface ImageCropDialogProps {
  file: File;
  variant: CropVariant;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}

type PreviewKey = "brandPage" | "app" | "cards" | "avatar" | "website";

interface PreviewFrame {
  key: PreviewKey;
  aspect: number;
  shape: string;
  /** Width in the desktop column, as a share of its widest tile. */
  width: number;
}

// Each preview copies the shape of a place the image is shown, so it trims the same way.
const VARIANTS: Record<CropVariant, { aspect: number; round: boolean; previews: PreviewFrame[] }> = {
  brand: {
    aspect: 4 / 3,
    round: false,
    previews: [
      { key: "brandPage", aspect: 4 / 3, shape: "rounded-lg", width: 1 }, // website brand page, About
      { key: "app", aspect: 7 / 3, shape: "rounded-lg", width: 1 }, // app brand page banner
      { key: "cards", aspect: 4 / 5, shape: "rounded-lg", width: 0.55 }, // website home cards
    ],
  },
  logo: {
    aspect: 1,
    round: true,
    previews: [
      { key: "website", aspect: 1, shape: "rounded-full", width: 0.6 }, // brand page and website nav
      { key: "app", aspect: 1, shape: "rounded-[25%]", width: 0.6 }, // app appointment tile
    ],
  },
  profile: {
    aspect: 1,
    round: true,
    previews: [
      { key: "avatar", aspect: 1, shape: "rounded-full", width: 0.6 },
      { key: "website", aspect: 4 / 5, shape: "rounded-lg", width: 0.6 }, // website team cards
    ],
  },
};

// Zoom limits: a little under "the whole image fits", up to 4x "the image fills the frame".
const MAX_ZOOM = 4;
const MIN_ZOOM_OF_FIT = 0.8;
const ZOOM_STEP = 1.25;
// One mouse-wheel notch zooms by about a fifth at any zoom level (the library's own step is a fixed amount).
const WHEEL_ZOOM = 0.4;
const FRAME_MARGIN = { mobile: 16, desktop: 24 };
const MOBILE_QUERY = "(max-width: 767px)";
// Stands in for the light surfaces transparent areas are shown on.
const BACKDROP = "rgb(229 229 229)";
// Let the close animation finish before the parent unmounts the dialog.
const EXIT_MS = { dialog: 180, sheet: 500 };
// Desktop: the stage gives way on short screens so the dialog fits (21rem is everything around it).
const STAGE_HEIGHT = "clamp(15rem, calc(100dvh - 21rem), 26rem)";

const PREVIEW_TILE = "bg-no-repeat ring-1 ring-inset ring-black/[0.06] dark:ring-white/10";
const PREVIEW_LABEL = "mt-1.5 text-neutral-500 dark:text-foreground-3";

// The same slider in every browser; the filled part ends under the thumb (--zoom-progress).
const ZOOM_SLIDER = cn(
  "min-w-0 flex-1 cursor-pointer touch-none appearance-none bg-transparent outline-none",
  "disabled:cursor-default disabled:opacity-50",
  "[&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full",
  "[&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,var(--primary)_var(--zoom-progress),var(--border-strong)_var(--zoom-progress))]",
  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2",
  "[&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm",
  "[&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-border-strong",
  "[&::-moz-range-progress]:h-1 [&::-moz-range-progress]:rounded-full [&::-moz-range-progress]:bg-primary",
  "[&::-moz-range-thumb]:box-border [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2",
  "[&::-moz-range-thumb]:border-solid [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-white",
  "focus-visible:[&::-webkit-slider-thumb]:ring-4 focus-visible:[&::-webkit-slider-thumb]:ring-primary/25",
  "focus-visible:[&::-moz-range-thumb]:ring-4 focus-visible:[&::-moz-range-thumb]:ring-primary/25",
);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function IconButton({ label, className, ...props }: ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full md:size-9",
        "text-neutral-600 transition-[background-color,color,transform] duration-150 hover:bg-neutral-200/70 hover:text-neutral-900 active:scale-95",
        "dark:text-foreground-2 dark:hover:bg-surface-hover dark:hover:text-foreground-1",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 disabled:pointer-events-none disabled:opacity-40",
        "[&_svg]:size-[18px]",
        className,
      )}
      {...props}
    />
  );
}

export function ImageCropDialog({ file, variant, onCancel, onConfirm }: ImageCropDialogProps) {
  const { t } = useTranslation("common");
  const config = VARIANTS[variant];
  const isLogo = variant === "logo";
  const [isMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  const [open, setOpen] = useState(true);
  const [source, setSource] = useState<{ url: string; aspect: number } | null>(null);
  const [fill, setFill] = useState<string | null>(null);
  const [stageEl, setStageEl] = useState<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState<Size | null>(null);
  // Kept relative to the frame (offset in frame sizes, zoom as a multiple of the opening zoom),
  // so the framing survives the stage being resized.
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [zoomRatio, setZoomRatio] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [interacting, setInteracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<"previewError" | "exportError" | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const pixelsRef = useRef<Area | null>(null);
  const closingRef = useRef(false);
  const exitTimer = useRef<number | undefined>(undefined);

  const geometry = stageSize && source
    ? cropGeometry(stageSize, source.aspect, config.aspect, config.round, isMobile ? FRAME_MARGIN.mobile : FRAME_MARGIN.desktop)
    : null;
  // The whole image shows first; a profile photo fills the circle, since a face should.
  const baseZoom = geometry ? (variant === "profile" ? geometry.coverZoom : geometry.fitZoom) : 1;
  const minRatio = geometry ? (geometry.fitZoom * MIN_ZOOM_OF_FIT) / baseZoom : 1;
  const maxRatio = geometry ? (geometry.coverZoom * MAX_ZOOM) / baseZoom : MAX_ZOOM;
  const ratio = clamp(zoomRatio, minRatio, maxRatio);
  const zoom = baseZoom * ratio;
  const crop = geometry
    ? { x: offset.x * geometry.crop.width, y: offset.y * geometry.crop.height }
    : { x: 0, y: 0 };
  const atDefault = Math.abs(ratio - 1) < 0.001 && Math.abs(offset.x) < 0.001 && Math.abs(offset.y) < 0.001;
  const sliderRange = Math.log(maxRatio) - Math.log(minRatio);
  const sliderProgress = sliderRange > 0 ? ((Math.log(ratio) - Math.log(minRatio)) / sliderRange) * 100 : 0;
  const ready = area !== null;
  const failed = error !== null;
  const backdrop = fill ?? BACKDROP;

  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;
    (async () => {
      try {
        const blob = isSvgFile(file) ? await rasterizeSvg(file) : file;
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        const image = await loadImage(url);
        if (cancelled) return;
        if (!image.naturalWidth || !image.naturalHeight) throw new Error("Empty image");
        imageRef.current = image;
        setFill(cornerFill(image));
        setSource({ url, aspect: image.naturalWidth / image.naturalHeight });
      } catch {
        if (!cancelled) setError("previewError");
      }
    })();
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [file]);

  // The stage lives in a portal that mounts a commit late, hence a callback ref rather than a mount effect.
  useEffect(() => {
    if (!stageEl) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      setStageSize((current) => (current?.width === width && current.height === height ? current : { width, height }));
    });
    observer.observe(stageEl);
    return () => observer.disconnect();
  }, [stageEl]);

  useEffect(() => () => window.clearTimeout(exitTimer.current), []);

  const close = (after: () => void) => {
    if (closingRef.current) return;
    closingRef.current = true;
    setOpen(false);
    exitTimer.current = window.setTimeout(after, isMobile ? EXIT_MS.sheet : EXIT_MS.dialog);
  };
  const cancel = () => close(onCancel);
  const pickOriginal = () => close(() => onConfirm(file));

  const confirm = async () => {
    const image = imageRef.current;
    const pixels = pixelsRef.current;
    if (!image || !pixels || saving) return;
    setSaving(true);
    try {
      const result = await exportCrop(image, pixels, file.name, { fill, keepAlpha: isLogo });
      if (!closingRef.current) close(() => onConfirm(result));
    } catch {
      if (!closingRef.current) {
        setError("exportError");
        setSaving(false);
      }
    }
  };

  const zoomBy = (factor: number) => setZoomRatio(clamp(ratio * factor, minRatio, maxRatio));
  const reset = () => {
    setZoomRatio(1);
    setOffset({ x: 0, y: 0 });
  };

  // The library also calls this after every zoom change, which keeps the position inside the limits.
  const changeCrop = (next: Point) => {
    if (!geometry) return;
    // Smaller than the frame, the image stays inside it; larger, it keeps covering it.
    const maxX = Math.abs(geometry.media.width * zoom - geometry.crop.width) / 2;
    const maxY = Math.abs(geometry.media.height * zoom - geometry.crop.height) / 2;
    const x = clamp(next.x, -maxX, maxX) / geometry.crop.width;
    const y = clamp(next.y, -maxY, maxY) / geometry.crop.height;
    setOffset((current) => (current.x === x && current.y === y ? current : { x, y }));
  };

  const title = t(`imageCrop.title.${variant}`);
  const description = t(`imageCrop.description.${variant}`);

  const stage = (
    <div
      ref={setStageEl}
      className={cn("relative overflow-hidden", isMobile ? "min-h-44 flex-1" : "w-full rounded-2xl")}
      style={{
        backgroundColor: backdrop,
        ...(isMobile ? null : { height: error === "previewError" ? "12rem" : "var(--crop-stage)" }),
      }}
    >
      {source && stageSize && geometry && error !== "previewError" && (
        <Cropper
          // Remount on resize: the library skips a new frame size when the zoom changes in the same update.
          key={`${stageSize.width}x${stageSize.height}`}
          image={source.url}
          crop={crop}
          zoom={zoom}
          aspect={config.aspect}
          cropSize={geometry.crop}
          cropShape={config.round ? "round" : "rect"}
          objectFit="cover"
          minZoom={baseZoom * minRatio}
          maxZoom={baseZoom * maxRatio}
          zoomSpeed={zoom * WHEEL_ZOOM}
          restrictPosition={false}
          showGrid={interacting}
          keyboardStep={10}
          disableAutomaticStylesInjection
          onCropChange={changeCrop}
          onZoomChange={(next) => setZoomRatio(next / baseZoom)}
          onCropAreaChange={(percentages, pixels) => {
            // Skips the empty measurement the library can report before the image has loaded.
            if (!(pixels.width > 0 && pixels.height > 0)) return;
            pixelsRef.current = pixels;
            setArea(percentages);
          }}
          onInteractionStart={() => setInteracting(true)}
          onInteractionEnd={() => setInteracting(false)}
          cropperProps={{ role: "group", "aria-label": t("imageCrop.cropArea") }}
          mediaProps={{ onError: () => setError("previewError") }}
          style={{
            containerStyle: { background: backdrop },
            cropAreaStyle: {
              border: "1.5px solid rgb(255 255 255 / 0.9)",
              ...(config.round ? null : { borderRadius: 12 }),
            },
            // Safari blurs a will-change layer once zoomed (react-easy-crop #520): promote it only while dragging.
            mediaStyle: { willChange: interacting ? "transform" : "auto" },
          }}
        />
      )}
      {error === "previewError" ? (
        <p role="alert" className="absolute inset-0 grid place-content-center px-6 text-center text-sm text-neutral-600 text-pretty">
          {t("imageCrop.previewError")}
        </p>
      ) : (
        !ready && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <Spinner />
          </div>
        )
      )}
    </div>
  );

  const controls = !failed && (
    // Phones: pulled out so the icons and "Reset" line up with the previews below.
    <div className={cn("flex items-center gap-1", isMobile ? "-mx-3" : "mt-3")}>
      <IconButton label={t("imageCrop.zoomOut")} onClick={() => zoomBy(1 / ZOOM_STEP)} disabled={!ready || ratio <= minRatio * 1.001}>
        <ZoomOut aria-hidden />
      </IconButton>
      <input
        type="range"
        // Logarithmic, so each step zooms by the same proportion.
        min={Math.log(minRatio)}
        max={Math.log(maxRatio)}
        step={0.01}
        value={Math.log(ratio)}
        onChange={(event) => setZoomRatio(Math.exp(event.currentTarget.valueAsNumber))}
        disabled={!ready}
        aria-label={t("imageCrop.zoom")}
        aria-valuetext={`${Math.round(ratio * 100)}%`}
        className={cn(
          ZOOM_SLIDER,
          isMobile
            ? "h-11 [&::-webkit-slider-thumb]:-mt-2.5 [&::-webkit-slider-thumb]:size-6"
            : "h-9 [&::-webkit-slider-thumb]:-mt-2 [&::-webkit-slider-thumb]:size-5",
        )}
        style={{ "--zoom-progress": `${sliderProgress}%` } as CSSProperties}
      />
      <IconButton label={t("imageCrop.zoomIn")} onClick={() => zoomBy(ZOOM_STEP)} disabled={!ready || ratio >= maxRatio * 0.999}>
        <ZoomIn aria-hidden />
      </IconButton>
      <button
        type="button"
        onClick={reset}
        disabled={!ready || atDefault}
        className={cn(modalGhost, "min-h-11 shrink-0 md:min-h-0 disabled:pointer-events-none disabled:opacity-40")}
      >
        {t("imageCrop.reset")}
      </button>
    </div>
  );

  const previewStyle = (frame: PreviewFrame): CSSProperties => ({
    aspectRatio: frame.aspect,
    backgroundColor: backdrop,
    ...(source && area
      ? { backgroundImage: `url("${source.url}")`, ...areaBackground(centerCrop(area, config.aspect, frame.aspect)) }
      : null),
  });

  // Rendered before the image is ready too, so nothing jumps when they fill in.
  const previews = !failed && (isMobile ? (
    <div aria-hidden className={cn("flex items-start", config.round ? "justify-center gap-6" : "gap-3")}>
      {config.previews.map((frame) => (
        // A rectangle's strip spans the row: widths follow the shapes, so every tile is equally tall.
        <div
          key={frame.key}
          className="flex min-w-0 flex-col items-center"
          style={config.round ? undefined : { flex: `${frame.aspect} 1 0%` }}
        >
          <div className={cn(PREVIEW_TILE, frame.shape, config.round ? "h-16" : "w-full")} style={previewStyle(frame)} />
          <span className={cn("whitespace-nowrap text-[11px] leading-4", PREVIEW_LABEL)}>{t(`imageCrop.preview.${frame.key}`)}</span>
        </div>
      ))}
    </div>
  ) : (
    <div aria-hidden className="flex shrink-0 flex-col gap-4" style={{ width: "var(--crop-preview)" }}>
      {config.previews.map((frame) => (
        <div key={frame.key}>
          <div
            className={cn(PREVIEW_TILE, frame.shape)}
            style={{ ...previewStyle(frame), width: `calc(var(--crop-preview) * ${frame.width})` }}
          />
          <p className={cn("text-xs leading-4", PREVIEW_LABEL)}>{t(`imageCrop.preview.${frame.key}`)}</p>
        </div>
      ))}
    </div>
  ));

  const exportFailed = error === "exportError" && (
    <p role="alert" className={cn("text-sm text-destructive text-pretty", !isMobile && "mt-3")}>{t("imageCrop.exportError")}</p>
  );

  const actions = (
    <>
      <button type="button" onClick={cancel} className={cn(modalCancel, isMobile && "flex-1")}>
        {t("imageCrop.cancel")}
      </button>
      <button
        type="button"
        onClick={failed ? pickOriginal : confirm}
        disabled={!failed && !ready}
        aria-busy={saving || undefined}
        className={cn(modalPrimary, isMobile && "flex-1")}
      >
        {saving ? <Spinner size="sm" color="white" /> : <span>{t(failed ? "imageCrop.useOriginal" : "imageCrop.apply")}</span>}
      </button>
    </>
  );

  if (isMobile) {
    return (
      <BaseSlider
        isOpen={open}
        onClose={cancel}
        title={title}
        subtitle={description}
        panelClassName="z-[300]"
        backdropClassName="z-[299]"
        // Edge-to-edge stage right under the header; the body's inner wrapper becomes a column so it takes the free height.
        headerClassName="pb-0"
        contentClassName="!p-0 [&>div]:flex [&>div]:min-h-0 [&>div]:flex-col"
        footer={<div className="flex gap-2 pt-3">{actions}</div>}
      >
        {/* data-vaul-no-drag: dragging the photo or the zoom slider never swipes the panel closed. */}
        <div data-vaul-no-drag="" className="flex min-h-0 flex-1 flex-col">
          {stage}
          {(!failed || exportFailed) && (
            <div className="flex shrink-0 flex-col gap-3 px-4 pb-3 pt-2">
              {controls}
              {previews}
              {/* The panel header drops its subtitle on phones, so the explanation sits here. */}
              {!failed && (
                <p className="text-xs leading-relaxed text-foreground-3 text-pretty dark:text-foreground-2">{description}</p>
              )}
              {exportFailed}
            </div>
          )}
        </div>
      </BaseSlider>
    );
  }

  // Tiles shrink with the stage: together with their labels they stay as tall as the stage plus the zoom row.
  const previewShare = config.previews.reduce((sum, frame) => sum + frame.width / frame.aspect, 0);
  const previewLabels = config.previews.length * 1.375 + (config.previews.length - 1);
  const sizes = {
    "--crop-stage": STAGE_HEIGHT,
    "--crop-preview": `min(10.5rem, calc((var(--crop-stage) + ${3 - previewLabels}rem) / ${previewShare}))`,
  } as CSSProperties;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => { if (!next) cancel(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={modalScrim} />
        <DialogPrimitive.Content
          data-vaul-no-drag=""
          className={cn(modalPanelLarge, config.round ? "max-w-[680px]" : "max-w-[800px]", "text-left sm:p-8")}
          // Fade without scaling: react-easy-crop measures its frame while the panel opens.
          style={{ "--tw-enter-scale": 1 } as CSSProperties}
        >
          <DialogPrimitive.Close
            aria-label={t("aria.close")}
            className={cn(
              "absolute right-4 top-4 inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-neutral-500 transition-colors",
              "hover:bg-neutral-100 hover:text-neutral-800 dark:text-foreground-3 dark:hover:bg-surface-hover dark:hover:text-foreground-1",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30",
            )}
          >
            <X className="size-4" aria-hidden />
          </DialogPrimitive.Close>
          <DialogPrimitive.Title className={cn(modalTitleCompact, "pr-8 text-balance")}>{title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className={cn(modalBody, "mt-2")}>{description}</DialogPrimitive.Description>
          <div className="mt-6 flex items-start gap-7" style={sizes}>
            <div className="min-w-0 flex-1">
              {stage}
              {controls}
              {exportFailed}
            </div>
            {previews}
          </div>
          <div className={cn("mt-6", modalFooterRowRight)}>{actions}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
