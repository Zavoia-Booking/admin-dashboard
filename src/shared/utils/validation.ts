// Shared validation and sanitization utilities
import type { TFunction } from "i18next";

export const sanitizeName = (value: string): string =>
  value.replace(/[^A-Za-zÀ-ÿ'\-\s]/g, "");

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
 * - Letters (A-Z, a-z, including accented characters like À-ÿ)
 * - Numbers (0-9)
 * - Spaces
 * - Hyphens (-)
 * - Apostrophes (')
 * - Ampersands (&)
 * - Periods (.)
 * - Parentheses (())
 */
export const NAME_PATTERN = /^[A-Za-zÀ-ÿ0-9\s\-'&.()]+$/;

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
 * Pattern for person names. Permits letters (including accented),
 * spaces, hyphens, and apostrophes. Romanian/Latin diacritics covered by À-ÿ.
 */
export const PERSON_NAME_PATTERN = /^[A-Za-zÀ-ÿ\s\-']+$/;

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
  if (v.length > 32)
    return t("common:validation.maxLengthGeneric", { max: 32 });
  if (!PERSON_NAME_PATTERN.test(v))
    return t("common:validation.personNameSpecialChars");
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
