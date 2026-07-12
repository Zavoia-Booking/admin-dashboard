import { LocationIndex } from "../parts/LocationIndex";
import { LocationPanel } from "../parts/LocationPanel";
import { LocationPhoto } from "../parts/LocationPhoto";
import type { LocationsVariantProps } from "../types";

/** Default — the editorial "switcher": a numbered index of places stacked over a compact data card on the
 *  left (opening hours, stats, contact, tags, Book CTA), and the selected location's photo as a full-height
 *  editorial plate on the right that stretches to match the left column. A single location drops the index. */
export function Default({ shown, idx, loc, onSelect, dict, t }: LocationsVariantProps) {
  return (
    <div className="grid grid-cols-1 items-stretch gap-[clamp(18px,3cqw,40px)] @3xl:[grid-template-columns:1.12fr_0.88fr]">
      <div className="flex min-w-0 flex-col gap-[clamp(20px,3cqw,28px)]">
        {shown.length > 1 && <LocationIndex shown={shown} active={idx} onSelect={onSelect} />}
        <LocationPanel loc={loc} dict={dict} t={t} />
      </div>
      <LocationPhoto loc={loc} t={t} />
    </div>
  );
}
