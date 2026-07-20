/** Hero styles whose composition cannot render correctly without a cover image. */
export const HERO_VARIANTS_REQUIRING_COVER_IMAGE: ReadonlySet<string> = new Set([
  "cinematic",
  "portal",
]);

export function heroVariantRequiresCoverImage(variant: unknown): boolean {
  return typeof variant === "string" && HERO_VARIANTS_REQUIRING_COVER_IMAGE.has(variant);
}
