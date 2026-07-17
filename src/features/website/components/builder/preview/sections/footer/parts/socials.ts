import { createElement, type ComponentType, type SVGProps } from "react";
import type { PreviewData } from "../../../shared/types";

const href = (url: string) => {
  const value = url.trim();
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
};

type SocialIcon = ComponentType<SVGProps<SVGSVGElement>>;

const InstagramIcon = (props: SVGProps<SVGSVGElement>) => createElement(
  "svg",
  { viewBox: "0 0 24 24", fill: "none", ...props },
  createElement("rect", {
    x: 3,
    y: 3,
    width: 18,
    height: 18,
    rx: 5,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
  }),
  createElement("circle", {
    cx: 12,
    cy: 12,
    r: 4,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
  }),
  createElement("circle", { cx: 17.5, cy: 6.5, r: 1, fill: "currentColor" }),
);

const TikTokIcon = (props: SVGProps<SVGSVGElement>) => createElement(
  "svg",
  { viewBox: "0 0 24 24", fill: "none", ...props },
  createElement("path", {
    d: "M14 4v9a3 3 0 1 1-3-3V8a5 5 0 1 0 5 5V8a6 6 0 0 0 4 1.5V7a4 4 0 0 1-4-3h-2Z",
    fill: "currentColor",
  }),
);

const FacebookIcon = (props: SVGProps<SVGSVGElement>) => createElement(
  "svg",
  { viewBox: "0 0 24 24", fill: "none", ...props },
  createElement("path", {
    d: "M13.4 21v-7h2.3l.4-2.9h-2.7V9.2c0-.85.27-1.43 1.49-1.43H16.2V5.16C15.9 5.12 14.96 5 13.86 5c-2.07 0-3.49 1.26-3.49 3.59v2.5H8v2.9h2.37V21h3.03Z",
    fill: "currentColor",
  }),
);

const PinterestIcon = (props: SVGProps<SVGSVGElement>) => createElement(
  "svg",
  { viewBox: "0 0 24 24", fill: "none", ...props },
  createElement("path", {
    d: "M12 3a9 9 0 0 0-3.28 17.38c-.08-.73-.15-1.85.03-2.65.16-.69 1.06-4.5 1.06-4.5s-.27-.54-.27-1.34c0-1.26.73-2.2 1.63-2.2.77 0 1.14.58 1.14 1.27 0 .77-.49 1.92-.75 2.99-.21.9.45 1.62 1.34 1.62 1.6 0 2.84-1.69 2.84-4.13 0-2.16-1.55-3.67-3.77-3.67-2.57 0-4.08 1.92-4.08 3.91 0 .77.3 1.6.67 2.05a.27.27 0 0 1 .06.26c-.06.26-.21.86-.24.98-.04.16-.13.2-.29.12-1.1-.51-1.78-2.11-1.78-3.4 0-2.77 2.01-5.31 5.8-5.31 3.04 0 5.41 2.17 5.41 5.07 0 3.03-1.9 5.46-4.54 5.46-.89 0-1.72-.46-2-1.01l-.55 2.08c-.2.77-.73 1.73-1.09 2.32A9 9 0 1 0 12 3Z",
    fill: "currentColor",
  }),
);

export type SocialLink = { key: string; label: string; url: string; Icon: SocialIcon };

/** Owner's social links in the design-file order, dropping values that are not configured. The website is
 * contact information in the design and is deliberately not duplicated as a social icon. */
export function socialLinks(social: PreviewData["social"]): SocialLink[] {
  const all: { key: string; label: string; url?: string | null; Icon: SocialIcon }[] = [
    { key: "instagram", label: "Instagram", url: social.instagram, Icon: InstagramIcon },
    { key: "tiktok", label: "TikTok", url: social.tiktok, Icon: TikTokIcon },
    { key: "facebook", label: "Facebook", url: social.facebook, Icon: FacebookIcon },
    { key: "pinterest", label: "Pinterest", url: social.pinterest, Icon: PinterestIcon },
  ];
  return all
    .filter((s): s is { key: string; label: string; url: string; Icon: SocialIcon } => !!s.url?.trim())
    .map((s) => ({ key: s.key, label: s.label, url: href(s.url), Icon: s.Icon }));
}
