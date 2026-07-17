import type { ParsedShareState, ShareField, ShareSchema } from '../types/share';

const MAX_SAFE_SHARE_NUMBER = Number.MAX_SAFE_INTEGER;

function isSafeShareNumber(value: number) {
  return Number.isFinite(value) && Math.abs(value) <= MAX_SAFE_SHARE_NUMBER;
}

function shouldIncludeField<T extends Record<string, string>>(field: ShareField<T>, values: Partial<T>) {
  return !field.include || field.include(values);
}

function normalizeNumberString(rawValue: string): string | null {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  const value = Number(trimmed);
  if (!isSafeShareNumber(value)) {
    return null;
  }

  return Object.is(value, -0) ? '0' : value.toString();
}

function validateField<T extends Record<string, string>>(field: ShareField<T>, rawValue: string): string | null {
  if (field.type === 'enum') {
    return field.options.includes(rawValue) ? rawValue : null;
  }

  const normalized = normalizeNumberString(rawValue);
  if (normalized === null) {
    return null;
  }

  const value = Number(normalized);
  if (field.integer && !Number.isInteger(value)) {
    return null;
  }
  if (field.min !== undefined && value < field.min) {
    return null;
  }
  if (field.max !== undefined && value > field.max) {
    return null;
  }

  return normalized;
}

export function serializeShareValues<T extends Record<string, string>>(
  schema: ShareSchema<T>,
  values: Partial<T>,
): URLSearchParams {
  const params = new URLSearchParams();

  for (const field of schema.fields) {
    if (!shouldIncludeField(field, values)) {
      continue;
    }

    const rawValue = values[field.key];
    if (rawValue === undefined) {
      continue;
    }

    const normalized = validateField(field, rawValue);
    if (normalized !== null) {
      params.append(field.param, normalized);
    }
  }

  return params;
}

export function buildShareCalculationUrl<T extends Record<string, string>>(
  pathname: string,
  schema: ShareSchema<T>,
  values: Partial<T>,
  origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
): string {
  const url = new URL(pathname, origin);
  const params = serializeShareValues(schema, values);
  url.search = params.toString();
  return url.toString();
}

export function parseShareCalculation<T extends Record<string, string>>(
  schema: ShareSchema<T>,
  search = typeof window !== 'undefined' ? window.location.search : '',
): ParsedShareState<T> {
  const result: ParsedShareState<T> = {
    values: {},
    loaded: false,
    ignoredInvalid: false,
  };

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search);
  } catch {
    return result;
  }

  for (const field of schema.fields) {
    if (!shouldIncludeField(field, result.values)) {
      continue;
    }

    const rawValue = params.get(field.param);
    if (rawValue === null) {
      continue;
    }

    const normalized = validateField(field, rawValue);
    if (normalized === null) {
      result.ignoredInvalid = true;
      continue;
    }

    result.values[field.key] = normalized as T[typeof field.key];
    result.loaded = true;
  }

  return result;
}

export function getShareLoadNotice<T extends Record<string, string>>(state: ParsedShareState<T>) {
  if (state.loaded && state.ignoredInvalid) {
    return {
      tone: 'warning' as const,
      title: 'Shared link loaded',
      message: 'Values were loaded from a shared link. Some invalid values were ignored. Review them and select Calculate to generate the result.',
    };
  }

  if (state.loaded) {
    return {
      tone: 'info' as const,
      title: 'Shared link loaded',
      message: 'Values were loaded from a shared link. Review them and select Calculate to generate the result.',
    };
  }

  if (state.ignoredInvalid) {
    return {
      tone: 'warning' as const,
      title: 'Shared link issue',
      message: 'Some shared values were ignored because they were invalid.',
    };
  }

  return null;
}
