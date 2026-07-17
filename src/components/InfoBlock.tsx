import { Link } from 'react-router-dom';

import type { ExampleItem, FAQItem, RelatedLink } from '../types/financial';
import { InfoNotice } from './InfoNotice';

type InfoBlockProps = {
  formula: string;
  explanation: string;
  example: ExampleItem;
  faqs: FAQItem[];
  related: RelatedLink[];
  disclaimer: string;
};

export function InfoBlock({ formula, explanation, example, faqs, related, disclaimer }: InfoBlockProps) {
  return (
    <div className="content-stack">
      <section className="card">
        <h2>Formula</h2>
        <p className="formula">{formula}</p>
        <p>{explanation}</p>
      </section>
      <section className="card">
        <h2>Worked Example</h2>
        <h3>{example.title}</h3>
        <p>{example.description}</p>
      </section>
      <section className="card">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-list">
          {faqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="card">
        <h2>Related Calculators</h2>
        <ul className="link-list">
          {related.map((item) => (
            <li key={item.to}>
              <Link to={item.to}>{item.label}</Link>
            </li>
          ))}
        </ul>
      </section>
      <InfoNotice tone="warning" title="Estimate disclaimer">
        {disclaimer}
      </InfoNotice>
    </div>
  );
}
