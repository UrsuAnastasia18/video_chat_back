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

const premiumSurfaceStyle = {
    background: "linear-gradient(135deg, #1e2d40 0%, #243650 55%, #1a3a5c 100%)",
};

const PremiumTexture = () => (
    <>
        <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
                backgroundImage:
                    "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 48px)," +
                    "repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 48px)",
            }}
        />
        <div
            className="absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-[0.08]"
            style={{ background: "radial-gradient(circle, #4f8ef7 0%, transparent 70%)" }}
        />
        <div
            className="absolute -bottom-10 left-1/3 h-36 w-36 rounded-full opacity-[0.05]"
            style={{ background: "radial-gradient(circle, #818cf8 0%, transparent 70%)" }}
        />
    </>
);

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

    return (
        <section className="flex size-full flex-col gap-7">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl px-6 py-6 text-white" style={premiumSurfaceStyle}>
                <PremiumTexture />
                <div className="relative z-10 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-[28px] font-bold leading-tight tracking-tight">Grupele mele</h1>
                        <p className="mt-1 text-sm text-white/70">
                            Gestionează grupele tale de studiu și cursanții din ele
                        </p>
                    </div>

                    <button
                        onClick={() => setModalOpen(true)}
                        className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-1 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                        style={{ boxShadow: "0 4px 14px rgba(79,142,247,0.35)" }}
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
            </div>

            {/* Content */}
            {loading ? (
                <GroupsSkeleton />
            ) : groups.length === 0 ? (
                <EmptyState onCreateClick={() => setModalOpen(true)} />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {groups.map((group) => (
                        <GroupCard key={group.id} group={group} />
                    ))}
                </div>
            )}

            <CreateGroupModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onCreated={handleGroupCreated}
            />
        </section>
    );
}

function GroupCard({ group }: { group: Group }) {
    const createdDate = new Date(group.createdAt).toLocaleDateString("en-RO", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    return (
        <Link href={`/teacher/groups/${group.id}`}>
            <div className="group relative flex h-full cursor-pointer flex-col gap-4 overflow-hidden rounded-2xl p-5 text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(30,45,64,0.24)]" style={premiumSurfaceStyle}>
                <PremiumTexture />

                {/* Icon + Name */}
                <div className="relative z-10 flex items-start gap-3">
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="#4f8ef7"
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
                        <h3
                            className="truncate font-semibold text-base leading-tight"
                            style={{ color: "#ffffff" }}
                        >
                            {group.name}
                        </h3>
                        <p className="mt-1 text-xs font-medium text-white/70">
                            Nivel: {group.level.code} - {group.level.title}
                        </p>
                        {group.description && (
                            <p
                                className="mt-1 text-xs line-clamp-2 leading-relaxed"
                                style={{ color: "rgba(255,255,255,0.6)" }}
                            >
                                {group.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Stats footer */}
                <div
                    className="relative z-10 mt-auto flex items-center justify-between pt-3"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}
                >
                    <div className="flex items-center gap-1.5 text-xs text-white/70">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5"
                            />
                        </svg>
                        {createdDate}
                    </div>
                    <span
                        className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{ background: "rgba(255,255,255,0.1)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.15)" }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                        </svg>
                        {group._count.memberships}{" "}
                        {group._count.memberships === 1 ? "elev" : "elevi"}
                    </span>
                </div>
            </div>
        </Link>
    );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
    return (
        <div
            className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl py-20 text-center text-white"
            style={premiumSurfaceStyle}
        >
            <PremiumTexture />
            <div
                className="relative z-10 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="#4f8ef7"
                    strokeWidth={1.5}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                    />
                </svg>
            </div>
            <h3 className="relative z-10 text-lg font-semibold">
                Încă nu există grupe
            </h3>
            <p className="relative z-10 mt-2 max-w-xs text-sm text-white/70">
                Creează prima ta grupă de studiu ca să începi să îți organizezi elevii.
            </p>
            <button
                onClick={onCreateClick}
                className="relative z-10 mt-6 flex items-center gap-2 rounded-xl bg-blue-1 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: '#4f8ef7', boxShadow: '0 4px 14px rgba(79,142,247,0.3)' }}
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="h-40 animate-pulse rounded-2xl"
                    style={{ background: '#e8edf4' }}
                />
            ))}
        </div>
    );
}
