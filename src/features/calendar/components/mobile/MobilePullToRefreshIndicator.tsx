import { type FC } from "react";
import { RefreshCw } from "lucide-react";

interface MobilePullToRefreshIndicatorProps {
  pull: number;
  refreshing: boolean;
}

export const MobilePullToRefreshIndicator: FC<MobilePullToRefreshIndicatorProps> = ({
  pull,
  refreshing,
}) => {
  if (pull <= 0 && !refreshing) return null;

  const opacity = Math.min(1, pull / 40);
  const rotate = pull * 3;

  return (
    <div
      aria-hidden
      className="absolute left-0 right-0 top-0 z-30 pointer-events-none flex items-center justify-center overflow-hidden"
      style={{
        height: pull,
        transition: refreshing ? "none" : "height 200ms cubic-bezier(0.32, 0.72, 0, 1)",
      }}
    >
      <span
        className="inline-flex items-center justify-center text-primary"
        style={{
          opacity,
          transform: refreshing ? undefined : `rotate(${rotate}deg)`,
          transition: refreshing ? "none" : "transform 150ms linear, opacity 150ms linear",
        }}
      >
        <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
      </span>
    </div>
  );
};
