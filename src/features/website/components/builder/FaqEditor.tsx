import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "../../../../shared/components/ui/button";
import { Input } from "../../../../shared/components/ui/input";
import { Label } from "../../../../shared/components/ui/label";
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

/** Edits the dashboard locale while preserving content already entered in the other locale. */
export function FaqEditor({ items, onChange, locale }: FaqEditorProps) {
  const { t } = useTranslation("website");

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
        const number = i + 1;
        const questionId = `faq-question-${i}`;
        const answerId = `faq-answer-${i}`;
        return (
          <div
            key={i}
            className="space-y-2 rounded-xl border border-border bg-surface p-3 transition-colors duration-150 hover:border-border-strong"
          >
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Label htmlFor={questionId}>
                  {t("businessPage.builder.faq.questionLabel", { number })}
                </Label>
                <Input
                  id={questionId}
                  value={item.q[locale]}
                  onChange={(e) => update(i, "q", e.target.value)}
                  placeholder={t("businessPage.builder.faq.questionPlaceholder")}
                  maxLength={160}
                  className="rounded-lg font-medium"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                aria-label={t("businessPage.builder.faq.remove", { number })}
                className="size-11 shrink-0 text-foreground-3 hover:text-destructive xl:size-9"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={answerId}>{t("businessPage.builder.faq.answerLabel")}</Label>
              <Textarea
                id={answerId}
                value={item.a[locale]}
                onChange={(e) => update(i, "a", e.target.value)}
                placeholder={t("businessPage.builder.faq.answerPlaceholder")}
                maxLength={MAX_ANSWER}
                rows={2}
                className="rounded-lg"
              />
            </div>
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
