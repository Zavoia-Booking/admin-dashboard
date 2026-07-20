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
  /** Requirements block a section/publish action; recommendations are optional, quieter guidance. */
  tone?: "requirement" | "recommendation";
  current?: number;
  required?: number;
  progressLabel?: string;
  actionLabel?: ReactNode;
  onAction?: () => void;
  secondaryActionLabel?: ReactNode;
  onSecondaryAction?: () => void;
  className?: string;
}

export function SectionReadinessPanel({
  ariaLabel,
  eyebrow,
  title,
  description,
  tone = "requirement",
  current,
  required,
  progressLabel,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
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
    <section
      className={cn(
        "atelier-section-requirement",
        tone === "recommendation" && "atelier-section-requirement--recommendation",
        className,
      )}
      aria-label={ariaLabel}
    >
      <div className="atelier-section-requirement-meta">
        <span className="atelier-section-requirement-eyebrow">
          <InfoPulse className="atelier-section-requirement-pulse" />
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
      {(actionLabel && onAction) || (secondaryActionLabel && onSecondaryAction) ? (
        <div className="atelier-section-requirement-actions">
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
          {secondaryActionLabel && onSecondaryAction ? (
            <Button
              type="button"
              variant="ghost"
              size="default"
              rounded="default"
              className="atelier-section-requirement-action atelier-section-requirement-action--secondary"
              onClick={onSecondaryAction}
            >
              <span>{secondaryActionLabel}</span>
              <ArrowRight className="size-3.5" strokeWidth={1.8} aria-hidden />
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default SectionReadinessPanel;
