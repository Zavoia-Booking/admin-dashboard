import { Capacitor } from "@capacitor/core";
import { Clipboard } from "@capacitor/clipboard";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

export class WebsiteSharingCancelled extends Error {
  constructor() {
    super("Website sharing cancelled");
    this.name = "WebsiteSharingCancelled";
  }
}

export function isWebsiteSharingCancelled(error: unknown): boolean {
  if (error instanceof WebsiteSharingCancelled) return true;
  if (!error || typeof error !== "object") return false;
  const value = error as { name?: string; message?: string };
  return value.name === "AbortError" || /^share cancel(?:l)?ed$/i.test(value.message ?? "");
}

function assertCurrent(isCurrent: () => boolean) {
  if (!isCurrent()) throw new WebsiteSharingCancelled();
}

export function websiteSharingCapabilities() {
  const native = Capacitor.isNativePlatform();
  return {
    native,
    open: !native || Capacitor.isPluginAvailable("Browser"),
    copy: native
      ? Capacitor.isPluginAvailable("Clipboard")
      : typeof navigator !== "undefined" && typeof navigator.clipboard?.writeText === "function",
    share: native
      ? Capacitor.isPluginAvailable("Share")
      : typeof navigator !== "undefined" && typeof navigator.share === "function",
    exportQr: !native || (
      Capacitor.isPluginAvailable("Share") && Capacitor.isPluginAvailable("Filesystem")
    ),
  };
}

export async function generateWebsiteQr(url: string): Promise<string> {
  const { default: QRCode } = await import("qrcode");
  return QRCode.toDataURL(url, {
    type: "image/png",
    width: 1024,
    margin: 4,
    errorCorrectionLevel: "M",
    color: { dark: "#111111", light: "#ffffff" },
  });
}

export async function copyWebsiteLink(url: string, isCurrent: () => boolean): Promise<void> {
  assertCurrent(isCurrent);
  if (!websiteSharingCapabilities().copy) throw new Error("Clipboard is unavailable");
  if (Capacitor.isNativePlatform()) {
    await Clipboard.write({ string: url });
  } else {
    await navigator.clipboard.writeText(url);
  }
  assertCurrent(isCurrent);
}

export async function shareWebsiteLink(
  url: string,
  title: string,
  isCurrent: () => boolean,
): Promise<void> {
  assertCurrent(isCurrent);
  if (!websiteSharingCapabilities().share) throw new Error("Sharing is unavailable");
  if (Capacitor.isNativePlatform()) {
    const { value } = await Share.canShare();
    assertCurrent(isCurrent);
    if (!value) throw new Error("Sharing is unavailable");
    await Share.share({ url, title, dialogTitle: title });
  } else {
    // Call directly from the button handler to retain browser user activation.
    await navigator.share({ url, title });
  }
  assertCurrent(isCurrent);
}

function qrFilename(url: string): string {
  const segments = new URL(url).pathname.split("/").filter(Boolean);
  const slug = (segments.at(-1) ?? "website").replace(/[^a-z0-9-]/gi, "-").slice(0, 120);
  return `zavoia-${slug}-${segments[0] === "ro" ? "ro" : "en"}-qr.png`;
}

export async function exportWebsiteQr(
  pngDataUrl: string,
  url: string,
  title: string,
  isCurrent: () => boolean,
): Promise<void> {
  assertCurrent(isCurrent);
  if (!websiteSharingCapabilities().exportQr) throw new Error("QR export is unavailable");
  const base64 = pngDataUrl.match(/^data:image\/png;base64,(.+)$/)?.[1];
  if (!base64) throw new Error("Invalid QR image");
  const filename = qrFilename(url);

  if (Capacitor.isNativePlatform()) {
    const { value } = await Share.canShare();
    assertCurrent(isCurrent);
    if (!value) throw new Error("Sharing is unavailable");
    const { uri } = await Filesystem.writeFile({
      path: `website-qr/${filename}`,
      data: base64,
      directory: Directory.Cache,
      recursive: true,
      // Omit encoding: the native plugins decode base64 into PNG bytes.
    });
    assertCurrent(isCurrent);
    await Share.share({ files: [uri], title, dialogTitle: title });
    // Keep the cached image available to the receiving app. Re-exporting the
    // same stable address reuses its file; this is not permanent file storage.
    assertCurrent(isCurrent);
    return;
  }

  const decoded = atob(base64);
  const bytes = new Uint8Array(decoded.length);
  for (let index = 0; index < decoded.length; index += 1) bytes[index] = decoded.charCodeAt(index);
  const objectUrl = URL.createObjectURL(new Blob([bytes], { type: "image/png" }));
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  try {
    assertCurrent(isCurrent);
    link.click();
  } finally {
    link.remove();
    // Give the browser time to consume the object URL for the download.
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }
}
