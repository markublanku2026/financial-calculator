import { useEffect } from 'react';

import { siteOrigin } from './env';
import type { MetaDefinition } from '../types/financial';

const defaultTitle = 'Financial Calculator Hub';
const structuredDataId = 'structured-data';

function buildCanonicalUrl(path: string): string {
  return new URL(path, siteOrigin.endsWith('/') ? siteOrigin : `${siteOrigin}/`).toString();
}

export function useDocumentMeta(
  meta: MetaDefinition,
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>,
): void {
  useEffect(() => {
    document.title = `${meta.title} | ${defaultTitle}`;

    let descriptionTag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!descriptionTag) {
      descriptionTag = document.createElement('meta');
      descriptionTag.name = 'description';
      document.head.appendChild(descriptionTag);
    }
    descriptionTag.content = meta.description;

    let canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = buildCanonicalUrl(meta.path);

    const previousStructuredData = document.getElementById(structuredDataId);
    if (previousStructuredData) {
      previousStructuredData.remove();
    }

    if (structuredData) {
      const script = document.createElement('script');
      script.id = structuredDataId;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    return () => {
      const currentStructuredData = document.getElementById(structuredDataId);
      if (currentStructuredData) {
        currentStructuredData.remove();
      }
    };
  }, [meta.description, meta.path, meta.title, structuredData]);
}
