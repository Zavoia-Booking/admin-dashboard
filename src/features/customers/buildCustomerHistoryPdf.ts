import { jsPDF } from 'jspdf';
import type {
  FullActivityItem,
  AppointmentActivityMetadata,
  MilestoneActivityMetadata,
} from '../../shared/types/customer';
import { formatActivityTimelineDateTime } from '../calendar/timezone';
import { priceFromStorage } from '../../shared/utils/currency';

export interface CustomerHistoryPdfTranslations {
  headingDefault: string;
  emptyState: string;
  locationLabel: string;
  durationLabel: string;
  priceLabel: string;
  sourceLabel: string;
  sourceManual: string;
  sourceMarketplace: string;
  sourceImport: string;
  typeAppointment: string;
  typeMilestone: string;
  metaLine: string;
  pageFooter: string;
  hourShort: string;
  minuteShort: string;
}

const COLORS = {
  stripeAppointment: [59, 130, 246] as [number, number, number],
  stripeMilestone: [107, 114, 128] as [number, number, number],
  cardFill: [248, 250, 252] as [number, number, number],
  cardStroke: [226, 232, 240] as [number, number, number],
  divider: [226, 232, 240] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  label: [71, 85, 105] as [number, number, number],
  body: [15, 23, 42] as [number, number, number],
  footer: [148, 163, 184] as [number, number, number],
};

const PAGE_MARGIN = 14;
const CARD_PAD = 5;
const STRIPE_H = 2.2;
const LINE_H = 5.2;
const LINE_H_TITLE = 5.8;
const GAP_SM = 2;
const GAP_MD = 4;
const PAGE_BOTTOM_SAFE = 268;
const LABEL_COL_MM = 38;

function formatDuration(minutes: number, hUnit: string, mUnit: string): string {
  const safe = Math.max(0, Math.floor(minutes ?? 0));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h === 0) return `${m} ${mUnit}`;
  if (m === 0) return `${h}${hUnit}`;
  return `${h}${hUnit} ${m}${mUnit}`;
}

function formatPrice(price: number, currency: string, locale: string): string {
  const value = priceFromStorage(price, currency);
  return new Intl.NumberFormat(locale || 'en', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(value);
}

function getSourceLabel(source: string, t: CustomerHistoryPdfTranslations): string {
  switch (source) {
    case 'manual':
      return t.sourceManual;
    case 'marketplace':
      return t.sourceMarketplace;
    case 'import':
      return t.sourceImport;
    default:
      return source;
  }
}

function isAppointmentMetadata(
  item: FullActivityItem,
): item is FullActivityItem & { metadata: AppointmentActivityMetadata } {
  return item.type === 'appointment';
}

function isMilestoneMetadata(
  item: FullActivityItem,
): item is FullActivityItem & { metadata: MilestoneActivityMetadata } {
  return item.type === 'milestone';
}

function getTitleLine(item: FullActivityItem): string {
  let title = item.label;
  if (item.type === 'appointment' && item.status) {
    title += ` · ${item.status}`;
  }
  return title;
}

function buildRows(
  item: FullActivityItem,
  t: CustomerHistoryPdfTranslations,
  locale: string,
): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [];
  if (isAppointmentMetadata(item)) {
    const m = item.metadata;
    if (m.locationName) {
      rows.push({ label: `${t.locationLabel}:`, value: m.locationName });
    }
    rows.push({ label: `${t.durationLabel}:`, value: formatDuration(m.duration, t.hourShort, t.minuteShort) });
    rows.push({ label: `${t.priceLabel}:`, value: formatPrice(m.price, m.currency, locale) });
  } else if (isMilestoneMetadata(item)) {
    rows.push({
      label: `${t.sourceLabel}:`,
      value: getSourceLabel(item.metadata.source, t),
    });
  }
  return rows;
}

function computeEntryHeight(
  doc: jsPDF,
  item: FullActivityItem,
  innerW: number,
  t: CustomerHistoryPdfTranslations,
  locale: string,
): number {
  const valueW = Math.max(20, innerW - LABEL_COL_MM - 2);
  let h = STRIPE_H + GAP_MD + LINE_H + GAP_SM;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(getTitleLine(item), innerW);
  h += titleLines.length * LINE_H_TITLE;
  h += GAP_MD + 1 + GAP_SM;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const rows = buildRows(item, t, locale);
  for (const row of rows) {
    const valueLines = doc.splitTextToSize(row.value, valueW);
    h += Math.max(LINE_H, valueLines.length * LINE_H) + 1;
  }
  h += CARD_PAD;
  return h;
}

function applyPageFooter(doc: jsPDF, pageWidth: number, pageHeight: number, template: string): void {
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.footer);
    const text = template
      .replace(/\{\{page\}\}/g, String(p))
      .replace(/\{\{pages\}\}/g, String(total));
    doc.text(text, pageWidth / 2, pageHeight - 9, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  }
}

