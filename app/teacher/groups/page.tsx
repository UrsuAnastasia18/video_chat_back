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

export default function GroupsPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);

    const fetchGroups = async () => {
        try {
            const res = await fetch("/api/groups");
            const data = await res.json();
            setGroups(data.groups ?? []);
        } catch {
            console.error("Failed to fetch groups");
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
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1
                        className="text-[28px] font-bold leading-tight tracking-tight"
                        style={{ color: '#1e293b' }}
                    >
                        My Groups
                    </h1>
                    <p className="mt-1 text-sm" style={{ color: '#64748b' }}>
                        Manage your study groups and their students
                    </p>
                </div>

                <button
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 flex-shrink-0"
                    style={{
                        background: '#4f8ef7',
                        boxShadow: '0 4px 14px rgba(79,142,247,0.35)',
                    }}
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
                    Create Group
                </button>
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
            <div
                className="group relative flex h-full flex-col gap-4 rounded-2xl p-5 transition-all duration-200 cursor-pointer"
                style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                }}
                onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement
                    el.style.boxShadow = '0 8px 24px rgba(79,142,247,0.12)'
                    el.style.borderColor = '#a5c0f7'
                    el.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement
                    el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'
                    el.style.borderColor = '#e2e8f0'
                    el.style.transform = 'translateY(0)'
                }}
            >
                {/* Top color stripe */}
                <div
                    className="absolute inset-x-0 top-0 h-1 rounded-t-2xl opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ background: 'linear-gradient(90deg, #4f8ef7 0%, #818cf8 100%)' }}
                />

                {/* Icon + Name */}
                <div className="flex items-start gap-3">
                    <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                        style={{ background: 'rgba(79,142,247,0.1)' }}
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
                            style={{ color: '#1e293b' }}
                        >
                            {group.name}
                        </h3>
                        <p className="mt-1 text-xs font-medium" style={{ color: '#4f8ef7' }}>
                            Level: {group.level.code} - {group.level.title}
                        </p>
                        {group.description && (
                            <p
                                className="mt-1 text-xs line-clamp-2 leading-relaxed"
                                style={{ color: '#94a3b8' }}
                            >
                                {group.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Stats footer */}
                <div
                    className="mt-auto flex items-center justify-between pt-3"
                    style={{ borderTop: '1px solid #f1f5f9' }}
                >
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: '#94a3b8' }}>
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
                        style={{ background: 'rgba(79,142,247,0.1)', color: '#4f8ef7' }}
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
                        {group._count.memberships === 1 ? "student" : "students"}
                    </span>
                </div>
            </div>
        </Link>
    );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
    return (
        <div
            className="flex flex-col items-center justify-center rounded-2xl py-20 text-center"
            style={{
                background: '#ffffff',
                border: '2px dashed #e2e8f0',
            }}
        >
            <div
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: 'rgba(79,142,247,0.08)' }}
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
            <h3 className="text-lg font-semibold" style={{ color: '#1e293b' }}>
                No groups yet
            </h3>
            <p className="mt-2 max-w-xs text-sm" style={{ color: '#94a3b8' }}>
                Create your first study group to start organizing your students.
            </p>
            <button
                onClick={onCreateClick}
                className="mt-6 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
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
                Create your first group
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
