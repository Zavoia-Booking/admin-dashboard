import type { TFunction } from "i18next";
import type {
  WebsiteSectionCatalogEntry,
  WebsiteVariantCatalogEntry,
} from "../../types";

const sectionName = (t: TFunction, sectionType: string) =>
  t(`businessPage.sections.${sectionType}.label`, {
    defaultValue: t("businessPage.catalog.unknownSection"),
  });

export const localizeWebsiteSectionCatalog = (
  entries: WebsiteSectionCatalogEntry[],
  t: TFunction,
): WebsiteSectionCatalogEntry[] =>
  entries.map((entry) => ({
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
  entries.map((entry) => {
    const section = sectionName(t, entry.sectionType);
    const style = t(`businessPage.sections.variants.${entry.variantKey}`, {
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
