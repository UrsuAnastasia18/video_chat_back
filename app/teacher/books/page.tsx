"use client";

import {
  FormEvent,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
  useEffect,
  useMemo,
  useState,
} from "react";

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

function DecorativeDots() {
  return (
    <>
      <span className="absolute -left-10 top-16 h-24 w-24 rounded-full bg-[#f3a9c2]/70" />
      <span className="absolute right-10 top-12 h-6 w-6 rounded-full bg-[#eaa0bd]" />
      <span className="absolute right-28 top-20 h-4 w-4 rounded-full bg-[#9697f3]" />
      <span className="absolute bottom-10 right-10 h-24 w-24 rounded-full bg-[#ffe48c]/75" />
      <span className="absolute bottom-16 left-12 h-16 w-16 rounded-full bg-[#9697f3]/65" />
    </>
  );
}

function BookIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
      />
    </svg>
  );
}

function InputField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8b7c8f]">
        {label} {required ? <span className="text-[#df6f98]">*</span> : null}
      </label>
      {children}
    </div>
  );
}

function FeedbackBanner({
  type,
  message,
}: {
  type: "error" | "success";
  message: string;
}) {
  const isSuccess = type === "success";

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
        isSuccess
          ? "border-[#c7ecd6] bg-[#effcf4] text-[#198754]"
          : "border-[#f4c4cd] bg-[#fff2f4] text-[#c94b6c]"
      }`}
    >
      {message}
    </div>
  );
}

function FormInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-[#eadfeb] bg-white px-4 py-3 text-sm text-[#17141f] outline-none transition placeholder:text-[#ab9cab] focus:border-[#9697f3] focus:ring-4 focus:ring-[#9697f3]/10 ${props.className ?? ""}`}
    />
  );
}

function FormTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-2xl border border-[#eadfeb] bg-white px-4 py-3 text-sm text-[#17141f] outline-none transition placeholder:text-[#ab9cab] focus:border-[#9697f3] focus:ring-4 focus:ring-[#9697f3]/10 ${props.className ?? ""}`}
    />
  );
}

function SelectField({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full appearance-none rounded-2xl border border-[#eadfeb] bg-white px-4 py-3 pr-11 text-sm text-[#17141f] outline-none transition focus:border-[#9697f3] focus:ring-4 focus:ring-[#9697f3]/10"
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7c8f]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  );
}

