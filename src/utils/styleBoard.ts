export type StyleCategory = 'all' | 'classic' | 'bold' | 'stylized';

export interface PaletteSwatch {
  hex: string;
  role: string;
}

export interface StyleDirection {
  id: string;
  number: string;
  slug: string;
  title: string;
  category: Exclude<StyleCategory, 'all'>;
  lineage: string;
  imageSrc: string;
  imageAlt: string;
  rule: string;
  mood: string;
  shape: string;
  colorSummary: string;
  webglNotes: string;
  pros: string[];
  cons: string[];
  palette: PaletteSwatch[];
}

export function filterDirections(
  directions: StyleDirection[],
  category: StyleCategory
): StyleDirection[] {
  if (category === 'all') return directions;
  return directions.filter((d) => d.category === category);
}

export function toggleLikedId(likedIds: string[], id: string): string[] {
  return likedIds.includes(id)
    ? likedIds.filter((item) => item !== id)
    : [...likedIds, id];
}

export function buildSelectionSummary(
  directions: StyleDirection[],
  selectedId: string | null,
  likedIds: string[],
  note: string
): string {
  const selected = directions.find((d) => d.id === selectedId);
  const likedTitles = directions
    .filter((d) => likedIds.includes(d.id) && d.id !== selectedId)
    .map((d) => `«${d.title}» (${d.number})`);

  const parts: string[] = [];
  if (selected) {
    parts.push(`Выбираю стиль ${selected.number}: «${selected.title}»`);
  } else if (likedTitles.length > 0) {
    parts.push(`Нравятся направления: ${likedTitles.join(', ')}`);
  } else {
    parts.push('Пока не выбрано основное направление');
  }

  if (selected && likedTitles.length > 0) {
    parts.push(`Также нравятся элементы из: ${likedTitles.join(', ')}`);
  }
  const trimmedNote = note.trim();
  if (trimmedNote) {
    parts.push(`Пожелание: ${trimmedNote}`);
  }
  return parts.join('. ');
}
