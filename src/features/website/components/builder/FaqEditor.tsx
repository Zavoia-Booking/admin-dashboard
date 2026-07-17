import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "../../../../shared/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../../../shared/components/ui/collapsible";
import { Input } from "../../../../shared/components/ui/input";
import { Label } from "../../../../shared/components/ui/label";
import { Progress } from "../../../../shared/components/ui/progress";
import { Textarea } from "../../../../shared/components/ui/textarea";
import { Card, CardContent, CardHeader } from "../../../../shared/components/ui/card";
import { cn } from "../../../../shared/lib/utils";
import type { FaqConfig, FaqItem } from "../../types";
import { hasUnsafeWebsiteCopyCharacters } from "../../../../shared/utils/validation";
import { CopyOverride } from "./CopyOverride";
import { AutoHeight } from "./AutoHeight";
import { validateFaqItemLocale } from "./faqValidation";
import { completeFaqCount } from "./sectionReadiness";

const MAX_ITEMS = 7;
const MAX_ANSWER = 600;
const RECOMMENDED_ITEMS = 3;
const emptyItem = (): FaqItem => ({ q: { en: "", ro: "" }, a: { en: "", ro: "" } });

interface FaqEditorProps {
  items: FaqItem[];
  onChange: (items: FaqItem[]) => void;
  locale: "en" | "ro";
  config: FaqConfig;
  onConfigChange: (patch: Partial<FaqConfig>) => void;
}

