import { aggregateReviews } from "../../shared/util";
import type { PreviewData, T } from "../../shared/types";
import { splitAboutContent } from "../../../aboutContent";

export type AboutStat = {
  n: number;
  dec: number;
  labelKey: string;
  raw?: boolean;
  pluralizeLabel?: boolean;
};

export function aboutStatLabel(stat: AboutStat, t: T): string {
  return stat.pluralizeLabel
    ? t(stat.labelKey, { count: stat.n })
    : t(stat.labelKey);
}

export function aboutCopy(
  data: PreviewData,
  t: (key: string) => string,
  headlineHidden = false,
) {
  const split = splitAboutContent(data.aboutContent);
  const lede = split.title.trim();
  return {
    lede: headlineHidden ? "" : lede || t("businessPage.builder.preview.aboutGhostLede"),
    body: split.body.trim(),
    ledeGhost: false,
    bodyGhost: false,
  };
}

const NON_TERMINAL_ABBREVIATION = /(?:\b(?:mr|mrs|ms|dr|prof|sr|jr|st|dl|dna|d-na|str|nr|no|bd|b-dul|șos|sos|e\.g|i\.e)\.|(?:\b[A-ZĂÂÎȘȚ]\.){1,})["'”’\])]*$/iu;
const LOWERCASE_START = /^["'“”‘’(\[]*[a-zăâîșț]/u;

function mergeSentenceCandidates(candidates: string[]): string[] {
  const sentences: string[] = [];

  for (const candidate of candidates) {
    const sentence = candidate.trim();
    if (!sentence) continue;

    const previous = sentences.at(-1);
    if (
      previous
      && (NON_TERMINAL_ABBREVIATION.test(previous) || LOWERCASE_START.test(sentence))
    ) {
      sentences[sentences.length - 1] = `${previous} ${sentence}`;
    } else {
      sentences.push(sentence);
    }
  }

  return sentences;
}

function balanceAboutBeats(units: string[], separator: string): string[] {
  if (units.length <= 3) return units;

  const prefixWeights = [0];
  for (const unit of units) {
    const weight = Math.max(1, unit.replace(/\s/gu, "").length);
    prefixWeights.push(prefixWeights[prefixWeights.length - 1] + weight);
  }

  const target = prefixWeights.at(-1)! / 3;
  let firstBoundary = 1;
  let secondBoundary = 2;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let first = 1; first < units.length - 1; first += 1) {
    for (let second = first + 1; second < units.length; second += 1) {
      const firstWeight = prefixWeights[first];
      const secondWeight = prefixWeights[second] - prefixWeights[first];
      const thirdWeight = prefixWeights[units.length] - prefixWeights[second];
      const score = (firstWeight - target) ** 2
        + (secondWeight - target) ** 2
        + (thirdWeight - target) ** 2;

      if (score < bestScore) {
        bestScore = score;
        firstBoundary = first;
        secondBoundary = second;
      }
    }
  }

  return [
    units.slice(0, firstBoundary).join(separator),
    units.slice(firstBoundary, secondBoundary).join(separator),
    units.slice(secondBoundary).join(separator),
  ];
}

/** At most three logical groups, split only at authored paragraph or sentence boundaries. */
export function aboutBeats(body: string, locale: "en" | "ro" = "en"): string[] {
  const content = body.trim().replace(/\r\n?/gu, "\n");
  if (!content) return [];

  const paragraphs = content
    .split(/\n\s*\n/gu)
    .map((paragraph) => paragraph.replace(/\s+/gu, " ").trim())
    .filter(Boolean);

  if (paragraphs.length > 1) {
    return balanceAboutBeats(paragraphs, "\n\n");
  }

  if (typeof Intl.Segmenter !== "function") return [paragraphs[0]];

  const segmenter = new Intl.Segmenter(locale === "ro" ? "ro-RO" : "en-US", {
    granularity: "sentence",
  });
  const candidates = Array.from(
    segmenter.segment(paragraphs[0]),
    ({ segment }) => segment,
  );
  return balanceAboutBeats(mergeSentenceCandidates(candidates), " ");
}

export function computeAboutStats(data: PreviewData): AboutStat[] {
  const stats: AboutStat[] = [];
  if (data.locations.length > 0) {
    stats.push({
      n: data.locations.length,
      dec: 0,
      labelKey: "businessPage.builder.preview.statLocations",
      pluralizeLabel: true,
    });
  }
  // Team is a business-wide headcount: the same member can be assigned to several locations, so dedup by id.
  const team = new Set<number>();
  for (const l of data.locations) for (const m of l.teamMembers ?? []) team.add(m.id);
  if (team.size > 0) {
    stats.push({
      n: team.size,
      dec: 0,
      labelKey: "businessPage.builder.preview.statTeam",
      pluralizeLabel: true,
    });
  }
  const { rating, count } = aggregateReviews(data.locations);
  if (count > 0) {
    stats.push({ n: rating, dec: 1, labelKey: "businessPage.builder.preview.statRating" });
  }
  if (data.establishedYear !== null) {
    stats.push({
      n: data.establishedYear,
      dec: 0,
      raw: true,
      labelKey: "businessPage.builder.preview.statEstablished",
    });
  }
  return stats;
}
