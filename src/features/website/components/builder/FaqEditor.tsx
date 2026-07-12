import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "../../../../shared/components/ui/button";
import { Input } from "../../../../shared/components/ui/input";
import { Textarea } from "../../../../shared/components/ui/textarea";
import { cn } from "../../../../shared/lib/utils";
import type { FaqItem } from "../../types";

const MAX_ITEMS = 12;
const MAX_ANSWER = 600;
const emptyItem = (): FaqItem => ({ q: { en: "", ro: "" }, a: { en: "", ro: "" } });

interface FaqEditorProps {
  items: FaqItem[];
  onChange: (items: FaqItem[]) => void;
  locale: "en" | "ro";
}

/**
 * Bilingual FAQ editor. Edits the currently-selected locale in place while preserving the other
 * locale's text, so the EN/RO toggle stays the single language control for the whole builder.
 */
export function FaqEditor({ items, onChange, locale }: FaqEditorProps) {
  const { t } = useTranslation("marketplace");

  const update = (index: number, field: "q" | "a", value: string) => {
    onChange(
      items.map((item, i) =>
        i === index ? { ...item, [field]: { ...item[field], [locale]: value } } : item,
      ),
    );
  };

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const answerLen = item.a[locale].length;
        const near = answerLen >= MAX_ANSWER * 0.9;
        return (
          <div
            key={i}
            className="space-y-2 rounded-xl border border-border bg-surface p-3 transition-colors duration-150 hover:border-border-strong"
          >
            <div className="flex items-start gap-2">
              <Input
                value={item.q[locale]}
                onChange={(e) => update(i, "q", e.target.value)}
                placeholder={t("businessPage.builder.faq.questionPlaceholder")}
                aria-label={t("businessPage.builder.faq.questionPlaceholder")}
                maxLength={160}
                className="rounded-lg font-medium"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                aria-label={t("businessPage.builder.faq.remove")}
                className="size-11 shrink-0 text-foreground-3 hover:text-destructive xl:size-9"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              value={item.a[locale]}
              onChange={(e) => update(i, "a", e.target.value)}
              placeholder={t("businessPage.builder.faq.answerPlaceholder")}
              aria-label={t("businessPage.builder.faq.answerPlaceholder")}
              maxLength={MAX_ANSWER}
              rows={2}
              className="rounded-lg"
            />
            <p className="text-right text-[11px] tabular-nums text-foreground-3">
              <span className={cn(near && "text-amber-700 dark:text-amber-400")}>{answerLen}</span>
              <span className="text-foreground-3/70">/{MAX_ANSWER}</span>
            </p>
          </div>
        );
      })}

      {items.length === 0 && (
        <p className="px-1 text-sm text-foreground-3">{t("businessPage.builder.faq.empty")}</p>
      )}

      {items.length < MAX_ITEMS && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...items, emptyItem()])}
          className="min-h-11 gap-1.5 xl:min-h-0"
        >
          <Plus className="h-4 w-4" />
          {t("businessPage.builder.faq.add")}
        </Button>
      )}
    </div>
  );
}

export default FaqEditor;
