import { DISPLAY, MONO } from "../../../shared/constants";
import type { InterludeVariantProps } from "../types";

/** Default — a cinematic full-bleed photo break with a short line. Uses a portfolio image beyond the
 *  gallery's first six where possible. */
export function Default({ images, data, t }: InterludeVariantProps) {
  const src = images[6] ?? images[images.length - 1];
  const name = data.businessName || t("businessPage.builder.preview.businessNamePlaceholder");
  const line = data.tagline?.trim() || name;
  const city = data.locations.find((l) => l.addressComponents?.city)?.addressComponents?.city;

  return (
    <section className="relative isolate flex min-h-[clamp(280px,52cqw,460px)] flex-col justify-end overflow-hidden">
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "linear-gradient(180deg, rgba(16,15,14,0.36) 0%, rgba(16,15,14,0.04) 36%, rgba(16,15,14,0.5) 100%)" }}
      />
      <div className="px-[clamp(20px,5cqw,48px)] pb-[clamp(28px,5cqw,52px)] pt-12" style={{ color: "#F4EFE6" }}>
        {city && (
          <p className="text-[10.5px] uppercase" style={{ ...MONO, letterSpacing: "0.16em", color: "var(--mc-accent)" }}>
            {city}
          </p>
        )}
        <div className="mt-2.5 max-w-[16ch] text-balance" style={{ ...DISPLAY, fontSize: "clamp(28px,7cqw,64px)", lineHeight: 0.98 }}>
          {line}
        </div>
      </div>
    </section>
  );
}
