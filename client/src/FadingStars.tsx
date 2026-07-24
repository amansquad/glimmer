import type { Graph } from "./types";

interface Props {
  graph: Graph;
  onOpen: (id: string) => void;
}

const FADE_THRESHOLD = 0.5;
const MAX_SHOWN = 6;

export function FadingStars({ graph, onOpen }: Props) {
  const dimming = graph.nodes
    .filter((n) => !n.ghost && n.brightness < FADE_THRESHOLD)
    .sort((a, b) => a.brightness - b.brightness)
    .slice(0, MAX_SHOWN);

  if (dimming.length === 0) return null;

  return (
    <div className="fading-strip">
      <span className="fading-label">Fading — revisit to keep lit</span>
      {dimming.map((n) => (
        <button
          key={n.id}
          className="fading-chip"
          style={{ opacity: 0.45 + n.brightness * 0.55 }}
          onClick={() => onOpen(n.id)}
        >
          {n.title} · {(n.brightness * 100).toFixed(0)}%
        </button>
      ))}
    </div>
  );
}