function StatCard({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "yellow" | "pink" | "violet";
}) {
  const styles = {
    yellow: "border-[#f6d98d] bg-[#fff4c9] text-[#8a6122]",
    pink: "border-[#f0b3c7] bg-[#ffe6ef] text-[#a04469]",
    violet: "border-[#d7d7fb] bg-[#efefff] text-[#6465c8]",
  }[tone];

  return (
    <div className={`rounded-2xl border px-4 py-3 text-center ${styles}`}>
      <p className="text-2xl font-black leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] opacity-80">{label}</p>
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="rounded-[28px] border-2 border-dashed border-[#eadfeb] bg-[linear-gradient(180deg,#ffffff_0%,#fff8f1_100%)] px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-[#f0b3c7] bg-[#ffe6ef] text-[#a04469] shadow-[0_10px_24px_rgba(223,111,152,0.16)]">
        <BookIcon className="h-7 w-7" />
      </div>
      <h3 className="mt-5 text-xl font-black text-[#17141f]">Biblioteca este încă goală</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7c7081]">
        Adaugă prima carte PDF pentru elevi și organizează resursele pe niveluri de engleză.
      </p>
      <button
        type="button"
        onClick={onCreateClick}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#9697f3] px-5 py-3 text-sm font-bold text-white shadow-[0_16px_34px_rgba(150,151,243,0.3)] transition hover:bg-[#7f80ea]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Adaugă prima carte
      </button>
    </div>
  );
}

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

  const activeBooksCount = books.filter((book) => book.isActive).length;
  const inactiveBooksCount = books.length - activeBooksCount;

  const loadBooks = async (filters?: { levelId?: string; isActive?: string | null }) => {
    const query = new URLSearchParams();

    if (filters?.levelId && filters.levelId !== "all") {
      query.set("levelId", filters.levelId);
    }

    if (filters?.isActive === "true" || filters?.isActive === "false") {
      query.set("isActive", filters.isActive);
    }

    const response = await fetch(`/api/books${query.toString() ? `?${query}` : ""}`);
    const payload = (await response.json()) as { books?: Book[]; error?: string };

    if (!response.ok) {
      throw new Error(payload.error ?? "Nu am putut încărca cărțile");
    }

    setBooks(payload.books ?? []);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);

      try {
        const [levelsRes, booksRes] = await Promise.all([fetch("/api/levels"), fetch("/api/books")]);
        const levelsPayload = (await levelsRes.json()) as { levels?: Level[]; error?: string };
        const booksPayload = (await booksRes.json()) as { books?: Book[]; error?: string };

        if (!levelsRes.ok) {
          throw new Error(levelsPayload.error ?? "Nu am putut încărca nivelurile");
        }

        if (!booksRes.ok) {
          throw new Error(booksPayload.error ?? "Nu am putut încărca cărțile");
        }

        const fetchedLevels = levelsPayload.levels ?? [];
        setLevels(fetchedLevels);
        setBooks(booksPayload.books ?? []);
        setForm((previous) => ({ ...previous, levelId: previous.levelId || fetchedLevels[0]?.id || "" }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nu am putut încărca datele");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (loading) return;

    loadBooks({ levelId: levelFilter, isActive: activeQuery }).catch((err) => {
      setError(err instanceof Error ? err.message : "Nu am putut filtra cărțile");
    });
  }, [levelFilter, activeQuery, loading]);

  const resetForm = () => {
    setForm((previous) => ({ ...EMPTY_FORM, levelId: levels[0]?.id || previous.levelId }));
    setEditingBookId(null);
    setFormOpen(false);
  };

  const openCreateForm = () => {
    resetForm();
    setError(null);
    setSuccess(null);
    setFormOpen(true);
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

      const response = await fetch(editingBookId ? `/api/books/${editingBookId}` : "/api/books", {
        method: editingBookId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Nu am putut salva cartea");
      }

      await loadBooks({ levelId: levelFilter, isActive: activeQuery });
      setSuccess(editingBookId ? "Cartea a fost actualizată cu succes." : "Cartea a fost creată cu succes.");
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut salva cartea");
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
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeactivate = async (bookId: string) => {
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/books/${bookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Nu am putut dezactiva cartea");
      }

      await loadBooks({ levelId: levelFilter, isActive: activeQuery });
      setSuccess("Cartea a fost dezactivată cu succes.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut dezactiva cartea");
    }
  };

  const handleDelete = async (book: Book) => {
    const confirmed = window.confirm(`Sigur vrei să ștergi definitiv cartea "${book.title}"?`);

    if (!confirmed) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/books/${book.id}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Nu am putut șterge cartea");
      }

      await loadBooks({ levelId: levelFilter, isActive: activeQuery });
      setSuccess("Cartea a fost ștearsă cu succes.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut șterge cartea");
    }
  };

  return (
    <section
      className="-mx-6 -mt-10 flex min-h-[calc(100vh-57px)] flex-col overflow-hidden px-4 py-5 sm:-mx-14 sm:px-8 lg:px-10"
      style={{
        background:
          "radial-gradient(circle at 0% 12%, #f3a9c2 0 76px, transparent 77px)," +
          "radial-gradient(circle at 100% 42%, #ffe48c 0 150px, transparent 151px)," +
          "radial-gradient(circle at 4% 92%, #9697f3 0 120px, transparent 121px)," +
          "#fbf6f1",
        color: "#17141f",
      }}
    >
      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col overflow-hidden rounded-[28px] bg-white px-6 py-6 shadow-[0_26px_80px_rgba(58,36,72,0.14)] sm:px-9 lg:px-10">
        <DecorativeDots />

        <div className="relative z-10 flex flex-col gap-6">
          <section className="relative overflow-hidden rounded-[30px] border border-[#eadfeb] bg-[linear-gradient(180deg,#ffffff_0%,#fff8f1_100%)] px-7 py-7 shadow-[0_18px_42px_rgba(58,36,72,0.08)]">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg,#df6f98 0,#df6f98 1px,transparent 1px,transparent 48px)," +
                  "repeating-linear-gradient(90deg,#f6a43a 0,#f6a43a 1px,transparent 1px,transparent 48px)",
              }}
            />
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(243,169,194,0.3)_0%,transparent_65%)]" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(150,151,243,0.2)_0%,transparent_65%)]" />
            <div className="pointer-events-none absolute bottom-6 right-10 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(255,228,140,0.38)_0%,transparent_70%)]" />

            <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-2xl">
                
                <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#17141f] sm:text-3xl">
                  Cărți disponibile
                </h1>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <StatCard value={books.length} label="resurse" tone="yellow" />
                  <StatCard value={activeBooksCount} label="active" tone="pink" />
                  <StatCard value={inactiveBooksCount} label="inactive" tone="violet" />
                </div>
              </div>

              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 rounded-full bg-[#9697f3] px-5 py-3 text-sm font-bold text-white shadow-[0_16px_34px_rgba(150,151,243,0.3)] transition hover:bg-[#7f80ea]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Adaugă carte
              </button>
            </div>
          </section>

          {error ? <FeedbackBanner type="error" message={error} /> : null}
          {success ? <FeedbackBanner type="success" message={success} /> : null}

          {formOpen ? (
            <section className="relative overflow-hidden rounded-[28px] border border-[#eadfeb] bg-[#fbf6f1] p-5 shadow-[0_18px_42px_rgba(58,36,72,0.08)] sm:p-6">
              <span className="pointer-events-none absolute -right-10 top-4 h-24 w-24 rounded-full bg-[#ffe48c]/40" />
              <span className="pointer-events-none absolute bottom-3 left-6 h-16 w-16 rounded-full bg-[#9697f3]/15" />

              <div className="relative z-10 mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#df6f98]">
                    {editingBookId ? "Actualizare" : "Resursă nouă"}
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-[#17141f]">
                    {editingBookId ? "Editează cartea" : "Adaugă o carte nouă"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-[#eadfeb] bg-white px-4 py-2 text-sm font-semibold text-[#75697c] transition hover:border-[#f0b3c7] hover:text-[#a04469]"
                >
                  Închide
                </button>
              </div>

              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
                <div className="md:col-span-2">
                  <InputField label="Titlu" required>
                    <FormInput
                      value={form.title}
                      onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))}
                      required
                      placeholder="ex. English Grammar in Use"
                    />
                  </InputField>
                </div>

                <InputField label="Autor">
                  <FormInput
                    value={form.author}
                    onChange={(event) => setForm((previous) => ({ ...previous, author: event.target.value }))}
                    placeholder="ex. Raymond Murphy"
                  />
                </InputField>

                <InputField label="Nivel" required>
                  <SelectField
                    value={form.levelId}
                    onChange={(value) => setForm((previous) => ({ ...previous, levelId: value }))}
                  >
                    {levels.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.code} - {level.title}
                      </option>
                    ))}
                  </SelectField>
                </InputField>

                <div className="md:col-span-2">
                  <InputField label="URL resursă (PDF)" required>
                    <FormInput
                      value={form.resourceUrl}
                      onChange={(event) =>
                        setForm((previous) => ({ ...previous, resourceUrl: event.target.value }))
                      }
                      required
                      placeholder="/manuals/book.pdf"
                    />
                  </InputField>
                </div>

                <div className="md:col-span-2">
                  <InputField label="URL imagine copertă">
                    <FormInput
                      value={form.coverImageUrl}
                      onChange={(event) =>
                        setForm((previous) => ({ ...previous, coverImageUrl: event.target.value }))
                      }
                      placeholder="https://..."
                    />
                  </InputField>
                </div>

                <div className="md:col-span-2">
                  <InputField label="Descriere">
                    <FormTextarea
                      value={form.description}
                      onChange={(event) =>
                        setForm((previous) => ({ ...previous, description: event.target.value }))
                      }
                      className="min-h-[110px] resize-y"
                      placeholder="Scurtă descriere a acestei cărți..."
                    />
                  </InputField>
                </div>

                {editingBookId ? (
                  <div className="md:col-span-2">
                    <button
                      type="button"
                      onClick={() => setForm((previous) => ({ ...previous, isActive: !previous.isActive }))}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        form.isActive
                          ? "border-[#c7ecd6] bg-[#effcf4] text-[#198754]"
                          : "border-[#d7d7fb] bg-[#efefff] text-[#6465c8]"
                      }`}
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          form.isActive ? "bg-[#26b36d]" : "bg-[#9697f3]"
                        }`}
                      />
                      {form.isActive ? "Cartea este activă" : "Cartea este inactivă"}
                    </button>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-3 md:col-span-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-full bg-[#9697f3] px-5 py-3 text-sm font-bold text-white shadow-[0_16px_34px_rgba(150,151,243,0.3)] transition hover:bg-[#7f80ea] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Se salvează...
                      </>
                    ) : editingBookId ? (
                      "Actualizează cartea"
                    ) : (
                      "Creează cartea"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-full border border-[#eadfeb] bg-white px-5 py-3 text-sm font-semibold text-[#75697c] transition hover:border-[#f0b3c7] hover:text-[#a04469]"
                  >
                    Anulează
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          <section className="rounded-[28px] bg-[#fbf6f1] p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
              <div>
                
                <h2 className="mt-1.5 text-2xl font-black text-[#17141f]">Catalog de cărți</h2>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="min-w-[210px]">
                  <SelectField value={levelFilter} onChange={setLevelFilter}>
                    <option value="all">Toate nivelurile</option>
                    {levels.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.code} - {level.title}
                      </option>
                    ))}
                  </SelectField>
                </div>

                <div className="min-w-[210px]">
                  <SelectField value={activeFilter} onChange={(value) => setActiveFilter(value as ActiveFilter)}>
                    <option value="all">Toate statusurile</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </SelectField>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-40 animate-pulse rounded-[26px] border border-[#eadfeb] bg-white/80"
                  />
                ))}
              </div>
            ) : books.length === 0 ? (
              <EmptyState onCreateClick={openCreateForm} />
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {books.map((book) => (
                  <article
                    key={book.id}
                    className="group relative overflow-hidden rounded-[28px] border border-[#eadfeb] bg-[linear-gradient(180deg,#ffffff_0%,#fff8f1_100%)] p-5 shadow-[0_14px_32px_rgba(58,36,72,0.08)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_38px_rgba(58,36,72,0.12)]"
                  >
                    <div
                      className="pointer-events-none absolute inset-0 opacity-[0.05]"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(0deg,#df6f98 0,#df6f98 1px,transparent 1px,transparent 48px)," +
                          "repeating-linear-gradient(90deg,#f6a43a 0,#f6a43a 1px,transparent 1px,transparent 48px)",
                      }}
                    />
                    <div className="pointer-events-none absolute -right-16 top-6 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(255,228,140,0.35)_0%,transparent_70%)]" />
                    <div className="pointer-events-none absolute -bottom-10 left-6 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(150,151,243,0.18)_0%,transparent_70%)]" />

                    <div className="relative z-10 flex h-full flex-col">
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#d7d7fb] bg-[#efefff] text-[#6465c8] shadow-[0_10px_24px_rgba(150,151,243,0.16)]">
                          <BookIcon className="h-6 w-6" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-[#f6d98d] bg-[#fff4c9] px-3 py-1 text-xs font-bold text-[#8a6122]">
                                  {book.level.code}
                                </span>
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                                    book.isActive
                                      ? "border border-[#c7ecd6] bg-[#effcf4] text-[#198754]"
                                      : "border border-[#d7d7fb] bg-[#efefff] text-[#6465c8]"
                                  }`}
                                >
                                  {book.isActive ? "Activă" : "Inactivă"}
                                </span>
                              </div>

                              <h3 className="mt-3 text-xl font-black leading-tight text-[#17141f]">
                                {book.title}
                              </h3>
                              <p className="mt-1 text-sm font-semibold text-[#75697c]">
                                Autor: {book.author ?? "Necunoscut"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl bg-white/80 px-4 py-3">
                        <p className="text-sm leading-6 text-[#7c7081]">
                          {book.description?.trim() || "Fără descriere adăugată pentru această carte."}
                        </p>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleEdit(book)}
                          className="rounded-full border border-[#d7d7fb] bg-[#efefff] px-4 py-2 text-sm font-bold text-[#6465c8] transition hover:bg-[#e5e5ff]"
                        >
                          Editează
                        </button>

                        {book.isActive ? (
                          <button
                            type="button"
                            onClick={() => handleDeactivate(book.id)}
                            className="rounded-full border border-[#f4c4cd] bg-[#fff2f4] px-4 py-2 text-sm font-bold text-[#c94b6c] transition hover:bg-[#ffe7eb]"
                          >
                            Dezactivează
                          </button>
                        ) : null}

                        <a
                          href={book.resourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-[#cfe0ff] bg-[#eef4ff] px-4 py-2 text-sm font-bold text-[#4f82f3] transition hover:bg-[#e3edff]"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                            />
                          </svg>
                          PDF
                        </a>

                        <button
                          type="button"
                          onClick={() => handleDelete(book)}
                          className="rounded-full border border-[#f0b3c7] bg-white px-4 py-2 text-sm font-bold text-[#a04469] transition hover:bg-[#fff2f4]"
                        >
                          Șterge
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
