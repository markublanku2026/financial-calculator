import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export default async function globalSetup() {
  const reviewDir = resolve(process.cwd(), 'playwright-review');
  const screenshotsDir = resolve(reviewDir, 'screenshots');
  rmSync(reviewDir, { recursive: true, force: true });
  mkdirSync(screenshotsDir, { recursive: true });
  writeFileSync(resolve(reviewDir, 'network-origins.json'), '[]\n');
}
