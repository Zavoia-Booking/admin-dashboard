import type { LocationWithAssignments } from "../../../../../types";
import type { ChipOption, ResolvedTagDictionaries } from "../../../../../../marketplace/hooks/useLocationTagDictionaries";
import type { T } from "../../shared/types";

/** Contract every Locations layout variant renders against — the orchestrator owns data prep (filtering,
 *  dictionaries, heading/sublede), the selected-location state, and the empty state. */
export type LocationsVariantProps = {
  shown: LocationWithAssignments[];
  idx: number;
  loc: LocationWithAssignments;
  onSelect: (i: number) => void;
  dict: ResolvedTagDictionaries | null;
  t: T;
};

/** A location's selected marketplace tags resolved + grouped by category — built in the panel, rendered by
 *  the tag band. Each group keeps its own id space (separate dictionary tables). */
export type LocationTagGroup = { key: keyof ResolvedTagDictionaries; items: ChipOption[] };
