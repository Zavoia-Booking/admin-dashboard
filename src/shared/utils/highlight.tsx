import type { ReactNode } from "react";

/**
 * Highlights matching text segments in a string based on a search query.
 * 
 * @param text - The text to highlight
 * @param searchTerm - The search query to match against
 * @returns React node with highlighted segments wrapped in styled spans
 * 
 * @example
 * highlightMatches("Hello World", "hello") 
 * // Returns: <><span>Hello</span> World</> (with "Hello" highlighted)
 */
export const highlightMatches = (
  text: string,
  searchTerm: string
): string | ReactNode => {
  const query = (searchTerm ?? "").trim().toLowerCase();
  if (!query) return text;

  const tokens = query
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1); // ignore 1-char noise

  if (tokens.length === 0) return text;

  const lower = text.toLowerCase();

  type Range = { start: number; end: number };
  const ranges: Range[] = [];

  // For each token, only highlight its first occurrence in the string.
  for (const token of tokens) {
    const idx = lower.indexOf(token);
    if (idx !== -1) {
      ranges.push({ start: idx, end: idx + token.length });
    }
  }

  if (ranges.length === 0) return text;

  // Sort by start index and remove overlaps (keep the earliest range)
  ranges.sort((a, b) => a.start - b.start);
  const merged: Range[] = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (!last || range.start >= last.end) {
      merged.push(range);
    }
    // If overlapping, skip the later one – we only want one highlight segment there.
  }

  const segments: ReactNode[] = [];
  let cursor = 0;

  merged.forEach((range, index) => {
    if (range.start > cursor) {
      segments.push(
        <span key={`n-${index}`}>{text.slice(cursor, range.start)}</span>
      );
    }

    segments.push(
      <span
        key={`h-${index}`}
        className="bg-primary/50 dark:bg-primary/60 text-foreground-1 rounded-[3px] px-0.5"
      >
        {text.slice(range.start, range.end)}
      </span>
    );

    cursor = range.end;
  });

  if (cursor < text.length) {
    segments.push(
      <span key="n-final">{text.slice(cursor)}</span>
    );
  }

  return <>{segments}</>;
};

