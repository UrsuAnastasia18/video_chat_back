"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

interface Level {
  id: string;
  code: string;
  title: string;
}

interface Book {
  id: string;
  title: string;
  description: string | null;
  author: string | null;
  resourceUrl: string;
  coverImageUrl: string | null;
  isActive: boolean;
  level: Level;
}

type ActiveFilter = "all" | "active" | "inactive";

interface BookFormState {
  title: string;
  description: string;
  author: string;
  levelId: string;
  resourceUrl: string;
  coverImageUrl: string;
  isActive: boolean;
}

const EMPTY_FORM: BookFormState = {
  title: "",
  description: "",
  author: "",
  levelId: "",
  resourceUrl: "/manuals/worksheets-grammar.pdf",
  coverImageUrl: "",
  isActive: true,
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

  const activeQuery = useMemo(() => {
    if (activeFilter === "active") return "true";
    if (activeFilter === "inactive") return "false";
    return null;
  }, [activeFilter]);

  const loadBooks = async (filters?: { levelId?: string; isActive?: string | null }) => {
    const query = new URLSearchParams();

    if (filters?.levelId && filters.levelId !== "all") {
      query.set("levelId", filters.levelId);
    }
    if (filters?.isActive === "true" || filters?.isActive === "false") {
      query.set("isActive", filters.isActive);
    }

    const res = await fetch(`/api/books${query.toString() ? `?${query.toString()}` : ""}`);
    const payload = (await res.json()) as { books?: Book[]; error?: string };

    if (!res.ok) {
      throw new Error(payload.error ?? "Failed to load books");
    }

    setBooks(payload.books ?? []);
  };

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [levelsRes, booksRes] = await Promise.all([
        fetch("/api/levels"),
        fetch("/api/books"),
      ]);

      const levelsPayload = (await levelsRes.json()) as {
        levels?: Level[];
        error?: string;
      };
      const booksPayload = (await booksRes.json()) as {
        books?: Book[];
        error?: string;
      };

      if (!levelsRes.ok) {
        throw new Error(levelsPayload.error ?? "Failed to load levels");
      }
      if (!booksRes.ok) {
        throw new Error(booksPayload.error ?? "Failed to load books");
      }

      const fetchedLevels = levelsPayload.levels ?? [];
      setLevels(fetchedLevels);
      setBooks(booksPayload.books ?? []);

      setForm((prev) => ({
        ...prev,
        levelId: prev.levelId || fetchedLevels[0]?.id || "",
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load books data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (loading) return;
    loadBooks({ levelId: levelFilter, isActive: activeQuery }).catch((err) => {
      setError(err instanceof Error ? err.message : "Failed to filter books");
    });
  }, [levelFilter, activeQuery, loading]);

  const resetForm = () => {
    setForm((prev) => ({
      ...EMPTY_FORM,
      levelId: levels[0]?.id || prev.levelId,
    }));
    setEditingBookId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const body = {
        title: form.title,
        description: form.description || null,
        author: form.author || null,
        levelId: form.levelId,
        resourceUrl: form.resourceUrl,
        coverImageUrl: form.coverImageUrl || null,
        ...(editingBookId ? { isActive: form.isActive } : {}),
      };

      const res = await fetch(editingBookId ? `/api/books/${editingBookId}` : "/api/books", {
        method: editingBookId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error ?? "Failed to save book");
      }

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
      title: book.title,
      description: book.description ?? "",
      author: book.author ?? "",
      levelId: book.level.id,
      resourceUrl: book.resourceUrl,
      coverImageUrl: book.coverImageUrl ?? "",
      isActive: book.isActive,
    });
    setSuccess(null);
    setError(null);
  };

  const handleDeactivate = async (bookId: string) => {
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/books/${bookId}`, { method: "DELETE" });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error ?? "Failed to deactivate book");
      }
      await loadBooks({ levelId: levelFilter, isActive: activeQuery });
      setSuccess("Book deactivated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate book");
    }
  };

  return (
    <section className="flex size-full flex-col gap-6 text-black">
      <div>
        <h1 className="text-3xl font-bold">Books</h1>
        <p className="text-sm text-slate-500">
          Manage PDF books by English level.
        </p>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold">
          {editingBookId ? "Edit Book" : "Add Book"}
        </h2>

        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
            Title *
            <input
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              className="rounded border border-slate-300 px-3 py-2"
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Author
            <input
              value={form.author}
              onChange={(event) => setForm((prev) => ({ ...prev, author: event.target.value }))}
              className="rounded border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Level *
            <select
              value={form.levelId}
              onChange={(event) => setForm((prev) => ({ ...prev, levelId: event.target.value }))}
              className="rounded border border-slate-300 px-3 py-2"
              required
            >
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.code} - {level.title}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
            Resource URL (PDF) *
            <input
              value={form.resourceUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, resourceUrl: event.target.value }))}
              className="rounded border border-slate-300 px-3 py-2"
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
            Cover Image URL
            <input
              value={form.coverImageUrl}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, coverImageUrl: event.target.value }))
              }
              className="rounded border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
            Description
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
              className="min-h-24 rounded border border-slate-300 px-3 py-2"
            />
          </label>

          {editingBookId ? (
            <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, isActive: event.target.checked }))
                }
              />
              Active
            </label>
          ) : null}

          <div className="flex items-center gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Saving..." : editingBookId ? "Update Book" : "Create Book"}
            </button>
            {editingBookId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="mr-auto text-lg font-semibold">Existing Books</h2>

          <select
            value={levelFilter}
            onChange={(event) => setLevelFilter(event.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">All levels</option>
            {levels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.code} - {level.title}
              </option>
            ))}
          </select>

          <select
            value={activeFilter}
            onChange={(event) => setActiveFilter(event.target.value as ActiveFilter)}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading books...</p>
        ) : books.length === 0 ? (
          <p className="text-sm text-slate-500">No books found for the selected filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-2 py-2">Title</th>
                  <th className="px-2 py-2">Level</th>
                  <th className="px-2 py-2">Author</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.id} className="border-b border-slate-100 text-slate-700">
                    <td className="px-2 py-3 font-medium">{book.title}</td>
                    <td className="px-2 py-3">
                      {book.level.code} - {book.level.title}
                    </td>
                    <td className="px-2 py-3">{book.author ?? "-"}</td>
                    <td className="px-2 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          book.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {book.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(book)}
                          className="rounded border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                        >
                          Edit
                        </button>
                        {book.isActive ? (
                          <button
                            type="button"
                            onClick={() => handleDeactivate(book.id)}
                            className="rounded border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700"
                          >
                            Deactivate
                          </button>
                        ) : null}
                        <a
                          href={book.resourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700"
                        >
                          Open PDF
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
