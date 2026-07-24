import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import { StarMap } from "./StarMap";
import { NoteEditor } from "./NoteEditor";
import type { Graph, GraphNode, Note } from "./types";

export default function App() {
  const [graph, setGraph] = useState<Graph>({ nodes: [], edges: [] });
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const refreshGraph = useCallback(() => {
    api.getGraph().then(setGraph).catch(console.error);
  }, []);

  useEffect(() => {
    refreshGraph();
  }, [refreshGraph]);

  const openRealNote = useCallback((id: string) => {
    api.getNote(id).then(setSelectedNote).catch(console.error);
  }, []);

  const handleSelectNode = useCallback(
    (node: GraphNode) => {
      if (node.ghost) {
        api.createNote(node.title, "").then((note) => {
          refreshGraph();
          setSelectedNote(note);
        });
      } else {
        openRealNote(node.id);
      }
    },
    [openRealNote, refreshGraph]
  );

  const handleJumpTo = useCallback(
    (id: string) => {
      const node = graph.nodes.find((n) => n.id === id);
      if (node) handleSelectNode(node);
    },
    [graph.nodes, handleSelectNode]
  );

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const note = await api.createNote(newTitle.trim(), "");
    setNewTitle("");
    refreshGraph();
    setSelectedNote(note);
  };

  const handleSave = async (title: string, content: string) => {
    if (!selectedNote) return;
    const updated = await api.updateNote(selectedNote.id, title, content);
    setSelectedNote(updated);
    refreshGraph();
  };

  const handleDelete = async () => {
    if (!selectedNote) return;
    await api.deleteNote(selectedNote.id);
    setSelectedNote(null);
    refreshGraph();
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>✦ Glimmer</h1>
        <p>Your notes, as a night sky. Revisit a star to keep it burning.</p>
        <div className="header-controls">
          <div className="new-note">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="New note title..."
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <button className="primary" onClick={handleCreate}>
              + New star
            </button>
          </div>
          <input
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search titles and #tags..."
          />
        </div>
      </header>
      <main className="app-main">
        <StarMap
          graph={graph}
          selectedId={selectedNote?.id ?? null}
          searchQuery={searchQuery}
          onSelect={handleSelectNode}
        />
        <NoteEditor
          note={selectedNote}
          graph={graph}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setSelectedNote(null)}
          onJumpTo={handleJumpTo}
        />
      </main>
    </div>
  );
}
