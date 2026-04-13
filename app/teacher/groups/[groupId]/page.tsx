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
                fetch("/api/groups", { cache: "no-store" }),
                fetch(`/api/groups/${groupId}/students`, { cache: "no-store" }),
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
                <span className="absolute -left-12 top-20 h-28 w-28 rounded-full bg-[#f3a9c2]/70" />
                <span className="absolute -right-16 top-40 h-40 w-40 rounded-full bg-[#ffe48c]/80" />
                <span className="absolute bottom-16 left-8 h-20 w-20 rounded-full bg-[#9697f3]/75" />
                <span className="absolute right-20 top-24 h-5 w-5 rounded-full bg-[#eaa0bd]" />
                <span className="absolute right-56 top-32 h-3 w-3 rounded-full bg-[#9697f3]" />
                <span className="absolute right-80 top-36 h-4 w-4 rounded-full bg-[#ffe17e]" />

                {/* Toast feedback */}
                {feedback && (
                    <div
                        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium"
                        style={{
                            boxShadow: "0 18px 40px rgba(58,36,72,0.14)",
                            background: feedback.type === "success" ? "#f0fdf4" : "#fff1f5",
                            border: `1px solid ${feedback.type === "success" ? "#bbf7d0" : "#f0b3c7"}`,
                            color: feedback.type === "success" ? "#177245" : "#a04469",
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

                <div className="relative z-10 flex flex-col gap-6">
                    {/* Back button */}
                    <button
                        onClick={() => router.push("/teacher/groups")}
                        className="flex w-fit items-center gap-2 rounded-full border border-[#eadfeb] bg-[#fff8f1] px-4 py-2 text-sm font-semibold text-[#75697c] transition hover:bg-[#fff1f6] hover:text-[#17141f]"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Înapoi la grupe
                    </button>

                    {/* Page header */}
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

                        <div className="relative z-10 flex flex-wrap items-start justify-between gap-5">
                            <div className="flex items-start gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#f0b3c7] bg-[#ffe6ef] shadow-[0_10px_24px_rgba(223,111,152,0.18)]">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[#a04469]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#df6f98]">
                                        Detalii grupă
                                    </p>
                                    <h1 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#17141f] sm:text-4xl">
                                        {groupName}
                                    </h1>
                                    {groupLevel ? (
                                        <p className="mt-2 text-sm font-semibold text-[#6963c8]">
                                            Nivel: {groupLevel.code} - {groupLevel.title}
                                        </p>
                                    ) : null}
                                    {groupDescription ? (
                                        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#75697c]">
                                            {groupDescription}
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border border-[#f6d98d] bg-[#fff4c9] px-4 py-3 text-center">
                                    <p className="text-2xl font-black leading-none text-[#8a6122]">{memberships.length}</p>
                                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#b0894a]">
                                        {memberships.length === 1 ? "elev" : "elevi"}
                                    </p>
                                </div>
                                {groupLevel ? (
                                    <div className="rounded-2xl border border-[#d9d3fb] bg-[#f2efff] px-4 py-3 text-center">
                                        <p className="text-2xl font-black leading-none text-[#6963c8]">{groupLevel.code}</p>
                                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#8a86db]">
                                            nivel
                                        </p>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </section>

                    {/* Main layout */}
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">

                        {/* Left: Members list */}
                        <div className="min-w-0 rounded-3xl bg-[#fbf6f1] p-4 sm:p-5">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    
                                    <h2 className="mt-2 text-2xl font-black text-[#17141f]">
                                        Elevii înscriși
                                    </h2>
                                </div>
                                <span className="rounded-full border border-[#eadfeb] bg-white px-3 py-1 text-xs font-bold text-[#6f6174]">
                                    {memberships.length}
                                </span>
                            </div>

                            {memberships.length === 0 ? (
                                <div
                                    className="flex flex-col items-center justify-center rounded-3xl py-20 text-center"
                                    style={{
                                        background: "linear-gradient(180deg,#ffffff 0%,#fff8f1 100%)",
                                        border: "2px dashed #eadfeb",
                                    }}
                                >
                                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-[#f0b3c7] bg-[#ffe6ef] shadow-[0_10px_24px_rgba(223,111,152,0.16)]">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#a04469]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-base font-semibold text-[#17141f]">Încă nu există elevi în grupă</p>
                                   
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
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
                        <div className="w-full shrink-0">
                            <div className="sticky top-4 rounded-3xl border border-[#eadfeb] bg-white p-5 shadow-[0_12px_28px_rgba(58,36,72,0.06)]">
            
                                <h2 className="mt-2 text-2xl font-black text-[#17141f]">
                                    Adaugă elevi în grup
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
                                placeholder="Caută după nume sau email..."
                                className="mt-4 w-full rounded-2xl py-3 pl-10 pr-10 text-sm outline-none transition-all"
                                style={{
                                    background: '#fff8f1',
                                    border: '1.5px solid #eadfeb',
                                    color: '#17141f',
                                }}
                                onFocus={(e) => {
                                    ; (e.target as HTMLElement).style.borderColor = '#df6f98'
                                        ; (e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(223,111,152,0.12)'
                                }}
                                onBlur={(e) => {
                                    ; (e.target as HTMLElement).style.borderColor = '#eadfeb'
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
                        <div className="mt-4 flex max-h-[420px] flex-col gap-2 overflow-y-auto">
                            {searchQuery && !searching && searchResults.length === 0 ? (
                                <p className="py-8 text-center text-xs" style={{ color: '#94a3b8' }}>
                                    Nu am găsit elevi pentru &ldquo;{searchQuery}&rdquo;
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
                                    Scrie un nume sau un email pentru căutare
                                </p>
                            )}
                        </div>
                            </div>
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
            className="flex items-center gap-3 rounded-2xl border border-[#eadfeb] bg-[linear-gradient(180deg,#ffffff_0%,#fff8f1_100%)] px-4 py-3 shadow-[0_8px_20px_rgba(58,36,72,0.05)] transition-all"
            style={{
                boxShadow: "0 8px 20px rgba(58,36,72,0.05)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#f0b3c7' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#eadfeb' }}
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
                <p className="truncate text-sm font-semibold" style={{ color: '#17141f' }}>
                    {student.user.firstName} {student.user.lastName}
                </p>
                <p className="truncate text-xs" style={{ color: '#8b7c8f' }}>
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
            className="flex items-center gap-3 rounded-2xl border border-[#eadfeb] bg-[#fff8f1] px-3 py-3"
            style={{
                background: '#fff8f1',
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
                <p className="truncate text-sm font-medium leading-tight" style={{ color: '#17141f' }}>
                    {student.user.firstName} {student.user.lastName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="truncate text-xs" style={{ color: '#8b7c8f' }}>
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
                <span className="flex items-center gap-1 text-xs font-medium" style={{ color: '#177245' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Adăugat
                </span>
            ) : (
                <button
                    onClick={() => onAdd(student.id)}
                    disabled={adding}
                    className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: '#9697f3' }}
                >
                    {adding ? (
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    )}
                    Adaugă
                </button>
            )}
        </div>
    );
}

function GroupDetailSkeleton() {
    return (
        <section
            className="-mx-6 -mt-10 flex min-h-[calc(100vh-57px)] flex-col overflow-hidden px-4 py-5 sm:-mx-14 sm:px-8 lg:px-10"
            style={{
                background:
                    "radial-gradient(circle at 0% 12%, #f3a9c2 0 76px, transparent 77px)," +
                    "radial-gradient(circle at 100% 42%, #ffe48c 0 150px, transparent 151px)," +
                    "radial-gradient(circle at 4% 92%, #9697f3 0 120px, transparent 121px)," +
                    "#fbf6f1",
            }}
        >
            <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col overflow-hidden rounded-[28px] bg-white px-6 py-6 shadow-[0_26px_80px_rgba(58,36,72,0.14)] sm:px-9 lg:px-10">
                <div className="flex flex-col gap-6 animate-pulse">
                    <div className="h-10 w-40 rounded-full bg-[#f7ecf1]" />
                    <div className="h-44 rounded-3xl bg-[linear-gradient(180deg,#ffffff_0%,#fff8f1_100%)]" />
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                        <div className="flex flex-col gap-3 rounded-3xl bg-[#fbf6f1] p-5">
                    {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-20 rounded-2xl bg-content-card" />
                    ))}
                        </div>
                        <div className="h-80 rounded-3xl bg-[#fff8f1]" />
                    </div>
                </div>
            </div>
        </section>
    );
}
