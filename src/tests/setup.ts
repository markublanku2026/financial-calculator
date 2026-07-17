import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

import { installStorageMock } from './renderWithApp';

beforeEach(() => {
  installStorageMock();
  vi.restoreAllMocks();
});

afterEach(() => {
  cleanup();
});
