import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";
import { cn } from "../../../../../../../../shared/lib/utils";

type GalleryImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
  fallbackLabel?: string;
};

/** Design-file image primitive: lazy decode, load fade, and a quiet striped failure state. */
export function GalleryImage({
  src,
  alt = "",
  fallbackLabel = "Gallery",
  className,
  onLoad,
  onError,
  ...props
}: GalleryImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const previousSrc = useRef(src);

  useEffect(() => {
    if (previousSrc.current === src) return;
    previousSrc.current = src;
    setFailed(false);
    setLoaded(false);
  }, [src]);

  if (!src || failed) {
    return (
      <span className={cn("mc-gallery-image-fallback", className)} role="img" aria-label={alt || fallbackLabel}>
        <span>{fallbackLabel}</span>
      </span>
    );
  }

  return (
    <img
      {...props}
      src={src}
      alt={alt}
      className={cn("mc-gallery-image", loaded && "is-loaded", className)}
      loading={props.loading ?? "lazy"}
      decoding={props.decoding ?? "async"}
      onLoad={(event) => {
        setLoaded(true);
        onLoad?.(event);
      }}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
      ref={(node) => {
        if (node?.complete && node.naturalWidth > 0 && !loaded) setLoaded(true);
      }}
    />
  );
}
