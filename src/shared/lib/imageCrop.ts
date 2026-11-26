import type { Area, Size } from "react-easy-crop";

export type CropVariant = "brand" | "logo" | "profile";

// admin-api keeps at most 1024px on the longest edge, so larger exports only slow the upload.
const MAX_EDGE = 1024;
const SVG_RASTER_EDGE = 2048;

export const isSvgFile = (file: File) => file.type === "image/svg+xml" || /\.svg$/i.test(file.name);

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image failed to load"));
    image.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))), type, quality);
  });
}

function svgSize(svg: Element) {
  const pixels = (value: string | null) => {
    const match = value?.trim().match(/^(\d*\.?\d+)(px)?$/);
    return match ? parseFloat(match[1]) : null;
  };
  const box = svg.getAttribute("viewBox")?.trim().split(/[\s,]+/).map(Number);
  const boxRatio = box?.length === 4 && box[2] > 0 && box[3] > 0 ? box[2] / box[3] : null;
  let width = pixels(svg.getAttribute("width"));
  let height = pixels(svg.getAttribute("height"));
  if (width && !height && boxRatio) height = width / boxRatio;
  if (height && !width && boxRatio) width = height * boxRatio;
  if (!width || !height) {
    width = box && boxRatio ? box[2] : 300;
    height = box && boxRatio ? box[3] : 150;
  }
  return { width, height };
}

/** react-easy-crop mis-measures SVGs without a fixed size (issue #381), so they are cropped as PNG. */
export async function rasterizeSvg(file: File): Promise<Blob> {
  const doc = new DOMParser().parseFromString(await file.text(), "image/svg+xml");
  const svg = doc.documentElement;
  if (svg.nodeName.toLowerCase() !== "svg" || doc.getElementsByTagName("parsererror").length) {
    throw new Error("Invalid SVG");
  }
  const { width, height } = svgSize(svg);
  if (!svg.hasAttribute("viewBox")) svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  const scale = SVG_RASTER_EDGE / Math.max(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  svg.setAttribute("width", String(canvas.width));
  svg.setAttribute("height", String(canvas.height));
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(doc)], { type: "image/svg+xml" }));
  try {
    const image = await loadImage(url);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await canvasToBlob(canvas, "image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** A logo's own background colour when its four corners share one opaque colour, so padding blends in. */
export function cornerFill(image: HTMLImageElement): string | null {
  try {
    const scale = Math.min(1, 256 / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(image, 0, 0, width, height);
    const corners = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]]
      .map(([x, y]) => context.getImageData(x, y, 1, 1).data);
    if (corners.some((pixel) => pixel[3] < 250)) return null;
    const channels = [0, 1, 2].map((channel) => corners.map((pixel) => pixel[channel]));
    if (channels.some((values) => Math.max(...values) - Math.min(...values) > 16)) return null;
    const [red, green, blue] = channels.map((values) => Math.round(values.reduce((sum, value) => sum + value, 0) / 4));
    return `rgb(${red}, ${green}, ${blue})`;
  } catch {
    return null;
  }
}

/** Largest box of `aspect` that fits in width × height. */
export function fitRect(width: number, height: number, aspect: number): Size | null {
  if (width <= 0 || height <= 0) return null;
  return width / height > aspect ? { width: height * aspect, height } : { width, height: width / aspect };
}

/**
 * The frame inside the stage (a dimmed margin around it shows what gets cut) and the zooms at which
 * the whole image fits in the frame or covers it. Zoom 1 is the image covering the stage.
 */
export function cropGeometry(stage: Size, imageAspect: number, frameAspect: number, round: boolean, margin: number) {
  const crop = fitRect(stage.width - margin * 2, stage.height - margin * 2, frameAspect);
  if (!crop) return null;
  const media = imageAspect > stage.width / stage.height
    ? { width: stage.height * imageAspect, height: stage.height }
    : { width: stage.width, height: stage.width / imageAspect };
  const fitZoom = round
    ? crop.width / Math.hypot(media.width, media.height)
    : Math.min(crop.width / media.width, crop.height / media.height);
  const coverZoom = Math.max(crop.width / media.width, crop.height / media.height);
  return { crop, media, fitZoom, coverZoom };
}

/** The part of the crop a frame of another shape keeps when it trims from the centre (object-fit: cover). */
export function centerCrop(area: Area, cropAspect: number, frameAspect: number): Area {
  if (frameAspect > cropAspect) {
    const height = (area.height * cropAspect) / frameAspect;
    return { ...area, y: area.y + (area.height - height) / 2, height };
  }
  const width = (area.width * frameAspect) / cropAspect;
  return { ...area, x: area.x + (area.width - width) / 2, width };
}

/** Background size and position that make `area` (percentages of the image) fill its box. */
export function areaBackground(area: Area) {
  const position = (offset: number, size: number) => (Math.abs(100 - size) < 0.001 ? 0 : (offset / (100 - size)) * 100);
  return {
    backgroundSize: `${10000 / area.width}% ${10000 / area.height}%`,
    backgroundPosition: `${position(area.x, area.width)}% ${position(area.y, area.height)}%`,
  };
}

function hasTransparency(context: CanvasRenderingContext2D, width: number, height: number) {
  const { data } = context.getImageData(0, 0, width, height);
  for (let index = 3; index < data.length; index += 4) {
    if (data[index] < 255) return true;
  }
  return false;
}

/** Draws the crop (it can extend past the image when a logo is zoomed out) at the size the API keeps. */
export async function exportCrop(
  image: HTMLImageElement,
  area: Area,
  fileName: string,
  { fill, keepAlpha }: { fill: string | null; keepAlpha: boolean },
): Promise<File> {
  const scale = Math.min(1, MAX_EDGE / Math.max(area.width, area.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(area.width * scale));
  canvas.height = Math.max(1, Math.round(area.height * scale));
  const context = canvas.getContext("2d", { willReadFrequently: !keepAlpha });
  if (!context) throw new Error("Canvas unavailable");
  if (fill) {
    context.fillStyle = fill;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.imageSmoothingQuality = "high";
  context.drawImage(image, -area.x * scale, -area.y * scale, image.naturalWidth * scale, image.naturalHeight * scale);
  // Opaque photos go up as JPEG, a fraction of the PNG size; anything transparent stays PNG.
  const png = keepAlpha || hasTransparency(context, canvas.width, canvas.height);
  const blob = await canvasToBlob(canvas, png ? "image/png" : "image/jpeg", png ? undefined : 0.92);
  const baseName = fileName.replace(/\.[^.]*$/, "") || "image";
  return new File([blob], `${baseName}.${png ? "png" : "jpg"}`, { type: blob.type });
}
