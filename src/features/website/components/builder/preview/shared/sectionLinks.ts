type SectionLinkDefinition = {
  labelKey: string;
  includeInFooterSample: boolean;
};

/** Sections surfaced by both site-navigation renderers. Keeping eligibility and labels together prevents
 * Navbar and Footer from drifting when a section is added to the builder. */
export const SECTION_LINK_REGISTRY = {
  about: {
    labelKey: "businessPage.builder.preview.kicker.about",
    includeInFooterSample: true,
  },
  services: {
    labelKey: "businessPage.builder.preview.kicker.services",
    includeInFooterSample: true,
  },
  locations: {
    labelKey: "businessPage.builder.preview.kicker.locations",
    includeInFooterSample: true,
  },
  gallery: {
    labelKey: "businessPage.builder.preview.kicker.gallery",
    includeInFooterSample: true,
  },
  team: {
    labelKey: "businessPage.builder.preview.kicker.team",
    includeInFooterSample: false,
  },
  testimonials: {
    labelKey: "businessPage.builder.preview.kicker.reviews",
    includeInFooterSample: false,
  },
  faq: {
    labelKey: "businessPage.builder.preview.kicker.faq",
    includeInFooterSample: false,
  },
} as const satisfies Readonly<Record<string, SectionLinkDefinition>>;

export type WebsiteSectionLinkType = keyof typeof SECTION_LINK_REGISTRY;

export function isWebsiteSectionLinkType(type: string): type is WebsiteSectionLinkType {
  return Object.prototype.hasOwnProperty.call(SECTION_LINK_REGISTRY, type);
}

/** Stable representative links used only when Footer is rendered as a one-section style sample. */
export const FOOTER_SCOPED_SAMPLE_TYPES = Object.entries(SECTION_LINK_REGISTRY)
  .filter(([, definition]) => definition.includeInFooterSample)
  .map(([type]) => type);

export function sectionLinkLabelKey(type: string): string | undefined {
  return isWebsiteSectionLinkType(type) ? SECTION_LINK_REGISTRY[type].labelKey : undefined;
}
