"use client";

import { useEffect, useState } from "react";

interface GroupData {
  id: string;
  name: string;
  description: string | null;
  level: { id: string; code: string; title: string };
  teacher: { firstName: string; lastName: string } | null;
}
interface MemberData {
  id: string;
  user: { firstName: string; lastName: string };
}
interface StudentGroupResponse {
  group: GroupData | null;
  membership: { joinedAt: string } | null;
  members: MemberData[];
}

const PALETTES = [
  { bg: "#e0eaff", text: "#3b5bdb", ring: "#bac8ff" },
  { bg: "#e6fcf5", text: "#0ca678", ring: "#96f2d7" },
  { bg: "#fff3bf", text: "#e67700", ring: "#ffe066" },
  { bg: "#ffe0f0", text: "#c2255c", ring: "#faa2c1" },
  { bg: "#f3f0ff", text: "#7048e8", ring: "#d0bfff" },
];
const pal = (name: string) => PALETTES[name.charCodeAt(0) % PALETTES.length];
const ini = (f: string, l: string) => `${f[0] ?? ""}${l[0] ?? ""}`.toUpperCase();

export default function StudentGroupPage() {
  const [data, setData] = useState<StudentGroupResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/student/group");
        const payload = (await res.json()) as StudentGroupResponse & { error?: string };
        if (!res.ok) throw new Error(payload.error ?? "Failed to load group");
        setData(payload);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load group");
      } finally {
        setLoading(false);
        setTimeout(() => setShow(true), 30);
      }
    })();
  }, []);

  if (loading) return (
    <div className="flex flex-col gap-5">
      <div className="h-8 w-40 rounded-xl animate-pulse" style={{ background: "#e2e8f0" }} />
      <div className="h-56 rounded-3xl animate-pulse" style={{ background: "#e2e8f0" }} />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl animate-pulse"
            style={{ background: "#e2e8f0", animationDelay: `${i * 50}ms` }} />
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ opacity: show ? 1 : 0, transform: show ? "none" : "translateY(10px)", transition: "opacity 0.4s ease, transform 0.4s ease" }}>
      <section className="flex size-full flex-col gap-6" style={{ color: "#1e293b" }}>

        {/* title */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Grupul meu</h1>
          <p className="mt-0.5 text-sm" style={{ color: "#94a3b8" }}>Grupul tău de studiu și colegii.</p>
        </div>

        {/* error */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
            style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        {/* empty */}
        {!data?.group ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl py-24"
            style={{ background: "linear-gradient(135deg,#f8fafc,#f1f5f9)", border: "2px dashed #e2e8f0" }}>
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl"
              style={{ background: "#fff", boxShadow: "0 4px 24px rgba(79,142,247,0.13)", border: "1px solid #e0eaff" }}>
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="#4f8ef7" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-semibold" style={{ color: "#334155" }}>Nu ești în niciun grup</p>
              <p className="mt-1 text-sm" style={{ color: "#94a3b8" }}>Profesorul tău te va adăuga în curând.</p>
            </div>
          </div>
        ) : (
          <>
            {/* ══ HERO ══════════════════════════════════════════════════════ */}
            <div className="relative overflow-hidden rounded-3xl"
              style={{
                background: "linear-gradient(140deg, #1a2740 0%, #1e3a60 55%, #152c4a 100%)",
                boxShadow: "0 12px 48px rgba(20,40,70,0.28)",
              }}>

              {/* dot texture */}
              <div className="pointer-events-none absolute inset-0"
                style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
              {/* glow top-right */}
              <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(79,142,247,0.2) 0%, transparent 65%)" }} />
              {/* glow bottom-left */}
              <div className="pointer-events-none absolute -bottom-12 -left-12 h-52 w-52 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 65%)" }} />

              <div className="relative px-7 py-7">
                {/* top */}
                <div className="flex items-start justify-between gap-5">
                  <div className="flex-1 min-w-0">
                    {/* level badge */}
                    <span className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
                      style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24" }}>
                      <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ background: "#fbbf24" }} />
                      {data.group.level.code} · {data.group.level.title}
                    </span>

                    <h2 className="text-[2rem] font-bold leading-none" style={{ color: "#fff", letterSpacing: "-0.03em" }}>
                      {data.group.name}
                    </h2>

                    {data.group.description && (
                      <p className="mt-2 text-sm leading-relaxed max-w-md" style={{ color: "rgba(255,255,255,0.42)" }}>
                        {data.group.description}
                      </p>
                    )}
                  </div>

                  {/* count */}
                  <div className="shrink-0 flex flex-col items-center justify-center rounded-2xl px-5 py-4"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", backdropFilter: "blur(12px)" }}>
                    <span className="text-4xl font-black" style={{ color: "#fff", letterSpacing: "-0.05em", lineHeight: 1 }}>
                      {data.members.length}
                    </span>
                    <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.3)" }}>
                      colegi
                    </span>
                  </div>
                </div>

                {/* separator */}
                <div className="my-5 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />

                {/* chips */}
                <div className="flex flex-wrap gap-2.5">
                  {data.group.teacher && (
                    <Chip icon={
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="#4f8ef7" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                      </svg>
                    } color="rgba(79,142,247,0.15)" border="rgba(79,142,247,0.22)">
                      {data.group.teacher.firstName} {data.group.teacher.lastName}
                    </Chip>
                  )}
                  {data.membership && (
                    <Chip icon={
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                    } color="rgba(16,185,129,0.12)" border="rgba(16,185,129,0.22)">
                      Înscris {new Date(data.membership.joinedAt).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}
                    </Chip>
                  )}
                </div>
              </div>
            </div>

            {/* ══ MEMBERS ═══════════════════════════════════════════════════ */}
            <div className="rounded-3xl overflow-hidden"
              style={{ background: "#fff", border: "1px solid #e8edf4", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>

              {/* header */}
              <div className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: "1px solid #f1f5f9" }}>
                <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#94a3b8" }}>
                  Colegi de grup
                </p>
                <span className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                  style={{ background: "rgba(79,142,247,0.08)", color: "#4f8ef7" }}>
                  {data.members.length}
                </span>
              </div>

              {data.members.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <p className="text-sm" style={{ color: "#94a3b8" }}>Niciun coleg momentan.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4">
                  {data.members.map((member, i) => (
                    <MemberCard key={member.id} member={member} index={i} show={show} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

/* ── sub-components ─────────────────────────────────────────────────────── */

function Chip({ icon, color, border, children }: {
  icon: React.ReactNode;
  color: string;
  border: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full px-3.5 py-1.5"
      style={{ background: color, border: `1px solid ${border}` }}>
      {icon}
      <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.72)" }}>
        {children}
      </span>
    </div>
  );
}

function MemberCard({ member, index, show }: {
  member: MemberData;
  index: number;
  show: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const p = pal(member.user.firstName);
  const delay = index * 38;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex flex-col items-center gap-2.5 rounded-2xl px-3 py-5 cursor-default select-none"
      style={{
        background: hovered ? p.bg : "#fafbfd",
        border: `1.5px solid ${hovered ? p.ring : "#f1f5f9"}`,
        boxShadow: hovered ? `0 6px 20px ${p.ring}60` : "none",
        transform: hovered ? "translateY(-3px)" : show ? "translateY(0)" : "translateY(8px)",
        opacity: show ? 1 : 0,
        transition: `opacity 0.35s ease ${delay}ms, transform ${hovered ? "0.18s" : `0.35s ease ${delay}ms`}, background 0.18s, border-color 0.18s, box-shadow 0.18s`,
      }}
    >
      {/* avatar */}
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold"
        style={{
          background: p.bg,
          color: p.text,
          border: `1.5px solid ${p.ring}`,
          transform: hovered ? "scale(1.08)" : "scale(1)",
          transition: "transform 0.18s ease",
        }}>
        {ini(member.user.firstName, member.user.lastName)}
      </div>

      {/* name */}
      <div className="text-center leading-tight">
        <p className="text-xs font-bold" style={{ color: "#1e293b" }}>{member.user.firstName}</p>
        <p className="text-[11px]" style={{ color: "#94a3b8" }}>{member.user.lastName}</p>
      </div>
    </div>
  );
}