// Keep the profile link contract in sync across the dashboard, API, and public website.
const webProtocol = /^https?:\/\//i;
const dnsLabel = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
const topLevelDomain = /^(?:[a-z]{2,63}|xn--[a-z0-9-]+)$/i;
const ipv4 = /^\d{1,3}(?:\.\d{1,3}){3}$/;

/** Returns the exact value to store, an empty string for a clear, or null for an invalid link. */
export function parseProfileLink(value: string): string | null {
  const source = value.trim();
  if (!source) return "";
  if (/[\s\\<>\u0000-\u001f\u007f]/u.test(source)) return null;

  const authority = source.replace(webProtocol, "").split(/[/?#]/, 1)[0];
  if (!authority || /[@%]/.test(authority) || authority.endsWith(":")) return null;

  const normalized = webProtocol.test(source) ? source : `https://${source}`;
  try {
    const { hostname, port } = new URL(normalized);
    if (port === "0") return null;
    // URL validates bracketed IPv6. Exclude relative names and legacy numeric
    // shortcuts (such as a single integer) that URL quietly rewrites as IPv4.
    if (hostname.startsWith("[")) return normalized;
    if (ipv4.test(hostname)) {
      return authority.replace(/:\d+$/, "") === hostname ? normalized : null;
    }
    const labels = hostname.split(".");
    return hostname.length <= 253 && labels.length >= 2 && topLevelDomain.test(labels[labels.length - 1]) && labels.every(label => dnsLabel.test(label))
      ? normalized
      : null;
  } catch {
    return null;
  }
}
