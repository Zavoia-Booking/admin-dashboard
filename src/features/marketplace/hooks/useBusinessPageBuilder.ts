import { useState, useEffect, useMemo, useCallback } from "react";
import type {
  SectionEntry,
  PageTheme,
  FaqItem,
  AnnouncementContent,
} from "../types";
import {
  buildInitialLayout,
  DEFAULT_FONT_KEY,
  LAYOUT_SCHEMA_VERSION,
} from "../components/business/builder/sectionCatalog";

interface UseBusinessPageBuilderProps {
  pageLayout?: SectionEntry[] | null;
  pageTheme?: PageTheme | null;
  faq?: FaqItem[] | null;
  announcement?: AnnouncementContent | null;
}

const EMPTY_ANNOUNCEMENT: AnnouncementContent = {
  message: { en: "", ro: "" },
  link: "",
};

const initialFontKey = (theme?: PageTheme | null): string =>
  theme?.fontKey || DEFAULT_FONT_KEY;

/**
 * Working state for the business-page section builder: the ordered layout, the font "personality"
 * (brand colour stays in the profile form so there is a single colour source), and the two net-new
 * content blocks (FAQ + Announcement). Mirrors `useProfileDetails`' seed-from-props + dirty-tracking
 * pattern so it rides the same Save → publish flow. Brand colour is merged into `pageTheme` at save.
 */
export function useBusinessPageBuilder({
  pageLayout,
  pageTheme,
  faq,
  announcement,
}: UseBusinessPageBuilderProps) {
  const [layout, setLayout] = useState<SectionEntry[]>(() =>
    buildInitialLayout(pageLayout),
  );
  const [fontKey, setFontKey] = useState<string>(() => initialFontKey(pageTheme));
  const [faqItems, setFaqItems] = useState<FaqItem[]>(() => faq ?? []);
  const [announcementContent, setAnnouncementContent] =
    useState<AnnouncementContent>(() => announcement ?? EMPTY_ANNOUNCEMENT);

  // Serialized snapshots of the SAVED state. Used as primitive deps so re-seeding only happens when
  // the saved content actually changes (post-publish refetch) — never on parent reference churn.
  const initialLayoutStr = useMemo(
    () => JSON.stringify(buildInitialLayout(pageLayout)),
    [pageLayout],
  );
  const initialFontKey_ = useMemo(() => initialFontKey(pageTheme), [pageTheme]);
  const initialFaqStr = useMemo(() => JSON.stringify(faq ?? []), [faq]);
  const initialAnnStr = useMemo(
    () => JSON.stringify(announcement ?? EMPTY_ANNOUNCEMENT),
    [announcement],
  );

  // Re-seed working state when the saved props change (e.g. after a publish refetch).
  useEffect(() => {
    setLayout(JSON.parse(initialLayoutStr));
    setFontKey(initialFontKey_);
    setFaqItems(JSON.parse(initialFaqStr));
    setAnnouncementContent(JSON.parse(initialAnnStr));
  }, [initialLayoutStr, initialFontKey_, initialFaqStr, initialAnnStr]);

  // ----- Layout operations -----
  const reorder = useCallback((from: number, to: number) => {
    setLayout((prev) => {
      if (from === to || from < 0 || to < 0 || from >= prev.length || to >= prev.length) {
        return prev;
      }
      const next = prev.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const toggleVisible = useCallback((index: number) => {
    setLayout((prev) =>
      prev.map((s, i) => (i === index ? { ...s, visible: !s.visible } : s)),
    );
  }, []);

  const setVariant = useCallback((index: number, variant: string) => {
    setLayout((prev) =>
      prev.map((s, i) => (i === index ? { ...s, variant } : s)),
    );
  }, []);

  const setSectionConfig = useCallback(
    (index: number, config: Record<string, unknown>) => {
      setLayout((prev) =>
        prev.map((s, i) =>
          i === index ? { ...s, config: { ...s.config, ...config } } : s,
        ),
      );
    },
    [],
  );

  // ----- Dirty tracking -----
  const isDirty = useMemo(
    () =>
      JSON.stringify(layout) !== initialLayoutStr ||
      fontKey !== initialFontKey_ ||
      JSON.stringify(faqItems) !== initialFaqStr ||
      JSON.stringify(announcementContent) !== initialAnnStr,
    [
      layout,
      fontKey,
      faqItems,
      announcementContent,
      initialLayoutStr,
      initialFontKey_,
      initialFaqStr,
      initialAnnStr,
    ],
  );

  /**
   * Assemble the builder's slice of the publish payload. Brand colour comes from the profile form
   * (single source) and is merged into `pageTheme` here so the renderer gets one theme object.
   */
  const getBuilderPayload = useCallback(
    (brandColor: string | null) => ({
      pageLayout: layout,
      pageTheme: { brandColor: brandColor || null, fontKey },
      faq: faqItems,
      announcement: announcementContent,
      layoutVersion: LAYOUT_SCHEMA_VERSION,
    }),
    [layout, fontKey, faqItems, announcementContent],
  );

  return {
    layout,
    fontKey,
    faqItems,
    announcementContent,
    isDirty,
    // operations
    reorder,
    toggleVisible,
    setVariant,
    setSectionConfig,
    setFontKey,
    setFaqItems,
    setAnnouncementContent,
    getBuilderPayload,
  };
}
