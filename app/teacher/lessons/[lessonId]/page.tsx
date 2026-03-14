"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type LessonDetails = {
  id: string;
  title: string;
  description: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
  group: {
    id: string;
    name: string;
    level: {
      id: string;
      code: string;
      title: string;
    };
  };
};

type LessonStudent = {
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  currentLevel: {
    code: string;
    title: string;
  } | null;
};

type ManualGrade = {
  gradeId: string;
  value: number;
  comment: string | null;
  gradedAt: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

type StudentFormState = {
  value: string;
  comment: string;
  submitting: boolean;
  error: string | null;
  success: string | null;
};

export default function TeacherLessonGradesPage() {
  const params = useParams<{ lessonId: string }>();
  const lessonId = params.lessonId;

  const [lesson, setLesson] = useState<LessonDetails | null>(null);
  const [students, setStudents] = useState<LessonStudent[]>([]);
  const [grades, setGrades] = useState<ManualGrade[]>([]);
  const [forms, setForms] = useState<Record<string, StudentFormState>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (targetLessonId: string) => {
    const [lessonRes, studentsRes, gradesRes] = await Promise.all([
      fetch(`/api/lessons/${targetLessonId}`),
      fetch(`/api/lessons/${targetLessonId}/students`),
      fetch(`/api/lessons/${targetLessonId}/grades`),
    ]);

    const lessonPayload = (await lessonRes.json()) as {
      lesson?: LessonDetails;
      error?: string;
    };
    const studentsPayload = (await studentsRes.json()) as {
      students?: LessonStudent[];
      error?: string;
    };
    const gradesPayload = (await gradesRes.json()) as {
      grades?: ManualGrade[];
      error?: string;
    };

    if (!lessonRes.ok) {
      throw new Error(lessonPayload.error ?? "Failed to load lesson");
    }
    if (!studentsRes.ok) {
      throw new Error(studentsPayload.error ?? "Failed to load lesson students");
    }
    if (!gradesRes.ok) {
      throw new Error(gradesPayload.error ?? "Failed to load lesson grades");
    }

    setLesson(lessonPayload.lesson ?? null);
    setStudents(studentsPayload.students ?? []);
    setGrades(gradesPayload.grades ?? []);
  };

  useEffect(() => {
    if (!lessonId) return;

    const initialize = async () => {
      setLoading(true);
      setError(null);
      try {
        await loadData(lessonId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load lesson data");
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [lessonId]);

  useEffect(() => {
    const initialForms: Record<string, StudentFormState> = {};
    students.forEach((student) => {
      initialForms[student.studentId] = {
        value: "",
        comment: "",
        submitting: false,
        error: null,
        success: null,
      };
    });
    setForms(initialForms);
  }, [students]);

  const gradesByStudent = useMemo(() => {
    const grouped: Record<string, ManualGrade[]> = {};
    grades.forEach((grade) => {
      if (!grouped[grade.student.id]) {
        grouped[grade.student.id] = [];
      }
      grouped[grade.student.id].push(grade);
    });
    return grouped;
  }, [grades]);

  const updateStudentForm = (
    studentId: string,
    patch: Partial<StudentFormState>
  ) => {
    setForms((prev) => ({
      ...prev,
      [studentId]: {
        value: prev[studentId]?.value ?? "",
        comment: prev[studentId]?.comment ?? "",
        submitting: prev[studentId]?.submitting ?? false,
        error: prev[studentId]?.error ?? null,
        success: prev[studentId]?.success ?? null,
        ...patch,
      },
    }));
  };

  const handleSaveGrade = async (
    event: FormEvent<HTMLFormElement>,
    studentId: string
  ) => {
    event.preventDefault();
    if (!lessonId) return;

    const form = forms[studentId];
    const numericValue = Number(form?.value);

    if (!form?.value.trim()) {
      updateStudentForm(studentId, { error: "Grade value is required.", success: null });
      return;
    }
    if (!Number.isInteger(numericValue)) {
      updateStudentForm(studentId, { error: "Grade must be an integer.", success: null });
      return;
    }
    if (numericValue < 1 || numericValue > 10) {
      updateStudentForm(studentId, {
        error: "Grade must be between 1 and 10.",
        success: null,
      });
      return;
    }

    updateStudentForm(studentId, { submitting: true, error: null, success: null });

    try {
      const res = await fetch("/api/grades/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          studentId,
          value: numericValue,
          comment: form.comment.trim() ? form.comment.trim() : null,
        }),
      });

      const payload = (await res.json()) as { error?: string };

      if (!res.ok) {
        throw new Error(payload.error ?? "Failed to save manual grade");
      }

      await loadData(lessonId);
      updateStudentForm(studentId, {
        value: "",
        comment: "",
        submitting: false,
        error: null,
        success: "Grade saved.",
      });
    } catch (err) {
      updateStudentForm(studentId, {
        submitting: false,
        error: err instanceof Error ? err.message : "Failed to save manual grade",
        success: null,
      });
    }
  };

  return (
    <section className="flex size-full flex-col gap-6 text-black">
      <div>
        <h1 className="text-3xl font-bold">Lesson Manual Grades</h1>
        <p className="text-sm text-slate-500">
          Add oral/manual grades for students from this lesson group.
        </p>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading lesson data...</p>
      ) : !lesson ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Lesson not found.
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-semibold text-slate-900">{lesson.title}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {lesson.group.name} ({lesson.group.level.code} - {lesson.group.level.title})
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {new Date(lesson.scheduledStart).toLocaleString()} -{" "}
              {new Date(lesson.scheduledEnd).toLocaleString()}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Status: {lesson.status}</p>
            {lesson.description ? (
              <p className="mt-2 text-sm text-slate-600">{lesson.description}</p>
            ) : null}
          </div>

          {students.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No active students in this lesson group.
            </div>
          ) : (
            <div className="space-y-4">
              {students.map((student) => {
                const form = forms[student.studentId] ?? {
                  value: "",
                  comment: "",
                  submitting: false,
                  error: null,
                  success: null,
                };
                const studentGrades = gradesByStudent[student.studentId] ?? [];

                return (
                  <article
                    key={student.studentId}
                    className="rounded-xl border border-slate-200 bg-white p-5"
                  >
                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {student.firstName} {student.lastName}
                      </h3>
                      <p className="text-sm text-slate-600">{student.email}</p>
                      <p className="text-sm text-slate-500">
                        Level:{" "}
                        {student.currentLevel
                          ? `${student.currentLevel.code} - ${student.currentLevel.title}`
                          : "N/A"}
                      </p>
                    </div>

                    <form
                      className="mt-4 grid gap-3 md:grid-cols-[140px_1fr_auto]"
                      onSubmit={(event) => handleSaveGrade(event, student.studentId)}
                    >
                      <input
                        type="number"
                        min={1}
                        max={10}
                        step={1}
                        value={form.value}
                        onChange={(event) =>
                          updateStudentForm(student.studentId, {
                            value: event.target.value,
                            error: null,
                            success: null,
                          })
                        }
                        placeholder="Grade 1-10"
                        className="rounded border border-slate-300 px-3 py-2 text-sm"
                      />
                      <textarea
                        value={form.comment}
                        onChange={(event) =>
                          updateStudentForm(student.studentId, {
                            comment: event.target.value,
                            error: null,
                            success: null,
                          })
                        }
                        placeholder="Optional comment"
                        rows={2}
                        className="rounded border border-slate-300 px-3 py-2 text-sm"
                      />
                      <button
                        type="submit"
                        disabled={form.submitting}
                        className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {form.submitting ? "Saving..." : "Save Grade"}
                      </button>
                    </form>

                    {form.error ? (
                      <p className="mt-2 text-sm text-red-600">{form.error}</p>
                    ) : null}
                    {form.success ? (
                      <p className="mt-2 text-sm text-emerald-600">{form.success}</p>
                    ) : null}

                    <div className="mt-4">
                      <p className="text-sm font-semibold text-slate-700">
                        Existing manual grades for this lesson
                      </p>
                      {studentGrades.length === 0 ? (
                        <p className="mt-1 text-sm text-slate-500">No grades yet.</p>
                      ) : (
                        <ul className="mt-2 space-y-2">
                          {studentGrades.map((grade) => (
                            <li
                              key={grade.gradeId}
                              className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                            >
                              <span className="font-semibold">Value: {grade.value}</span>{" "}
                              <span className="text-slate-500">
                                ({new Date(grade.gradedAt).toLocaleString()})
                              </span>
                              {grade.comment ? (
                                <p className="mt-1 text-slate-600">{grade.comment}</p>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
