import type { TFunction } from "i18next";
import type {
  WebsiteSectionCatalogEntry,
  WebsiteVariantCatalogEntry,
} from "../../types";
import { SECTION_META, isKnownSectionType } from "./sectionCatalog";

const isImplementedVariant = (sectionType: string, variantKey: string) =>
  isKnownSectionType(sectionType) &&
  SECTION_META[sectionType].variants.some((variant) => variant.id === variantKey);

const sectionName = (t: TFunction, sectionType: string) =>
  t(`businessPage.sections.${sectionType}.label`, {
    defaultValue: t("businessPage.catalog.unknownSection"),
  });

export const localizeWebsiteSectionCatalog = (
  entries: WebsiteSectionCatalogEntry[],
  t: TFunction,
): WebsiteSectionCatalogEntry[] =>
  entries
    .filter((entry) => isKnownSectionType(entry.sectionType))
    .map((entry) => ({
      ...entry,
      name: sectionName(t, entry.sectionType),
      description: t(`businessPage.sections.${entry.sectionType}.description`, {
        defaultValue: t("businessPage.paidVariants.sectionDefaultDescription"),
      }),
    }));

export const localizeWebsiteVariantCatalog = (
  entries: WebsiteVariantCatalogEntry[],
  t: TFunction,
): WebsiteVariantCatalogEntry[] =>
  entries
    .filter((entry) => isImplementedVariant(entry.sectionType, entry.variantKey))
    .map((entry) => {
      const section = sectionName(t, entry.sectionType);
      // Some executable identities intentionally differ from their customer-facing design names.
      const styleKey =
        entry.sectionType === "announcement" && entry.variantKey === "bar"
          ? "ribbon"
          : entry.sectionType === "announcement" && entry.variantKey === "split"
            ? "ticker"
            : entry.sectionType === "announcement" && entry.variantKey === "hairline"
              ? "pill"
              : entry.sectionType === "gallery" && entry.variantKey === "index"
                ? "mosaic"
                : entry.sectionType === "locations" && entry.variantKey === "cards"
                  ? "bento"
                  : entry.sectionType === "services" && entry.variantKey === "grid"
                    ? "cards"
                    : entry.sectionType === "testimonials" && entry.variantKey === "default"
                      ? "showcase"
                      : entry.variantKey;
      const style = t(`businessPage.sections.variants.${styleKey}`, {
        defaultValue: t("businessPage.catalog.unknownStyle"),
      });

      return {
        ...entry,
        name: t("businessPage.catalog.styleName", { section, style }),
        description: t(
          `businessPage.sections.variantDescriptions.${entry.sectionType}.${entry.variantKey}`,
          { defaultValue: t("businessPage.paidVariants.defaultDescription") },
        ),
      };
    });
