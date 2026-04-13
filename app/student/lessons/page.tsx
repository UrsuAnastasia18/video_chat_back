"use client";

import { useState } from "react";
import CallList from "@/components/CallList";
import { sidebarLinks } from "@/constants";
import {
  StudentChip,
  StudentHero,
  StudentPageHeader,
} from "@/components/student/StudentShell";

type LessonView = "upcoming" | "previous";

export default function StudentLessonsPage() {
  const [view, setView] = useState<LessonView>("upcoming");
  const lessonsIcon =
    sidebarLinks.find((link) => link.route === "/student/lessons")?.imgUrl ?? "/icons/computer.png";

  return (
    <section className="flex size-full flex-col gap-6 text-black">

      <StudentHero
        title="Lecțiile mele"
        subtitle="Intră în ședințele asociate când sunt disponibile și revizuiește sesiunile trecute."
        
      />

      <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-[#eadfeb] bg-white p-1.5 shadow-[0_12px_28px_rgba(58,36,72,0.06)]">
        <button
          type="button"
          onClick={() => setView("upcoming")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            view === "upcoming"
              ? "bg-[#9697f3] text-white"
              : "text-[#75697c] hover:bg-[#fff8f1]"
          }`}
        >
          Urmează
        </button>
        <button
          type="button"
          onClick={() => setView("previous")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            view === "previous"
              ? "bg-[#df6f98] text-white"
              : "text-[#75697c] hover:bg-[#fff8f1]"
          }`}
        >
          Anterioare
        </button>
      </div>

      <CallList type={view === "upcoming" ? "upcoming" : "ended"} />
    </section>
  );
}
