import { getAvatarBgColor } from "../../features/setupWizard/components/StepTeam";

/**
 * Converts HSL color to hex format
 * @param hsl - HSL color string like "hsl(123 60% 92%)"
 * @returns Hex color string like "#A1B2C3"
 */
export function hslToHex(hsl: string): string {
  // Parse HSL string: "hsl(123 60% 92%)"
  const match = hsl.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/);
  if (!match) return "#000000";

  const h = parseInt(match[1], 10);
  const s = parseInt(match[2], 10) / 100;
  const l = parseInt(match[3], 10) / 100;

  // Convert HSL to RGB
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  // Convert RGB to hex
  const toHex = (n: number) => {
    const hex = n.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generates a hex color from a string (for database storage)
 * Uses the same algorithm as getAvatarBgColor but returns hex instead of HSL.
 * This is useful when storing colors in databases with limited varchar length (e.g., varchar(7) for hex).
 *
 * @param name - String to generate color from (e.g., category name, email)
 * @returns Hex color string like "#A1B2C3" (7 characters, suitable for database storage)
 */
export function getColorHex(name: string | undefined): string {
  const hsl = getAvatarBgColor(name);
  return hslToHex(hsl);
}

/**
 * Given a hex background color, returns either black or white text
 * for good contrast. Shared by category pills and other colored chips.
 */
export function getReadableTextColor(bgColor: string): string {
  const hex = bgColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}

