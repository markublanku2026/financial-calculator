export type StorageAvailability = {
  available: boolean;
  reason?: string;
};

export function getStorageAvailability(): StorageAvailability {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { available: false, reason: 'localStorage unavailable' };
    }
    const key = '__financial_calculator_test__';
    window.localStorage.setItem(key, '1');
    window.localStorage.removeItem(key);
    return { available: true };
  } catch {
    return { available: false, reason: 'localStorage blocked' };
  }
}

export function readStorageValue<T>(key: string, fallback: T): T {
  try {
    const availability = getStorageAvailability();
    if (!availability.available) return fallback;
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorageValue<T>(key: string, value: T): boolean {
  try {
    const availability = getStorageAvailability();
    if (!availability.available) return false;
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeStorageValue(key: string): boolean {
  try {
    const availability = getStorageAvailability();
    if (!availability.available) return false;
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
