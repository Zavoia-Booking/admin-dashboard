import { Maximize2 } from "lucide-react";

/** Hover-revealed "expand" badge on a zoomable thumbnail — shared by the editorial, bento, and masonry grids. */
export function ZoomBadge() {
  return (
    <span className="mc-zoom-badge">
      <Maximize2 className="h-[15px] w-[15px]" strokeWidth={1.8} />
    </span>
  );
}
