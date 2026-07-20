import { useId, useState } from "react";
import { Plus } from "lucide-react";
import { localized } from "../../../shared/util";
import { MeasuredCollapse } from "../parts/MeasuredCollapse";
import type { FaqVariantProps } from "../types";
import "./accordion.css";

/** Hairline, single-open accordion from the executable FAQ source. The first answer starts open. */
export function Accordion({ items, locale }: FaqVariantProps) {
  const [open, setOpen] = useState(0);
  const id = useId();
  const openIndex =
    open >= 0 && open < items.length ? open : items.length > 0 ? 0 : -1;

  return (
    <div className="mc-faq">
      {items.map((item, index) => {
        const question = localized(item.q, locale);
        const answer = localized(item.a, locale);
        const isOpen = openIndex === index;
        const questionId = `${id}-question-${index}`;
        const answerId = `${id}-answer-${index}`;

        return (
          <div
            key={index}
            className="mc-faq-item"
            data-on={isOpen ? "1" : "0"}
            data-faq-reveal
          >
            <button
              id={questionId}
              type="button"
              className="mc-faq-q"
              aria-expanded={isOpen}
              aria-controls={answerId}
              onClick={() => setOpen(index)}
            >
              <span className="mc-faq-q-text">{question}</span>
              <span className="mc-faq-ic" aria-hidden="true">
                <Plus size={16} strokeWidth={2} />
              </span>
            </button>
            <MeasuredCollapse
              id={answerId}
              labelledBy={questionId}
              open={isOpen}
              className="mc-faq-a"
              innerClassName="mc-faq-a-inner"
              measureKey={`${locale}:${answer}`}
            >
              {answer}
            </MeasuredCollapse>
          </div>
        );
      })}
    </div>
  );
}
