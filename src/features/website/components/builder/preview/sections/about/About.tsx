import type { AboutConfig, SectionEntry } from "../../../../../types";
import { resolveAboutImage } from "../../../aboutImageSelection";
import type { PreviewData, T } from "../../shared/types";
import { Editorial } from "./variants/Editorial";
import { Manifesto } from "./variants/Manifesto";
import { Story } from "./variants/Story";
import type { AboutMedia, AboutVariantProps } from "./types";
import "./base.css";

// About is intentionally not wrapped by the generic preview Section: the design source gives Manifesto a
// full-bleed ink field and each variant owns its complete composition, spacing and motion in an adjacent CSS
// file. Manifesto is the Included fallback; Editorial and Story (`sticky`) are the premium designs.

const VARIANTS: Record<string, React.FC<AboutVariantProps>> = {
  manifesto: Manifesto,
  editorial: Editorial,
  sticky: Story,
};

function normalizeMedia(
  image: NonNullable<ReturnType<typeof resolveAboutImage>>,
  businessName: string,
): AboutMedia {
  return {
    src: image.src,
    alt: image.alt || image.locationName || businessName,
  };
}

export function About({
  entry,
  data,
  t,
}: {
  entry: SectionEntry;
  data: PreviewData;
  t: T;
  layout: SectionEntry[];
}) {
  const config = (entry.config ?? {}) as AboutConfig;
  const image = resolveAboutImage(config, data.locations);
  const media = image ? normalizeMedia(image, data.businessName) : null;
  const View = Object.hasOwn(VARIANTS, entry.variant) ? VARIANTS[entry.variant] : Manifesto;

  return (
    <View
      data={data}
      t={t}
      media={media}
      showStats={config.showStats !== false}
      headlineHidden={config.headlineHidden === true}
    />
  );
}
