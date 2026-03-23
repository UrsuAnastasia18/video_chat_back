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
        title="Lecțiile mele"
        subtitle="Vezi lecțiile viitoare și anterioare pentru grupa ta curentă."
      />

      <StudentHero
        title="Calendarul lecțiilor"
        subtitle="Intră în ședințele asociate când sunt disponibile și revizuiește sesiunile trecute."
        chips={
          <>
            <StudentChip>Program academic</StudentChip>
            <StudentChip>Acces la ședințe</StudentChip>
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
          Urmează
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
          Anterioare
        </button>
      </div>

      <CallList type={view === "upcoming" ? "upcoming" : "ended"} />
    </section>
  );
}
