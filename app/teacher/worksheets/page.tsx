"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { WorksheetContent } from "@/lib/worksheet-content";

interface Level {
  id: string;
  code: string;
  title: string;
}

interface Worksheet {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  contentJson: WorksheetContent | null;
  isActive: boolean;
  maxScore: number;
  passingScore: number | null;
  level: Level;
}

type ActiveFilter = "all" | "active" | "inactive";

interface WorksheetFormState {
  title: string;
  description: string;
  instructions: string;
  levelId: string;
  contentJsonText: string;
  passingScore: string;
  isActive: boolean;
}

const DEMO_WORKSHEET_CONTENT: WorksheetContent = {
  title: "Choose the best answer",
  questions: [
    {
      id: "q1",
      prompt: "Maggie and Carol ______ good friends.",
      type: "single_choice",
      options: [
        { id: "a", label: "am" },
        { id: "b", label: "are" },
        { id: "c", label: "is" },
        { id: "d", label: "isn't" },
      ],
      correctOptionId: "b",
    },
  ],
};

const EMPTY_FORM: WorksheetFormState = {
  title: "",
  description: "",
  instructions: "Choose one correct answer for each question and submit.",
  levelId: "",
  contentJsonText: JSON.stringify(DEMO_WORKSHEET_CONTENT, null, 2),
  passingScore: "",
  isActive: true,
};

