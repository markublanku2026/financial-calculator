import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { CurrencyCode, UserPreferences } from '../types/financial';
import { readStorageValue, writeStorageValue } from '../utils/storage';

const storageKey = 'financial-calculator-preferences';
const recentLimit = 6;

const defaultPreferences: UserPreferences = {
  currency: 'USD',
  reducedMotion: false,
  schedulesExpanded: false,
  favorites: [],
  recentCalculators: [],
};

type PreferencesContextValue = {
  preferences: UserPreferences;
  storageEnabled: boolean;
  setCurrency: (currency: CurrencyCode) => void;
  setReducedMotion: (value: boolean) => void;
  setSchedulesExpanded: (value: boolean) => void;
  toggleFavorite: (slug: string) => void;
  isFavorite: (slug: string) => boolean;
  addRecentCalculator: (slug: string) => void;
  clearRecentCalculators: () => void;
  clearFavorites: () => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function sanitizePreferences(input: UserPreferences): UserPreferences {
  const favorites = Array.isArray(input.favorites) ? input.favorites.filter((item) => typeof item === 'string') : [];
  const recentCalculators = Array.isArray(input.recentCalculators)
    ? input.recentCalculators.filter((item) => typeof item === 'string').slice(0, recentLimit)
    : [];

  return {
    currency: input.currency === 'USD' ? 'USD' : 'USD',
    reducedMotion: Boolean(input.reducedMotion),
    schedulesExpanded: Boolean(input.schedulesExpanded),
    favorites,
    recentCalculators,
  };
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    sanitizePreferences(readStorageValue<UserPreferences>(storageKey, defaultPreferences)),
  );
  const [storageEnabled, setStorageEnabled] = useState(true);

  useEffect(() => {
    const saved = writeStorageValue(storageKey, preferences);
    setStorageEnabled((current) => (current === saved ? current : saved));
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.motion = preferences.reducedMotion ? 'reduced' : 'full';
    }
  }, [preferences]);

  const setCurrency = useCallback((currency: CurrencyCode) => {
    setPreferences((current) => (current.currency === currency ? current : { ...current, currency }));
  }, []);

  const setReducedMotion = useCallback((value: boolean) => {
    setPreferences((current) => (current.reducedMotion === value ? current : { ...current, reducedMotion: value }));
  }, []);

  const setSchedulesExpanded = useCallback((value: boolean) => {
    setPreferences((current) =>
      current.schedulesExpanded === value ? current : { ...current, schedulesExpanded: value },
    );
  }, []);

  const toggleFavorite = useCallback((slug: string) => {
    setPreferences((current) => {
      const favorites = current.favorites.includes(slug)
        ? current.favorites.filter((item) => item !== slug)
        : [...current.favorites, slug];

      if (
        favorites.length === current.favorites.length &&
        favorites.every((item, index) => item === current.favorites[index])
      ) {
        return current;
      }

      return { ...current, favorites };
    });
  }, []);

  const isFavorite = useCallback((slug: string) => preferences.favorites.includes(slug), [preferences.favorites]);

  const addRecentCalculator = useCallback((slug: string) => {
    setPreferences((current) => {
      if (current.recentCalculators[0] === slug) {
        return current;
      }

      const recentCalculators = [slug, ...current.recentCalculators.filter((item) => item !== slug)].slice(0, recentLimit);
      return { ...current, recentCalculators };
    });
  }, []);

  const clearRecentCalculators = useCallback(() => {
    setPreferences((current) => (current.recentCalculators.length ? { ...current, recentCalculators: [] } : current));
  }, []);

  const clearFavorites = useCallback(() => {
    setPreferences((current) => (current.favorites.length ? { ...current, favorites: [] } : current));
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      preferences,
      storageEnabled,
      setCurrency,
      setReducedMotion,
      setSchedulesExpanded,
      toggleFavorite,
      isFavorite,
      addRecentCalculator,
      clearRecentCalculators,
      clearFavorites,
    }),
    [
      addRecentCalculator,
      clearFavorites,
      clearRecentCalculators,
      isFavorite,
      preferences,
      setCurrency,
      setReducedMotion,
      setSchedulesExpanded,
      storageEnabled,
      toggleFavorite,
    ],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return context;
}