/** Edits the dashboard locale while preserving content already entered in the other locale. */
export function FaqEditor({
  items,
  onChange,
  locale,
  config,
  onConfigChange,
}: FaqEditorProps) {
  const { t } = useTranslation(["website", "common"]);
  const [blurredFields, setBlurredFields] = useState<Set<string>>(() => new Set());
  const [addBlockedFields, setAddBlockedFields] = useState<Set<string>>(() => new Set());
  const [openItemIndex, setOpenItemIndex] = useState<number | null>(0);
  const editorItems = items.length > 0 ? items : [emptyItem()];
  const completeItemCount = items.reduce((count, item, index) => {
    const question = item.q[locale].trim();
    const answer = item.a[locale].trim();
    if (!question || !answer) return count;
    const validation = validateFaqItemLocale(item, locale, t, index + 1);
    return validation.question || validation.answer ? count : count + 1;
  }, 0);
  const overallCompleteItemCount = completeFaqCount(items);
  const recommendationCount = Math.min(completeItemCount, RECOMMENDED_ITEMS);
  const showRecommendation =
    overallCompleteItemCount > 0 && completeItemCount < RECOMMENDED_ITEMS;
  const atItemLimit = items.length >= MAX_ITEMS;

  const markBlurred = (key: string) => {
    setBlurredFields((current) => {
      if (current.has(key)) return current;
      const next = new Set(current);
      next.add(key);
      return next;
    });
  };

  const setHeading = (value: string) => {
    const current = config.heading ?? { en: "", ro: "" };
    const next = { ...current, [locale]: value };
    const hasOverride = next.en.trim() !== "" || next.ro.trim() !== "";
    onConfigChange({ heading: hasOverride ? next : undefined });
  };

  const update = (index: number, field: "q" | "a", value: string) => {
    onChange(
      editorItems.map((item, i) =>
        i === index ? { ...item, [field]: { ...item[field], [locale]: value } } : item,
      ),
    );
  };

  const commit = (index: number, field: "q" | "a", key: string) => {
    const normalized = editorItems[index][field][locale].trim();
    if (normalized !== editorItems[index][field][locale]) update(index, field, normalized);
    markBlurred(key);
  };

  const remove = (index: number) => {
    setBlurredFields(new Set());
    setAddBlockedFields(new Set());
    setOpenItemIndex((current) => {
      if (current === null) return null;
      if (index < current) return current - 1;
      if (index > current) return current;
      const remaining = items.length - 1;
      return remaining > 0 ? Math.min(index, remaining - 1) : 0;
    });
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  };

  const add = () => {
    if (atItemLimit) return;

    for (let index = 0; index < editorItems.length; index += 1) {
      const item = editorItems[index];
      const validation = validateFaqItemLocale(item, locale, t, index + 1);
      const questionMissing = item.q[locale].trim() === "";
      const answerMissing = item.a[locale].trim() === "";
      const field = questionMissing || validation.question
        ? "question"
        : answerMissing || validation.answer
          ? "answer"
          : null;

      if (!field) continue;

      const key = `${locale}:${index}:${field}`;
      const id = `faq-${field}-${index}`;
      setAddBlockedFields((current) => new Set(current).add(key));
      markBlurred(key);
      setOpenItemIndex(index);
      window.requestAnimationFrame(() => document.getElementById(id)?.focus());
      return;
    }

    setAddBlockedFields(new Set());
    const nextIndex = items.length;
    setOpenItemIndex(nextIndex);
    onChange([...items, emptyItem()]);
    window.requestAnimationFrame(() => document.getElementById(`faq-question-${nextIndex}`)?.focus());
  };

  return (
    <div className="atelier-faq-editor space-y-3">
      <div className="space-y-4 pb-2">
        <CopyOverride
          idBase="faq-heading"
          locale={locale}
          label={t("businessPage.builder.settings.headingLabel")}
          defaultText={t("businessPage.builder.preview.subhead.faq")}
          value={config.heading?.[locale] ?? ""}
          onChange={setHeading}
          maxLength={80}
          rows={2}
        />
        <p className="text-[12px] leading-5 text-foreground-3">
          {t("businessPage.builder.settings.faqHint")}
        </p>
        {showRecommendation ? (
          <div className="space-y-2.5 rounded-xl border border-border bg-surface-hover/50 px-3.5 py-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground-3">
                  {t("businessPage.builder.faq.recommendationEyebrow")}
                </p>
                <p className="text-[13px] font-semibold text-foreground-1">
                  {t("businessPage.builder.faq.recommendationTitle", {
                    count: RECOMMENDED_ITEMS,
                  })}
                </p>
                <p className="text-[11.5px] leading-[1.55] text-foreground-3">
                  {t("businessPage.builder.faq.recommendationBody")}
                </p>
              </div>
              <span className="shrink-0 font-mono text-[11px] font-medium tabular-nums text-foreground-2">
                {recommendationCount}/{RECOMMENDED_ITEMS}
              </span>
            </div>
            <Progress
              value={(recommendationCount / RECOMMENDED_ITEMS) * 100}
              className="h-1 bg-border [&>div]:bg-foreground-2"
              aria-label={t("businessPage.builder.faq.recommendationProgress", {
                current: recommendationCount,
                recommended: RECOMMENDED_ITEMS,
              })}
            />
          </div>
        ) : null}
      </div>

      <div className="border-t border-border-subtle pt-5" />

      {editorItems.map((item, i) => {
        const isOpen = openItemIndex === i;
        const answerLen = item.a[locale].length;
        const near = answerLen >= MAX_ANSWER * 0.9;
        const number = i + 1;
        const questionId = `faq-question-${i}`;
        const answerId = `faq-answer-${i}`;
        const questionKey = `${locale}:${i}:question`;
        const answerKey = `${locale}:${i}:answer`;
        const validation = validateFaqItemLocale(item, locale, t, number);
        const showQuestionError = hasUnsafeWebsiteCopyCharacters(item.q[locale]) ||
          blurredFields.has(questionKey);
        const showAnswerError = hasUnsafeWebsiteCopyCharacters(item.a[locale]) ||
          blurredFields.has(answerKey);
        const questionError = showQuestionError
          ? addBlockedFields.has(questionKey) && item.q[locale].trim() === ""
            ? t("businessPage.builder.faq.questionRequiredBeforeAdd")
            : validation.question
          : undefined;
        const answerError = showAnswerError
          ? addBlockedFields.has(answerKey) && item.a[locale].trim() === ""
            ? t("businessPage.builder.faq.answerRequiredBeforeAdd")
            : validation.answer
          : undefined;
        return (
          <Collapsible
            key={i}
            open={isOpen}
            onOpenChange={(next) => setOpenItemIndex(next ? i : null)}
          >
            <Card
              className={cn(
                "atelier-faq-item gap-0 overflow-hidden rounded-[14px] border-border-strong/60 bg-surface-hover/45 py-0 shadow-none transition-[border-color,background-color] duration-150 hover:border-border-strong",
                isOpen && "border-border-strong bg-surface-hover/60",
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-border bg-surface/70 p-0 pr-2">
                <CollapsibleTrigger asChild>
                  <button
                    id={`faq-item-trigger-${i}`}
                    type="button"
                    className="flex min-h-[58px] min-w-0 flex-1 items-center gap-2.5 rounded-tl-[13px] px-3.5 py-2.5 text-left outline-none transition-colors hover:bg-surface-hover/70 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60"
                  >
                    <span className="shrink-0 font-mono text-[10px] font-semibold tabular-nums text-primary">
                      {String(number).padStart(2, "0")}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground-3">
                        {t("businessPage.builder.faq.questionTitle")}
                      </span>
                      {!isOpen ? (
                        <span className="truncate text-[12.5px] font-medium text-foreground-1">
                          {item.q[locale].trim() || t("businessPage.builder.faq.questionEmpty")}
                        </span>
                      ) : null}
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-foreground-3 transition-transform duration-300 ease-out",
                        isOpen && "rotate-180",
                      )}
                      aria-hidden="true"
                    />
                  </button>
                </CollapsibleTrigger>
                {items.length > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    rounded="full"
                    onClick={() => remove(i)}
                    aria-label={t("businessPage.builder.faq.remove", { number })}
                    className="atelier-faq-remove shrink-0 text-foreground-3 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" strokeWidth={1.8} />
                  </Button>
                ) : (
                  <span className="size-9 shrink-0" aria-hidden="true" />
                )}
              </CardHeader>

              <CollapsibleContent>
                <AutoHeight>
                  <CardContent className="space-y-4 px-3.5 py-3.5">
                    <div className="space-y-1.5">
                      <Label htmlFor={questionId} className="sr-only">
                        {t("businessPage.builder.faq.questionLabel", { number })}
                      </Label>
                      <Input
                        id={questionId}
                        value={item.q[locale]}
                        onChange={(e) => update(i, "q", e.target.value)}
                        onBlur={() => commit(i, "q", questionKey)}
                        placeholder={t("businessPage.builder.faq.questionPlaceholder")}
                        maxLength={160}
                        className={cn(
                          "rounded-lg font-medium",
                          questionError && "border-destructive bg-error-bg focus-visible:ring-error",
                        )}
                        aria-invalid={!!questionError}
                        aria-describedby={questionError ? `${questionId}-error` : undefined}
                      />
                      {questionError ? (
                        <p
                          id={`${questionId}-error`}
                          className="mt-1 flex items-center gap-1.5 text-xs text-destructive"
                          role="alert"
                        >
                          <AlertCircle className="size-3.5 shrink-0" />
                          <span>{questionError}</span>
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-2 border-t border-border pt-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <Label htmlFor={answerId}>{t("businessPage.builder.faq.answerLabel")}</Label>
                        <span className="font-mono text-[10px] tabular-nums text-foreground-3">
                          <span className={cn(near && "text-amber-700 dark:text-amber-400")}>{answerLen}</span>
                          <span className="text-foreground-3/70">/{MAX_ANSWER}</span>
                        </span>
                      </div>
                      <Textarea
                        id={answerId}
                        value={item.a[locale]}
                        onChange={(e) => update(i, "a", e.target.value)}
                        onBlur={() => commit(i, "a", answerKey)}
                        placeholder={t("businessPage.builder.faq.answerPlaceholder")}
                        maxLength={MAX_ANSWER}
                        rows={4}
                        className={cn(
                          "rounded-lg",
                          answerError && "border-destructive bg-error-bg focus-visible:ring-error",
                        )}
                        aria-invalid={!!answerError}
                        aria-describedby={answerError ? `${answerId}-error` : undefined}
                      />
                      {answerError ? (
                        <p
                          id={`${answerId}-error`}
                          className="mt-1 flex items-center gap-1.5 text-xs text-destructive"
                          role="alert"
                        >
                          <AlertCircle className="size-3.5 shrink-0" />
                          <span>{answerError}</span>
                        </p>
                      ) : null}
                    </div>
                  </CardContent>
                </AutoHeight>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}

      <div className="space-y-2">
        <Button
          id="faq-add-question"
          type="button"
          variant="outline"
          size="sm"
          onClick={add}
          disabled={atItemLimit}
          className="atelier-faq-add min-h-11 gap-1.5 xl:min-h-0"
        >
          <Plus className="h-4 w-4" />
          {t("businessPage.builder.faq.add")}
        </Button>
        {atItemLimit ? (
          <p className="text-[11.5px] leading-5 text-foreground-3" role="status">
            {t("businessPage.builder.faq.limitReached", { count: MAX_ITEMS })}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default FaqEditor;
