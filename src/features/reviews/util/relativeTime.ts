import { formatDistanceToNow, parseISO } from "date-fns";
import { ro } from "date-fns/locale/ro";

export function relativeTime(dateStr: string, lang: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), {
      addSuffix: true,
      locale: lang === "ro" ? ro : undefined,
    });
  } catch {
    return "";
  }
}
