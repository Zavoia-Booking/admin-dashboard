export type CleanedAddress = { text: string; postcode: string | null };
export type LookupRow = {
  id: string; label: string; street: string; number: string;
  localities: string[]; county: string; postcode: string; country: string;
  lngLat: [number, number]; bbox: [number, number, number, number] | null;
  precision: 'address' | 'street';
};

type MaptilerFeature = {
  id?: string | number;
  place_type?: string[];
  text?: string;
  address?: string;
  place_name?: string;
  center?: [number, number];
  bbox?: [number, number, number, number];
  context?: { id: string; text: string; place_designation?: string }[];
  properties?: { feature_tags?: Record<string, string>; country_code?: string };
};

const norm = (s: unknown): string => String(s ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

const RO_FIRST_TOKEN: Record<string, string> = { 'str': 'Strada', 'str.': 'Strada', 'bd': 'Bulevardul', 'bd.': 'Bulevardul', 'b-dul': 'Bulevardul', 'bdul': 'Bulevardul', 'bld': 'Bulevardul', 'bld.': 'Bulevardul', 'bulev.': 'Bulevardul', 'blvd': 'Bulevardul', 'blvd.': 'Bulevardul', 'sos': 'Șoseaua', 'sos.': 'Șoseaua', 'șos': 'Șoseaua', 'șos.': 'Șoseaua', 'cal.': 'Calea', 'al.': 'Aleea', 'p-ta': 'Piața', 'p-ța': 'Piața', 'pta': 'Piața', 'pța': 'Piața', 'intr.': 'Intrarea', 'spl.': 'Splaiul', 'prel.': 'Prelungirea' };
// Only shapes that cannot be mistaken for a house number; group 2 is the postcode (no lookbehind: iOS 15)
const POSTCODE: Record<string, RegExp> = {
  ro: /(^|[^\p{L}\d])(\d{6})(?![\p{L}\d])/u, md: /(^|[^\p{L}\d])(MD-?\s?\d{4})(?![\p{L}\d])/iu, pl: /(^|[^\p{L}\d])(\d{2}-\d{3})(?![\p{L}\d])/u, pt: /(^|[^\p{L}\d])(\d{4}-\d{3})(?![\p{L}\d])/u,
  nl: /(^|[^\p{L}\d])(\d{4}\s?[A-Z]{2})(?![\p{L}\d])/iu, cz: /(^|[^\p{L}\d])(\d{3}\s\d{2})(?![\p{L}\d])/u, gr: /(^|[^\p{L}\d])(\d{3}\s\d{2})(?![\p{L}\d])/u,
  gb: /(^|[^\p{L}\d])([A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})(?![\p{L}\d])/iu, ie: /(^|[^\p{L}\d])([A-Z]\d{2}\s?[A-Z\d]{4})(?![\p{L}\d])/iu,
  de: /(^|[^\p{L}\d])(\d{5})(?![\p{L}\d])/u, fr: /(^|[^\p{L}\d])(\d{5})(?![\p{L}\d])/u, it: /(^|[^\p{L}\d])(\d{5})(?![\p{L}\d])/u, es: /(^|[^\p{L}\d])(\d{5})(?![\p{L}\d])/u,
};
const UNIT_START = /[,\s]+(bl(oc)?\.?|sc(ara)?\.?|ap(art(ament)?)?\.?|et(aj)?\.?|corp|apt\.?|suite|unit|floor|fl\.)(\s|\d|$).*$/iu;

const UNIT_WORDS: Record<string, string> = { ro: 'bl|bloc|sc|scara|ap|apart|apartament|et|etaj|parter', md: 'bl|bloc|sc|scara|ap|apart|apartament|et|etaj|parter', gb: 'flat|apt|apartment|suite|unit|floor', ie: 'flat|apt|apartment|suite|unit|floor', us: 'apt|apartment|suite|unit|floor' };
const unitIn = (cc: string): RegExp | null => (UNIT_WORDS[cc] ? new RegExp(`(^|\\s)(${UNIT_WORDS[cc]})\\.?(?=\\s|\\d|$)[\\s\\S]*$`, 'iu') : null); // per country: French 'et' is a word in street names

export function cleanTypedAddress(text: string, countryCode?: string | null): CleanedAddress {
  const cc = (countryCode ?? '').toLowerCase();
  let t = String(text ?? '').replace(/\s+/g, ' ').trim();
  let postcode: string | null = null;
  const re = POSTCODE[cc];
  if (re) {
    const m = t.match(re);
    if (m) {
      const start = (m.index as number) + m[1].length;
      postcode = m[2];
      t = t.slice(0, start) + ' ' + t.slice(start + postcode.length);
    }
  }
  t = t.replace(/(^|[\s,])(nr|no|num[aă]r(ul)?)\.?\s*(?=\d)/giu, '$1'); // "nr. 77" -> "77"
  const unit = unitIn(cc);
  if (unit) t = t.split(',').map((seg) => seg.replace(unit, '')).filter((seg) => seg.trim()).join(','); // drop "bl. A2, sc. 1, ap. 5"
  if (cc === 'ro' || cc === 'md') {
    const parts = t.trim().split(' ');
    const exp = RO_FIRST_TOKEN[parts[0]?.toLowerCase()];
    if (exp && parts.length > 1) { parts[0] = exp; t = parts.join(' '); }
  }
  if (cc === 'ro' || cc === 'md') { // official village form: "Sat X, Comuna Y, nr. Z, Jud. W" -> "X Z, Y"
    let segs = t.split(',').map((x) => x.trim()).filter(Boolean);
    segs = segs.filter((x) => !/^(jud(e[tț]ul)?|jude[tț]ul)\.?\s/iu.test(x)).map((x) => x.replace(/^(sat(ul)?|com(una)?|ora[sș](ul)?|mun(icipiul)?)\.?\s+/iu, ''));
    const lone = segs.findIndex((x, i) => i > 0 && /^\d+[a-z]?([/-]\d+[a-z]?)?$/iu.test(x));
    if (lone > 0) { const [nr] = segs.splice(lone, 1); segs[0] = `${segs[0]} ${nr}`; }
    t = segs.join(', ');
  }
  t = t.replace(/\s+,/g, ',').replace(/,\s*,/g, ',').replace(/\s+/g, ' ').replace(/^[,\s]+|[,\s]+$/g, '');
  return { text: t, postcode };
}

export function leadingHouseNumber(numberField: string): string { // "7, Bl. U, Sc. A" -> "7";  "nr. 231A" -> "231A"
  const s = String(numberField ?? '').replace(/^\s*(nr|no)\.?\s*/i, '').replace(UNIT_START, '').trim();
  const m = s.match(/^\d+(\s?\p{L}(?!\p{L}))?(\s?[/-]\s?\d+(\s?\p{L}(?!\p{L}))?)?(\s(bis|ter)(?!\p{L}))?/iu);
  return m ? m[0].replace(/\s*([/-])\s*/g, '$1').replace(/(\d)\s+(\p{L})(?!\p{L})/u, '$1$2') : '';
}

export function readAddressRow(feature: unknown): LookupRow {
  const f = feature as MaptilerFeature;
  const ctx = f.context || [];
  const type = (f.place_type || [])[0];
  const of = (c: { id: string }): string => String(c.id).split('.')[0];
  const settled = (c: { place_designation?: string }): boolean => ['city', 'town'].includes(c.place_designation as string);
  const rural = (c: { id: string; place_designation?: string }): boolean => of(c) === 'place' && ['village', 'town', 'city', 'hamlet'].includes(c.place_designation as string);
  const muni = ctx.find((c) => of(c) === 'municipality');
  const notASettlement = muni && ['suburb', 'quarter', 'neighbourhood', 'borough'].includes(muni.place_designation as string);
  let city = '';
  if (muni && settled(muni)) city = muni.text; // a town or city in its own right
  else if (muni && !notASettlement) city = muni.text; // commune
  else { // big cities that are a county / region / borough group: the widest unit marked as a city
    const wide = ctx.filter((c) => ['joint_submunicipality', 'municipal_district', 'joint_municipality', 'county', 'subregion', 'region'].includes(of(c)) && settled(c));
    city = wide[wide.length - 1]?.text || ctx.find(rural)?.text || ctx.find((c) => of(c) === 'joint_municipality')?.text || '';
  }
  const localities = [...new Set(ctx.filter((c) => rural(c) || of(c) === 'municipality' || (['joint_submunicipality', 'municipal_district', 'joint_municipality', 'county', 'subregion', 'region'].includes(of(c)) && settled(c)))
    .map((c) => c.text).concat(city ? [city] : []))];
  const tags = f.properties?.feature_tags || {};
  const isPoi = type === 'poi';
  const streetCtx = ctx.find((c) => of(c) === 'address');
  return {
    id: String(f.id), label: f.place_name ?? '',
    street: isPoi ? (tags['addr:street'] || streetCtx?.text || '') : (f.text ?? ''),
    number: isPoi ? (tags['addr:housenumber'] || '') : (f.address ?? ''),
    localities,
    county: ctx.find((c) => of(c) === 'region' && !settled(c))?.text || ctx.find((c) => of(c) === 'county' && !settled(c))?.text || '',
    postcode: ctx.find((c) => of(c) === 'postal_code')?.text || tags['addr:postcode'] || '',
    country: ctx.find((c) => of(c) === 'country')?.text || '',
    lngLat: f.center as [number, number], bbox: f.bbox || null, precision: (isPoi || f.address) ? 'address' : 'street',
  };
}

const metres = (a: [number, number], b: [number, number]): number => { const R = 6371000, r = (d: number) => (d * Math.PI) / 180; const h = Math.sin(r(b[1] - a[1]) / 2) ** 2 + Math.cos(r(a[1])) * Math.cos(r(b[1])) * Math.sin(r(b[0] - a[0]) / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };

const toks = (s: string): string[] => norm(s).split(' ').filter(Boolean);
function takeAll(need: string[], pool: string[]): string[] | null { const p = [...pool]; for (const t of need) { const i = p.indexOf(t); if (i < 0) return null; p.splice(i, 1); } return p; }

export function rankAddressRows<T extends LookupRow>(rows: T[], cleanedText: string, typedPostcode: string | null): T[] {
  const q = toks(cleanedText);
  const scored = rows.map((r, i) => {
    const afterStreet = takeAll(toks(r.street), q);
    const streetFull = afterStreet ? 1 : 0;
    const typedTown = r.localities.find((l) => { const lt = toks(l); return lt.length && takeAll(lt, afterStreet || q); }) ?? null;
    const settlement = typedTown ? 1 : 0;
    const numberHit = afterStreet && r.number && afterStreet.includes(norm(r.number)) ? 1 : 0; // a number only counts on the street that was typed in full
    const a = norm(r.postcode).replace(/ /g, ''), b = norm(typedPostcode ?? '').replace(/ /g, '');
    const pcHit = b && a === b ? 2 : (b && a && a.slice(0, 3) === b.slice(0, 3) ? 1 : 0);
    return { r, i, key: [streetFull, settlement, numberHit, pcHit] };
  });
  const anchors = scored.filter((x) => x.key[0] && x.key[1]);
  for (const x of scored) {
    if (!x.key[0] || x.key[1]) continue;
    const a = anchors.find((an) => norm(an.r.street).split(' ').some((t) => t.length > 3 && norm(x.r.street).includes(t)) && ((an.r.postcode && an.r.postcode === x.r.postcode) || metres(an.r.lngLat, x.r.lngLat) <= 500));
    if (a) x.key[1] = 1;
  }
  scored.sort((a, b) => { for (let k = 0; k < 4; k++) if (a.key[k] !== b.key[k]) return b.key[k] - a.key[k]; return a.i - b.i; });
  return scored.map((s) => s.r);
}

// the house number the owner typed, when the picked row has none
export function typedHouseNumber(row: LookupRow, cleanedText: string): string {
  const first = takeAll(toks(row.street), toks(cleanedText));
  if (!first) return '';
  let rest: string[] = first;
  for (const l of [...row.localities, row.county, row.country]) { const lt = toks(l); const next: string[] | null = lt.length ? takeAll(lt, rest) : null; if (next) rest = next; }
  const nums = rest.filter((t) => /^\d+[a-z]?$|^\d+[a-z]?[/-]\d+[a-z]?$/i.test(t));
  const others = rest.filter((t) => !nums.includes(t));
  return nums.length === 1 && others.length <= 1 ? nums[0].toUpperCase() : '';
}

export const normText = norm;
export const textWords = toks;
export const metresBetween = metres;