export default function TeacherWorksheetsPage() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [form, setForm] = useState<WorksheetFormState>(EMPTY_FORM);
  const [editingWorksheetId, setEditingWorksheetId] = useState<string | null>(null);
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

  const loadWorksheets = async (filters?: { levelId?: string; isActive?: string | null }) => {
    const query = new URLSearchParams();

    if (filters?.levelId && filters.levelId !== "all") {
      query.set("levelId", filters.levelId);
    }
    if (filters?.isActive === "true" || filters?.isActive === "false") {
      query.set("isActive", filters.isActive);
    }

    const res = await fetch(`/api/worksheets${query.toString() ? `?${query.toString()}` : ""}`);
    const payload = (await res.json()) as { worksheets?: Worksheet[]; error?: string };

    if (!res.ok) {
      throw new Error(payload.error ?? "Failed to load worksheets");
    }

    setWorksheets(payload.worksheets ?? []);
  };

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [levelsRes, worksheetsRes] = await Promise.all([
        fetch("/api/levels"),
        fetch("/api/worksheets"),
      ]);

      const levelsPayload = (await levelsRes.json()) as { levels?: Level[]; error?: string };
      const worksheetsPayload = (await worksheetsRes.json()) as {
        worksheets?: Worksheet[];
        error?: string;
      };

      if (!levelsRes.ok) {
        throw new Error(levelsPayload.error ?? "Failed to load levels");
      }
      if (!worksheetsRes.ok) {
        throw new Error(worksheetsPayload.error ?? "Failed to load worksheets");
      }

      const fetchedLevels = levelsPayload.levels ?? [];
      setLevels(fetchedLevels);
      setWorksheets(worksheetsPayload.worksheets ?? []);
      setForm((prev) => ({ ...prev, levelId: prev.levelId || fetchedLevels[0]?.id || "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load worksheets data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (loading) return;
    loadWorksheets({ levelId: levelFilter, isActive: activeQuery }).catch((err) => {
      setError(err instanceof Error ? err.message : "Failed to filter worksheets");
    });
  }, [levelFilter, activeQuery, loading]);

  const resetForm = () => {
    setForm((prev) => ({
      ...EMPTY_FORM,
      levelId: levels[0]?.id || prev.levelId,
    }));
    setEditingWorksheetId(null);
  };

  const useDemoTemplate = () => {
    setForm((prev) => ({
      ...prev,
      title: prev.title || "Choose the best answer",
      contentJsonText: JSON.stringify(DEMO_WORKSHEET_CONTENT, null, 2),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      let parsedContentJson: unknown;
      try {
        parsedContentJson = JSON.parse(form.contentJsonText);
      } catch {
        throw new Error("contentJson must be valid JSON");
      }

      const passingScore = form.passingScore.trim();

      const body = {
        title: form.title,
        description: form.description || null,
        instructions: form.instructions || null,
        levelId: form.levelId,
        contentJson: parsedContentJson,
        passingScore: passingScore === "" ? null : Number(passingScore),
        ...(editingWorksheetId ? { isActive: form.isActive } : {}),
      };

      const res = await fetch(
        editingWorksheetId ? `/api/worksheets/${editingWorksheetId}` : "/api/worksheets",
        {
          method: editingWorksheetId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error ?? "Failed to save worksheet");
      }

      await loadWorksheets({ levelId: levelFilter, isActive: activeQuery });
      setSuccess(editingWorksheetId ? "Worksheet updated successfully." : "Worksheet created successfully.");
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save worksheet");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (worksheet: Worksheet) => {
    setEditingWorksheetId(worksheet.id);
    setForm({
      title: worksheet.title,
      description: worksheet.description ?? "",
      instructions: worksheet.instructions ?? "",
      levelId: worksheet.level.id,
      contentJsonText: JSON.stringify(worksheet.contentJson ?? DEMO_WORKSHEET_CONTENT, null, 2),
      passingScore: worksheet.passingScore === null ? "" : String(worksheet.passingScore),
      isActive: worksheet.isActive,
    });
    setError(null);
    setSuccess(null);
  };

  const handleDeactivate = async (worksheetId: string) => {
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/worksheets/${worksheetId}`, { method: "DELETE" });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error ?? "Failed to deactivate worksheet");
      }
      await loadWorksheets({ levelId: levelFilter, isActive: activeQuery });
      setSuccess("Worksheet deactivated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate worksheet");
    }
  };

  return (
    <section className="flex size-full flex-col gap-6 text-black">
      <div>
        <h1 className="text-3xl font-bold">Worksheets</h1>
        <p className="text-sm text-slate-500">Manage interactive worksheets by English level.</p>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      {success ? (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{editingWorksheetId ? "Edit Worksheet" : "Add Worksheet"}</h2>
          <button
            type="button"
            onClick={useDemoTemplate}
            className="rounded border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
          >
            Use Demo Template
          </button>
        </div>

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

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Passing Score
            <input
              type="number"
              min={0}
              value={form.passingScore}
              onChange={(event) => setForm((prev) => ({ ...prev, passingScore: event.target.value }))}
              className="rounded border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
            Description
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              className="min-h-20 rounded border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
            Instructions
            <textarea
              value={form.instructions}
              onChange={(event) => setForm((prev) => ({ ...prev, instructions: event.target.value }))}
              className="min-h-20 rounded border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
            Content JSON *
            <textarea
              value={form.contentJsonText}
              onChange={(event) => setForm((prev) => ({ ...prev, contentJsonText: event.target.value }))}
              className="min-h-56 rounded border border-slate-300 px-3 py-2 font-mono text-xs"
              required
            />
          </label>

          {editingWorksheetId ? (
            <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
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
              {submitting ? "Saving..." : editingWorksheetId ? "Update Worksheet" : "Create Worksheet"}
            </button>
            {editingWorksheetId ? (
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
          <h2 className="mr-auto text-lg font-semibold">Existing Worksheets</h2>
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
          <p className="text-sm text-slate-500">Loading worksheets...</p>
        ) : worksheets.length === 0 ? (
          <p className="text-sm text-slate-500">No worksheets found for the selected filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-2 py-2">Title</th>
                  <th className="px-2 py-2">Level</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Questions</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {worksheets.map((worksheet) => (
                  <tr key={worksheet.id} className="border-b border-slate-100 text-slate-700">
                    <td className="px-2 py-3 font-medium">{worksheet.title}</td>
                    <td className="px-2 py-3">{worksheet.level.code} - {worksheet.level.title}</td>
                    <td className="px-2 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          worksheet.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {worksheet.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-2 py-3">{worksheet.maxScore}</td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(worksheet)}
                          className="rounded border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                        >
                          Edit
                        </button>
                        {worksheet.isActive ? (
                          <button
                            type="button"
                            onClick={() => handleDeactivate(worksheet.id)}
                            className="rounded border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700"
                          >
                            Deactivate
                          </button>
                        ) : null}
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
