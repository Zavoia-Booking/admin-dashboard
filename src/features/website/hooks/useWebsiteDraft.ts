import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import type {
  WebsiteDraft,
  UpdateWebsiteDraftBody,
  SectionEntry,
  PageTheme,
  FaqItem,
  AnnouncementContent,
  WebsiteAutosaveStatus,
  WebsiteDraftConflict,
  WebsiteSaveFailure,
  WebsiteThemeAssetCatalogItem,
} from "../types";
import type { SaveWebsiteDraftRequest, PublishWebsiteRequest } from "../actions";
import {
  buildInitialLayout,
  isKnownSectionType,
  DEFAULT_FONT_KEY,
  LAYOUT_SCHEMA_VERSION,
  PINNED_TYPES,
  REQUIRED_TYPES,
  SECTION_META,
} from "../components/builder/sectionCatalog";
import { BRAND_ACCENT_CATALOG } from "../components/builder/theme";
import { validateUrlField } from "../../../shared/utils/validation";

interface UseWebsiteDraftProps {
  /** The saved baseline from GET /website-builder (Redux). Null while loading. */
  draft: WebsiteDraft | null;
  /** The request identity returned by the reducer after a successful save. */
  lastSavedRequestId: string | null;
  onSave: (request: SaveWebsiteDraftRequest) => void;
  /** Save-then-publish entry point; optional so read-only embeds can omit it. */
  onPublish?: (request: PublishWebsiteRequest) => void;
  /** Current owner-scoped location ids. Stale saved references are removed before a PUT. */
  allowedLocationIds?: readonly number[];
  /** Autosave is capability-gated; read-only users keep the same local presentation. */
  autosaveEnabled: boolean;
  /** True only while the serialized lane is executing a draft PUT. */
  isSaving: boolean;
  /** Any active/queued Website mutation that must stay ordered with draft saves. */
  mutationBusy: boolean;
  conflict: WebsiteDraftConflict | null;
  saveFailure: WebsiteSaveFailure | null;
}

const AUTOSAVE_DELAY_MS = 750;

/** The builder API stores only explicit HTTP(S) URLs. Keep the forgiving input
 * experience, but never send the protocol-less value that the backend rejects. */
function normalizeHttpUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || /^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const stringValue = (value: unknown): string =>
  typeof value === "string" ? value : "";

function normalizeLocaleText(value: unknown): { en: string; ro: string } {
  const source = isPlainRecord(value) ? value : {};
  return {
    en: stringValue(source.en),
    ro: stringValue(source.ro),
  };
}

/** Fill a saved/empty announcement to the full working shape, migrating the legacy `link` and the
 *  older `cta.target` shape into the flat `cta.url` + opt-in `cta.enabled`. */
function normalizeAnnouncement(raw?: AnnouncementContent | null): AnnouncementContent {
  const source: Record<string, unknown> = isPlainRecord(raw as unknown)
    ? (raw as unknown as Record<string, unknown>)
    : {};
  const legacyLink = stringValue(source.link).trim();
  const cta = isPlainRecord(source.cta) ? source.cta : {};
  const target = isPlainRecord(cta.target) ? cta.target : {};
  const legacyTargetUrl = target.type === "url" ? stringValue(target.url) : "";
  const url = normalizeHttpUrl(stringValue(cta.url) || legacyTargetUrl || legacyLink);
  const rawSchedule = isPlainRecord(source.schedule) ? source.schedule : null;
  return {
    message: normalizeLocaleText(source.message),
    cta: {
      enabled: typeof cta.enabled === "boolean" ? cta.enabled : url !== "",
      label: normalizeLocaleText(cta.label),
      url,
      newTab: typeof cta.newTab === "boolean" ? cta.newTab : false,
      showArrow: typeof cta.showArrow === "boolean" ? cta.showArrow : true,
    },
    schedule: rawSchedule
      ? {
          start:
            typeof rawSchedule.start === "string" || rawSchedule.start === null
              ? rawSchedule.start
              : null,
          end:
            typeof rawSchedule.end === "string" || rawSchedule.end === null
              ? rawSchedule.end
              : null,
          timezone:
            typeof rawSchedule.timezone === "string" || rawSchedule.timezone === null
              ? rawSchedule.timezone
              : null,
        }
      : null,
  };
}

