import { getHighlightedText } from '../utils/search';

export function HighlightedText({ text, query }: { text: string; query: string }) {
  return (
    <>
      {getHighlightedText(text, query).map((part, index) =>
        part.match ? <mark key={`${part.text}-${index}`}>{part.text}</mark> : <span key={`${part.text}-${index}`}>{part.text}</span>,
      )}
    </>
  );
}
