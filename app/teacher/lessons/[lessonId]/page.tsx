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
  streamCallId: string | null;
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

type LessonRecording = {
  id: string;
  filename: string;
  url: string;
  recordingType: string;
  sessionId: string;
  startTime: string;
  endTime: string;
};

type LessonStudent = {
  studentId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  currentLevel: {
    code: string;
    title: string;
  } | null;
};

type AttendanceStatus = "PENDING" | "PRESENT" | "ABSENT";

type LessonAttendanceRow = {
  studentId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  status: AttendanceStatus;
  markedAt: string | null;
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
  const [attendance, setAttendance] = useState<LessonAttendanceRow[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [attendanceUpdating, setAttendanceUpdating] = useState<
    Record<string, boolean>
  >({});
  const [recordings, setRecordings] = useState<LessonRecording[]>([]);
  const [recordingsLoading, setRecordingsLoading] = useState(false);
  const [recordingsError, setRecordingsError] = useState<string | null>(null);
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
      throw new Error(gradesPayload.error ?? "Nu am putut încărca notele lecției");
    }

    setLesson(lessonPayload.lesson ?? null);
    setStudents(studentsPayload.students ?? []);
    setGrades(gradesPayload.grades ?? []);
  };

  const loadRecordings = async (targetLessonId: string) => {
    setRecordingsLoading(true);
    setRecordingsError(null);

    try {
      const recordingsRes = await fetch(`/api/lessons/${targetLessonId}/recordings`);
      const recordingsPayload = (await recordingsRes.json()) as {
        recordings?: LessonRecording[];
        error?: string;
      };

      if (!recordingsRes.ok) {
        throw new Error(recordingsPayload.error ?? "Failed to load lesson recordings");
      }

      setRecordings(recordingsPayload.recordings ?? []);
    } catch (err) {
      setRecordings([]);
      setRecordingsError(
        err instanceof Error ? err.message : "Failed to load lesson recordings"
      );
    } finally {
      setRecordingsLoading(false);
    }
  };

  const loadAttendance = async (targetLessonId: string) => {
    setAttendanceLoading(true);
    setAttendanceError(null);

    try {
      const attendanceRes = await fetch(`/api/lessons/${targetLessonId}/attendance`);
      const attendancePayload = (await attendanceRes.json()) as {
        attendance?: LessonAttendanceRow[];
        error?: string;
      };

      if (!attendanceRes.ok) {
        throw new Error(attendancePayload.error ?? "Failed to load attendance");
      }

      setAttendance(attendancePayload.attendance ?? []);
    } catch (err) {
      setAttendance([]);
      setAttendanceError(
        err instanceof Error ? err.message : "Failed to load attendance"
      );
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    if (!lessonId) return;

    const initialize = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([
          loadData(lessonId),
          loadRecordings(lessonId),
          loadAttendance(lessonId),
        ]);
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
      await loadRecordings(lessonId);
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

  const formatDateTime = (value: string) => new Date(value).toLocaleString();

  const getAttendanceBadgeClassName = (status: AttendanceStatus) => {
    if (status === "PRESENT") {
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    }
    if (status === "ABSENT") {
      return "bg-rose-100 text-rose-700 border border-rose-200";
    }
    return "bg-slate-100 text-slate-700 border border-slate-200";
  };

  const handleMarkAttendance = async (
    targetUserId: string,
    status: "PRESENT" | "ABSENT"
  ) => {
    if (!lessonId) return;
    setAttendanceUpdating((prev) => ({ ...prev, [targetUserId]: true }));
    setAttendanceError(null);

    try {
      const response = await fetch(`/api/lessons/${lessonId}/attendance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUserId, status }),
      });
      const payload = (await response.json()) as {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Nu am putut actualiza prezența");
      }
      await loadAttendance(lessonId);
    } catch (err) {
      setAttendanceError(
        err instanceof Error ? err.message : "Nu am putut actualiza prezența"
      );
    } finally {
      setAttendanceUpdating((prev) => ({ ...prev, [targetUserId]: false }));
    }
  };

  return (
    <section className="flex size-full flex-col gap-6 text-black">
      <div>
        <h1 className="text-3xl font-bold">Panoul lecției</h1>
        <p className="text-sm text-slate-500">
          Vezi contextul lecției, linkul ședinței, înregistrările și notele manuale într-un singur loc.
        </p>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Se încarcă datele lecției...</p>
      ) : !lesson ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Lecția nu a fost găsită.
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-semibold text-slate-900">Prezentare generală</h2>
            <p className="mt-1 text-sm text-slate-500">
              Contextul academic pentru această lecție programată.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Titlul lecției
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">{lesson.title}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">{lesson.status}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Grupă
                </p>
                <p className="mt-1 text-base text-slate-800">{lesson.group.name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Nivel
                </p>
                <p className="mt-1 text-base text-slate-800">
                  {lesson.group.level.code} - {lesson.group.level.title}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Începe la
                </p>
                <p className="mt-1 text-base text-slate-800">
                  {formatDateTime(lesson.scheduledStart)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Se încheie la
                </p>
                <p className="mt-1 text-base text-slate-800">
                  {formatDateTime(lesson.scheduledEnd)}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Descriere
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {lesson.description?.trim() ? lesson.description : "Nu a fost adăugată nicio descriere."}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-semibold text-slate-900">Apel video asociat</h3>
            <p className="mt-1 text-sm text-slate-500">
              Apelul asociat acestei lecții este folosit pentru acces și înregistrări.
            </p>

            {lesson.streamCallId ? (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-emerald-700">Apel asociat</p>
                <a
                  href={`/meeting/${lesson.streamCallId}`}
                  className="mt-3 inline-flex rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Deschide ședința
                </a>
                <p className="mt-3 text-xs text-slate-500">ID apel: {lesson.streamCallId}</p>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                Încă nu există un apel asociat.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-semibold text-slate-900">Prezență</h3>
            <p className="mt-1 text-sm text-slate-500">
              Marchează manual fiecare elev ca prezent sau absent pentru această lecție.
            </p>

            {attendanceError ? (
              <p className="mt-3 text-sm text-red-600">{attendanceError}</p>
            ) : null}

            {attendanceLoading ? (
              <p className="mt-3 text-sm text-slate-500">Se încarcă prezența...</p>
            ) : attendance.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                Nu există elevi activi disponibili pentru prezență.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {attendance.map((row) => {
                  const isUpdating = attendanceUpdating[row.userId] ?? false;

                  return (
                    <li
                      key={row.userId}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {row.firstName} {row.lastName}
                          </p>
                          <p className="text-xs text-slate-500">{row.email}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getAttendanceBadgeClassName(
                                row.status
                              )}`}
                            >
                              {row.status}
                            </span>
                            {row.markedAt ? (
                              <span className="text-xs text-slate-500">
                                Marcat: {formatDateTime(row.markedAt)}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">
                                Încă nemarcat
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleMarkAttendance(row.userId, "PRESENT")}
                            className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                          >
                            Prezent
                          </button>
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleMarkAttendance(row.userId, "ABSENT")}
                            className="rounded bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                          >
                            Absent
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-semibold text-slate-900">Înregistrările lecției</h3>
            <p className="mt-1 text-sm text-slate-500">
              Înregistrări din apelul asociat lecției.
            </p>
            {recordingsLoading ? (
              <p className="mt-2 text-sm text-slate-500">Se încarcă înregistrările...</p>
            ) : recordingsError ? (
              <p className="mt-2 text-sm text-red-600">{recordingsError}</p>
            ) : recordings.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                {lesson.streamCallId
                  ? "Încă nu există înregistrări pentru acest apel asociat."
                  : "Nu există niciun apel asociat pentru această lecție."}
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {recordings.map((recording) => (
                  <li
                    key={recording.id}
                    className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">{recording.filename}</p>
                      <p className="text-slate-500">{formatDateTime(recording.startTime)}</p>
                      <p className="text-xs text-slate-500">Tip: {recording.recordingType}</p>
                    </div>
                    <a
                      href={recording.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Redă
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-semibold text-slate-900">Note manuale</h3>
            <p className="mt-1 text-sm text-slate-500">
              Adaugă și verifică notele introduse de profesor pentru elevii din această grupă.
            </p>

            {students.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
                Nu există elevi activi în această grupă a lecției.
              </div>
            ) : (
              <div className="mt-4 space-y-4">
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
                        <h4 className="text-lg font-semibold text-slate-900">
                          {student.firstName} {student.lastName}
                        </h4>
                        <p className="text-sm text-slate-600">{student.email}</p>
                        <p className="text-sm text-slate-500">
                          Nivel:{" "}
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
                          placeholder="Notă 1-10"
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
                          placeholder="Comentariu opțional"
                          rows={2}
                          className="rounded border border-slate-300 px-3 py-2 text-sm"
                        />
                        <button
                          type="submit"
                          disabled={form.submitting}
                          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          {form.submitting ? "Se salvează..." : "Salvează nota"}
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
                          Note manuale existente pentru această lecție
                        </p>
                        {studentGrades.length === 0 ? (
                          <p className="mt-1 text-sm text-slate-500">Încă nu există note.</p>
                        ) : (
                          <ul className="mt-2 space-y-2">
                            {studentGrades.map((grade) => (
                              <li
                                key={grade.gradeId}
                                className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                              >
                                <span className="font-semibold">Valoare: {grade.value}</span>{" "}
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
          </div>
        </>
      )}
    </section>
  );
}
