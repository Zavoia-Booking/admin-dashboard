import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "../../../../shared/lib/utils";
import { Button } from "../../../../shared/components/ui/button";
import { InfoPulse } from "./InfoHint";

export interface SectionReadinessPanelProps {
  ariaLabel: string;
  eyebrow: ReactNode;
  title: ReactNode;
  description: ReactNode;
  current?: number;
  required?: number;
  progressLabel?: string;
  actionLabel?: ReactNode;
  onAction?: () => void;
  className?: string;
}

export function SectionReadinessPanel({
  ariaLabel,
  eyebrow,
  title,
  description,
  current,
  required,
  progressLabel,
  actionLabel,
  onAction,
  className,
}: SectionReadinessPanelProps) {
  const hasProgress =
    typeof current === "number" &&
    Number.isFinite(current) &&
    typeof required === "number" &&
    Number.isFinite(required) &&
    required > 0;
  const safeCurrent = hasProgress ? Math.max(0, current) : 0;
  const progress = hasProgress ? Math.min(100, (safeCurrent / required) * 100) : 0;

  return (
    <section className={cn("atelier-section-requirement", className)} aria-label={ariaLabel}>
      <div className="atelier-section-requirement-meta">
        <span className="atelier-section-requirement-eyebrow">
          <InfoPulse />
          {eyebrow}
        </span>
        {hasProgress ? (
          <span className="atelier-section-requirement-count" aria-hidden>
            {safeCurrent} / {required}
          </span>
        ) : null}
      </div>
      <h3 className="atelier-section-requirement-title">{title}</h3>
      <p className="atelier-section-requirement-copy">{description}</p>
      {hasProgress ? (
        <div
          className="atelier-section-requirement-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={required}
          aria-valuenow={Math.min(safeCurrent, required)}
          aria-label={progressLabel ?? `${safeCurrent} / ${required}`}
        >
          <span
            className="atelier-section-requirement-progress-value"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          type="button"
          variant="outline"
          size="default"
          rounded="default"
          className="atelier-section-requirement-action"
          onClick={onAction}
        >
          <span>{actionLabel}</span>
          <ArrowRight className="size-3.5" strokeWidth={1.8} aria-hidden />
        </Button>
      ) : null}
    </section>
  );
}

export default SectionReadinessPanel;
