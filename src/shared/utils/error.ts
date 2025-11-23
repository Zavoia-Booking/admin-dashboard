/**
 * Extracts error message from axios error response
 * Handles various error response formats from the backend
 */
export function getErrorMessage(error: unknown): string {
  if (!error) {
    return "An unexpected error occurred";
  }

  // Handle axios errors
  if (typeof error === "object" && "response" in error) {
    const axiosError = error as any;
    const response = axiosError.response;

    if (response?.data) {
      // Backend sends message codes (e.g., 'CATEGORY.E06') in the message field
      // For now, we'll use the message code directly. In the future, these can be translated
      if (response.data.message) {
        const message = response.data.message;
        // Handle array of messages
        if (Array.isArray(message)) {
          return message.filter(Boolean).join("\n");
        }
        return message;
      }

      // Fallback to error field
      if (response.data.error) {
        return response.data.error;
      }
    }

    // Fallback to status text
    if (response?.statusText) {
      return response.statusText;
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === "string") {
    return error;
  }

  return "An unexpected error occurred";
}
