import type { ReactNode } from "react";
import { cn } from "../../../../../../../../shared/lib/utils";

/** Section head shared by every reviews variant — display heading and an optional trailing block.
 *  Row by default (heading left, `children` right — the wall rating chip); `center` stacks
 *  it as a centred column (marquee/deck) with `children` sitting under the heading. The design retired the
 *  numbered eyebrow kicker (no-op SecKicker), so `no`/`kicker` are accepted but never rendered. A hidden
 *  heading removes the head entirely unless a variant supplies rating-summary children. */
export function RvHead({
  heading,
  showHeading,
  center,
  children,
}: {
  no?: string;
  kicker?: string;
  heading: string;
  showHeading: boolean;
  center?: boolean;
  children?: ReactNode;
}) {
  if (!showHeading && !children) return null;

  return (
    <div className={cn("mc-rv-head", center && "mc-rv-head--center", !showHeading && "mc-rv-head--summary-only")}>
      {showHeading ? (
        <div className="mc-rv-head-main">
          <h2 className="mc-rv-h2">{heading}</h2>
          {center && children}
        </div>
      ) : (
        children
      )}
      {showHeading && !center && children}
    </div>
  );
}
