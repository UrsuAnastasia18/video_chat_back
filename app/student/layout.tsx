import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import React from "react";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen" style={{ background: "var(--color-content-bg)" }}>
      <Navbar />
      <Sidebar />

      <section
        className="relative min-h-screen overflow-hidden pt-[57px] sm:pl-[88px] lg:pl-60"
        style={{
          background:
            "radial-gradient(circle at 0% 12%, #f3a9c2 0 82px, transparent 83px)," +
            "radial-gradient(circle at 100% 42%, #ffe48c 0 165px, transparent 166px)," +
            "radial-gradient(circle at 8% 92%, #9697f3 0 132px, transparent 133px)," +
            "#fbf6f1",
        }}
      >
        <span className="pointer-events-none absolute left-4 top-16 h-28 w-28 rounded-full bg-[#f3a9c2]/75" />
        <span className="pointer-events-none absolute right-0 top-56 h-60 w-60 rounded-full bg-[#ffe48c]/65 blur-[2px]" />
        <span className="pointer-events-none absolute bottom-0 left-10 h-44 w-44 rounded-full bg-[#9697f3]/72" />
        <span className="pointer-events-none absolute right-36 top-32 h-5 w-5 rounded-full bg-[#eaa0bd]" />
        <span className="pointer-events-none absolute right-72 top-44 h-3.5 w-3.5 rounded-full bg-[#9697f3]" />
        <span className="pointer-events-none absolute left-1/3 top-24 h-4 w-4 rounded-full bg-[#ffe17e]" />

        <div className="relative z-10 min-h-[calc(100vh-57px)] px-7 py-7 sm:px-10 sm:py-8">
          {children}
        </div>
      </section>
    </main>
  );
}
