import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, Calendar } from "lucide-react";
import { localized } from "../../../shared/util";
import { MeasuredCollapse } from "../parts/MeasuredCollapse";
import type { FaqVariantProps } from "../types";
import "./index.css";

function useStackedIndex() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [stacked, setStacked] = useState(false);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const preview = host.closest<HTMLElement>(".mc-root") ?? host;
    const measure = () => setStacked(preview.clientWidth <= 880);
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(preview);
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return { hostRef, stacked };
}

function AnswerFade({ changeKey, children }: { changeKey: string; children: React.ReactNode }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    setShown(false);
    const timeout = window.setTimeout(() => setShown(true), 20);
    return () => window.clearTimeout(timeout);
  }, [changeKey]);

  return (
    <div className="mc-fq-fade" data-shown={shown ? "1" : "0"}>
      {children}
    </div>
  );
}

/** Booking remains visual-only in the builder preview, matching every other preview booking treatment. */
function IndexContact({ email, label }: { email: string; label: string }) {
  const mail = email.trim();
  return (
    <>
      <div className="mc-fqx-cta">
        <span className="mc-fqx-cta-ic" aria-hidden="true">
          <Calendar size={18} strokeWidth={1.7} />
        </span>
        <span className="mc-fqx-cta-link">{label}</span>
      </div>
      {mail && (
        <a className="mc-fqx-mail" href={`mailto:${mail}`}>
          {mail}
        </a>
      )}
    </>
  );
}

/** Editorial master/detail index; at 880px it becomes a single-open inline accordion. */
export function Index({ items, locale, email, t }: FaqVariantProps) {
  const [selected, setSelected] = useState(0);
  const { hostRef, stacked } = useStackedIndex();
  const id = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeIndex = selected >= 0 && selected < items.length ? selected : 0;
  const activeAnswer = localized(items[activeIndex].a, locale);
  const frequentlyAsked = t("businessPage.builder.preview.faqFrequentlyAsked");
  const inShort = t("businessPage.builder.preview.faqInShort");
  const bookVisit = t("businessPage.builder.preview.faqBookVisit");
  const panelId = `${id}-answer-panel`;

  useEffect(() => {
    setSelected((current) =>
      current >= 0 && current < items.length ? current : 0,
    );
  }, [items.length]);

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (index + 1) % items.length;
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (index - 1 + items.length) % items.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else return;

    event.preventDefault();
    setSelected(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div ref={hostRef} className="mc-fqx-card" data-faq-reveal>
      {stacked ? (
        <div className="mc-fqx-stack">
          <span className="mc-fqx-eyebrow">{frequentlyAsked}</span>
          <div className="mc-fqx-list mc-fqx-list--acc">
            {items.map((item, index) => {
              const question = localized(item.q, locale);
              const answer = localized(item.a, locale);
              const isOpen = activeIndex === index;
              const questionId = `${id}-stack-question-${index}`;
              const answerId = `${id}-stack-answer-${index}`;
              return (
                <div key={index} className="mc-fqx-item">
                  <button
                    id={questionId}
                    type="button"
                    className="mc-fqx-row"
                    data-on={isOpen ? "1" : "0"}
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() => setSelected(index)}
                  >
                    <span className="mc-fqx-row-tx">{question}</span>
                    <span className="mc-fqx-row-ic" aria-hidden="true">
                      <ArrowRight size={20} strokeWidth={1.8} />
                    </span>
                  </button>
                  <MeasuredCollapse
                    id={answerId}
                    labelledBy={questionId}
                    open={isOpen}
                    className="mc-fqx-acc"
                    innerClassName="mc-fqx-acc-inner"
                    measureKey={`${locale}:${answer}`}
                  >
                    {answer && <p className="mc-fqx-acc-a">{answer}</p>}
                  </MeasuredCollapse>
                </div>
              );
            })}
          </div>
          <IndexContact email={email} label={bookVisit} />
        </div>
      ) : (
        <div className="mc-fqx-grid">
          <div className="mc-fqx-main">
            <span className="mc-fqx-eyebrow">{frequentlyAsked}</span>
            <div
              className="mc-fqx-list"
              role="tablist"
              aria-label={frequentlyAsked}
              aria-orientation="vertical"
            >
              {items.map((item, index) => {
                const isActive = activeIndex === index;
                const questionId = `${id}-tab-${index}`;
                return (
                  <button
                    key={index}
                    ref={(node) => {
                      tabRefs.current[index] = node;
                    }}
                    id={questionId}
                    type="button"
                    role="tab"
                    className="mc-fqx-row"
                    data-on={isActive ? "1" : "0"}
                    aria-selected={isActive}
                    aria-controls={panelId}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => setSelected(index)}
                    onKeyDown={(event) => handleTabKeyDown(event, index)}
                  >
                    <span className="mc-fqx-row-tx">{localized(item.q, locale)}</span>
                    <span className="mc-fqx-row-ic" aria-hidden="true">
                      <ArrowRight size={20} strokeWidth={1.8} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <aside className="mc-fqx-aside">
            <span className="mc-fqx-eyebrow">{inShort}</span>
            <div
              id={panelId}
              className="mc-fqx-answer-wrap"
              role="tabpanel"
              aria-labelledby={`${id}-tab-${activeIndex}`}
              tabIndex={0}
            >
              <AnswerFade changeKey={`${activeIndex}:${locale}:${activeAnswer}`}>
                <p className="mc-fqx-answer">{activeAnswer}</p>
              </AnswerFade>
            </div>
            <IndexContact email={email} label={bookVisit} />
          </aside>
        </div>
      )}
    </div>
  );
}
