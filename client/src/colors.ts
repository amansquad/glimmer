// Deterministic hue per tag so the same tag always lights the same color across sessions.
export function colorForTag(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 70%)`;
}

export const DEFAULT_STAR_COLOR = "#fdf6e3";