function ensureY(doc: jsPDF, y: number, needed: number): number {
  if (y + needed <= PAGE_BOTTOM_SAFE) return y;
  doc.addPage();
  return PAGE_MARGIN + 6;
}

function drawHorizontalRule(
  doc: jsPDF,
  x1: number,
  x2: number,
  y: number,
  rgb: [number, number, number],
): void {
  doc.setDrawColor(...rgb);
  doc.setLineWidth(0.25);
  doc.line(x1, y, x2, y);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
}

function drawEntryCard(
  doc: jsPDF,
  item: FullActivityItem,
  startY: number,
  pageWidth: number,
  t: CustomerHistoryPdfTranslations,
  timezone: string,
  locale: string,
): number {
  const contentW = pageWidth - PAGE_MARGIN * 2;
  const innerX = PAGE_MARGIN + CARD_PAD;
  const innerW = contentW - CARD_PAD * 2;
  const valueW = Math.max(20, innerW - LABEL_COL_MM - 2);

  const cardH = computeEntryHeight(doc, item, innerW, t, locale);
  const stripeColor =
    item.type === 'appointment' ? COLORS.stripeAppointment : COLORS.stripeMilestone;

  doc.setFillColor(...COLORS.cardFill);
  doc.setDrawColor(...COLORS.cardStroke);
  doc.roundedRect(PAGE_MARGIN, startY, contentW, cardH, 1.2, 1.2, 'FD');

  doc.setFillColor(...stripeColor);
  doc.rect(PAGE_MARGIN, startY, contentW, STRIPE_H, 'F');

  let y = startY + STRIPE_H + GAP_MD + LINE_H * 0.75;

  const dateStr = formatActivityTimelineDateTime(item.date, timezone);
  const typeStr =
    item.type === 'appointment' ? t.typeAppointment.toUpperCase() : t.typeMilestone.toUpperCase();

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.label);
  doc.text(typeStr, innerX, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.muted);
  doc.text(dateStr, PAGE_MARGIN + contentW - CARD_PAD, y, { align: 'right' });
  doc.setTextColor(...COLORS.body);

  y += LINE_H + GAP_SM;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(getTitleLine(item), innerW);
  for (const line of titleLines) {
    doc.text(line, innerX, y);
    y += LINE_H_TITLE;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  y += GAP_SM;

  const ruleY = y;
  drawHorizontalRule(doc, innerX, PAGE_MARGIN + contentW - CARD_PAD, ruleY, COLORS.divider);
  y = ruleY + GAP_MD;

  const rows = buildRows(item, t, locale);
  for (const row of rows) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.label);
    doc.text(row.label, innerX, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.body);
    const valueLines = doc.splitTextToSize(row.value, valueW);
    let valueY = y;
    for (const line of valueLines) {
      doc.text(line, innerX + LABEL_COL_MM, valueY);
      valueY += LINE_H;
    }
    y = Math.max(y + LINE_H, valueY) + 1;
    doc.setTextColor(...COLORS.body);
  }

  return startY + cardH + GAP_MD;
}

export function buildCustomerHistoryPdfBlob(
  items: FullActivityItem[],
  options: {
    timezone: string;
    heading?: string;
    translations: CustomerHistoryPdfTranslations;
    locale?: string;
  },
): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const locale = options.locale ?? 'en';

  let y = PAGE_MARGIN;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.body);
  const heading = options.heading?.trim() || options.translations.headingDefault;
  const maxTitleW = pageWidth - PAGE_MARGIN * 2;
  const titleLines = doc.splitTextToSize(heading, maxTitleW);
  for (const line of titleLines) {
    doc.text(line, PAGE_MARGIN, y);
    y += LINE_H_TITLE + 1;
  }
  y += GAP_SM;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.muted);
  const metaLines = doc.splitTextToSize(options.translations.metaLine, maxTitleW);
  for (const line of metaLines) {
    doc.text(line, PAGE_MARGIN, y);
    y += LINE_H;
  }
  y += GAP_MD;

  drawHorizontalRule(doc, PAGE_MARGIN, pageWidth - PAGE_MARGIN, y, COLORS.divider);
  y += GAP_MD + 2;

  doc.setTextColor(...COLORS.body);

  if (items.length === 0) {
    y = ensureY(doc, y, 24);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.muted);
    doc.text(options.translations.emptyState, PAGE_MARGIN, y);
    doc.setTextColor(...COLORS.body);
    applyPageFooter(doc, pageWidth, pageHeight, options.translations.pageFooter);
    return doc.output('blob');
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const innerWForMeasure = pageWidth - PAGE_MARGIN * 2 - CARD_PAD * 2;

  for (const item of items) {
    const estH =
      computeEntryHeight(doc, item, innerWForMeasure, options.translations, locale) + GAP_MD + 4;
    y = ensureY(doc, y, estH);
    y = drawEntryCard(doc, item, y, pageWidth, options.translations, options.timezone, locale);
  }

  applyPageFooter(doc, pageWidth, pageHeight, options.translations.pageFooter);
  return doc.output('blob');
}
