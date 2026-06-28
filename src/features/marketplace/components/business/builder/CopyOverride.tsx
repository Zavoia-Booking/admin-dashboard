import { useEffect, useState } from "react";
import { Switch } from "../../../../../shared/components/ui/switch";
import { Textarea } from "../../../../../shared/components/ui/textarea";
import { Collapsible, CollapsibleContent } from "../../../../../shared/components/ui/collapsible";
import { AutoHeight } from "./AutoHeight";

/** Shared group label style for section-settings sub-headings. */
export const GROUP_LABEL = "text-[11px] font-medium uppercase tracking-[0.14em] text-foreground-3";

/**
 * One section-copy field that defaults to the built-in text. The default is shown (muted) while the
 * switch is off; flipping it on reveals the editor. Turning it back off reverts to the default by
 * clearing the override. Shared by the Locations / Team / Gallery / Reviews / Contact section editors —
 * each stores its copy per locale (a blank override falls back to the default editorial string).
 */
export function CopyOverride({
  idBase,
  label,
  defaultText,
  value,
  onChange,
  maxLength,
  rows,
  customizeAria,
  locale,
}: {
  idBase: string;
  label: string;
  defaultText: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  rows: number;
  customizeAria: string;
  /** Active edit locale — switching it re-derives the open/closed switch from the new locale's value. */
  locale: "en" | "ro";
}) {
  const labelId = `${idBase}-label`;
  const [open, setOpen] = useState(value.trim() !== "");

  // `value` is per-locale; if the app language flips mid-edit, re-seed the switch from the new locale's
  // override so it doesn't claim "customized" over an empty field (or hide an override the other locale has).
  useEffect(() => {
    setOpen(value.trim() !== "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const handleToggle = (next: boolean) => {
    setOpen(next);
    if (!next && value.trim() !== "") onChange("");
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span id={labelId} className={GROUP_LABEL}>
            {label}
          </span>
          {!open && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-foreground-2">{defaultText}</p>}
        </div>
        <Switch checked={open} onCheckedChange={handleToggle} aria-label={customizeAria} />
      </div>
      <Collapsible open={open}>
        <CollapsibleContent>
          <AutoHeight className="pt-3">
            <Textarea
              id={idBase}
              aria-labelledby={labelId}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={defaultText}
              rows={rows}
              maxLength={maxLength}
              className="min-h-0 resize-none text-sm leading-relaxed transition-all border-border dark:border-border-subtle hover:border-border-strong focus:border-focus focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-focus focus-visible:ring-offset-0"
            />
            <div className="mt-2 text-right text-[11px] tabular-nums text-foreground-3">
              {value.length}/{maxLength}
            </div>
          </AutoHeight>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export default CopyOverride;
