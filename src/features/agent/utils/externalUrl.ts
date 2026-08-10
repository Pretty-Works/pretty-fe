export function resolveAllowedExternalUrl(
  value: unknown,
  allowedOrigin: string,
): string | null {
  if (typeof value !== "string" || !value || !allowedOrigin) return null;

  try {
    const url = new URL(value);
    const origin = new URL(allowedOrigin);

    if (
      url.protocol !== "https:" ||
      origin.protocol !== "https:" ||
      url.origin !== origin.origin
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}
