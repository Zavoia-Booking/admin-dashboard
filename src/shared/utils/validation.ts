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

export const emailError = (fieldLabel: string, value: string): string | null => {
  const v = (value ?? '').trim();
  if (!v) return null; // only enforce when present
  return isValidEmail(v) ? null : `Enter a valid ${fieldLabel.toLowerCase()}`;
}

// Required email validation (for mandatory email fields)
export const requiredEmailError = (fieldLabel: string, value: string): string | null => {
  const v = (value ?? '').trim();
  if (!v) return `${fieldLabel} is required`;
  return isValidEmail(v) ? null : `Enter a valid ${fieldLabel.toLowerCase()}`;
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

