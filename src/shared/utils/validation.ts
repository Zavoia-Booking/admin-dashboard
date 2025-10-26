// Shared validation and sanitization utilities

export const sanitizeName = (value: string): string => value.replace(/[^A-Za-zÀ-ÿ'\-\s]/g, '');

// E.164-style check: optional leading +, start 1-9, min 8 total digits, max 15
export const isE164 = (value: string): boolean => /^\+?[1-9]\d{7,14}$/.test(value) || /^0\d{8,14}$/.test(value);

// Sanitize to "+" and digits only; cap to 15 digits
export const sanitizePhoneToE164Draft = (value: string): string => {
  const startsPlus = value.trim().startsWith('+');
  const digits = value.replace(/\D/g, '');
  return (startsPlus ? '+' : '') + digits.slice(0, 15);
}

// Password policy aligned with backend RegisterDTO
export const validatePasswordPolicy = (password: string): true | string => {
  if (!password || password.length < 8) return 'Password must be at least 8 characters long';
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[@$!%*?&]/.test(password);
  if (!(hasLower && hasUpper && hasNumber && hasSymbol)) return 'Please enter a valid password.';
  return true;
}

// Email validation
export const EMAIL_PATTERN = /[^@\s]+@[^@\s]+\.[^@\s]+/;

export const isValidEmail = (value: string): boolean => EMAIL_PATTERN.test(value);

export const emailError = (_fieldLabel: string, value: string): string | null => {
  const v = (value ?? '').trim();
  if (!v) return null; // only enforce when present
  
  // Adaptive validation for optional fields
  if (!v.includes('@')) return 'Email must include an @ symbol';
  if (v.includes(' ')) return 'Email can\'t contain spaces';
  if (v.indexOf('@') === 0) return 'Email can\'t start with @';
  if (v.indexOf('@') === v.length - 1) return 'Email can\'t end with @';
  if ((v.match(/@/g) || []).length > 1) return 'Email can only have one @ symbol';
  
  const afterAt = v.split('@')[1];
  if (afterAt && !afterAt.includes('.')) return 'Email must include a domain (like .com)';
  
  return isValidEmail(v) ? null : 'Please enter a valid email address';
}

// Required email validation (for mandatory email fields) - Adaptive validation
export const requiredEmailError = (fieldLabel: string, value: string): string | null => {
  const v = (value ?? '').trim();
  if (!v) return `Please enter ${fieldLabel.toLowerCase()}`;
  
  // Adaptive validation - specific error messages
  if (!v.includes('@')) return 'Email must include an @ symbol';
  if (v.includes(' ')) return 'Email can\'t contain spaces';
  if (v.indexOf('@') === 0) return 'Email can\'t start with @';
  if (v.indexOf('@') === v.length - 1) return 'Email can\'t end with @';
  if ((v.match(/@/g) || []).length > 1) return 'Email can only have one @ symbol';
  
  const afterAt = v.split('@')[1];
  if (afterAt && !afterAt.includes('.')) return 'Email must include a domain (like .com)';
  
  // Generic fallback
  return isValidEmail(v) ? null : 'Please enter a valid email address';
}

// Generic helpers
export const sanitizeDigits = (value: string): string => value.replace(/\D+/g, '');

export const minLengthError = (fieldLabel: string, value: string, min = 2): string | null => {
  const v = (value ?? '').trim();
  if (!v) return null; // only enforce when present
  return v.length < min ? `${fieldLabel} must be at least ${min} characters` : null;
}

// Required + min length combined helper (for mandatory fields)
export const requiredMinError = (fieldLabel: string, value: string, min = 2): string | null => {
  const v = (value ?? '').trim();
  if (!v) return `${fieldLabel} is required`;
  return v.length < min ? `${fieldLabel} must be at least ${min} characters` : null;
}

// Required-only helper (no min-length)
export const requiredError = (fieldLabel: string, value: string): string | null => {
  const v = (value ?? '').trim();
  return v ? null : `${fieldLabel} is required`;
}

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

/**
 * Validates business name for allowed characters and length.
 * 
 * @param value - The business name to validate
 * @returns null if valid, error message string if invalid
 * 
 * @example
 * validateBusinessName("Sarah's Hair & Beauty") // null (valid)
 * validateBusinessName("<script>") // "Business name contains invalid characters..."
 */
export const validateBusinessName = (value: string): string | null => {
  const v = (value ?? '').trim();
  if (!v) return 'Please enter a business name';
  if (v.length < 2) return 'Enter at least 2 characters';
  if (v.length > 70) return 'Maximum 70 characters allowed';
  if (!NAME_PATTERN.test(v)) {
    return 'Please remove special characters (only - \' & . ( ) allowed)';
  }
  return null;
};

/**
 * Validates location name for allowed characters and length.
 * 
 * @param value - The location name to validate
 * @returns null if valid, error message string if invalid
 * 
 * @example
 * validateLocationName("Downtown Office") // null (valid)
 * validateLocationName("Main<script>") // "Location name contains invalid characters..."
 */
export const validateLocationName = (value: string): string | null => {
  const v = (value ?? '').trim();
  if (!v) return 'Please enter a location name';
  if (v.length < 2) return 'Enter at least 2 characters';
  if (v.length > 70) return 'Maximum 70 characters allowed';
  if (!NAME_PATTERN.test(v)) {
    return 'Please remove special characters (only - \' & . ( ) allowed)';
  }
  return null;
};

// ============================================================
// DESCRIPTION FIELD VALIDATION
// ============================================================

/**
 * Validates description fields for length and potentially dangerous content.
 * This is a "soft" validation - we warn but don't completely block user input.
 * 
 * @param value - The description text to validate
 * @param maxLength - Maximum allowed length (default 500)
 * @returns null if valid, error message string if invalid
 * 
 * @example
 * validateDescription("Great place!", 500) // null (valid)
 * validateDescription("<script>alert(1)</script>", 500) // "Special characters < > aren't allowed"
 */
export const validateDescription = (
  value: string, 
  maxLength: number = 500
): string | null => {
  const v = (value ?? '').trim();
  
  // Hard limit on length
  if (v.length > maxLength) {
    return `Maximum ${maxLength} characters allowed`;
  }
  
  // Warn about potentially dangerous content
  if (/<script|<iframe|javascript:|onclick|onerror|onload/i.test(v)) {
    return 'Special characters < > aren\'t allowed';
  }
  
  return null;
};

/**
 * Sanitizes dangerous characters from descriptions (input-level sanitization).
 * Note: This is a basic sanitization. Use DOMPurify for display-level sanitization.
 * 
 * @param value - The description text to sanitize
 * @returns Sanitized text with script/iframe tags removed
 */
export const sanitizeDescriptionInput = (value: string): string => {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .trim();
};

