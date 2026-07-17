export function createShareUrl(pathname: string, params: Record<string, string>) {
  const url = new URL(window.location.origin + pathname);
  Object.entries(params).forEach(([key, value]) => {
    if (value.trim()) {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

export function readSharedParams(allowedKeys: string[]): URLSearchParams | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const filtered = new URLSearchParams();
    for (const key of allowedKeys) {
      const value = params.get(key);
      if (value && value.length < 64) {
        filtered.set(key, value);
      }
    }
    return filtered;
  } catch {
    return null;
  }
}
