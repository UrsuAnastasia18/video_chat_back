"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CreateGroupModal } from "@/components/groups/CreateGroupModal";

interface Group {
  id: string;
  name: string;
  description: string | null;
  level: {
    id: string;
    code: string;
    title: string;
  };
  createdAt: string;
  _count: { memberships: number };
}

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

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/groups", { cache: "no-store" });
      const data = await res.json();
      setGroups(data.groups ?? []);
    } catch {
      console.error("Nu am putut încărca grupele");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleGroupCreated = (group: Group) => {
    setGroups((prev) => [{ ...group, _count: { memberships: 0 } }, ...prev]);
    setModalOpen(false);
  };

  const totalStudents = groups.reduce((sum, group) => sum + group._count.memberships, 0);

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
          <section
            className="relative overflow-hidden rounded-3xl border border-[#eadfeb] px-7 py-7 text-[#17141f] shadow-[0_18px_42px_rgba(58,36,72,0.08)]"
            style={{
              background: "linear-gradient(180deg, #ffffff 0%, #fff8f1 100%)",
            }}
          >
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
                
                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#17141f] sm:text-3xl">
                  Panou grupe
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#f6d98d] bg-[#fff4c9] px-4 py-3 text-center">
                    <p className="text-2xl font-black leading-none text-[#8a6122]">{groups.length}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#b0894a]">
                      grupe
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#f0b3c7] bg-[#ffe6ef] px-4 py-3 text-center">
                    <p className="text-2xl font-black leading-none text-[#a04469]">{totalStudents}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#c05d84]">
                      elevi
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setModalOpen(true)}
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
                Creează grupă
              </button>
            </div>
          </section>

          <div className="rounded-3xl bg-[#fbf6f1] p-4 sm:p-5">
            {loading ? (
              <GroupsSkeleton />
            ) : groups.length === 0 ? (
              <EmptyState onCreateClick={() => setModalOpen(true)} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {groups.map((group) => (
                  <GroupCard key={group.id} group={group} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateGroupModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleGroupCreated}
      />
    </section>
  );
}

function GroupCard({ group }: { group: Group }) {
  const createdDate = new Date(group.createdAt).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Link href={`/teacher/groups/${group.id}`}>
      <article className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-[#eadfeb] bg-[linear-gradient(180deg,#ffffff_0%,#fff8f1_100%)] p-5 shadow-[0_14px_32px_rgba(58,36,72,0.08)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_38px_rgba(58,36,72,0.12)]">
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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#f0b3c7] bg-[#ffe6ef] shadow-[0_10px_24px_rgba(223,111,152,0.16)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-[#a04469]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-xl font-black leading-tight text-[#17141f] sm:text-1xl">
                    {group.name}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-[#75697c]">
                    Nivel: {group.level.code} - {group.level.title}
                  </p>
                </div>
                
              </div>
            </div>
          </div>

          {group.description ? (
            <div className="mt-5 border-t border-[#f1e4ec] pt-4">
              <p className="line-clamp-2 text-sm leading-6 text-[#7c7081]">
                {group.description}
              </p>
            </div>
          ) : null}

          <div className="relative z-10 mt-5 flex flex-wrap items-center gap-2.5">
            <span className="rounded-full border border-[#f6d98d] bg-[#fff4c9] px-3 py-1 text-xs font-semibold text-[#8a6122]">
              Creată: {createdDate}
            </span>
            <span className="rounded-full border border-[#eadfeb] bg-white px-3 py-1 text-xs font-semibold text-[#6f6174]">
              {group._count.memberships} {group._count.memberships === 1 ? "elev" : "elevi"}
            </span>
          </div>

          
        </div>
      </article>
    </Link>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div
      className="flex flex-col items-center gap-4 rounded-3xl py-20 text-center"
      style={{
        background: "linear-gradient(180deg,#ffffff 0%,#fff8f1 100%)",
        border: "2px dashed #eadfeb",
      }}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-[#f0b3c7] bg-[#ffe6ef] shadow-[0_10px_24px_rgba(223,111,152,0.16)]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-[#a04469]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
          />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-[#17141f]">Încă nu există grupe</p>
        <p className="mt-2 max-w-md text-sm text-[#75697c]">
          Creează prima ta grupă de studiu ca să începi organizarea elevilor și lecțiilor.
        </p>
      </div>
      <button
        onClick={onCreateClick}
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
        Creează prima grupă
      </button>
    </div>
  );
}

function GroupsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-64 animate-pulse rounded-3xl border border-[#eadfeb]"
          style={{
            background: "linear-gradient(180deg,#ffffff 0%,#fff8f1 100%)",
            animationDelay: `${i * 55}ms`,
          }}
        />
      ))}
    </div>
  );
}
