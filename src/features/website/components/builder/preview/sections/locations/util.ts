import type { WebsiteBuilderLocation } from "../../../../../types";
import type { ChipOption, ResolvedTagDictionaries } from "../../../../../../marketplace/hooks/useLocationTagDictionaries";
import type { LocationTagGroup } from "./types";

/** Tag categories in reading order — mirrors the owner-facing amenities slider so the page is scannable.
 *  Each group keeps its own id space (separate dictionary tables), so ids resolve against their own group.
 *  Shared by the Locations detail panel (switcher) + the atlas sheet. */
const TAG_GROUP_ORDER: { ids: keyof WebsiteBuilderLocation; dict: keyof ResolvedTagDictionaries }[] = [
  { ids: "amenityTagIds", dict: "amenities" },
  { ids: "paymentMethodTagIds", dict: "paymentMethods" },
  { ids: "languageTagIds", dict: "languages" },
];

export function buildLocationTagGroups(
  loc: WebsiteBuilderLocation,
  dict: ResolvedTagDictionaries | null,
): LocationTagGroup[] {
  if (!dict) return [];
  const out: LocationTagGroup[] = [];
  for (const g of TAG_GROUP_ORDER) {
    const ids = (loc[g.ids] as number[] | undefined) ?? [];
    if (ids.length === 0) continue;
    const byId = new Map(dict[g.dict].map((o) => [o.id, o]));
    const items = ids.map((id) => byId.get(id)).filter((x): x is ChipOption => !!x);
    if (items.length > 0) out.push({ key: g.dict, items });
  }
  return out;
}
