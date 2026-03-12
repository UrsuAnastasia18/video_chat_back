import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import React from "react";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen" style={{ background: "#f4f6f9" }}>
      <Navbar />

      <div className="flex pt-[57px]">
        <Sidebar />

        <section
          className="flex-1 min-h-[calc(100vh-57px)] px-7 py-7 sm:px-10 sm:py-8"
          style={{ background: "#f4f6f9" }}
        >
          {children}
        </section>
      </div>
    </main>
  );
}
