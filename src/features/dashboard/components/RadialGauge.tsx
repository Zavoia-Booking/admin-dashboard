interface RadialGaugeProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
}

export function RadialGauge({
  value,
  size = 80,
  strokeWidth = 8,
  color = 'var(--info)',
  trackColor = 'var(--surface-active)',
  label,
  sublabel,
}: RadialGaugeProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Use 270deg arc (start from 135deg, sweep 270deg)
  const arcLength = circumference * 0.75;
  const offset = arcLength - (clamped / 100) * arcLength;
  const center = size / 2;

  // Rotation: start from bottom-left (135deg)
  const rotation = 135;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="overflow-visible">
          {/* Track arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform={`rotate(${rotation} ${center} ${center})`}
          />
          {/* Value arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(${rotation} ${center} ${center})`}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-foreground-1 leading-none">
            {clamped < 1 && clamped > 0 ? `<1` : `${Math.round(clamped)}`}%
          </span>
        </div>
      </div>
      {label && (
        <span className="text-[10px] font-semibold uppercase tracking-wide text-foreground-3 text-center leading-tight">
          {label}
        </span>
      )}
      {sublabel && (
        <span className="text-[9px] text-foreground-3 text-center leading-tight">{sublabel}</span>
      )}
    </div>
  );
}
