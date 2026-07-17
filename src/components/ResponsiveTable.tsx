import type { ReactNode } from 'react';

type ResponsiveTableProps = {
  title: string;
  headers: string[];
  rows: ReactNode[][];
};

export function ResponsiveTable({ title, headers, rows }: ResponsiveTableProps) {
  return (
    <section className="table-panel">
      <h3>{title}</h3>
      <div className="table-scroll">
        <table>
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header} scope="col">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${title}-${rowIndex + 1}`}>
                {row.map((cell, cellIndex) => (
                  <td data-label={headers[cellIndex]} key={`${title}-${rowIndex + 1}-${cellIndex + 1}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
