import { Instagram, Facebook, Globe, Music2, Link2, type LucideIcon } from "lucide-react";
import type { PreviewData } from "../../../shared/types";

const href = (u: string) => (/^https?:\/\//.test(u) ? u : `https://${u}`);

export type SocialLink = { key: string; label: string; url: string; Icon: LucideIcon };

/** Owner's social links in display order, dropping any that aren't set; each url is scheme-normalised so a
 *  bare domain becomes absolute. Shared by the icon row (FootSocials) and the footer index's text links. */
export function socialLinks(social: PreviewData["social"]): SocialLink[] {
  const all: { key: string; label: string; url?: string | null; Icon: LucideIcon }[] = [
    { key: "instagram", label: "Instagram", url: social.instagram, Icon: Instagram },
    { key: "facebook", label: "Facebook", url: social.facebook, Icon: Facebook },
    { key: "tiktok", label: "TikTok", url: social.tiktok, Icon: Music2 },
    { key: "website", label: "Website", url: social.website, Icon: Globe },
    { key: "pinterest", label: "Pinterest", url: social.pinterest, Icon: Link2 },
  ];
  return all
    .filter((s): s is { key: string; label: string; url: string; Icon: LucideIcon } => !!s.url?.trim())
    .map((s) => ({ key: s.key, label: s.label, url: href(s.url), Icon: s.Icon }));
}
