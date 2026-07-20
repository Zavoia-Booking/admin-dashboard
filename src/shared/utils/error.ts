import i18n from "../lib/i18n";

type GlobalHttpErrorToastReason = "subscription_required";

const globallyHandledHttpErrorToasts = new WeakMap<
  object,
  Set<GlobalHttpErrorToastReason>
>();

/**
 * Records that the shared HTTP boundary already explained an error to the user.
 * Feature-level catches should still update their state, but can use the paired
 * predicate to avoid presenting the same failure twice.
 */
export function markGlobalHttpErrorToastHandled(
  error: unknown,
  reason: GlobalHttpErrorToastReason,
): void {
  if (typeof error !== "object" || error === null) return;
  const handled = globallyHandledHttpErrorToasts.get(error) ?? new Set<GlobalHttpErrorToastReason>();
  handled.add(reason);
  globallyHandledHttpErrorToasts.set(error, handled);
}

export function wasGlobalHttpErrorToastHandled(
  error: unknown,
  reason: GlobalHttpErrorToastReason,
): boolean {
  if (typeof error !== "object" || error === null) return false;
  return globallyHandledHttpErrorToasts.get(error)?.has(reason) === true;
}

/**
 * Pattern for message codes: DOMAIN.CODE (e.g., 'AUTH.E12', 'CATEGORY.S01')
 */
const MESSAGE_CODE_PATTERN = /^[A-Z_]+\.[A-Z]\d{2}$/;

/**
 * Checks if a string is a valid message code
 */
export function isMessageCode(value: string): boolean {
  return MESSAGE_CODE_PATTERN.test(value);
}

/**
 * Translates a message code (e.g., 'AUTH.E12') to a human-readable message
 * using the current i18n language. If the code is not found or not a valid
 * message code, returns the original value.
 *
 * @param code - The message code to translate (e.g., 'AUTH.E12')
 * @returns The translated message or the original code if not found
 */
export function translateMessageCode(code: string): string {
  if (!code || typeof code !== "string") {
    return code;
  }

  // Check if it matches the message code pattern
  if (!isMessageCode(code)) {
    return code;
  }

  // Parse the code into namespace and key (e.g., 'AUTH.E12' -> ['AUTH', 'E12'])
  const [namespace, key] = code.split(".");

  // Try to get the translation from the messages namespace
  const translationKey = `messages:${namespace}.${key}`;
  const translated = i18n.t(translationKey, { defaultValue: "" });

  // If translation exists and is different from the key, return it
  if (translated && translated !== translationKey && translated !== `${namespace}.${key}`) {
    return translated;
  }

  // Fallback to the original code
  return code;
}

/**
 * Extracts error message from axios error response
 * Handles various error response formats from the backend
 */
export function getErrorMessage(error: unknown): string {
  if (!error) {
    return i18n.t("messages:fallback");
  }

  // Handle axios errors
  if (typeof error === "object" && "response" in error) {
    const axiosError = error as any;
    const response = axiosError.response;

    // Rate-limit guards respond with developer-facing English strings
    // ("Too many requests. Please try again later.") or bare message codes.
    // Show a friendly localized message unless the code has a real translation.
    if (response?.status === 429) {
      const raw = Array.isArray(response.data?.message)
        ? response.data.message[0]
        : response.data?.message;
      const translated = typeof raw === "string" ? translateMessageCode(raw) : "";
      if (translated && translated !== raw) {
        return translated;
      }
      return i18n.t("messages:rateLimited");
    }

    if (response?.data) {
      // Backend sends message codes (e.g., 'CATEGORY.E06') in the message field
      if (response.data.message) {
        const message = response.data.message;
        // Handle array of messages
        if (Array.isArray(message)) {
          return message
            .filter(Boolean)
            .map((m: string) => translateMessageCode(m))
            .join("\n");
        }
        return translateMessageCode(message);
      }

      // Fallback to error field
      if (response.data.error) {
        return translateMessageCode(response.data.error);
      }
    }

    // Fallback to status text
    if (response?.statusText) {
      return response.statusText;
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    return translateMessageCode(error.message);
  }

  // Handle string errors
  if (typeof error === "string") {
    return translateMessageCode(error);
  }

  return i18n.t("messages:fallback");
}
