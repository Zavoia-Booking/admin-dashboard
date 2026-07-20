import type { Ref } from "react";
import type { FooterConfig, SectionEntry } from "../../../../../types";
import type { PreviewData, T } from "../../shared/types";

export type FooterStyleKey = "directory" | "editorial" | "signature" | "masthead" | "marque";

export type FooterLinkItem = {
  type: string;
  label: string;
};

/** Inputs supplied by the page renderer. The footer needs the visible layout so its sitemap variants mirror
 * the links that actually exist on the page instead of rendering a separate, hard-coded navigation tree. */
export type FooterVariantProps = {
  data: PreviewData;
  t: T;
  footerRef: Ref<HTMLElement>;
  layout: SectionEntry[];
  selectedLocationId: number | null;
  variant?: string;
};

/** Normalized view contract shared by the five design-file variants. Each variant still owns its complete
 * semantic footer shell, local state, interaction logic, and CSS file. */
export type FooterViewProps = {
  data: PreviewData;
  t: T;
  footerRef: Ref<HTMLElement>;
  links: FooterLinkItem[];
  selectedLocationId: number | null;
  showLogo: boolean;
  headline: string;
  headlineHidden: boolean;
  description: string;
  onNavigate: (type: string) => void;
};

export type { FooterConfig };
