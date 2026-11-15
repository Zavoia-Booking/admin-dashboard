import type { PreviewData, T } from "../../../shared/types";

/** Shared copy only; every variant owns the legal row's composition and styling. */
export function FooterLegal({ data, t }: { data: PreviewData; t: T }) {
  const name = data.businessName || t("businessPage.builder.preview.businessNamePlaceholder");
  const year = new Date().getFullYear();
  return (
    <>
      {/* First child, so the variants' last-child styling still lands on the credit below. */}
      {isRomanian(data.countryCode) && <ConsumerProtection t={t} />}
      <span>{t("businessPage.builder.preview.footer.rights", { year, name })}.</span>
      <span className="mc-foot-zav">{t("businessPage.builder.preview.footer.poweredBy")}</span>
    </>
  );
}

function isRomanian(countryCode: string | null | undefined) {
  return countryCode?.trim().toLowerCase() === "ro";
}

/** A Romanian site that takes bookings must show, on its home page, a link to ANPC (Ordin ANPC 72/2010
 * art. 2) and the SAL pictogram at 250 × 50 px linked to the SAL platform (Ordin ANPC 449/2022 art. 2). */
function ConsumerProtection({ t }: { t: T }) {
  const sal = t("businessPage.builder.preview.footer.alternativeDisputeResolution");
  return (
    <div className="mc-foot-anpc">
      <a className="mc-foot-anpc-link" href="https://www.anpc.ro/" target="_blank" rel="noopener noreferrer">
        {t("businessPage.builder.preview.footer.consumerProtection")}
      </a>
      <a className="mc-foot-sal" href="https://reclamatiisal.anpc.ro/" target="_blank" rel="noopener noreferrer" title={sal}>
        <img src="/legal/anpc-sal.png" alt={sal} width={250} height={50} loading="lazy" decoding="async" />
      </a>
    </div>
  );
}
