import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";

type LocationImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
  fallbackLabel?: string;
};

/** Design-source image behavior: lazy decode, load fade, and a striped failed-URL fallback. */
export function LocationImage({
  src,
  alt = "",
  fallbackLabel,
  className = "",
  onLoad,
  onError,
  ...props
}: LocationImageProps) {
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
      <span
        className={`mc-location-image-fallback ${className}`}
        role={alt || fallbackLabel ? "img" : undefined}
        aria-label={alt || fallbackLabel || undefined}
        aria-hidden={alt || fallbackLabel ? undefined : true}
      >
        <span>{fallbackLabel || alt}</span>
      </span>
    );
  }

  return (
    <img
      {...props}
      src={src}
      alt={alt}
      className={`mc-location-image${loaded ? " is-loaded" : ""} ${className}`}
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
