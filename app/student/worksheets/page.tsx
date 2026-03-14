"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Worksheet {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  maxScore: number;
  passingScore: number | null;
  level: {
    id: string;
    code: string;
    title: string;
  };
}

export default function StudentWorksheetsPage() {
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWorksheets = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/student/worksheets");
        const payload = (await res.json()) as { worksheets?: Worksheet[]; error?: string };

        if (!res.ok) {
          throw new Error(payload.error ?? "Failed to load worksheets");
        }

        setWorksheets(payload.worksheets ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load worksheets");
      } finally {
        setLoading(false);
      }
    };

    loadWorksheets();
  }, []);

  return (
    <section className="flex size-full flex-col gap-6 text-black">
      <div>
        <h1 className="text-3xl font-bold">My Worksheets</h1>
        <p className="text-sm text-slate-500">Interactive worksheets available for your level.</p>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading worksheets...</p>
      ) : worksheets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No active worksheets are available for your current level yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {worksheets.map((worksheet) => (
            <article
              key={worksheet.id}
              className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="mb-3 text-xs font-semibold text-blue-600">
                {worksheet.level.code} - {worksheet.level.title}
              </div>
              <h2 className="text-lg font-semibold text-slate-900">{worksheet.title}</h2>
              {worksheet.description ? (
                <p className="mt-2 text-sm text-slate-600">{worksheet.description}</p>
              ) : null}
              {worksheet.instructions ? (
                <p className="mt-2 text-sm text-slate-500">{worksheet.instructions}</p>
              ) : null}
              <p className="mt-2 text-sm text-slate-500">Questions: {worksheet.maxScore}</p>

              <div className="mt-auto pt-4">
                <Link
                  href={`/student/worksheets/${worksheet.id}`}
                  className="inline-flex rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Open
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