function normalizeFaqItems(raw: unknown): FaqItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isPlainRecord)
    .map((item) => ({
      q: normalizeLocaleText(item.q),
      a: normalizeLocaleText(item.a),
    }));
}

const initialFontKey = (theme?: PageTheme | null): string => {
  const stored = typeof theme?.fontKey === "string" ? theme.fontKey.trim() : "";
  // Rendering safely falls back through displayFontFor, but the raw key must
  // round-trip so an older client never destroys a newer/legacy font identity.
  return stored || DEFAULT_FONT_KEY;
};

interface DraftValues {
  tagline: string;
  aboutContent: string;
  brandColorHex: string;
  brandColorKey: string;
  layout: SectionEntry[];
  fontKey: string;
  faqItems: FaqItem[];
  announcementContent: AnnouncementContent;
}

interface DraftBaseline {
  values: DraftValues;
  version: number;
  contentSignature: string;
}

function cloneValues(values: DraftValues): DraftValues {
  return {
    tagline: values.tagline,
    aboutContent: values.aboutContent,
    brandColorHex: values.brandColorHex,
    brandColorKey: values.brandColorKey,
    layout: JSON.parse(JSON.stringify(values.layout)),
    fontKey: values.fontKey,
    faqItems: JSON.parse(JSON.stringify(values.faqItems)),
    announcementContent: JSON.parse(JSON.stringify(values.announcementContent)),
  };
}

function serializeValues(values: DraftValues): string {
  return JSON.stringify(values);
}

function canonicalJson(value: unknown): string {
  const normalize = (entry: unknown): unknown => {
    if (Array.isArray(entry)) return entry.map(normalize);
    if (entry && typeof entry === "object") {
      return Object.fromEntries(
        Object.entries(entry as Record<string, unknown>)
          .filter(([, item]) => item !== undefined)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, item]) => [key, normalize(item)]),
      );
    }
    return entry;
  };
  return JSON.stringify(normalize(value));
}

function valuesFromDraft(draft: WebsiteDraft | null): DraftValues {
  return {
    tagline: draft?.tagline ?? "",
    aboutContent: draft?.aboutContent ?? "",
    brandColorHex: draft?.brandColorHex ?? "",
    brandColorKey: draft?.brandColorKey ?? draft?.pageTheme?.brandColorKey ?? "",
    layout: buildInitialLayout(draft?.pageLayout),
    fontKey: initialFontKey(draft?.pageTheme),
    faqItems: normalizeFaqItems(draft?.faq),
    announcementContent: normalizeAnnouncement(draft?.announcement),
  };
}

function baselineFromDraft(draft: WebsiteDraft | null): DraftBaseline {
  const values = valuesFromDraft(draft);
  return {
    values,
    version: draft?.version ?? 0,
    contentSignature: serializeValues(values),
  };
}

function createSaveRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `website-save-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Pinned lead/tail sections (announcement/nav/hero/footer) never move; targets clamp into
 * the movable band. Pure so the index-based action path and the type-keyed undo path share
 * the exact same invariants.
 */
function reorderLayout(prev: SectionEntry[], from: number, to: number): SectionEntry[] {
  if (from === to || from < 0 || to < 0 || from >= prev.length || to >= prev.length) {
    return prev;
  }
  let lead = 0;
  while (lead < prev.length && PINNED_TYPES.has(prev[lead].type)) lead += 1;
  let trailing = 0;
  while (trailing < prev.length && PINNED_TYPES.has(prev[prev.length - 1 - trailing].type)) trailing += 1;
  const lastMovable = prev.length - 1 - trailing;
  if (from < lead || from > lastMovable) return prev;
  const target = Math.min(Math.max(to, lead), lastMovable);
  if (from === target) return prev;
  const next = prev.slice();
  const [moved] = next.splice(from, 1);
  next.splice(target, 0, moved);
  return next;
}

/**
 * Working state for the Website draft: the ordered layout, theme (brand colour + font),
 * hero tagline, about content, and the two net-new content blocks (FAQ + Announcement) —
 * plus the versioned save lifecycle against PUT /website-builder.
 *
 * Structural errors (malformed colour, over-long tagline, invalid CTA URL) block saving —
 * the server would reject them. Missing copy (About headline, announcement message) is a
 * READINESS state: incomplete drafts save fine and readiness is surfaced per section.
 *
 * Hero mutations are immediate and advance the baseline version without touching this
 * hook's unsaved state (the reducer only moves draft.heroImageUrl/version/updatedAt;
 * the seeded content fields keep their identity, so no re-seed fires).
 */
export function useWebsiteDraft({
  draft,
  lastSavedRequestId,
  onSave,
  onPublish,
  allowedLocationIds,
  autosaveEnabled,
  isSaving,
  mutationBusy,
  conflict,
  saveFailure,
}: UseWebsiteDraftProps) {
  const { t } = useTranslation("website");
  const [baseline, setBaseline] = useState<DraftBaseline>(() => baselineFromDraft(draft));
  const baselineRef = useRef<DraftBaseline>(baseline);
  const [tagline, setTagline] = useState<string>(baseline.values.tagline);
  const [aboutContent, setAboutContent] = useState<string>(baseline.values.aboutContent);
  const [brandColorHex, setBrandColorHexState] = useState<string>(baseline.values.brandColorHex);
  const [brandColorKey, setBrandColorKey] = useState<string>(baseline.values.brandColorKey);
  const [layout, setLayout] = useState<SectionEntry[]>(() => cloneValues(baseline.values).layout);
  const [fontKey, setFontKey] = useState<string>(baseline.values.fontKey);
  const [faqItems, setFaqItems] = useState<FaqItem[]>(() => cloneValues(baseline.values).faqItems);
  const [announcementContent, setAnnouncementContent] = useState<AnnouncementContent>(() =>
    cloneValues(baseline.values).announcementContent,
  );

  const setBrandColorHex = useCallback((value: string) => {
    setBrandColorHexState(value);
    const catalogEntry = BRAND_ACCENT_CATALOG.find(
      (entry) => entry.hex.toLowerCase() === value.toLowerCase(),
    );
    setBrandColorKey(catalogEntry?.key ?? "");
  }, []);

  const workingValues = useMemo<DraftValues>(
    () => ({ tagline, aboutContent, brandColorHex, brandColorKey, layout, fontKey, faqItems, announcementContent }),
    [tagline, aboutContent, brandColorHex, brandColorKey, layout, fontKey, faqItems, announcementContent],
  );
  const workingSignature = useMemo(() => serializeValues(workingValues), [workingValues]);
  const pendingSaveRef = useRef<SaveWebsiteDraftRequest | null>(null);
  const failedSaveRef = useRef<SaveWebsiteDraftRequest | null>(null);
  // Once a PUT result is ambiguous, every later local snapshot must prove server state with
  // GET before another PUT. This deliberately survives subsequent edits/signature changes.
  const reconciliationRequiredRef = useRef(false);
  const [pendingSave, setPendingSave] = useState<SaveWebsiteDraftRequest | null>(null);
  const acceptNextServerBaselineRef = useRef(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [readyAutosaveSignature, setReadyAutosaveSignature] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const applyWorkingValues = useCallback((values: DraftValues) => {
    const next = cloneValues(values);
    setTagline(next.tagline);
    setAboutContent(next.aboutContent);
    setBrandColorHexState(next.brandColorHex);
    setBrandColorKey(next.brandColorKey);
    setLayout(next.layout);
    setFontKey(next.fontKey);
    setFaqItems(next.faqItems);
    setAnnouncementContent(next.announcementContent);
  }, []);

  const resetToBaseline = useCallback(() => {
    applyWorkingValues(baselineRef.current.values);
  }, [applyWorkingValues]);

  const serverBaseline = baselineFromDraft(draft);
  const serverSignature = `${serverBaseline.version}:${serverBaseline.contentSignature}`;
  const processedServerSignatureRef = useRef(serverSignature);

  useEffect(() => {
    if (processedServerSignatureRef.current === serverSignature) return;

    const previousBaseline = baselineRef.current;
    const pendingSave = pendingSaveRef.current;
    const serverContentChanged = previousBaseline.contentSignature !== serverBaseline.contentSignature;

    baselineRef.current = serverBaseline;
    processedServerSignatureRef.current = serverSignature;
    setBaseline(serverBaseline);

    if (pendingSave?.requestId === lastSavedRequestId) {
      pendingSaveRef.current = null;
      failedSaveRef.current = null;
      reconciliationRequiredRef.current = false;
      if (workingSignature === pendingSave.workingSignature) {
        applyWorkingValues(serverBaseline.values);
      }
      return;
    }

    // Hero updates advance the version but leave text/layout untouched. Keep the local work in
    // place while moving the expected version forward. Explicit reloads and clean forms adopt a
    // content-changing server baseline; dirty forms never reset themselves silently.
    if (
      serverContentChanged &&
      (acceptNextServerBaselineRef.current || workingSignature === previousBaseline.contentSignature)
    ) {
      applyWorkingValues(serverBaseline.values);
    }
    acceptNextServerBaselineRef.current = false;
  }, [applyWorkingValues, lastSavedRequestId, serverBaseline, serverSignature, workingSignature]);

  useEffect(() => {
    const pending = pendingSaveRef.current;
    if (!pending) return;
    if (
      conflict ||
      (saveFailure && saveFailure.requestId === pending.requestId)
    ) {
      if (saveFailure?.requestId === pending.requestId) {
        if (saveFailure.kind === "cancelled") {
          failedSaveRef.current = null;
        } else {
          failedSaveRef.current = pending;
          reconciliationRequiredRef.current = true;
        }
      }
      if (conflict) reconciliationRequiredRef.current = false;
      pendingSaveRef.current = null;
    }
  }, [conflict, saveFailure]);

  // ----- Structural validation (blocks save — the server rejects these shapes) -----
  const taglineError = useMemo(
    () => (tagline.length > 200 ? t("businessPage.errors.taglineTooLong") : null),
    [tagline, t],
  );
  const brandColorError = useMemo(
    () =>
      brandColorHex && !/^#[0-9a-fA-F]{6}$/.test(brandColorHex)
        ? t("businessPage.errors.brandColorInvalid")
        : null,
    [brandColorHex, t],
  );

  const announcementVisible = useMemo(
    () => layout.some((s) => s.type === "announcement" && s.visible),
    [layout],
  );

  // CTA URL validity — structural. The server rejects ANY non-empty non-http(s) URL, even while
  // the announcement is hidden or the button is disabled/label-less (stale text still travels in
  // the payload), so the shape check never depends on those states. The "required" rule stays
  // scoped to a usable button.
  const announcementUrlError = useMemo(() => {
    const cta = announcementContent.cta;
    if (cta.url.trim() !== "") return validateUrlField(cta.url, t);
    const hasLabel = cta.label.en.trim() !== "" || cta.label.ro.trim() !== "";
    if (announcementVisible && cta.enabled && hasLabel) {
      return t("businessPage.builder.announcement.cta.urlRequiredHint");
    }
    return null;
  }, [announcementVisible, announcementContent.cta, t]);

  // Schedule order — structural (the server rejects start > end regardless of visibility).
  // Date-only YYYY-MM-DD keys compare correctly as strings, exactly as the server compares them.
  const announcementScheduleError = useMemo(() => {
    const schedule = announcementContent.schedule;
    if (!schedule?.start || !schedule?.end) return null;
    return schedule.start > schedule.end
      ? t("businessPage.builder.announcement.schedule.orderError")
      : null;
  }, [announcementContent.schedule, t]);

  // Unknown future sections are opaque records. Their schema belongs to the newer client, so
  // requiring today's variant/visible/config shape would prevent unrelated edits from saving.
  const layoutError: string | null = null;

  // ----- Readiness (guidance only — never blocks a draft save) -----
  const announcementMessageWarning = useMemo(() => {
    if (!announcementVisible) return null;
    const m = announcementContent.message;
    const hasMessage = (m.en?.trim() ?? "") !== "" || (m.ro?.trim() ?? "") !== "";
    return hasMessage ? null : t("businessPage.builder.announcement.messageRequiredHint");
  }, [announcementVisible, announcementContent.message, t]);

  const hasBlockingErrors = !!(
    taglineError ||
    brandColorError ||
    announcementUrlError ||
    announcementScheduleError ||
    layoutError
  );

  // ----- Layout operations (pinned/required invariants match sectionCatalog) -----
  const reorder = useCallback((from: number, to: number) => {
    setLayout((prev) => reorderLayout(prev, from, to));
  }, []);

  // Type-keyed operations for undo toasts. The layout holds one entry per section type, and a
  // toast's Undo can fire long after further edits moved everything around — an index captured
  // at action time may point at a different section by then. These resolve against the CURRENT
  // layout inside the functional update instead.
  const moveSectionOfType = useCallback((type: string, to: number) => {
    setLayout((prev) => {
      const from = prev.findIndex((s) => s.type === type);
      return from < 0 ? prev : reorderLayout(prev, from, to);
    });
  }, []);

  const setSectionVisibleByType = useCallback((type: string, visible: boolean) => {
    setLayout((prev) => {
      const index = prev.findIndex((s) => s.type === type);
      if (index < 0 || REQUIRED_TYPES.has(prev[index].type)) return prev;
      if (prev[index].visible === visible) return prev;
      return prev.map((s, i) => (i === index ? { ...s, visible } : s));
    });
  }, []);

  const setSectionConfigByType = useCallback((type: string, config: Record<string, unknown>) => {
    setLayout((prev) => {
      const index = prev.findIndex((s) => s.type === type);
      if (index < 0) return prev;
      return prev.map((s, i) => (i === index ? { ...s, config: { ...s.config, ...config } } : s));
    });
  }, []);

  const toggleVisible = useCallback((index: number) => {
    setLayout((prev) => {
      if (REQUIRED_TYPES.has(prev[index]?.type)) return prev;
      return prev.map((s, i) => (i === index ? { ...s, visible: !s.visible } : s));
    });
  }, []);

  const setVariant = useCallback((index: number, variant: string) => {
    setLayout((prev) => prev.map((s, i) => (i === index ? { ...s, variant } : s)));
  }, []);

  /** Apply checkout selections only after the return flow has independently proven their
   * ownership. Registry validation keeps a stale/future catalog key out of today's draft;
   * the resulting layout change follows the same ordinary autosave path as a manual pick. */
  const applyOwnedVariantSelections = useCallback(
    (selections: ReadonlyArray<{ sectionType: string; variantKey: string }>) => {
      if (!autosaveEnabled || selections.length === 0) return;
      const selectionByType = new Map(
        selections.map((selection) => [selection.sectionType, selection.variantKey]),
      );
      setLayout((current) => {
        let changed = false;
        const next = current.map((entry) => {
          const variantKey = selectionByType.get(entry.type);
          if (
            !variantKey ||
            variantKey === entry.variant ||
            !isKnownSectionType(entry.type) ||
            !SECTION_META[entry.type].variants.some((variant) => variant.id === variantKey)
          ) {
            return entry;
          }
          changed = true;
          return { ...entry, variant: variantKey };
        });
        return changed ? next : current;
      });
    },
    [autosaveEnabled],
  );

  const applyThemeAssetSelection = useCallback((asset: WebsiteThemeAssetCatalogItem) => {
    if (asset.kind === "color") {
      // The server catalog is the identity authority. Do not feed this through the legacy
      // hex-only setter, which derives a key from the dashboard's static presentation registry.
      setBrandColorHexState(asset.value);
      setBrandColorKey(asset.assetKey);
      return;
    }
    setFontKey(asset.assetKey);
  }, []);

  const applyOwnedThemeSelections = useCallback(
    (
      selections: ReadonlyArray<{
        kind: "color" | "font";
        assetKey: string;
        value: string;
      }>,
    ) => {
      if (!autosaveEnabled || selections.length === 0) return;
      selections.forEach((selection) => {
        if (selection.kind === "color") {
          setBrandColorHexState(selection.value);
          setBrandColorKey(selection.assetKey);
        } else {
          setFontKey(selection.assetKey);
        }
      });
    },
    [autosaveEnabled],
  );

  const setSectionConfig = useCallback((index: number, config: Record<string, unknown>) => {
    setLayout((prev) =>
      prev.map((s, i) => (i === index ? { ...s, config: { ...s.config, ...config } } : s)),
    );
  }, []);

  // ----- Dirty tracking -----
  const isDirty = workingSignature !== baseline.contentSignature;

  /**
   * The exact PUT /website-builder payload. Unknown stored sections are carried through
   * unchanged so an older dashboard cannot erase data created by a newer schema. Future
   * variant keys on known sections are also retained until the owner explicitly changes them.
   */
  const buildDraftBody = useCallback((): UpdateWebsiteDraftBody => {
    const brandColor = brandColorHex.trim() || null;
    const announcement = normalizeAnnouncement(announcementContent);
    const allowedLocationIdSet = allowedLocationIds
      ? new Set(allowedLocationIds)
      : null;
    return {
      tagline: tagline || null,
      aboutContent: aboutContent || null,
      brandColorHex: brandColor,
      brandColorKey: brandColorKey.trim() || null,
      pageLayout: layout.map((s) => {
        if (!isKnownSectionType(s.type)) {
          // A newer dashboard may have added fields beside type/variant/visible/config.
          // Unknown entries are opaque JSON records: never reconstruct them from the
          // subset this build understands, because doing so erases forward data.
          return JSON.parse(JSON.stringify(s)) as SectionEntry;
        }
        const config = { ...(s.config ?? {}) };
        if (s.type === "locations") {
          const hiddenIds = Array.isArray(config.hiddenLocationIds)
            ? config.hiddenLocationIds.filter(
                (id): id is number =>
                  Number.isInteger(id) &&
                  id > 0 &&
                  (!allowedLocationIdSet || allowedLocationIdSet.has(id)),
              )
            : [];
          config.hiddenLocationIds = [...new Set(hiddenIds)];
        }
        return {
          type: s.type,
          // A future client may add a variant before this registry knows about it. Preserve the
          // stored key unless the owner explicitly selects another style in this client.
          variant: s.variant,
          visible: s.visible,
          config,
        };
      }),
      pageTheme: { brandColor, brandColorKey: brandColorKey.trim() || null, fontKey },
      faq: faqItems,
      announcement,
      layoutVersion: LAYOUT_SCHEMA_VERSION,
    };
  }, [
    allowedLocationIds,
    tagline,
    aboutContent,
    brandColorHex,
    brandColorKey,
    layout,
    fontKey,
    faqItems,
    announcementContent,
  ]);

  const createSaveSnapshot = useCallback((): SaveWebsiteDraftRequest => {
    const body = buildDraftBody();
    const requestId = createSaveRequestId();
    return {
      requestId,
      workingSignature,
      bodySignature: canonicalJson(body),
      body,
      ...(reconciliationRequiredRef.current ? { reconcileFirst: true } : {}),
    };
  }, [buildDraftBody, workingSignature]);

  const submitAutosave = useCallback(
    (options?: { force?: boolean; reconcileFirst?: boolean }) => {
      if (
        !autosaveEnabled ||
        !isDirty ||
        hasBlockingErrors ||
        conflict ||
        !isOnline ||
        mutationBusy ||
        pendingSaveRef.current
      ) {
        return;
      }
      const failureMatchesCurrent =
        saveFailure?.kind !== "cancelled" &&
        saveFailure?.workingSignature === workingSignature;
      if (failureMatchesCurrent && !options?.force) return;

      const request = createSaveSnapshot();
      if (options?.reconcileFirst || reconciliationRequiredRef.current) {
        request.reconcileFirst = true;
      }
      pendingSaveRef.current = request;
      setPendingSave(request);
      onSave(request);
    },
    [
      autosaveEnabled,
      conflict,
      createSaveSnapshot,
      hasBlockingErrors,
      isDirty,
      isOnline,
      mutationBusy,
      onSave,
      saveFailure?.kind,
      saveFailure?.workingSignature,
      workingSignature,
    ],
  );
  const submitAutosaveRef = useRef(submitAutosave);
  useEffect(() => {
    submitAutosaveRef.current = submitAutosave;
  }, [submitAutosave]);

  // Debounce the newest valid local state. The timer records which exact signature is
  // ready; if another mutation still owns the lane, status becomes queued and the same
  // immutable snapshot is submitted when the lane clears.
  useEffect(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    const failureMatchesCurrent =
      saveFailure?.kind !== "cancelled" &&
      saveFailure?.workingSignature === workingSignature;
    if (
      !autosaveEnabled ||
      !isDirty ||
      hasBlockingErrors ||
      conflict ||
      failureMatchesCurrent
    ) {
      return;
    }

    const timer = setTimeout(() => {
      setReadyAutosaveSignature(workingSignature);
      submitAutosaveRef.current();
    }, AUTOSAVE_DELAY_MS);
    autosaveTimerRef.current = timer;
    return () => {
      clearTimeout(timer);
      if (autosaveTimerRef.current === timer) autosaveTimerRef.current = null;
    };
  }, [
    autosaveEnabled,
    baseline.contentSignature,
    conflict,
    hasBlockingErrors,
    isDirty,
    saveFailure?.kind,
    saveFailure?.workingSignature,
    workingSignature,
  ]);

  // A ready snapshot may have waited behind hero/save/publish work. Re-check whenever
  // the lane or acknowledgement changes; the submit callback prevents duplicates.
  useEffect(() => {
    if (
      readyAutosaveSignature !== workingSignature ||
      !isDirty ||
      hasBlockingErrors ||
      conflict
    ) {
      return;
    }
    const timer = setTimeout(() => submitAutosaveRef.current(), 0);
    return () => clearTimeout(timer);
  }, [
    conflict,
    hasBlockingErrors,
    isDirty,
    isSaving,
    isOnline,
    lastSavedRequestId,
    mutationBusy,
    readyAutosaveSignature,
    saveFailure,
    workingSignature,
  ]);

  const retryAutosave = useCallback(() => {
    const failed = failedSaveRef.current;
    if (!failed || failed.workingSignature !== workingSignature) return;
    submitAutosave({ force: true, reconcileFirst: true });
  }, [submitAutosave, workingSignature]);

  /**
   * Flush the newest valid local snapshot immediately. If another Website mutation owns
   * the serialized lane, mark this exact signature ready and let the existing queue effect
   * submit it as soon as the lane clears. A failed ambiguous save always reconciles first.
   */
  const flushAutosave = useCallback(() => {
    if (
      !autosaveEnabled ||
      !isDirty ||
      hasBlockingErrors ||
      conflict ||
      !isOnline
    ) {
      return;
    }
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    setReadyAutosaveSignature(workingSignature);
    const failureMatchesCurrent =
      saveFailure?.kind !== "cancelled" &&
      saveFailure?.workingSignature === workingSignature;
    submitAutosave({
      force: true,
      reconcileFirst: failureMatchesCurrent,
    });
  }, [
    autosaveEnabled,
    conflict,
    hasBlockingErrors,
    isDirty,
    isOnline,
    saveFailure?.kind,
    saveFailure?.workingSignature,
    submitAutosave,
    workingSignature,
  ]);

  // Ctrl/Cmd+S is an invisible autosave accelerator, not a browser-page download.
  // Only claim the shortcut when there is a valid, saveable local change.
  useEffect(() => {
    const canHandleShortcut =
      autosaveEnabled &&
      isDirty &&
      !hasBlockingErrors &&
      !conflict &&
      isOnline;
    if (!canHandleShortcut || typeof window === "undefined") return;

    const handleSaveShortcut = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.isComposing ||
        event.altKey ||
        event.shiftKey ||
        (!event.ctrlKey && !event.metaKey) ||
        event.key.toLowerCase() !== "s"
      ) {
        return;
      }
      event.preventDefault();
      flushAutosave();
    };

    window.addEventListener("keydown", handleSaveShortcut);
    return () => window.removeEventListener("keydown", handleSaveShortcut);
  }, [
    autosaveEnabled,
    conflict,
    flushAutosave,
    hasBlockingErrors,
    isDirty,
    isOnline,
  ]);

  /**
   * Called only after the user has fetched the latest server baseline and explicitly
   * confirmed replacing it. This intentionally bypasses the stale conflict flag; the
   * controller clears that flag synchronously before dispatch, and the saga injects the
   * freshly fetched Redux draft version as expectedVersion.
   */
  const replaceLatestWithLocal = useCallback(() => {
    if (!autosaveEnabled || !isDirty) return;
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    setReadyAutosaveSignature(workingSignature);
    if (
      hasBlockingErrors ||
      !isOnline ||
      mutationBusy ||
      pendingSaveRef.current
    ) {
      return;
    }
    const request = createSaveSnapshot();
    pendingSaveRef.current = request;
    setPendingSave(request);
    onSave(request);
  }, [
    autosaveEnabled,
    createSaveSnapshot,
    hasBlockingErrors,
    isDirty,
    isOnline,
    mutationBusy,
    onSave,
    workingSignature,
  ]);

  const currentFailure =
    saveFailure?.kind !== "cancelled" &&
    saveFailure?.workingSignature === workingSignature
      ? saveFailure
      : null;

  /**
   * Save-then-publish: a dirty form ships its draft alongside the publish request (the saga
   * saves first and the pending-save reconciliation adopts the returned baseline exactly as
   * a plain save would). Version zero may be the server's synthetic "no listing yet" draft,
   * so it also needs a normalization save before the first publish even when visually clean.
   */
  const handlePublish = useCallback(() => {
    if (!onPublish || hasBlockingErrors || !isOnline || currentFailure) return false;
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    if (conflict) return false;
    // A synthetic version-zero draft needs the normalizing PUT only when this user may
    // edit. Publish is an independent capability: a publish-only user must never issue an
    // unauthorized draft write, so the publish endpoint receives the existing version and
    // performs its own server-side validation/normalization.
    if (isDirty || (baseline.version === 0 && autosaveEnabled)) {
      const request = createSaveSnapshot();
      pendingSaveRef.current = request;
      setPendingSave(request);
      onPublish({ save: request });
      return true;
    }
    onPublish({ save: null });
    return true;
  }, [
    baseline.version,
    autosaveEnabled,
    conflict,
    createSaveSnapshot,
    hasBlockingErrors,
    isDirty,
    isOnline,
    onPublish,
    currentFailure,
  ]);

  const effectivePending = (() => {
    const pending = pendingSave;
    if (!pending) return null;
    if (
      pending.requestId === lastSavedRequestId ||
      pending.requestId === saveFailure?.requestId ||
      conflict
    ) {
      return null;
    }
    return pending;
  })();
  const autosaveStatus: WebsiteAutosaveStatus = conflict
    ? "conflict"
    : hasBlockingErrors
      ? "invalid"
      : (!isOnline && isDirty) || currentFailure?.kind === "offline"
        ? "offline"
        : currentFailure?.kind === "failed"
          ? "failed"
          : effectivePending
            ? effectivePending.workingSignature === workingSignature && isSaving
              ? "saving"
              : "queued"
            : isDirty &&
                readyAutosaveSignature === workingSignature &&
                mutationBusy
              ? "queued"
              : isDirty
                ? "dirty"
                : "clean";

  const acceptNextServerBaseline = useCallback(() => {
    acceptNextServerBaselineRef.current = true;
  }, []);

  const preserveWorkingValuesOnNextServerBaseline = useCallback(() => {
    acceptNextServerBaselineRef.current = false;
  }, []);

  return {
    // Content state
    tagline,
    aboutContent,
    brandColorHex,
    brandColorKey,
    layout,
    fontKey,
    faqItems,
    announcementContent,
    // Structural errors (block save)
    taglineError,
    brandColorError,
    announcementUrlError,
    announcementScheduleError,
    layoutError,
    hasBlockingErrors,
    // Readiness guidance (never blocks)
    announcementMessageWarning,
    isDirty,
    isOnline,
    autosaveStatus,
    canRetryAutosave: !!currentFailure,
    // Setters + layout operations
    setTagline,
    setAboutContent,
    setBrandColorHex,
    setBrandColorKey,
    setFontKey,
    setFaqItems,
    setAnnouncementContent,
    reorderSections: reorder,
    toggleSectionVisible: toggleVisible,
    setSectionVariant: setVariant,
    applyOwnedVariantSelections,
    applyThemeAssetSelection,
    applyOwnedThemeSelections,
    setSectionConfig,
    // Type-keyed variants for undo closures (see above)
    moveSectionOfType,
    setSectionVisibleByType,
    setSectionConfigByType,
    // Autosave recovery, publish barrier + discard
    retryAutosave,
    flushAutosave,
    replaceLatestWithLocal,
    handlePublish,
    buildDraftBody,
    resetToBaseline,
    acceptNextServerBaseline,
    preserveWorkingValuesOnNextServerBaseline,
  };
}

export type WebsiteDraftForm = ReturnType<typeof useWebsiteDraft>;
