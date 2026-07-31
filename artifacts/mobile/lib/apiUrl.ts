const HTTP_PROTOCOLS = new Set(["http:", "https:"]);

function configurationError(message: string): Error {
  return new Error(`Invalid EXPO_PUBLIC_API_URL: ${message}`);
}

export function normalizeApiOrigin(value: string | undefined): string {
  const candidate = value?.trim();
  if (!candidate) {
    throw configurationError(
      "set it to the full API origin, including http:// or https://.",
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw configurationError("the value is not a valid URL.");
  }

  if (!HTTP_PROTOCOLS.has(parsed.protocol)) {
    throw configurationError("only http:// and https:// URLs are supported.");
  }
  if (!__DEV__ && parsed.protocol !== "https:") {
    throw configurationError("production builds require an https:// origin.");
  }
  if (parsed.username || parsed.password) {
    throw configurationError("credentials must not be included in the URL.");
  }
  if (!/^\/*$/.test(parsed.pathname) || parsed.search || parsed.hash) {
    throw configurationError("provide an origin without a path, query, or hash.");
  }

  return parsed.origin;
}

export const apiOrigin = normalizeApiOrigin(
  process.env.EXPO_PUBLIC_API_URL,
);

export function resolveStreamUrl(value: string): string {
  const candidate = value.trim();
  if (!candidate) {
    throw new Error("The video stream URL is empty.");
  }

  try {
    const absolute = new URL(candidate);
    if (!HTTP_PROTOCOLS.has(absolute.protocol)) {
      throw new Error("The video stream URL must use http:// or https://.");
    }
    return candidate;
  } catch (error) {
    if (candidate.startsWith("/") && !candidate.startsWith("//")) {
      return new URL(candidate, `${apiOrigin}/`).toString();
    }
    if (error instanceof Error && error.message.includes("must use")) {
      throw error;
    }
    throw new Error("The video stream URL is not a valid URL.");
  }
}
