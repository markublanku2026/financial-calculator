import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { seoRoutes } from './seo-routes.mjs';

const configuredOrigin = process.env.VITE_SITE_ORIGIN?.trim();
const origin = (configuredOrigin || 'https://example.invalid').replace(/\/$/, '');
const publicDir = resolve(process.cwd(), 'public');
mkdirSync(publicDir, { recursive: true });

const robots = ['User-agent: *', 'Allow: /', '', 'Sitemap: /sitemap.xml', ''].join('\n');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${seoRoutes
  .map((route) => `  <url><loc>${new URL(route, `${origin}/`).toString()}</loc></url>`)
  .join('\n')}\n</urlset>\n`;

writeFileSync(resolve(publicDir, 'robots.txt'), robots);
writeFileSync(resolve(publicDir, 'sitemap.xml'), sitemap);
