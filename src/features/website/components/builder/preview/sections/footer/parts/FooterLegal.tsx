import type { PreviewData, T } from "../../../shared/types";

/** Shared copy only; every variant owns the legal row's composition and styling. */
export function FooterLegal({ data, t }: { data: PreviewData; t: T }) {
  const name = data.businessName || t("businessPage.builder.preview.businessNamePlaceholder");
  const year = new Date().getFullYear();
  return (
    <>
      <span>{t("businessPage.builder.preview.footer.rights", { year, name })}.</span>
      <span className="mc-foot-zav">{t("businessPage.builder.preview.footer.poweredBy")}</span>
    </>
  );
}
