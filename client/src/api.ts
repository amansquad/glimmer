import type { Graph, Note } from "./types";

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  listNotes: () => request<Note[]>("/notes"),
  getGraph: () => request<Graph>("/graph"),
  getNote: (id: string) => request<Note>(`/notes/${id}`),
  createNote: (title: string, content: string) =>
    request<Note>("/notes", { method: "POST", body: JSON.stringify({ title, content }) }),
  updateNote: (id: string, title: string, content: string) =>
    request<Note>(`/notes/${id}`, { method: "PUT", body: JSON.stringify({ title, content }) }),
  deleteNote: (id: string) => request<void>(`/notes/${id}`, { method: "DELETE" }),
  exportNotes: () => request<Note[]>("/export"),
  importNotes: (notes: { title: string; content: string }[]) =>
    request<{ imported: number }>("/import", { method: "POST", body: JSON.stringify({ notes }) }),
};
