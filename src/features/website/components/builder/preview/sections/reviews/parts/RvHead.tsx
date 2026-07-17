import type { ReactNode } from "react";
import { cn } from "../../../../../../../../shared/lib/utils";
import { Kicker } from "../../../shared/primitives";

/** Section head shared by every reviews variant — the numbered kicker + display heading, an optional lede,
 *  and an optional trailing block. Row by default (heading left, `children` right — the wall rating chip);
 *  `center` stacks it as a centred column (marquee/deck) with `children` sitting under the heading. */
export function RvHead({
  no,
  kicker,
  heading,
  sublede,
  center,
  children,
}: {
  no: string;
  kicker: string;
  heading: string;
  sublede?: string;
  center?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={cn("mc-rv-head", center && "mc-rv-head--center")}>
      <div className="mc-rv-head-main">
        <Kicker no={no}>{kicker}</Kicker>
        <h2 className="mc-rv-h2">{heading}</h2>
        {sublede && <p className="mc-rv-lede">{sublede}</p>}
        {center && children}
      </div>
      {!center && children}
    </div>
  );
}
