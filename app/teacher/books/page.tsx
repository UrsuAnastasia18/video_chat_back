"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

interface Level { id: string; code: string; title: string; }
interface Book {
  id: string; title: string; description: string | null; author: string | null;
  resourceUrl: string; coverImageUrl: string | null; isActive: boolean; level: Level;
}
type ActiveFilter = "all" | "active" | "inactive";
interface BookFormState {
  title: string; description: string; author: string; levelId: string;
  resourceUrl: string; coverImageUrl: string; isActive: boolean;
}

const EMPTY_FORM: BookFormState = {
  title: "", description: "", author: "", levelId: "",
  resourceUrl: "/manuals/worksheets-grammar.pdf", coverImageUrl: "", isActive: true,
};

function InputField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748b" }}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  background: "#f8fafc", border: "1.5px solid #e2e8f0",
  color: "#1e293b", borderRadius: "0.75rem", padding: "10px 14px",
  fontSize: "0.875rem", outline: "none", width: "100%", transition: "all 0.15s",
};

const premiumSurfaceStyle = {
  background: "linear-gradient(135deg, #1e2d40 0%, #243650 55%, #1a3a5c 100%)",
};

const panelStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  boxShadow: "0 10px 26px rgba(30,45,64,0.08)",
};

export default function TeacherBooksPage() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [form, setForm] = useState<BookFormState>(EMPTY_FORM);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const activeQuery = useMemo(() => {
    if (activeFilter === "active") return "true";
    if (activeFilter === "inactive") return "false";
    return null;
  }, [activeFilter]);

  const loadBooks = async (filters?: { levelId?: string; isActive?: string | null }) => {
    const query = new URLSearchParams();
    if (filters?.levelId && filters.levelId !== "all") query.set("levelId", filters.levelId);
    if (filters?.isActive === "true" || filters?.isActive === "false") query.set("isActive", filters.isActive);
    const res = await fetch(`/api/books${query.toString() ? `?${query}` : ""}`);
    const payload = (await res.json()) as { books?: Book[]; error?: string };
    if (!res.ok) throw new Error(payload.error ?? "Failed to load books");
    setBooks(payload.books ?? []);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      try {
        const [levelsRes, booksRes] = await Promise.all([fetch("/api/levels"), fetch("/api/books")]);
        const lp = (await levelsRes.json()) as { levels?: Level[]; error?: string };
        const bp = (await booksRes.json()) as { books?: Book[]; error?: string };
        if (!levelsRes.ok) throw new Error(lp.error ?? "Failed to load levels");
        if (!booksRes.ok) throw new Error(bp.error ?? "Failed to load books");
        const fl = lp.levels ?? [];
        setLevels(fl);
        setBooks(bp.books ?? []);
        setForm((p) => ({ ...p, levelId: p.levelId || fl[0]?.id || "" }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (loading) return;
    loadBooks({ levelId: levelFilter, isActive: activeQuery }).catch((err) => {
      setError(err instanceof Error ? err.message : "Failed to filter books");
    });
  }, [levelFilter, activeQuery, loading]);

  const resetForm = () => {
    setForm((p) => ({ ...EMPTY_FORM, levelId: levels[0]?.id || p.levelId }));
    setEditingBookId(null);
    setFormOpen(false);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const body = {
        title: form.title, description: form.description || null,
        author: form.author || null, levelId: form.levelId,
        resourceUrl: form.resourceUrl, coverImageUrl: form.coverImageUrl || null,
        ...(editingBookId ? { isActive: form.isActive } : {}),
      };
      const res = await fetch(editingBookId ? `/api/books/${editingBookId}` : "/api/books", {
        method: editingBookId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? "Failed to save book");
      await loadBooks({ levelId: levelFilter, isActive: activeQuery });
      setSuccess(editingBookId ? "Book updated successfully." : "Book created successfully.");
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save book");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (book: Book) => {
    setEditingBookId(book.id);
    setForm({
      title: book.title, description: book.description ?? "", author: book.author ?? "",
      levelId: book.level.id, resourceUrl: book.resourceUrl, coverImageUrl: book.coverImageUrl ?? "", isActive: book.isActive
    });
    setSuccess(null); setError(null); setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeactivate = async (bookId: string) => {
    setError(null); setSuccess(null);
    try {
      const res = await fetch(`/api/books/${bookId}`, { method: "DELETE" });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? "Failed to deactivate book");
      await loadBooks({ levelId: levelFilter, isActive: activeQuery });
      setSuccess("Book deactivated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate book");
    }
  };

  return (
    <section className="flex size-full flex-col gap-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl px-6 py-6 text-white" style={premiumSurfaceStyle}>
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 48px)," +
              "repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 48px)",
          }}
        />
        <div
          className="absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-[0.08]"
          style={{ background: "radial-gradient(circle, #4f8ef7 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-10 left-1/3 h-36 w-36 rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #818cf8 0%, transparent 70%)" }}
        />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight">Books</h1>
            <p className="mt-1 text-sm text-white/70">Manage PDF books by English level.</p>
          </div>
          <button
            onClick={() => { resetForm(); setFormOpen(true); }}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-1 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ boxShadow: "0 4px 14px rgba(79,142,247,0.3)" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Book
          </button>
        </div>
      </div>

      {/* Feedback */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
          </svg>
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          {success}
        </div>
      )}

      {/* Add / Edit form */}
      {formOpen && (
        <div className="rounded-2xl p-6" style={panelStyle}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold" style={{ color: "#1e293b" }}>
              {editingBookId ? "Edit Book" : "Add New Book"}
            </h2>
            <button onClick={resetForm} className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors" style={{ color: "#94a3b8" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f1f5f9" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "" }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="md:col-span-2">
              <InputField label="Title" required>
                <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  style={inputStyle} required placeholder="e.g. English Grammar in Use" />
              </InputField>
            </div>

            <InputField label="Author">
              <input value={form.author} onChange={(e) => setForm((p) => ({ ...p, author: e.target.value }))}
                style={inputStyle} placeholder="e.g. Raymond Murphy" />
            </InputField>

            <InputField label="Level" required>
              <div className="relative">
                <select value={form.levelId} onChange={(e) => setForm((p) => ({ ...p, levelId: e.target.value }))}
                  style={{ ...inputStyle, appearance: "none", paddingRight: "36px" }} required>
                  {levels.map((l) => <option key={l.id} value={l.id}>{l.code} — {l.title}</option>)}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "#94a3b8" }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </InputField>

            <div className="md:col-span-2">
              <InputField label="Resource URL (PDF)" required>
                <input value={form.resourceUrl} onChange={(e) => setForm((p) => ({ ...p, resourceUrl: e.target.value }))}
                  style={inputStyle} required placeholder="/manuals/book.pdf" />
              </InputField>
            </div>

            <div className="md:col-span-2">
              <InputField label="Cover Image URL">
                <input value={form.coverImageUrl} onChange={(e) => setForm((p) => ({ ...p, coverImageUrl: e.target.value }))}
                  style={inputStyle} placeholder="https://..." />
              </InputField>
            </div>

            <div className="md:col-span-2">
              <InputField label="Description">
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  style={{ ...inputStyle, minHeight: "90px", resize: "vertical" }}
                  placeholder="Brief description of this book..." />
              </InputField>
            </div>

            {editingBookId && (
              <div className="flex items-center gap-2.5 md:col-span-2">
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all"
                  style={form.isActive
                    ? { background: "rgba(16,185,129,0.1)", color: "#059669", border: "1px solid rgba(16,185,129,0.2)" }
                    : { background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}
                >
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${form.isActive ? "border-emerald-500 bg-emerald-500" : "border-slate-300"}`}>
                    {form.isActive && <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                  </div>
                  {form.isActive ? "Active" : "Inactive"}
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "#4f8ef7", boxShadow: "0 4px 12px rgba(79,142,247,0.25)" }}
              >
                {submitting ? (
                  <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Saving...</>
                ) : editingBookId ? "Update Book" : "Create Book"}
              </button>
              <button type="button" onClick={resetForm}
                className="rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
                style={{ color: "#64748b" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f1f5f9" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "" }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Books list */}
      <div className="overflow-hidden rounded-2xl" style={panelStyle}>
        {/* Filters header */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-50/80 px-5 py-4" style={{ borderBottom: "1px solid #e2e8f0" }}>
          <h2 className="mr-auto text-base font-bold" style={{ color: "#1e293b" }}>Library</h2>

          <div className="relative">
            <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}
              className="appearance-none rounded-xl py-2 pl-3 pr-8 text-sm outline-none"
              style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#475569" }}>
              <option value="all">All levels</option>
              {levels.map((l) => <option key={l.id} value={l.id}>{l.code} — {l.title}</option>)}
            </select>
            <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "#94a3b8" }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>

          <div className="relative">
            <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as ActiveFilter)}
              className="appearance-none rounded-xl py-2 pl-3 pr-8 text-sm outline-none"
              style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#475569" }}>
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "#94a3b8" }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl" style={{ background: "#f1f5f9" }} />)}
          </div>
        ) : books.length === 0 ? (
          <div className="flex items-center justify-center py-14 text-center">
            <p className="text-sm" style={{ color: "#94a3b8" }}>No books found for the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  {["Title", "Level", "Author", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94a3b8" }}>{h}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {books.map((book, idx) => (
                  <tr key={book.id} style={{ borderBottom: idx < books.length - 1 ? "1px solid #f8fafc" : "none" }}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(79,142,247,0.08)" }}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="#4f8ef7" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                          </svg>
                        </div>
                        <span className="font-semibold" style={{ color: "#1e293b" }}>{book.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: "rgba(240,165,0,0.1)", color: "#d97706" }}>
                        {book.level.code}
                      </span>
                    </td>
                    <td className="px-5 py-3.5" style={{ color: "#64748b" }}>{book.author ?? "—"}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={book.isActive
                          ? { background: "rgba(16,185,129,0.1)", color: "#059669" }
                          : { background: "#f1f5f9", color: "#94a3b8" }}
                      >
                        {book.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => handleEdit(book)}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                          style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#e2e8f0" }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#f1f5f9" }}>
                          Edit
                        </button>
                        {book.isActive && (
                          <button type="button" onClick={() => handleDeactivate(book.id)}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                            style={{ background: "rgba(239,68,68,0.06)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.15)" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.12)" }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.06)" }}>
                            Deactivate
                          </button>
                        )}
                        <a href={book.resourceUrl} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                          style={{ background: "rgba(79,142,247,0.08)", color: "#4f8ef7", border: "1px solid rgba(79,142,247,0.15)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(79,142,247,0.15)" }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(79,142,247,0.08)" }}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                          PDF
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
