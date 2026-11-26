import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, RotateCcw } from "lucide-react";
import { Collapsible, CollapsibleContent } from "../ui/collapsible";
import { AutoHeight } from "./AutoHeight";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { cn } from "../../lib/utils";

export interface InheritedEditPanelProps {
  id: string;
  title: React.ReactNode;
  /** Renders the title as a <Label htmlFor> for this input id (for panels editing one input that has no label of its own). */
  titleFor?: string;
  titleClassName?: string;
  helperText?: React.ReactNode;
  /** Optional extra line rendered under the helper text. */
  note?: React.ReactNode;
  /** Read-only view shown while collapsed. */
  summary: React.ReactNode;
  /** Inputs shown while expanded. */
  children: React.ReactNode;
  /** The revert action is shown inside the expanded area only when true. */
  isCustom: boolean;
  revertLabel: string;
  onRevert: () => void;
  /** Keeps the editor open, e.g. while a field inside it has a validation error. */
  forceOpen?: boolean;
  className?: string;
}

export const InheritedEditPanel: React.FC<InheritedEditPanelProps> = ({
  id,
  title,
  titleFor,
  titleClassName,
  helperText,
  note,
  summary,
  children,
  isCustom,
  revertLabel,
  onRevert,
  forceOpen,
  className,
}) => {
  const { t } = useTranslation("common");
  const [editing, setEditing] = useState(false);
  const open = editing || !!forceOpen;
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const focusOnOpenRef = useRef(false);
  const titleId = `${id}-title`;
  const editorId = `${id}-editor`;

  // Stay open after the error is fixed, until the user clicks Done.
  useEffect(() => {
    if (forceOpen) setEditing(true);
  }, [forceOpen]);

  useEffect(() => {
    if (!open || !focusOnOpenRef.current) return;
    const raf = requestAnimationFrame(() => {
      editorRef.current
        ?.querySelector<HTMLElement>("input, textarea, select")
        ?.focus({ preventScroll: true });
      focusOnOpenRef.current = false;
    });
    return () => cancelAnimationFrame(raf);
  }, [open]);

  const handleRevert = () => {
    onRevert();
    setEditing(false);
    editButtonRef.current?.focus();
  };

  const titleClass = cn("text-base font-medium text-foreground-1", titleClassName, "leading-6");

  return (
    <div className={cn(className)} role="group" aria-labelledby={titleId}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {titleFor ? (
            <Label htmlFor={titleFor} id={titleId} className={titleClass}>
              {title}
            </Label>
          ) : (
            <p id={titleId} className={titleClass}>
              {title}
            </p>
          )}
          {helperText && (
            <p className="mt-1 text-sm text-foreground-3 dark:text-foreground-2">{helperText}</p>
          )}
          {note}
        </div>
        <Button
          ref={editButtonRef}
          type="button"
          variant="ghost"
          size="sm"
          rounded="full"
          // Centers the 44px touch target on the 24px title line.
          className="-my-2.5 shrink-0"
          aria-expanded={open}
          aria-controls={editorId}
          aria-describedby={titleId}
          disabled={open && !!forceOpen}
          onClick={() => {
            if (open) {
              setEditing(false);
            } else {
              focusOnOpenRef.current = true;
              setEditing(true);
            }
          }}
        >
          {open ? (
            t("inheritedEdit.done")
          ) : (
            <>
              <Pencil className="h-3.5 w-3.5" />
              {t("inheritedEdit.edit")}
            </>
          )}
        </Button>
      </div>

      <Collapsible open={!open}>
        <CollapsibleContent>
          <AutoHeight className="pt-3">{summary}</AutoHeight>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={open}>
        {/* Side padding keeps the inputs' focus ring inside the overflow:hidden box. */}
        <CollapsibleContent className="-mx-1 px-1">
          <AutoHeight className="pt-4">
            <div id={editorId} ref={editorRef}>
              {children}
              {isCustom && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  rounded="full"
                  className="mt-2 text-foreground-3 hover:text-foreground-1 dark:text-foreground-2"
                  onClick={handleRevert}
                >
                  <RotateCcw className="h-3.5 w-3.5 text-primary" />
                  {revertLabel}
                </Button>
              )}
            </div>
          </AutoHeight>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default InheritedEditPanel;
