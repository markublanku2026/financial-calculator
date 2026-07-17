export type FieldErrors<T extends string> = Partial<Record<T, string>>;

export function parseNumberInput(rawValue: string): number | null {
  const normalized = rawValue.trim();
  if (normalized.length === 0) {
    return null;
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) {
    return null;
  }

  return value;
}

export function validateNumberField(
  rawValue: string,
  label: string,
  options: {
    min?: number;
    max?: number;
    integer?: boolean;
    allowZero?: boolean;
  } = {},
): { value?: number; error?: string } {
  const value = parseNumberInput(rawValue);
  if (value === null) {
    return { error: `Enter ${label.toLowerCase()}.` };
  }

  if (options.integer && !Number.isInteger(value)) {
    return { error: `${label} must be a whole number.` };
  }

  if (options.allowZero === false && value === 0) {
    return { error: `${label} must be greater than 0.` };
  }

  if (options.min !== undefined && value < options.min) {
    return { error: `${label} must be at least ${options.min}.` };
  }

  if (options.max !== undefined && value > options.max) {
    return { error: `${label} must be no more than ${options.max}.` };
  }

  return { value };
}

export function validateTextField(rawValue: string, label: string): { value?: string; error?: string } {
  const value = rawValue.trim();
  if (!value) {
    return { error: `Enter ${label.toLowerCase()}.` };
  }

  return { value };
}

export function hasErrors<T extends string>(errors: FieldErrors<T>): boolean {
  return Object.values(errors).some(Boolean);
}
