import { cn } from "../../../shared/lib/utils";
import { Check, X } from "lucide-react";

type PasswordStrengthProps = {
  password: string;
  className?: string;
  variant?: "inline" | "panel" | "bar";
};

type StrengthLevel = {
  score: number; // 0-100 (based on backend-required criteria)
  label: "Very weak" | "Weak" | "Fair" | "Strong" | "Very strong";
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

  let label: StrengthLevel["label"]; let colorClass: string;
  if (score <= 20) { label = "Very weak"; colorClass = "bg-destructive"; }
  else if (score <= 40) { label = "Weak"; colorClass = "bg-orange-500"; }
  else if (score <= 60) { label = "Fair"; colorClass = "bg-yellow-500"; }
  else if (score <= 80) { label = "Strong"; colorClass = "bg-emerald-500"; }
  else { label = "Very strong"; colorClass = "bg-green-600"; }

  return { score, label, colorClass, checks };
}

export const PasswordStrength = ({ password, className, variant = "inline" }: PasswordStrengthProps) => {
  const { score, label, checks } = getPasswordStrength(password);

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
          <span className="font-semibold text-foreground">Password strength</span>
          <span className={cn("font-medium", labelTint)}>{label}</span>
        </div>
        <div
          className="relative h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={score}
          aria-label="Password strength"
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
          <span className="text-xs font-semibold text-foreground">Password strength</span>
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", labelTint)}>{score === 100 ? "Excellent" : label}</span>
        </div>
        <div className="mb-2 h-px w-full bg-border" />
        <ul className="space-y-1 text-[11px] text-foreground">
          <PanelItem met={checks.hasMinLength} text="Minimum 8 characters" />
          <PanelItem met={checks.hasLower} text="At least one Lowercase (a–z)" />
          <PanelItem met={checks.hasUpper} text="At least one Uppercase (A–Z)" />
          <PanelItem met={checks.hasNumber} text="At least one Number (0–9)" />
          <PanelItem met={checks.hasSymbol} text="At least one Special character (@$!%*?&)" />
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
            <div className="grid w-full grid-cols-4 gap-2" role="progressbar" aria-valuemin={0} aria-valuemax={4} aria-valuenow={metCount} aria-label="Password strength">
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


