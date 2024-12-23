export function errorMessageResolver(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: Error | any,
  defaultMessage?: string,
): string {
  if ('message' in error) {
    return error.message;
  }

  return defaultMessage ?? 'An error occurred. Please try again later.';
}
