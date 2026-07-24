import { useEffect, useMemo, useState } from "react";
import type { Graph, Note } from "./types";
import { colorForTag } from "./colors";
import { renderMarkdownLite } from "./markdown";

interface Props {
  note: Note | null;
  graph: Graph;
  onSave: (title: string, content: string) => void;
  onDelete: () => void;
  onClose: () => void;
  onJumpTo: (id: string) => void;
  onTagClick: (tag: string) => void;
}

interface RelatedNote {
  id: string;
  title: string;
  ghost: boolean;
}

export function NoteEditor({ note, graph, onSave, onDelete, onClose, onJumpTo, onTagClick }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mode, setMode] = useState<"write" | "preview">("preview");

  useEffect(() => {
    setTitle(note?.title ?? "");
    setContent(note?.content ?? "");
    setMode(note?.content ? "preview" : "write");
  }, [note]);

  const nodeIdByLowerTitle = useMemo(() => {
    const map = new Map<string, string>();
    for (const n of graph.nodes) map.set(n.title.trim().toLowerCase(), n.id);
    return map;
  }, [graph.nodes]);

  const isDuplicateTitle = useMemo(() => {
    const lowerTitle = title.trim().toLowerCase();
    if (!lowerTitle) return false;
    return graph.nodes.some(
      (n) => !n.ghost && n.id !== note?.id && n.title.trim().toLowerCase() === lowerTitle
    );
  }, [title, graph.nodes, note?.id]);

  const related = useMemo<{ backlinks: RelatedNote[]; outlinks: RelatedNote[] }>(() => {
    if (!note) return { backlinks: [], outlinks: [] };
    const nodesById = new Map(graph.nodes.map((n) => [n.id, n]));
    const backlinks: RelatedNote[] = [];
    const outlinks: RelatedNote[] = [];

    for (const edge of graph.edges) {
      if (edge.target === note.id) {
        const other = nodesById.get(edge.source);
        if (other) backlinks.push({ id: other.id, title: other.title, ghost: other.ghost });
      } else if (edge.source === note.id) {
        const other = nodesById.get(edge.target);
        if (other) outlinks.push({ id: other.id, title: other.title, ghost: other.ghost });
      }
    }
    return { backlinks, outlinks };
  }, [note, graph]);

  if (!note) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onSave(title, content);
      setMode("preview");
    }
  };

  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const linkTitle = target.dataset.linkTitle;
    const tag = target.dataset.tag;
    if (linkTitle) {
      const id = nodeIdByLowerTitle.get(linkTitle.toLowerCase());
      if (id) onJumpTo(id);
    } else if (tag) {
      onTagClick(tag);
    }
  };

  return (
    <div className="editor-panel">
      <div className="editor-header">
        <input
          className="title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
        />
        <button className="icon-button" onClick={onClose} title="Close">
          ×
        </button>
      </div>

      {isDuplicateTitle && (
        <div className="duplicate-warning">
          Another note already has this title — [[links]] to it may resolve to the wrong one.
        </div>
      )}

      {note.tags.length > 0 && (
        <div className="tag-row">
          {note.tags.map((tag) => (
            <button
              key={tag}
              className="tag-chip"
              style={{ borderColor: colorForTag(tag) }}
              onClick={() => onTagClick(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      <div className="mode-tabs">
        <button className={mode === "write" ? "active" : ""} onClick={() => setMode("write")}>
          Write
        </button>
        <button className={mode === "preview" ? "active" : ""} onClick={() => setMode("preview")}>
          Preview
        </button>
      </div>

      {mode === "write" ? (
        <textarea
          className="content-input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write your note. Link with [[Note Title]], tag with #topic. Ctrl+Enter to save."
          autoFocus
        />
      ) : (
        <div
          className="content-preview"
          onClick={handlePreviewClick}
          dangerouslySetInnerHTML={{
            __html: content.trim() ? renderMarkdownLite(content) : "<em>Nothing here yet — switch to Write.</em>",
          }}
        />
      )}

      {(related.outlinks.length > 0 || related.backlinks.length > 0) && (
        <div className="related-notes">
          {related.outlinks.length > 0 && (
            <div className="related-group">
              <span className="related-label">Links to</span>
              {related.outlinks.map((n) => (
                <button
                  key={n.id}
                  className={`related-chip ${n.ghost ? "ghost" : ""}`}
                  onClick={() => onJumpTo(n.id)}
                >
                  {n.ghost ? `+ ${n.title}` : n.title}
                </button>
              ))}
            </div>
          )}
          {related.backlinks.length > 0 && (
            <div className="related-group">
              <span className="related-label">Linked from</span>
              {related.backlinks.map((n) => (
                <button key={n.id} className="related-chip" onClick={() => onJumpTo(n.id)}>
                  {n.title}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="editor-footer">
        <span className="brightness-label">
          brightness {(note.brightness * 100).toFixed(0)}%
        </span>
        <div className="editor-actions">
          <button className="danger" onClick={onDelete}>
            Delete
          </button>
          <button
            className="primary"
            onClick={() => {
              onSave(title, content);
              setMode("preview");
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
