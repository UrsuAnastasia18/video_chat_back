"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

interface EnglishLevel {
    id: string;
    code: string;
    title: string;
}

interface Student {
    id: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        imageUrl: string | null;
    };
    currentLevel: EnglishLevel | null;
}

interface Membership {
    id: string;
    joinedAt: string;
    student: Student;
}

interface GlobalStudent {
    id: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        imageUrl: string | null;
    };
    currentLevel: EnglishLevel | null;
}

export default function GroupDetailPage() {
    const params = useParams();
    const router = useRouter();
    const groupId = params.groupId as string;

    const [groupName, setGroupName] = useState<string>("");
    const [groupDescription, setGroupDescription] = useState<string | null>(null);
    const [groupLevel, setGroupLevel] = useState<EnglishLevel | null>(null);
    const [memberships, setMemberships] = useState<Membership[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<GlobalStudent[]>([]);
    const [searching, setSearching] = useState(false);
    const [addingStudentId, setAddingStudentId] = useState<string | null>(null);
    const [removingStudentId, setRemovingStudentId] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const searchRef = useRef<HTMLInputElement>(null);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchGroupData = useCallback(async () => {
        try {
            const [groupsRes, membersRes] = await Promise.all([
                fetch("/api/groups"),
                fetch(`/api/groups/${groupId}/students`),
            ]);
            const groupsData = await groupsRes.json();
            const membersData = await membersRes.json();

            const group = groupsData.groups?.find(
                (g: {
                    id: string;
                    name: string;
                    description: string | null;
                    level?: EnglishLevel;
                }) => g.id === groupId
            );
            if (group) {
                setGroupName(group.name);
                setGroupDescription(group.description);
                setGroupLevel(group.level ?? null);
            }

            if (membersData.group?.level) {
                setGroupLevel(membersData.group.level as EnglishLevel);
            }
            setMemberships(membersData.students ?? []);
        } catch {
            console.error("Failed to fetch group data");
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useEffect(() => {
        fetchGroupData();
    }, [fetchGroupData]);

    const showFeedback = (type: "success" | "error", message: string) => {
        setFeedback({ type, message });
        setTimeout(() => setFeedback(null), 3000);
    };

    const searchStudents = useCallback(async (query: string) => {
        if (!query.trim()) { setSearchResults([]); return; }
        setSearching(true);
        try {
            const res = await fetch(`/api/students?search=${encodeURIComponent(query)}`);
            const data = await res.json();
            setSearchResults(data.students ?? []);
        } catch {
            console.error("Search failed");
        } finally {
            setSearching(false);
        }
    }, []);

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => searchStudents(value), 350);
    };

    const addStudent = async (studentId: string) => {
        setAddingStudentId(studentId);
        try {
            const res = await fetch(`/api/groups/${groupId}/students`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId }),
            });
            if (res.ok) {
                showFeedback("success", "Student added to the group.");
                await fetchGroupData();
            } else {
                const data = await res.json();
                showFeedback("error", data.error ?? "Failed to add student.");
            }
        } catch {
            showFeedback("error", "Something went wrong.");
        } finally {
            setAddingStudentId(null);
        }
    };

    const removeStudent = async (studentId: string) => {
        setRemovingStudentId(studentId);
        try {
            const res = await fetch(`/api/groups/${groupId}/students/${studentId}`, { method: "DELETE" });
            if (res.ok) {
                setMemberships((prev) => prev.filter((m) => m.student.id !== studentId));
                showFeedback("success", "Student removed from the group.");
            } else {
                const data = await res.json();
                showFeedback("error", data.error ?? "Failed to remove student.");
            }
        } catch {
            showFeedback("error", "Something went wrong.");
        } finally {
            setRemovingStudentId(null);
        }
    };

    const memberStudentIds = new Set(memberships.map((m) => m.student.id));

    if (loading) return <GroupDetailSkeleton />;

    return (
        <section className="flex size-full flex-col gap-6">

            {/* Toast feedback */}
            {feedback && (
                <div
                    className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium"
                    style={{
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        background: feedback.type === "success" ? "#f0fdf4" : "#fef2f2",
                        border: `1px solid ${feedback.type === "success" ? "#bbf7d0" : "#fecaca"}`,
                        color: feedback.type === "success" ? "#16a34a" : "#dc2626",
                    }}
                >
                    {feedback.type === "success" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                        </svg>
                    )}
                    {feedback.message}
                </div>
            )}

            {/* Back button */}
            <button
                onClick={() => router.push("/teacher/groups")}
                className="flex items-center gap-1.5 text-sm font-medium w-fit transition-colors"
                style={{ color: '#94a3b8' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#4f8ef7' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#94a3b8' }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Back to Groups
            </button>

            {/* Page header */}
            <div
                className="flex items-start justify-between gap-4 rounded-2xl p-6"
                style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}
            >
                <div className="flex items-center gap-4">
                    <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: 'rgba(79,142,247,0.1)' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#4f8ef7" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#1e293b' }}>
                            {groupName}
                        </h1>
                        {groupLevel && (
                            <p className="mt-0.5 text-sm font-medium" style={{ color: '#4f8ef7' }}>
                                Level: {groupLevel.code} - {groupLevel.title}
                            </p>
                        )}
                        {groupDescription && (
                            <p className="mt-0.5 text-sm max-w-xl" style={{ color: '#64748b' }}>
                                {groupDescription}
                            </p>
                        )}
                    </div>
                </div>

                {/* Stats pill */}
                <div
                    className="flex items-center gap-2 rounded-xl px-4 py-2 shrink-0"
                    style={{ background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.15)' }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="#4f8ef7" viewBox="0 0 20 20">
                        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                    <span className="text-sm font-semibold" style={{ color: '#4f8ef7' }}>
                        {memberships.length}
                    </span>
                    <span className="text-sm" style={{ color: '#64748b' }}>
                        {memberships.length === 1 ? "student" : "students"}
                    </span>
                </div>
            </div>

            {/* Main layout */}
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start">

                {/* Left: Members list */}
                <div className="flex-1 min-w-0">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#94a3b8' }}>
                            Group Members
                        </h2>
                        <span
                            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                            style={{ background: 'rgba(79,142,247,0.1)', color: '#4f8ef7' }}
                        >
                            {memberships.length}
                        </span>
                    </div>

                    {memberships.length === 0 ? (
                        <div
                            className="flex flex-col items-center justify-center rounded-2xl py-16 text-center"
                            style={{ background: '#ffffff', border: '2px dashed #e2e8f0' }}
                        >
                            <div
                                className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
                                style={{ background: 'rgba(79,142,247,0.08)' }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#4f8ef7" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium" style={{ color: '#475569' }}>No students yet</p>
                            <p className="mt-1 text-xs" style={{ color: '#94a3b8' }}>Search and add students using the panel on the right.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {memberships.map((m) => (
                                <MemberRow
                                    key={m.id}
                                    membership={m}
                                    onRemove={removeStudent}
                                    removing={removingStudentId === m.student.id}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Search panel */}
                <div className="w-full lg:w-[340px] shrink-0">
                    <div
                        className="sticky top-4 rounded-2xl p-4"
                        style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                        }}
                    >
                        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: '#94a3b8' }}>
                            Add Students
                        </h2>

                        {/* Search input */}
                        <div className="relative">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="#94a3b8"
                                strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
                            </svg>
                            <input
                                ref={searchRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                placeholder="Search by name or email..."
                                className="w-full rounded-xl py-2.5 pl-9 pr-9 text-sm outline-none transition-all"
                                style={{
                                    background: '#f8fafc',
                                    border: '1.5px solid #e2e8f0',
                                    color: '#1e293b',
                                }}
                                onFocus={(e) => {
                                    ; (e.target as HTMLElement).style.borderColor = '#4f8ef7'
                                        ; (e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(79,142,247,0.1)'
                                }}
                                onBlur={(e) => {
                                    ; (e.target as HTMLElement).style.borderColor = '#e2e8f0'
                                        ; (e.target as HTMLElement).style.boxShadow = 'none'
                                }}
                            />
                            {searching && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div
                                        className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
                                        style={{ borderColor: '#4f8ef7', borderTopColor: 'transparent' }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Results */}
                        <div className="mt-3 flex flex-col gap-1.5 max-h-[400px] overflow-y-auto">
                            {searchQuery && !searching && searchResults.length === 0 ? (
                                <p className="py-8 text-center text-xs" style={{ color: '#94a3b8' }}>
                                    No students found matching &ldquo;{searchQuery}&rdquo;
                                </p>
                            ) : searchResults.map((student) => (
                                <SearchResultRow
                                    key={student.id}
                                    student={student}
                                    isInGroup={memberStudentIds.has(student.id)}
                                    onAdd={addStudent}
                                    adding={addingStudentId === student.id}
                                />
                            ))}

                            {!searchQuery && (
                                <p className="py-8 text-center text-xs" style={{ color: '#cbd5e1' }}>
                                    Type a name or email to search
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function MemberRow({
    membership,
    onRemove,
    removing,
}: {
    membership: Membership;
    onRemove: (studentId: string) => void;
    removing: boolean;
}) {
    const { student } = membership;
    const joinedDate = new Date(membership.joinedAt).toLocaleDateString("en-RO", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    // Deterministic pastel color from initials
    const colors = [
        { bg: 'rgba(79,142,247,0.1)', text: '#4f8ef7' },
        { bg: 'rgba(129,140,248,0.1)', text: '#818cf8' },
        { bg: 'rgba(52,211,153,0.1)', text: '#10b981' },
        { bg: 'rgba(251,146,60,0.1)', text: '#f97316' },
        { bg: 'rgba(244,114,182,0.1)', text: '#ec4899' },
    ];
    const colorIdx = (student.user.firstName.charCodeAt(0) + student.user.lastName.charCodeAt(0)) % colors.length;
    const color = colors[colorIdx];

    return (
        <div
            className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all"
            style={{
                background: '#ffffff',
                border: '1px solid #f1f5f9',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#f1f5f9' }}
        >
            {/* Avatar */}
            <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                style={{ background: color.bg, color: color.text }}
            >
                {student.user.firstName[0]}{student.user.lastName[0]}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold" style={{ color: '#1e293b' }}>
                    {student.user.firstName} {student.user.lastName}
                </p>
                <p className="truncate text-xs" style={{ color: '#94a3b8' }}>
                    {student.user.email}
                </p>
            </div>

            {/* Level badge */}
            {student.currentLevel && (
                <span
                    className="hidden shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold sm:block"
                    style={{ background: 'rgba(240,165,0,0.1)', color: '#d97706' }}
                >
                    {student.currentLevel.code}
                </span>
            )}

            {/* Joined date */}
            <span className="hidden shrink-0 text-xs lg:block" style={{ color: '#cbd5e1' }}>
                {joinedDate}
            </span>

            {/* Remove */}
            <button
                onClick={() => onRemove(student.id)}
                disabled={removing}
                className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-40"
                style={{ color: '#cbd5e1' }}
                title="Remove from group"
                onMouseEnter={(e) => {
                    ; (e.currentTarget as HTMLElement).style.background = '#fef2f2'
                        ; (e.currentTarget as HTMLElement).style.color = '#ef4444'
                }}
                onMouseLeave={(e) => {
                    ; (e.currentTarget as HTMLElement).style.background = ''
                        ; (e.currentTarget as HTMLElement).style.color = '#cbd5e1'
                }}
            >
                {removing ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: '#ef4444', borderTopColor: 'transparent' }} />
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                    </svg>
                )}
            </button>
        </div>
    );
}

function SearchResultRow({
    student,
    isInGroup,
    onAdd,
    adding,
}: {
    student: GlobalStudent;
    isInGroup: boolean;
    onAdd: (studentId: string) => void;
    adding: boolean;
}) {
    return (
        <div
            className="flex items-center gap-3 rounded-xl px-3 py-2.5"
            style={{
                background: '#f8fafc',
                border: '1px solid #f1f5f9',
            }}
        >
            {/* Avatar */}
            <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                style={{ background: 'rgba(129,140,248,0.12)', color: '#818cf8' }}
            >
                {student.user.firstName[0]}{student.user.lastName[0]}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight" style={{ color: '#1e293b' }}>
                    {student.user.firstName} {student.user.lastName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="truncate text-xs" style={{ color: '#94a3b8' }}>
                        {student.user.email}
                    </p>
                    {student.currentLevel && (
                        <span
                            className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                            style={{ background: 'rgba(240,165,0,0.1)', color: '#d97706' }}
                        >
                            {student.currentLevel.code}
                        </span>
                    )}
                </div>
            </div>

            {/* Add / Added */}
            {isInGroup ? (
                <span className="flex items-center gap-1 text-xs font-medium" style={{ color: '#16a34a' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Added
                </span>
            ) : (
                <button
                    onClick={() => onAdd(student.id)}
                    disabled={adding}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: '#4f8ef7' }}
                >
                    {adding ? (
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    )}
                    Add
                </button>
            )}
        </div>
    );
}

function GroupDetailSkeleton() {
    return (
        <div className="flex flex-col gap-6 animate-pulse">
            <div className="h-5 w-32 rounded-lg" style={{ background: '#e2e8f0' }} />
            <div className="h-24 rounded-2xl" style={{ background: '#e8edf4' }} />
            <div className="flex gap-5">
                <div className="flex-1 flex flex-col gap-2.5">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-16 rounded-xl" style={{ background: '#e8edf4' }} />
                    ))}
                </div>
                <div className="w-80 h-72 rounded-2xl" style={{ background: '#e8edf4' }} />
            </div>
        </div>
    );
}
