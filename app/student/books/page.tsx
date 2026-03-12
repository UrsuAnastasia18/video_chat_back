"use client";

import { useEffect, useState } from "react";

interface Book {
  id: string;
  title: string;
  description: string | null;
  author: string | null;
  resourceUrl: string;
  coverImageUrl: string | null;
  level: {
    id: string;
    code: string;
    title: string;
  };
}

export default function StudentBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBooks = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/student/books");
        const payload = (await res.json()) as { books?: Book[]; error?: string };

        if (!res.ok) {
          throw new Error(payload.error ?? "Failed to load books");
        }

        setBooks(payload.books ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load books");
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, []);

  return (
    <section className="flex size-full flex-col gap-6 text-black">
      <div>
        <h1 className="text-3xl font-bold">My Books</h1>
        <p className="text-sm text-slate-500">
          PDF books available for your current English level.
        </p>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading books...</p>
      ) : books.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No active books are available for your current level yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {books.map((book) => (
            <article
              key={book.id}
              className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="mb-3 text-xs font-semibold text-blue-600">
                {book.level.code} - {book.level.title}
              </div>
              <h2 className="text-lg font-semibold text-slate-900">{book.title}</h2>
              {book.description ? (
                <p className="mt-2 text-sm text-slate-600">{book.description}</p>
              ) : null}
              <p className="mt-2 text-sm text-slate-500">
                Author: {book.author ?? "Unknown"}
              </p>

              <div className="mt-auto pt-4">
                <a
                  href={book.resourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Open PDF
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
