import DOMPurify from 'dompurify';

/**
 * Sanitizes user-generated content before displaying it.
 * Use this when rendering descriptions or any user text to prevent XSS attacks.
 * 
 * This configuration strips all HTML tags and keeps only plain text.
 * 
 * @param text - The text to sanitize
 * @returns Plain text with all HTML removed
 * 
 * @example
 * sanitizeForDisplay("<script>alert('xss')</script>Hello") // "Hello"
 * sanitizeForDisplay("Safe text") // "Safe text"
 */
export const sanitizeForDisplay = (text: string): string => {
  if (!text) return '';
  
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [], // Plain text only, no HTML
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true, // Keep text content, remove tags
  });
};

/**
 * Sanitizes and allows basic formatting (bold, italic, links).
 * Use this if you want to allow limited HTML in descriptions.
 * 
 * Only allows safe, basic formatting tags with restricted attributes.
 * 
 * @param text - The text to sanitize
 * @returns Sanitized HTML with only allowed tags
 * 
 * @example
 * sanitizeRichText("<b>Bold</b> text") // "<b>Bold</b> text"
 * sanitizeRichText("<script>alert(1)</script>") // ""
 */
export const sanitizeRichText = (text: string): string => {
  if (!text) return '';
  
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br'],
    ALLOWED_ATTR: ['href', 'target'],
    ALLOWED_URI_REGEXP: /^https?:\/\//, // Only allow http/https URLs
  });
};

