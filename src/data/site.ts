import type { MetaDefinition, NavLinkItem } from '../types/financial';

export const mainNav: NavLinkItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Calculators', to: '/calculators' },
  { label: 'About', to: '/about' },
  { label: 'Support', to: '/support' },
];

export const footerNav: NavLinkItem[] = [
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Financial Disclaimer', to: '/financial-disclaimer' },
  { label: 'Support', to: '/support' },
];

export const pageMeta: Record<string, MetaDefinition> = {
  home: {
    title: 'Home',
    description: 'Use local-only financial calculators for income, debt, savings, mortgages, budgeting, and retirement planning.',
    path: '/',
  },
  directory: {
    title: 'Calculator Directory',
    description: 'Browse and search local-only financial calculators by category, use case, and related planning task.',
    path: '/calculators',
  },
  about: {
    title: 'About',
    description: 'Learn how this local-first calculator site works, what assumptions it uses, and what it does not do.',
    path: '/about',
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'Review the local-only privacy policy for browser-based calculations with no active analytics, ads, or payment services.',
    path: '/privacy-policy',
  },
  disclaimer: {
    title: 'Financial Disclaimer',
    description: 'Read the estimate-only financial disclaimer for calculators covering income, debt, savings, mortgages, and retirement planning.',
    path: '/financial-disclaimer',
  },
  support: {
    title: 'Support',
    description: 'Review current support scope, inactive future placeholders, and feedback expectations for the local-only calculator website.',
    path: '/support',
  },
  notFound: {
    title: 'Page Not Found',
    description: 'The requested page could not be found in the financial calculator website.',
    path: '/404',
  },
};
