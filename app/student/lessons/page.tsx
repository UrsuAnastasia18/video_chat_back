"use client";

import { useState } from "react";
import CallList from "@/components/CallList";
import {
  StudentChip,
  StudentHero,
  StudentPageHeader,
} from "@/components/student/StudentShell";

type LessonView = "upcoming" | "previous";

export default function StudentLessonsPage() {
  const [view, setView] = useState<LessonView>("upcoming");

  return (
    <section className="flex size-full flex-col gap-6 text-black">
      <StudentPageHeader
        title="My Lessons"
        subtitle="See upcoming and previous lessons for your current group."
      />

      <StudentHero
        title="Lesson Timeline"
        subtitle="Join linked meetings when available and review past sessions."
        chips={
          <>
            <StudentChip>Academic Schedule</StudentChip>
            <StudentChip>Meeting Access</StudentChip>
          </>
        }
      />

      <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <button
          type="button"
          onClick={() => setView("upcoming")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            view === "upcoming"
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Upcoming
        </button>
        <button
          type="button"
          onClick={() => setView("previous")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            view === "previous"
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Previous
        </button>
      </div>

      <CallList type={view === "upcoming" ? "upcoming" : "ended"} />
    </section>
  );
}

