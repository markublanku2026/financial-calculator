import type { ReactNode } from 'react';

export function SectionHeading({ title, eyebrow, aside }: { title: string; eyebrow?: string; aside?: ReactNode }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
      </div>
      {aside ? <div className="section-heading-aside">{aside}</div> : null}
    </div>
  );
}
