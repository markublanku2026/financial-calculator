import { usePreferences } from '../context/PreferencesContext';

export function FavoriteButton({ slug, title }: { slug: string; title: string }) {
  const { isFavorite, toggleFavorite } = usePreferences();
  const favorite = isFavorite(slug);
  return (
    <button
      type="button"
      className={`favorite-button ${favorite ? 'favorite-button-active' : ''}`}
      aria-pressed={favorite}
      onClick={() => toggleFavorite(slug)}
    >
      {favorite ? 'Remove favorite' : 'Add favorite'}
      <span className="sr-only"> {title}</span>
    </button>
  );
}
