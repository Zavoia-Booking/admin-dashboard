import type { ReactNode } from "react";

export type AnnouncementLayout = "ribbon" | "ticker" | "pill";

/** Shared content contract; every layout owns its own markup and adjacent stylesheet. */
export type AnnouncementVariantProps = {
  msg: string;
  ctaLabel: string;
  ctaUrl: string;
  ctaNewTab: boolean;
  showCta: boolean;
  showArrow: boolean;
  detailsControl: ReactNode;
  dismissControl: ReactNode;
};
