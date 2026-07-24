import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";
import { StarMap } from "./StarMap";
import { NoteEditor } from "./NoteEditor";
import { FadingStars } from "./FadingStars";
import { TagLegend } from "./TagLegend";
import type { Graph, GraphNode, Note } from "./types";

export default function App() {
  const [graph, setGraph] = useState<Graph>({ nodes: [], edges: [] });
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const refreshGraph = useCallback(() => {
    api.getGraph().then(setGraph).catch(console.error);
  }, []);

  useEffect(() => {
    refreshGraph();
  }, [refreshGraph]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
      if (e.key === "Escape" && !isTyping) {
        setSelectedNote(null);
      } else if (e.key === "/" && !isTyping) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  const handleTagClick = useCallback((tag: string) => {
    setSearchQuery(tag);
  }, []);

  const realNodes = graph.nodes.filter((n) => !n.ghost);
  const ghostCount = graph.nodes.length - realNodes.length;
  const fadingCount = realNodes.filter((n) => n.brightness < 0.5).length;

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
    if (!window.confirm(`Delete "${selectedNote.title}"? This can't be undone.`)) return;
    await api.deleteNote(selectedNote.id);
    setSelectedNote(null);
    refreshGraph();
  };

  const handleExport = async () => {
    const notes = await api.exportNotes();
    const blob = new Blob([JSON.stringify(notes, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "glimmer-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    const text = await file.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      window.alert("That file isn't valid JSON.");
      return;
    }
    if (!Array.isArray(parsed)) {
      window.alert("Expected a JSON array of notes (as produced by Export).");
      return;
    }
    const notes = parsed
      .filter((n): n is { title: string; content?: string } => typeof n?.title === "string")
      .map((n) => ({ title: n.title, content: n.content ?? "" }));
    await api.importNotes(notes);
    refreshGraph();
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>✦ Glimmer</h1>
        <p>Your notes, as a night sky. Revisit a star to keep it burning.</p>
        {realNodes.length > 0 && (
          <p className="sky-stats">
            {realNodes.length} star{realNodes.length === 1 ? "" : "s"}
            {fadingCount > 0 && ` · ${fadingCount} fading`}
            {ghostCount > 0 && ` · ${ghostCount} unborn`}
          </p>
        )}
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
          <div className="header-right">
            <div className="search-wrap">
              <input
                ref={searchInputRef}
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search titles and #tags... (press /)"
              />
              {searchQuery && (
                <button className="clear-search" onClick={() => setSearchQuery("")} title="Clear search">
                  ×
                </button>
              )}
            </div>
            <button onClick={handleExport} title="Download all notes as JSON">
              Export
            </button>
            <button onClick={() => importInputRef.current?.click()} title="Import notes from a JSON file">
              Import
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json"
              className="hidden-file-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportFile(file);
                e.target.value = "";
              }}
            />
          </div>
        </div>
      </header>
      <FadingStars graph={graph} onOpen={handleJumpTo} />
      <TagLegend graph={graph} activeQuery={searchQuery} onTagClick={setSearchQuery} />
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
          onTagClick={handleTagClick}
        />
      </main>
    </div>
  );
}
