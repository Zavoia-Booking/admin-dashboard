import type { TFunction } from "i18next";
import type { FaqItem } from "../../types";
import { validateWebsiteCopy } from "../../../../shared/utils/validation";

export interface FaqFieldErrors {
  question?: string;
  answer?: string;
}

function validateFaqItemCopyLocale(
  item: FaqItem,
  locale: "en" | "ro",
  t: TFunction,
  number: number,
): FaqFieldErrors {
  return {
    question: validateWebsiteCopy(item.q[locale] ?? "", t, {
      fieldLabel: t("businessPage.builder.faq.questionLabel", { number }),
      maxLength: 160,
    }) ?? undefined,
    answer: validateWebsiteCopy(item.a[locale] ?? "", t, {
      fieldLabel: t("businessPage.builder.faq.answerLabel"),
      maxLength: 600,
    }) ?? undefined,
  };
}

/** One FAQ row may be empty, but authored content must be a complete, safe question-and-answer pair. */
export function validateFaqItemLocale(
  item: FaqItem,
  locale: "en" | "ro",
  t: TFunction,
  number: number,
): FaqFieldErrors {
  const question = item.q[locale] ?? "";
  const answer = item.a[locale] ?? "";
  const hasQuestion = question.trim() !== "";
  const hasAnswer = answer.trim() !== "";

  const copyErrors = validateFaqItemCopyLocale(item, locale, t, number);

  return {
    question:
      copyErrors.question ??
      (hasAnswer && !hasQuestion
        ? t("businessPage.builder.faq.questionRequired")
        : undefined),
    answer:
      copyErrors.answer ??
      (hasQuestion && !hasAnswer
        ? t("businessPage.builder.faq.answerRequired")
        : undefined),
  };
}

/** Unsafe or oversized copy blocks saving; an incomplete pair remains a saveable draft. */
export function firstFaqSaveBlockingError(
  items: FaqItem[],
  t: TFunction,
): string | null {
  for (let index = 0; index < items.length; index += 1) {
    for (const locale of ["en", "ro"] as const) {
      const errors = validateFaqItemCopyLocale(items[index], locale, t, index + 1);
      if (errors.question) return errors.question;
      if (errors.answer) return errors.answer;
    }
  }
  return null;
}
