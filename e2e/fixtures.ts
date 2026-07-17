import { expect, test as base, type Locator, type Page } from 'playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

type AuditOptions = {
  allowConsoleErrors: boolean;
  allowPageErrors: boolean;
  allowExternalOrigins: string[];
};

type AuditState = {
  consoleErrors: string[];
  pageErrors: string[];
  observedOrigins: string[];
  externalOrigins: string[];
  failedAssets: string[];
};

const reviewDir = resolve(process.cwd(), 'playwright-review');
const screenshotsDir = resolve(reviewDir, 'screenshots');
const networkOriginsPath = resolve(reviewDir, 'network-origins.json');

function appendOrigins(origins: string[]) {
  mkdirSync(reviewDir, { recursive: true });
  let current: string[] = [];
  try {
    current = JSON.parse(readFileSync(networkOriginsPath, 'utf8')) as string[];
  } catch {
    current = [];
  }

  const merged = Array.from(new Set([...current, ...origins])).sort();
  writeFileSync(networkOriginsPath, `${JSON.stringify(merged, null, 2)}\n`);
}

export const test = base.extend<AuditOptions>({
  allowConsoleErrors: [false, { option: true }],
  allowPageErrors: [false, { option: true }],
  allowExternalOrigins: [[], { option: true }],
  page: async ({ page, baseURL, allowConsoleErrors, allowPageErrors, allowExternalOrigins }, use) => {
    const baseOrigin = new URL(baseURL ?? 'http://127.0.0.1:4173').origin;
    const auditState: AuditState = {
      consoleErrors: [],
      pageErrors: [],
      observedOrigins: [],
      externalOrigins: [],
      failedAssets: [],
    };

    page.on('console', (message) => {
      if (message.type() === 'error') {
        auditState.consoleErrors.push(message.text());
      }
    });

    page.on('pageerror', (error) => {
      auditState.pageErrors.push(error.message);
    });

    page.on('request', (request) => {
      const url = request.url();
      if (!/^https?:/i.test(url)) {
        return;
      }

      const origin = new URL(url).origin;
      auditState.observedOrigins.push(origin);
      if (origin !== baseOrigin) {
        auditState.externalOrigins.push(origin);
      }
    });

    page.on('response', (response) => {
      const url = response.url();
      if (!/^https?:/i.test(url)) {
        return;
      }

      const request = response.request();
      const origin = new URL(url).origin;
      if (origin === baseOrigin && request.resourceType() !== 'document' && response.status() >= 400) {
        auditState.failedAssets.push(`${response.status()} ${url}`);
      }
    });

    await use(page);

    appendOrigins(auditState.observedOrigins);

    const unexpectedExternalOrigins = auditState.externalOrigins.filter(
      (origin) => !allowExternalOrigins.includes(origin),
    );

    if (!allowConsoleErrors) {
      expect(auditState.consoleErrors, 'Unexpected console errors').toEqual([]);
    }
    if (!allowPageErrors) {
      expect(auditState.pageErrors, 'Unexpected unhandled page errors').toEqual([]);
    }

    expect(unexpectedExternalOrigins, 'Unexpected external request origins').toEqual([]);
    expect(auditState.failedAssets, 'Unexpected failed same-origin assets').toEqual([]);
  },
});

export { expect };

export async function expectSingleH1(page: Page) {
  await expect(page.locator('h1')).toHaveCount(1);
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    htmlScrollWidth: document.documentElement.scrollWidth,
    htmlClientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
    bodyClientWidth: document.body.clientWidth,
  }));

  expect(overflow.htmlScrollWidth <= overflow.htmlClientWidth + 1).toBe(true);
  expect(overflow.bodyScrollWidth <= overflow.bodyClientWidth + 1).toBe(true);
}

export async function expectVisibleFocus(locator: Locator) {
  const focusVisible = await locator.evaluate((element) => {
    const styles = window.getComputedStyle(element);
    return styles.outlineStyle !== 'none' || styles.boxShadow !== 'none';
  });

  expect(focusVisible).toBe(true);
}

export async function mockClipboard(page: Page, mode: 'success' | 'reject' | 'missing' = 'success') {
  await page.addInitScript((clipboardMode) => {
    (window as Window & { __clipboardWrites?: string[] }).__clipboardWrites = [];

    if (clipboardMode === 'missing') {
      Object.defineProperty(window.navigator, 'clipboard', {
        configurable: true,
        value: undefined,
      });
      return;
    }

    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (text: string) => {
          (window as Window & { __clipboardWrites?: string[] }).__clipboardWrites?.push(text);
          if (clipboardMode === 'reject') {
            return Promise.reject(new Error('clipboard rejected'));
          }
          return Promise.resolve();
        },
      },
    });
  }, mode);
}

export async function readClipboardWrites(page: Page) {
  return page.evaluate(() => (window as Window & { __clipboardWrites?: string[] }).__clipboardWrites ?? []);
}

export async function assertOnlyPreferenceStorage(page: Page) {
  const storage = await page.evaluate(() => {
    const result: Record<string, string> = {};
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key) {
        result[key] = window.localStorage.getItem(key) ?? '';
      }
    }
    return result;
  });

  expect(Object.keys(storage)).toEqual(Object.keys(storage).length ? ['financial-calculator-preferences'] : []);

  const serialized = JSON.stringify(storage);
  const prohibitedSnippets = [
    'hourlyRate',
    'annualSalary',
    'loanAmount',
    'interestRate',
    'homePrice',
    'balance',
    'monthlyContribution',
    'remainingCash',
    'projectedNominalBalance',
    'http://',
    'https://',
    'Result copied.',
    'Share link copied.',
  ];

  for (const snippet of prohibitedSnippets) {
    expect(serialized).not.toContain(snippet);
  }

  return storage;
}

export async function saveReviewScreenshot(page: Page, name: string) {
  mkdirSync(screenshotsDir, { recursive: true });
  const path = resolve(screenshotsDir, name);
  await page.screenshot({ path, fullPage: true });
  return path;
}
