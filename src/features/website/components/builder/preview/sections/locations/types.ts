import type { WebsiteBuilderLocation } from "../../../../../types";
import type { ChipOption, ResolvedTagDictionaries } from "../../../../../../marketplace/hooks/useLocationTagDictionaries";
import type { T } from "../../shared/types";

/** Contract every Locations layout variant renders against — the orchestrator owns filtering, shared
 *  dictionaries, curated gallery media, the selected-location state, and the empty state. */
export type LocationsVariantProps = {
  shown: WebsiteBuilderLocation[];
  idx: number;
  loc: WebsiteBuilderLocation;
  onSelect: (i: number) => void;
  dict: ResolvedTagDictionaries | null;
  t: T;
  businessEmail: string;
  showTeamLink: boolean;
  galleryImages: { src: string }[];
};

/** A location's selected marketplace tags resolved + grouped by category — built in the panel, rendered by
 *  the tag band. Each group keeps its own id space (separate dictionary tables). */
export type LocationTagGroup = { key: keyof ResolvedTagDictionaries; items: ChipOption[] };
