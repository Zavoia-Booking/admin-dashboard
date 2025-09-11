// Shared validation and sanitization utilities for auth forms

export const sanitizeName = (value: string): string => value.replace(/[^A-Za-zÀ-ÿ'\-\s]/g, '');

export const nameRules = {
  required: 'This field is required',
  minLength: { value: 2, message: 'Must be at least 2 characters' },
  maxLength: { value: 50, message: 'Must be under 50 characters' },
} as const;

// E.164-style check: optional leading +, start 1-9, min 8 total digits, max 15
export const isE164 = (value: string): boolean => /^\+?[1-9]\d{7,14}$/.test(value) || /^0\d{8,14}$/.test(value);

export const phoneRules = {
  required: 'Phone number is required',
  validate: (value: string) => isE164(value) || 'Enter a valid phone number',
} as const;

// Sanitize to "+" and digits only; cap to 15 digits
export const sanitizePhoneToE164Draft = (value: string): string => {
  const startsPlus = value.trim().startsWith('+');
  const digits = value.replace(/\D/g, '');
  return (startsPlus ? '+' : '') + digits.slice(0, 15);
}

// Lightweight email check for UX (backend does canonical IsEmail)
export const emailRules = {
  required: 'Email is required',
  pattern: { value: /[^@\s]+@[^@\s]+\.[^@\s]+/, message: 'Enter a valid email' },
} as const;

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


