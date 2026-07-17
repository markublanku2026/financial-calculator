import { siteOrigin } from './env';
import type { FAQItem } from '../types/financial';

function absoluteUrl(path: string): string {
  return new URL(path, siteOrigin.endsWith('/') ? siteOrigin : `${siteOrigin}/`).toString();
}

export function buildWebPageStructuredData(title: string, description: string, path: string, type = 'WebPage') {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    name: title,
    description,
    url: absoluteUrl(path),
  };
}

export function buildCalculatorStructuredData(
  title: string,
  description: string,
  path: string,
  faqs: FAQItem[],
): Array<Record<string, unknown>> {
  return [
    buildWebPageStructuredData(title, description, path, 'WebPage'),
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    },
  ];
}
