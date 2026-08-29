/**
 * Country -> IANA timezone data and the rules for turning a country choice into
 * a timezone.
 *
 * A country with exactly one zone leaves the user nothing to decide, so we pick
 * it for them. Everything here keys off the map below, so releasing a new
 * country needs no extra wiring: add its zones and the behaviour follows.
 */

/** ISO 3166-1 alpha-2 code -> IANA timezone identifiers, most-used zone first. */
export const COUNTRY_TIMEZONES: Record<string, string[]> = {
  // Europe
  ro: ['Europe/Bucharest'],
  de: ['Europe/Berlin', 'Europe/Busingen'],
  gb: ['Europe/London'],
  fr: ['Europe/Paris'],
  it: ['Europe/Rome'],
  es: ['Europe/Madrid', 'Atlantic/Canary', 'Africa/Ceuta'],
  nl: ['Europe/Amsterdam'],
  be: ['Europe/Brussels'],
  at: ['Europe/Vienna'],
  ch: ['Europe/Zurich'],
  pl: ['Europe/Warsaw'],
  cz: ['Europe/Prague'],
  hu: ['Europe/Budapest'],
  bg: ['Europe/Sofia'],
  pt: ['Europe/Lisbon', 'Atlantic/Madeira', 'Atlantic/Azores'],
  gr: ['Europe/Athens'],
  se: ['Europe/Stockholm'],
  dk: ['Europe/Copenhagen'],
  no: ['Europe/Oslo'],
  fi: ['Europe/Helsinki'],
  ie: ['Europe/Dublin'],
  al: ['Europe/Tirane'],
  ad: ['Europe/Andorra'],
  am: ['Asia/Yerevan'],
  az: ['Asia/Baku'],
  by: ['Europe/Minsk'],
  ba: ['Europe/Sarajevo'],
  hr: ['Europe/Zagreb'],
  cy: ['Asia/Nicosia', 'Asia/Famagusta'],
  ee: ['Europe/Tallinn'],
  ge: ['Asia/Tbilisi'],
  is: ['Atlantic/Reykjavik'],
  xk: ['Europe/Belgrade'], // Kosovo uses same as Serbia
  lv: ['Europe/Riga'],
  li: ['Europe/Vaduz'],
  lt: ['Europe/Vilnius'],
  lu: ['Europe/Luxembourg'],
  mt: ['Europe/Malta'],
  md: ['Europe/Chisinau'],
  mc: ['Europe/Monaco'],
  me: ['Europe/Podgorica'],
  mk: ['Europe/Skopje'],
  rs: ['Europe/Belgrade'],
  sk: ['Europe/Bratislava'],
  si: ['Europe/Ljubljana'],
  ua: ['Europe/Kiev', 'Europe/Kyiv', 'Europe/Simferopol'],
  // Americas
  us: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu', 'America/Phoenix', 'America/Detroit', 'America/Indiana/Indianapolis', 'America/Boise', 'America/Juneau', 'America/Adak'],
  ca: ['America/Toronto', 'America/Vancouver', 'America/Edmonton', 'America/Winnipeg', 'America/Halifax', 'America/St_Johns', 'America/Regina', 'America/Whitehorse', 'America/Yellowknife'],
  mx: ['America/Mexico_City', 'America/Tijuana', 'America/Cancun', 'America/Monterrey', 'America/Hermosillo', 'America/Chihuahua', 'America/Mazatlan'],
  br: ['America/Sao_Paulo', 'America/Rio_Branco', 'America/Manaus', 'America/Cuiaba', 'America/Fortaleza', 'America/Recife', 'America/Belem', 'America/Bahia', 'America/Noronha'],
  ar: ['America/Argentina/Buenos_Aires', 'America/Argentina/Cordoba', 'America/Argentina/Mendoza'],
  cl: ['America/Santiago', 'Pacific/Easter'],
  co: ['America/Bogota'],
  // Asia-Pacific
  au: ['Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane', 'Australia/Perth', 'Australia/Adelaide', 'Australia/Darwin', 'Australia/Hobart'],
  nz: ['Pacific/Auckland', 'Pacific/Chatham'],
  jp: ['Asia/Tokyo'],
  kr: ['Asia/Seoul'],
  sg: ['Asia/Singapore'],
  hk: ['Asia/Hong_Kong'],
  tw: ['Asia/Taipei'],
  cn: ['Asia/Shanghai', 'Asia/Urumqi'],
  in: ['Asia/Kolkata'],
  th: ['Asia/Bangkok'],
  my: ['Asia/Kuala_Lumpur'],
  ph: ['Asia/Manila'],
  id: ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'],
  vn: ['Asia/Ho_Chi_Minh'],
  // Middle East & Africa
  ae: ['Asia/Dubai'],
  il: ['Asia/Jerusalem'],
  tr: ['Europe/Istanbul'],
  za: ['Africa/Johannesburg'],
};


/** Every IANA zone a country spans, or null when the country isn't mapped. */
export const getCountryTimezones = (
  countryCode?: string | null
): string[] | null => {
  if (!countryCode) return null;
  return COUNTRY_TIMEZONES[countryCode.toLowerCase()] || null;
};

/** The browser's own timezone, or UTC when the runtime won't say. */
export const detectTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

/**
 * The timezone a country implies by itself: set only when the country spans a
 * single zone, null when the user still has a real choice to make (or the
 * country isn't mapped). This is the one safe to auto-select.
 */
export const getUnambiguousCountryTimezone = (
  countryCode?: string | null
): string | null => {
  const zones = getCountryTimezones(countryCode);
  return zones && zones.length === 1 ? zones[0] : null;
};

/**
 * Best-effort timezone for a country: its single zone when unambiguous, else
 * the browser's zone if that country contains it, else the country's primary
 * zone. Unmapped countries fall back to the browser.
 */
export const resolveTimezoneForCountry = (
  countryCode?: string | null
): string => {
  const single = getUnambiguousCountryTimezone(countryCode);
  if (single) return single;
  const zones = getCountryTimezones(countryCode);
  if (!zones || zones.length === 0) return detectTimezone();
  const detected = detectTimezone();
  return zones.includes(detected) ? detected : zones[0];
};
