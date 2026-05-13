import { useTranslation } from "react-i18next";
import { cn } from "../../../shared/lib/utils";
import { Check, X } from "lucide-react";

type PasswordStrengthProps = {
  password: string;
  className?: string;
  variant?: "inline" | "panel" | "bar";
};

type StrengthRating = "veryWeak" | "weak" | "fair" | "strong" | "veryStrong";

type StrengthLevel = {
  score: number; // 0-100 (based on backend-required criteria)
  ratingKey: StrengthRating;
  colorClass: string;
  checks: {
    hasMinLength: boolean;
    hasLower: boolean;
    hasUpper: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
  };
};

export const getPasswordStrength = (password: string): StrengthLevel => {
  const hasMinLength = password.length >= 8;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[@$!%*?&]/.test(password); // match backend set

  const checks = { hasMinLength, hasLower, hasUpper, hasNumber, hasSymbol };

  const satisfied = [hasMinLength, hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
  const score = Math.round((satisfied / 5) * 100);

  let ratingKey: StrengthRating; let colorClass: string;
  if (score <= 20) { ratingKey = "veryWeak"; colorClass = "bg-destructive"; }
  else if (score <= 40) { ratingKey = "weak"; colorClass = "bg-orange-500"; }
  else if (score <= 60) { ratingKey = "fair"; colorClass = "bg-yellow-500"; }
  else if (score <= 80) { ratingKey = "strong"; colorClass = "bg-emerald-500"; }
  else { ratingKey = "veryStrong"; colorClass = "bg-green-600"; }

  return { score, ratingKey, colorClass, checks };
}

export const PasswordStrength = ({ password, className, variant = "inline" }: PasswordStrengthProps) => {
  const { t } = useTranslation("auth");
  const { score, ratingKey, checks } = getPasswordStrength(password);
  const ratingLabel = t(`passwordStrength.ratings.${ratingKey}`);

  if (variant === "bar") {
    const labelTint =
      score <= 20
        ? "text-destructive"
        : score <= 40
        ? "text-orange-500"
        : score <= 60
        ? "text-yellow-500"
        : score <= 80
        ? "text-emerald-500"
        : "text-green-600";

    const fillColor =
      score <= 20
        ? "bg-destructive"
        : score <= 40
        ? "bg-orange-500"
        : score <= 60
        ? "bg-yellow-500"
        : score <= 80
        ? "bg-emerald-500"
        : "bg-green-600";

    return (
      <div className={cn("w-full", className)}>
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">{t("passwordStrength.label")}</span>
          <span className={cn("font-medium", labelTint)}>{ratingLabel}</span>
        </div>
        <div
          className="relative h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={score}
          aria-label={t("passwordStrength.ariaLabel")}
        >
          <div className={cn("h-full rounded-full transition-all", fillColor)} style={{ width: `${Math.max(4, score)}%` }} />
        </div>
      </div>
    );
  }

  if (variant === "panel") {
    const labelTint =
      score <= 20
        ? "bg-destructive/15 text-destructive"
        : score <= 40
        ? "bg-orange-500/15 text-orange-600"
        : score <= 60
        ? "bg-yellow-500/20 text-yellow-700"
        : score <= 80
        ? "bg-emerald-500/15 text-emerald-700"
        : "bg-green-600/15 text-green-700";

    return (
      <div className={cn("w-64 rounded-md border bg-popover p-3 text-popover-foreground shadow-sm", className)}>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">{t("passwordStrength.label")}</span>
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", labelTint)}>{score === 100 ? t("passwordStrength.ratings.excellent") : ratingLabel}</span>
        </div>
        <div className="mb-2 h-px w-full bg-border" />
        <ul className="space-y-1 text-xs text-foreground">
          <PanelItem met={checks.hasMinLength} text={t("passwordStrength.rules.minLength")} />
          <PanelItem met={checks.hasLower} text={t("passwordStrength.rules.lowercase")} />
          <PanelItem met={checks.hasUpper} text={t("passwordStrength.rules.uppercase")} />
          <PanelItem met={checks.hasNumber} text={t("passwordStrength.rules.number")} />
          <PanelItem met={checks.hasSymbol} text={t("passwordStrength.rules.special")} />
        </ul>
      </div>
    );
  }

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        {(() => {
          const segments = 4;
          const metCount = [checks.hasMinLength, checks.hasUpper, checks.hasNumber, checks.hasSymbol].filter(Boolean).length;
          const colors = ["bg-destructive", "bg-orange-500", "bg-yellow-500", "bg-emerald-500"];
          return (
            <div className="grid w-full grid-cols-4 gap-2" role="progressbar" aria-valuemin={0} aria-valuemax={4} aria-valuenow={metCount} aria-label={t("passwordStrength.ariaLabel")}>
              {Array.from({ length: segments }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full sm:h-2 transition-colors",
                    i < metCount ? colors[i] : "bg-muted"
                  )}
                />
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

const PanelItem = ({ met, text }: { met: boolean; text: string }) => {
  return (
    <li className="flex items-center gap-2">
      {met ? (
        <Check className="h-3 w-3 text-emerald-500" />
      ) : (
        <X className="h-3 w-3 text-red-500" />
      )}
      <span className={cn(met ? "text-foreground" : "text-muted-foreground")}>{text}</span>
    </li>
  );
}

export default PasswordStrength;
