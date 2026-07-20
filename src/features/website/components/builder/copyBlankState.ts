import type { LocaleCopyHidden } from "../../types";

export function localeCopyIsHidden(
  hidden: LocaleCopyHidden | undefined,
  locale: "en" | "ro",
): boolean {
  return hidden?.[locale] === true;
}

/** Keep only explicit `true` entries so restoring a default removes the additive state from saved JSON. */
export function setLocaleCopyHidden(
  current: LocaleCopyHidden | undefined,
  locale: "en" | "ro",
  hidden: boolean,
): LocaleCopyHidden | undefined {
  const next: LocaleCopyHidden = { ...(current ?? {}) };
  if (hidden) next[locale] = true;
  else delete next[locale];
  return next.en === true || next.ro === true ? next : undefined;
}
