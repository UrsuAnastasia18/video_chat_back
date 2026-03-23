"use client";

import { useEffect, useState } from "react";
import {
  StudentChip,
  StudentEmptyState,
  StudentError,
  StudentHero,
  StudentLoadingGrid,
  StudentPageHeader,
  StudentPanel,
} from "@/components/student/StudentShell";

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
          throw new Error(payload.error ?? "Nu am putut încărca materialele");
        }

        setBooks(payload.books ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nu am putut încărca materialele");
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, []);

  return (
    <section className="flex size-full flex-col gap-6 text-black">
      <StudentPageHeader
        title="Cărțile mele"
        subtitle="Cărți și resurse PDF disponibile pentru nivelul tău curent."
      />

      <StudentHero
        title="Biblioteca de cărți"
        subtitle="Folosește aceste resurse pentru a exersa citirea, vocabularul și gramatica între lecții."
        rightSlot={
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
            <p className="text-2xl font-black leading-none text-white">{books.length}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white/45">
              resurse
            </p>
          </div>
        }
        chips={
          <>
            <StudentChip>Biblioteca elevului</StudentChip>
            <StudentChip>Resurse după nivel</StudentChip>
          </>
        }
      />

      {error ? <StudentError message={error} /> : null}

      {loading ? (
        <StudentLoadingGrid cards={6} />
      ) : books.length === 0 ? (
        <StudentEmptyState
          title="Încă nu există cărți disponibile"
          description="Profesorul tău nu a publicat încă materiale pentru nivelul tău curent."
        />
      ) : (
        <StudentPanel
          title="Cărți disponibile"
          rightSlot={
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600">
              {books.length}
            </span>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {books.map((book) => (
              <article
                key={book.id}
                className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(30,58,96,0.12)]"
              >
                <div className="mb-3 inline-flex w-fit rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                  {book.level.code} - {book.level.title}
                </div>
                <h2 className="text-base font-bold text-slate-900">{book.title}</h2>
                {book.description ? (
                  <p className="mt-2 text-sm text-slate-600">{book.description}</p>
                ) : null}
                <p className="mt-2 text-sm text-slate-500">
                  Autor: {book.author ?? "Necunoscut"}
                </p>

                <div className="mt-auto pt-4">
                  <a
                    href={book.resourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Deschide PDF-ul
                  </a>
                </div>
              </article>
            ))}
          </div>
        </StudentPanel>
      )}
    </section>
  );
}
