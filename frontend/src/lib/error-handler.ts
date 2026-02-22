/**
 * Extract a user-friendly error message from mutation errors.
 */
export function getMutationErrorMessage(error: any, context?: string): string {
  const message =
    error?.response?.data?.message ||
    error?.message ||
    'Неизвестная ошибка';

  return context ? `${context}: ${message}` : message;
}

/**
 * Standard error handler for react-query mutation onError callbacks.
 * Shows alert with extracted error message.
 */
export function handleMutationError(error: any, context?: string): void {
  alert(getMutationErrorMessage(error, context));
}
