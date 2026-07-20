import { useCallback, useMemo, useState } from "react";
import { FOOTER_SCOPED_SAMPLE_TYPES, sectionLinkLabelKey } from "../../shared/sectionLinks";
import { findScrollParent, prefersReducedMotion } from "../../shared/util";
import type { FooterConfig, FooterLinkItem, FooterStyleKey, FooterVariantProps, FooterViewProps } from "./types";
import { Directory } from "./variants/Directory";
import { Editorial } from "./variants/Editorial";
import { Signature } from "./variants/Signature";
import { Masthead } from "./variants/Masthead";
import { Marque } from "./variants/Marque";

import "./base.css";

/** The live design identities are authoritative. Every retired footer id deliberately falls back to the new
 * included Directory design until the accompanying SQL/layout migration has been applied. */
export function normalizeFooterStyle(value: string | undefined): FooterStyleKey {
  if (value === "editorial" || value === "signature" || value === "masthead" || value === "marque") return value;
  return "directory";
}

const VARIANTS: Record<FooterStyleKey, React.FC<FooterViewProps>> = {
  directory: Directory,
  editorial: Editorial,
  signature: Signature,
  masthead: Masthead,
  marque: Marque,
};

/** Footer dispatcher. Cross-variant ownership stops at visible-section link derivation and scale-aware
 * scrolling inside the builder preview; each variant owns its complete footer element and behavior. */
export function Footer({ data, t, footerRef, layout, selectedLocationId, variant }: FooterVariantProps) {
  const style = normalizeFooterStyle(variant);
  const View = VARIANTS[style];
  const footerConfig = (layout.find((section) => section.type === "footer")?.config ?? {}) as FooterConfig;
  const showLogo = footerConfig.showLogo !== false;
  const headline = footerConfig.headline?.[data.locale]?.trim() || "";
  const headlineHidden = footerConfig.headlineHidden?.[data.locale] === true;
  const description = footerConfig.description?.[data.locale]?.trim() || "";
  const scopedSample = layout.length === 1 && layout[0]?.type === "footer";
  const links = useMemo<FooterLinkItem[]>(() => {
    const types = scopedSample
      ? FOOTER_SCOPED_SAMPLE_TYPES
      : layout.filter((section) => section.visible && sectionLinkLabelKey(section.type)).map((section) => section.type);
    return types.flatMap((type) => {
      const labelKey = sectionLinkLabelKey(type);
      return labelKey ? [{ type, label: t(labelKey) }] : [];
    });
  }, [layout, scopedSample, t]);

  const [footerNode, setFooterNode] = useState<HTMLElement | null>(null);
  const footerElementRef = useCallback((node: HTMLElement | null) => {
    setFooterNode((current) => current === node ? current : node);
    if (typeof footerRef === "function") footerRef(node);
    else if (footerRef) footerRef.current = node;
  }, [footerRef]);

  const onNavigate = useCallback((type: string) => {
    if (!footerNode) return;
    const previewRoot = footerNode.closest<HTMLElement>(".mc-root");
    const target = Array.from(
      previewRoot?.querySelectorAll<HTMLElement>(".mc-page-flow > [data-preview-section]") ?? [],
    ).find((section) => section.dataset.previewSection === type);
    const scrollParent = findScrollParent(footerNode);
    if (!previewRoot || !target || !scrollParent) return;

    const scrollRect = scrollParent.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const previewScale = scrollParent.clientWidth > 0 ? scrollRect.width / scrollParent.clientWidth : 1;
    const safeScale = Number.isFinite(previewScale) && previewScale > 0 ? previewScale : 1;
    const nav = previewRoot.querySelector<HTMLElement>(".mc-site-nav");
    const top = scrollParent.scrollTop + (targetRect.top - scrollRect.top) / safeScale - (nav?.offsetHeight ?? 0) - 12;
    scrollParent.scrollTo({
      top: Math.max(0, Math.min(top, scrollParent.scrollHeight - scrollParent.clientHeight)),
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [footerNode]);

  return (
    <View
      data={data}
      t={t}
      footerRef={footerElementRef}
      links={links}
      selectedLocationId={selectedLocationId}
      showLogo={showLogo}
      headline={headline}
      headlineHidden={headlineHidden}
      description={description}
      onNavigate={onNavigate}
    />
  );
}
