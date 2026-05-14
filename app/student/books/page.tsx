"use client";

import { useEffect, useState } from "react";
import {
  StudentEmptyState,
  StudentError,
  StudentHero,
  StudentLoadingGrid,
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
      

      <StudentHero
        title="Biblioteca de cărți"
        subtitle="Cărți și resurse PDF disponibile pentru nivelul tău curent."
        rightSlot={
          <div className="rounded-2xl border border-[#f6d98d] bg-[#fff4c9] px-4 py-3 text-center">
            <p className="text-2xl font-black leading-none text-[#8a6122]">{books.length}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#b0894a]">
              resurse
            </p>
          </div>
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
            <span className="rounded-full border border-[#f6d98d] bg-[#fff4c9] px-2.5 py-0.5 text-xs font-bold text-[#8a6122]">
              {books.length}
            </span>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {books.map((book) => (
              <article
                key={book.id}
                className="flex h-full flex-col rounded-2xl border border-[#eadfeb] bg-[linear-gradient(180deg,#ffffff_0%,#fff8f1_100%)] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(58,36,72,0.08)]"
              >
                <div className="mb-3 inline-flex w-fit rounded-full border border-[#f6d98d] bg-[#fff4c9] px-2.5 py-1 text-[11px] font-bold text-[#8a6122]">
                  {book.level.code} - {book.level.title}
                </div>
                <h2 className="text-base font-bold text-[#17141f]">{book.title}</h2>
                {book.description ? (
                  <p className="mt-2 text-sm text-[#75697c]">{book.description}</p>
                ) : null}
                <p className="mt-2 text-sm text-[#8b7c8f]">
                  Autor: {book.author ?? "Necunoscut"}
                </p>

                <div className="mt-auto pt-4">
                  <a
                    href={book.resourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-xl bg-[#9697f3] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7c7de8]"
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
