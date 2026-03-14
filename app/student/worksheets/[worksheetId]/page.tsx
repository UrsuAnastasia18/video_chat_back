"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type QuestionOption = {
  id: string;
  label: string;
};

type Question = {
  id: string;
  prompt: string;
  type: "single_choice";
  options: QuestionOption[];
};

type WorksheetContent = {
  title: string;
  questions: Question[];
};

type WorksheetDetails = {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  contentJson: WorksheetContent | null;
  maxScore: number;
  level: {
    id: string;
    code: string;
    title: string;
  };
};

interface SubmissionResult {
  score: number;
  maxScore: number;
}

export default function StudentWorksheetSolvePage() {
  const params = useParams<{ worksheetId: string }>();
  const worksheetId = params.worksheetId;
  const [worksheet, setWorksheet] = useState<WorksheetDetails | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [result, setResult] = useState<SubmissionResult | null>(null);

  useEffect(() => {
    if (!worksheetId) return;

    const loadWorksheet = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/student/worksheets/${worksheetId}`);
        const payload = (await res.json()) as {
          worksheet?: WorksheetDetails;
          error?: string;
        };

        if (!res.ok) {
          throw new Error(payload.error ?? "Failed to load worksheet");
        }

        const loaded = payload.worksheet ?? null;
        setWorksheet(loaded);

        const initialAnswers: Record<string, string> = {};
        loaded?.contentJson?.questions.forEach((question) => {
          initialAnswers[question.id] = "";
        });
        setAnswers(initialAnswers);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load worksheet");
      } finally {
        setLoading(false);
      }
    };

    loadWorksheet();
  }, [worksheetId]);

  const allAnswered = useMemo(() => {
    if (!worksheet?.contentJson?.questions?.length) return false;
    return worksheet.contentJson.questions.every((question) => Boolean(answers[question.id]));
  }, [worksheet, answers]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!worksheetId) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/student/worksheets/${worksheetId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const payload = (await res.json()) as {
        error?: string;
        result?: SubmissionResult;
      };

      if (!res.ok) {
        throw new Error(payload.error ?? "Failed to submit worksheet");
      }

      setResult(payload.result ?? null);
      setSuccess("Answers submitted successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit worksheet");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="flex size-full flex-col gap-6 text-black">
      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      {success ? (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>
      ) : null}

      {result ? (
        <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          Score: {result.score} / {result.maxScore}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading worksheet...</p>
      ) : !worksheet ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Worksheet not found.
        </div>
      ) : !worksheet.contentJson ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          This worksheet has no interactive content.
        </div>
      ) : (
        <>
          <div>
            <h1 className="text-3xl font-bold">{worksheet.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {worksheet.level.code} - {worksheet.level.title}
            </p>
            {worksheet.description ? (
              <p className="mt-2 text-sm text-slate-600">{worksheet.description}</p>
            ) : null}
            {worksheet.instructions ? (
              <p className="mt-2 text-sm text-slate-600">{worksheet.instructions}</p>
            ) : null}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {worksheet.contentJson.questions.map((question, index) => (
              <article
                key={question.id}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <h2 className="text-base font-semibold text-slate-900">
                  {index + 1}. {question.prompt}
                </h2>

                <div className="mt-3 space-y-2">
                  {question.options.map((option) => (
                    <label
                      key={option.id}
                      className="flex cursor-pointer items-center gap-2 rounded border border-slate-200 px-3 py-2 text-sm text-slate-700"
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option.id}
                        checked={answers[question.id] === option.id}
                        onChange={(event) =>
                          setAnswers((prev) => ({ ...prev, [question.id]: event.target.value }))
                        }
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </article>
            ))}

            <button
              type="submit"
              disabled={submitting || !allAnswered}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </form>
        </>
      )}
    </section>
  );
}
