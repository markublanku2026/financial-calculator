import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';

import { PreferencesProvider } from '../context/PreferencesContext';

type StorageMock = ReturnType<typeof createStorageMock>;

type RenderOptions = {
  route?: string;
  storage?: StorageMock;
  blockedStorage?: boolean;
};

export function createStorageMock(initial: Record<string, string> = {}) {
  let store = { ...initial };
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
    dump: () => ({ ...store }),
  };
}

export function installStorageMock(mock = createStorageMock()) {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: mock,
  });
  return mock;
}

export function installBlockedStorageMock() {
  const blocked = {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('blocked');
    },
    removeItem: () => {
      throw new Error('blocked');
    },
    clear: () => {
      throw new Error('blocked');
    },
    key: () => {
      throw new Error('blocked');
    },
    length: 0,
  };

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: blocked,
  });
}

export function renderWithApp(ui: ReactElement, options: RenderOptions = {}) {
  const { route = '/', storage = createStorageMock(), blockedStorage = false } = options;
  if (blockedStorage) {
    installBlockedStorageMock();
  } else {
    installStorageMock(storage);
  }
  window.history.pushState({}, 'Test', route);
  return {
    storage,
    ...render(
      <PreferencesProvider>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </PreferencesProvider>,
    ),
  };
}
