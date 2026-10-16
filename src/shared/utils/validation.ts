// Shared validation and sanitization utilities
import type { TFunction } from "i18next";

export const sanitizeName = (value: string): string =>
  value.replace(/[^\p{L}\s'’-]/gu, "");

// E.164-style check: optional leading +, start 1-9, min 8 total digits, max 15
export const isE164 = (value: string): boolean =>
  /^\+?[1-9]\d{7,14}$/.test(value) || /^0\d{8,14}$/.test(value);

// Sanitize to "+" and digits only; cap to 15 digits
export const sanitizePhoneToE164Draft = (value: string): string => {
  const startsPlus = value.trim().startsWith("+");
  const digits = value.replace(/\D/g, "");
  return (startsPlus ? "+" : "") + digits.slice(0, 15);
};

// Password policy aligned with backend RegisterDTO
export const validatePasswordPolicy = (
  password: string,
  t: TFunction
): true | string => {
  if (!password || password.length < 8)
    return t("common:validation.password.minLength");
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[@$!%*?&]/.test(password);
  if (!(hasLower && hasUpper && hasNumber && hasSymbol))
    return t("common:validation.password.invalid");
  return true;
};

// Email validation
export const EMAIL_PATTERN = /[^@\s]+@[^@\s]+\.[^@\s]+/;

export const isValidEmail = (value: string): boolean =>
  EMAIL_PATTERN.test(value);

/**
 * Adaptive email validator for OPTIONAL fields. Empty passes.
 * Returns null on success or the resolved error string.
 */
export const emailError = (value: string, t: TFunction): string | null => {
  const v = (value ?? "").trim();
  if (!v) return null; // only enforce when present

  if (!v.includes("@")) return t("common:validation.email.atSymbol");
  if (v.includes(" ")) return t("common:validation.email.noSpaces");
  if (v.indexOf("@") === 0) return t("common:validation.email.notStartWithAt");
  if (v.indexOf("@") === v.length - 1)
    return t("common:validation.email.notEndWithAt");
  if ((v.match(/@/g) || []).length > 1)
    return t("common:validation.email.singleAtSymbol");

  const afterAt = v.split("@")[1];
  if (afterAt && !afterAt.includes("."))
    return t("common:validation.email.needsDomain");

  return isValidEmail(v) ? null : t("common:validation.email.generic");
};

/**
 * Required-email validator. `fieldKey` indexes into `common:validation.fields.*`
 * to produce a translated field name for the "Please enter {{field}}" template.
 */
export const requiredEmailError = (
  fieldKey: keyof typeof FIELD_KEYS,
  value: string,
  t: TFunction
): string | null => {
  const v = (value ?? "").trim();
  if (!v)
    return t("common:validation.required", {
      field: t(`common:validation.fields.${fieldKey}`),
    });

  if (!v.includes("@")) return t("common:validation.email.atSymbol");
  if (v.includes(" ")) return t("common:validation.email.noSpaces");
  if (v.indexOf("@") === 0) return t("common:validation.email.notStartWithAt");
  if (v.indexOf("@") === v.length - 1)
    return t("common:validation.email.notEndWithAt");
  if ((v.match(/@/g) || []).length > 1)
    return t("common:validation.email.singleAtSymbol");

  const afterAt = v.split("@")[1];
  if (afterAt && !afterAt.includes("."))
    return t("common:validation.email.needsDomain");

  return isValidEmail(v) ? null : t("common:validation.email.generic");
};

// Keys used by validators that need a translated field name.
// Keep in sync with `common:validation.fields.*` in en/ro common.json.
const FIELD_KEYS = {
  email: true,
  businessEmail: true,
  firstName: true,
  lastName: true,
  streetAddress: true,
  buildingNumber: true,
  city: true,
  postcode: true,
  country: true,
  teamMemberEmail: true,
} as const;

// Generic helpers
export const sanitizeDigits = (value: string): string =>
  value.replace(/\D+/g, "");

export const minLengthError = (
  fieldLabel: string,
  value: string,
  t: TFunction,
  min = 2
): string | null => {
  const v = (value ?? "").trim();
  if (!v) return null; // only enforce when present
  return v.length < min
    ? t("common:validation.minLengthField", { field: fieldLabel, min })
    : null;
};

export interface WebsiteCopyValidationOptions {
  fieldLabel: string;
  maxLength: number;
  minLength?: number;
}

export const hasUnsafeWebsiteCopyCharacters = (value: string): boolean =>
  /[<>\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F]/.test(value ?? "");

/**
 * Validates optional, visitor-facing Website Builder copy. Empty values are valid because they mean
 * "use the built-in default"; a custom value must be meaningful and must not contain markup delimiters
 * or unsupported control characters. Normal punctuation and diacritics remain valid, unlike the stricter
 * business-name pattern.
 */
export const validateWebsiteCopy = (
  value: string,
  t: TFunction,
  { fieldLabel, maxLength, minLength = 2 }: WebsiteCopyValidationOptions,
): string | null => {
  const normalized = (value ?? "").trim();
  if (!normalized) return null;
  if (hasUnsafeWebsiteCopyCharacters(normalized)) {
    return t("common:validation.websiteCopyUnsafeChars");
  }
  const tooShort = minLengthError(fieldLabel, normalized, t, minLength);
  if (tooShort) return tooShort;
  if (normalized.length > maxLength) {
    return t("common:validation.maxLengthGeneric", { max: maxLength });
  }
  return null;
};

// Required + min length combined helper (for mandatory fields)
export const requiredMinError = (
  fieldKey: keyof typeof FIELD_KEYS,
  value: string,
  t: TFunction,
  min = 2
): string | null => {
  const v = (value ?? "").trim();
  if (!v)
    return t("common:validation.required", {
      field: t(`common:validation.fields.${fieldKey}`),
    });
  return v.length < min
    ? t("common:validation.minLengthGeneric", { min })
    : null;
};

// Required-only helper (no min-length)
export const requiredError = (
  fieldKey: keyof typeof FIELD_KEYS,
  value: string,
  t: TFunction
): string | null => {
  const v = (value ?? "").trim();
  return v
    ? null
    : t("common:validation.required", {
        field: t(`common:validation.fields.${fieldKey}`),
      });
};

// ============================================================
// NAME FIELD VALIDATION (Business Name, Location Name)
// ============================================================

/**
 * Pattern for business and location names.
 * Allowed characters:
 * - Letters — any Unicode letter (\p{L}), so Romanian ă/ș/ț work too; the old
 *   À-ÿ range only covered Latin-1 accents and wrongly rejected them.
 * - Numbers (0-9)
 * - Spaces
 * - Hyphens (-)
 * - Apostrophes (')
 * - Ampersands (&)
 * - Periods (.)
 * - Parentheses (())
 */
export const NAME_PATTERN = /^[\p{L}0-9\s\-'&.()]+$/u;

export const validateBusinessName = (
  value: string,
  t: TFunction
): string | null => {
  const v = (value ?? "").trim();
  if (!v) return t("common:validation.businessName");
  if (v.length < 2) return t("common:validation.minLength2Generic");
  if (v.length > 70)
    return t("common:validation.maxLengthGeneric", { max: 70 });
  if (!NAME_PATTERN.test(v)) return t("common:validation.nameSpecialChars");
  return null;
};

export const validateLocationName = (
  value: string,
  t: TFunction
): string | null => {
  const v = (value ?? "").trim();
  if (!v) return t("common:validation.locationName");
  if (v.length < 2) return t("common:validation.minLength2Generic");
  if (v.length > 70)
    return t("common:validation.maxLengthGeneric", { max: 70 });
  if (!NAME_PATTERN.test(v)) return t("common:validation.nameSpecialChars");
  return null;
};

export const validateCategoryName = (
  value: string,
  t: TFunction
): string | null => {
  const v = (value ?? "").trim();
  if (!v) return t("common:validation.categoryName");
  if (v.length < 2) return t("common:validation.minLength2Use");
  if (v.length > 50)
    return t("common:validation.maxLengthGeneric", { max: 50 });
  if (!NAME_PATTERN.test(v))
    return t("common:validation.categoryNameSpecialChars");
  return null;
};

// ============================================================
// ADDRESS FIELD VALIDATION
// ============================================================

type AddressFieldConfig = {
  fieldKey: keyof typeof FIELD_KEYS;
  minLength?: number;
  maxLength: number;
  pattern?: RegExp;
};

const validateAddressField = (
  value: string,
  config: AddressFieldConfig,
  t: TFunction
): string | null => {
  const v = (value ?? "").trim();

  if (!v)
    return t("common:validation.required", {
      field: t(`common:validation.fields.${config.fieldKey}`),
    });

  if (config.minLength && v.length < config.minLength) {
    return t("common:validation.minLength2Generic");
  }

  if (v.length > config.maxLength) {
    return t("common:validation.maxLengthGeneric", { max: config.maxLength });
  }

  if (config.pattern && !config.pattern.test(v)) {
    return t("common:validation.addressFieldSpecialChars");
  }

  return null;
};

export const validateStreetAddress = (
  value: string,
  t: TFunction
): string | null =>
  validateAddressField(
    value,
    {
      fieldKey: "streetAddress",
      minLength: 2,
      maxLength: 200,
      pattern: /^[^<>{}[\]]+$/,
    },
    t
  );

export const validateBuildingNumber = (
  value: string,
  t: TFunction
): string | null =>
  validateAddressField(
    value,
    {
      fieldKey: "buildingNumber",
      minLength: 1,
      maxLength: 50,
      pattern: /^[^<>{}[\]]+$/,
    },
    t
  );

export const validateCity = (value: string, t: TFunction): string | null =>
  validateAddressField(
    value,
    {
      fieldKey: "city",
      minLength: 2,
      maxLength: 100,
      pattern: /^[^<>{}[\]]+$/,
    },
    t
  );

export const validatePostcode = (value: string, t: TFunction): string | null =>
  validateAddressField(
    value,
    {
      fieldKey: "postcode",
      minLength: 2,
      maxLength: 20,
      pattern: /^[a-zA-Z0-9\s-]+$/,
    },
    t
  );

export const validateCountry = (value: string, t: TFunction): string | null =>
  validateAddressField(
    value,
    {
      fieldKey: "country",
      minLength: 2,
      maxLength: 100,
      pattern: /^[^<>{}[\]]+$/,
    },
    t
  );

// ============================================================
// DESCRIPTION FIELD VALIDATION
// ============================================================

export const validateDescription = (
  value: string,
  t: TFunction,
  maxLength: number = 500
): string | null => {
  const v = (value ?? "").trim();

  if (v.length > maxLength) {
    return t("common:validation.maxLengthGeneric", { max: maxLength });
  }

  if (/<script|<iframe|javascript:|onclick|onerror|onload/i.test(v)) {
    return t("common:validation.descriptionUnsafeChars");
  }

  return null;
};

/**
 * Sanitizes dangerous characters from descriptions (input-level sanitization).
 * Note: This is a basic sanitization. Use DOMPurify for display-level sanitization.
 */
export const sanitizeDescriptionInput = (value: string): string => {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .trim();
};

// ============================================================
// PERSON NAME VALIDATION (first name, last name)
// ============================================================

/**
 * Pattern for person names: any Unicode letters plus spaces, hyphens, and
 * apostrophes (straight or typographic), with at least one actual letter so
 * punctuation-only strings ("--") don't pass. \p{L} is what covers Romanian
 * diacritics — ă/ș/ț sit above the old À-ÿ range and were being rejected.
 */
export const PERSON_NAME_PATTERN = /^(?=.*\p{L})[\p{L}\s'’-]+$/u;

export const validatePersonName = (
  fieldKey: keyof typeof FIELD_KEYS,
  value: string,
  t: TFunction
): string | null => {
  const v = (value ?? "").trim();
  if (!v)
    return t("common:validation.required", {
      field: t(`common:validation.fields.${fieldKey}`),
    });
  if (v.length < 2)
    return t("common:validation.minLengthGeneric", { min: 2 });
  if (v.length > 32)
    return t("common:validation.maxLengthGeneric", { max: 32 });
  if (!PERSON_NAME_PATTERN.test(v))
    return t("common:validation.personNameSpecialChars");
  return null;
};

/**
 * react-hook-form rules object for a person-name field. Wraps validatePersonName
 * (which trims first) so every name input — register, team invite, profile —
 * shares one rule and a whitespace-only name can't slip past a raw `minLength`
 * that counts spaces. Spread into register(): register('firstName', personNameRules('firstName', t)).
 */
export const personNameRules = (
  fieldKey: keyof typeof FIELD_KEYS,
  t: TFunction
) => ({
  validate: (value: string) => validatePersonName(fieldKey, value, t) ?? true,
  // Live-strip disallowed characters while typing (same feel as the register form).
  onChange: (e: { target: { value: string } }) => {
    e.target.value = sanitizeName(e.target.value);
  },
});

// ============================================================
// PUBLIC PROFILE TEXT (marketplace display name, professional title)
// ============================================================

/**
 * Permissive public-name pattern: any Unicode letter (\p{L} — covers Romanian
 * ă/ș/ț, unlike the À-ÿ NAME_PATTERN), digits, spaces, and - ' & . ( ), with at
 * least one actual letter so "123" / "!!!" / punctuation-only don't pass. Blocks
 * markup and control characters. Broader than a person name (allows "Dr. Ana",
 * "Salon X & Co.") but still a real, safe label.
 */
export const DISPLAY_NAME_PATTERN = /^(?=.*\p{L})[\p{L}0-9\s\-'&.()]+$/u;

/** Required marketplace display name: trimmed, 2–50 chars, permissive but safe. */
export const validateDisplayName = (value: string, t: TFunction): string | null => {
  const v = (value ?? "").trim();
  if (!v)
    return t("common:validation.required", {
      field: t("common:validation.fields.displayName"),
    });
  if (v.length < 2) return t("common:validation.minLengthGeneric", { min: 2 });
  if (v.length > 50) return t("common:validation.maxLengthGeneric", { max: 50 });
  if (!DISPLAY_NAME_PATTERN.test(v)) return t("common:validation.nameSpecialChars");
  return null;
};

/** Optional professional title: empty passes; otherwise 2–100 chars, same set. */
export const validateProfessionalTitle = (value: string, t: TFunction): string | null => {
  const v = (value ?? "").trim();
  if (!v) return null;
  if (v.length < 2) return t("common:validation.minLengthGeneric", { min: 2 });
  if (v.length > 100) return t("common:validation.maxLengthGeneric", { max: 100 });
  if (!DISPLAY_NAME_PATTERN.test(v)) return t("common:validation.nameSpecialChars");
  return null;
};

// ============================================================
// URL VALIDATION (social profiles, website)
// ============================================================

/**
 * Validates an optional URL field. Empty values pass.
 * Non-empty values must be parseable as a URL — protocol is
 * optional (we prepend https:// for the parse check).
 */
export const validateUrlField = (
  value: string,
  t: TFunction
): string | null => {
  const v = (value ?? "").trim();
  if (!v) return null;
  if (v.length > 300)
    return t("common:validation.maxLengthGeneric", { max: 300 });
  const withProtocol = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withProtocol);
    if (!u.hostname.includes(".")) {
      return t("common:validation.url");
    }
    return null;
  } catch {
    return t("common:validation.url");
  }
};
