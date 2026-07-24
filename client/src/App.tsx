import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";
import { StarMap } from "./StarMap";
import { NoteEditor } from "./NoteEditor";
import { FadingStars } from "./FadingStars";
import { TagLegend } from "./TagLegend";
import { InfoButton } from "./InfoButton";
import { SettingsPanel } from "./SettingsPanel";
import type { Graph, GraphNode, Note } from "./types";

export default function App() {
  const [graph, setGraph] = useState<Graph>({ nodes: [], edges: [] });
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showWakingHint, setShowWakingHint] = useState(false);
  const [halfLifeDays, setHalfLifeDays] = useState(10);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  function describeError(err: unknown): string {
    if (err instanceof TypeError) {
      return "Can't reach the Glimmer API. Is the backend running and is VITE_API_BASE_URL set correctly?";
    }
    return err instanceof Error ? err.message : "Something went wrong.";
  }

  const refreshGraph = useCallback(() => {
    api
      .getGraph()
      .then(setGraph)
      .catch((err) => setErrorMessage(describeError(err)));
  }, []);

  useEffect(() => {
    // Render's free tier spins down after inactivity; the first request after
    // a while can take up to ~50s to wake it. Give the user a reason to wait
    // instead of staring at an empty sky.
    const wakingTimer = window.setTimeout(() => setShowWakingHint(true), 3000);
    api
      .getGraph()
      .then(setGraph)
      .catch((err) => setErrorMessage(describeError(err)))
      .finally(() => {
        setIsInitialLoading(false);
        window.clearTimeout(wakingTimer);
      });
    return () => window.clearTimeout(wakingTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    api
      .getSettings()
      .then((s) => setHalfLifeDays(s.halfLifeDays))
      .catch(() => {
        /* fall back to the default half-life silently — not worth an error banner */
      });
  }, []);

  const handleHalfLifeSaved = useCallback(
    (newHalfLifeDays: number) => {
      setHalfLifeDays(newHalfLifeDays);
      refreshGraph();
    },
    [refreshGraph]
  );

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
    api
      .getNote(id)
      .then(setSelectedNote)
      .catch((err) => setErrorMessage(describeError(err)));
  }, []);

  const handleSelectNode = useCallback(
    (node: GraphNode) => {
      if (node.ghost) {
        api
          .createNote(node.title, "")
          .then((note) => {
            refreshGraph();
            setSelectedNote(note);
          })
          .catch((err) => setErrorMessage(describeError(err)));
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
    setErrorMessage(null);
    try {
      const note = await api.createNote(newTitle.trim(), "");
      setNewTitle("");
      refreshGraph();
      setSelectedNote(note);
    } catch (err) {
      setErrorMessage(describeError(err));
    }
  };

  const handleSave = async (title: string, content: string) => {
    if (!selectedNote) return;
    setErrorMessage(null);
    try {
      const updated = await api.updateNote(selectedNote.id, title, content);
      setSelectedNote(updated);
      refreshGraph();
    } catch (err) {
      setErrorMessage(describeError(err));
    }
  };

  const handleDelete = async () => {
    if (!selectedNote) return;
    if (!window.confirm(`Delete "${selectedNote.title}"? This can't be undone.`)) return;
    setErrorMessage(null);
    try {
      await api.deleteNote(selectedNote.id);
      setSelectedNote(null);
      refreshGraph();
    } catch (err) {
      setErrorMessage(describeError(err));
    }
  };

  const handleExport = async () => {
    setErrorMessage(null);
    try {
      const notes = await api.exportNotes();
      const blob = new Blob([JSON.stringify(notes, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "glimmer-export.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setErrorMessage(describeError(err));
    }
  };

  const handleImportFile = async (file: File) => {
    setErrorMessage(null);
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
    try {
      await api.importNotes(notes);
      refreshGraph();
    } catch (err) {
      setErrorMessage(describeError(err));
    }
  };

  return (
    <div className="app">
      {errorMessage && (
        <div className="error-banner">
          {errorMessage}
          <button className="icon-button" onClick={() => setErrorMessage(null)} title="Dismiss">
            ×
          </button>
        </div>
      )}
      <header className="app-header">
        <div className="title-row">
          <h1>✦ Glimmer</h1>
          <InfoButton />
          <SettingsPanel halfLifeDays={halfLifeDays} onHalfLifeSaved={handleHalfLifeSaved} />
        </div>
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
        {isInitialLoading ? (
          <div className="loading-sky">
            <div className="loading-spinner" />
            <p>
              {showWakingHint
                ? "Waking up the sky… the free-tier backend can take up to a minute to start."
                : "Loading your sky…"}
            </p>
          </div>
        ) : (
          <StarMap
            graph={graph}
            selectedId={selectedNote?.id ?? null}
            searchQuery={searchQuery}
            onSelect={handleSelectNode}
          />
        )}
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
