"use client";

import { useState, useEffect, useRef } from "react";

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

interface EnglishLevel {
    id: string;
    code: string;
    title: string;
}

interface CreateGroupModalProps {
    open: boolean;
    onClose: () => void;
    onCreated: (group: Group) => void;
}

export function CreateGroupModal({ open, onClose, onCreated }: CreateGroupModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [levelId, setLevelId] = useState("");
    const [levels, setLevels] = useState<EnglishLevel[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [levelsError, setLevelsError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const nameRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setName("");
            setDescription("");
            setLevelId("");
            setError(null);
            setLevelsError(null);
            setTimeout(() => nameRef.current?.focus(), 80);
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;

        const fetchLevels = async () => {
            try {
                const res = await fetch("/api/levels");
                const data = await res.json();
                if (!res.ok) {
                    setLevelsError(data.error ?? "Nu am putut încărca nivelurile.");
                    return;
                }
                setLevels(data.levels ?? []);
            } catch {
                setLevelsError("Nu am putut încărca nivelurile.");
            }
        };

        fetchLevels();
    }, [open]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && open) onClose();
        };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [open, onClose]);

    const handleSubmit = async () => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            setError("Numele grupei este obligatoriu.");
            return;
        }
        if (!levelId) {
            setError("Nivelul grupei este obligatoriu.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: trimmedName,
                    description: description.trim() || null,
                    levelId,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? "A apărut o eroare.");
                return;
            }
            onCreated({ ...data.group, _count: { memberships: 0 } });
        } catch {
            setError("Nu am putut crea grupa. Te rog încearcă din nou.");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0"
                style={{ background: 'rgba(30,45,64,0.45)', backdropFilter: 'blur(4px)' }}
            />

            {/* Modal */}
            <div
                className="relative w-full max-w-xl overflow-hidden rounded-[32px]"
                style={{
                    background: "linear-gradient(180deg,#ffffff 0%,#fff8f1 100%)",
                    border: '1px solid #eadfeb',
                    boxShadow: '0 26px 80px rgba(58,36,72,0.18)',
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
                <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(243,169,194,0.28)_0%,transparent_68%)]" />
                <div className="pointer-events-none absolute -bottom-10 left-8 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(150,151,243,0.18)_0%,transparent_72%)]" />

                {/* Header */}
                <div
                    className="relative z-10 flex items-center justify-between px-7 py-5"
                    style={{ borderBottom: '1px solid #f1e4ec' }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#f0b3c7] bg-[#ffe6ef] shadow-[0_10px_24px_rgba(223,111,152,0.16)]"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#a04469" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                            </svg>
                        </div>
                        <div>
                            
                            <h2 className="mt-1 text-3xl font-black tracking-[-0.03em]" style={{ color: '#17141f' }}>
                                Creează o grupă nouă
                            </h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#eadfeb] bg-white transition-colors"
                        style={{ color: '#8b7c8f' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fff1f6' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="relative z-10 flex flex-col gap-5 px-7 py-6">
                    {/* Name */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: '#75697c' }}>
                            Numele grupei <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            ref={nameRef}
                            type="text"
                            value={name}
                            onChange={(e) => { setName(e.target.value); if (error) setError(null); }}
                            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                            placeholder="ex. B2 avansați – Luni"
                            className="w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all"
                            style={{
                                background: '#fffdfb',
                                border: error ? '1.5px solid #ef4444' : '1.5px solid #eadfeb',
                                color: '#17141f',
                            }}
                            onFocus={(e) => {
                                if (!error) (e.target as HTMLElement).style.borderColor = '#df6f98'
                                    ; (e.target as HTMLElement).style.boxShadow = error
                                        ? '0 0 0 3px rgba(239,68,68,0.1)'
                                        : '0 0 0 3px rgba(223,111,152,0.12)'
                            }}
                            onBlur={(e) => {
                                if (!error) (e.target as HTMLElement).style.borderColor = '#eadfeb'
                                    ; (e.target as HTMLElement).style.boxShadow = 'none'
                            }}
                        />
                        {error && (
                            <p className="flex items-center gap-1 text-xs" style={{ color: '#ef4444' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                                </svg>
                                {error}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: '#75697c' }}>
                            Descriere <span className="normal-case font-normal" style={{ color: '#94a3b8' }}>(opțional)</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Scurtă descriere a grupei..."
                            rows={3}
                            className="w-full resize-none rounded-2xl px-4 py-3 text-sm outline-none transition-all"
                            style={{
                                background: '#fffdfb',
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
                    </div>

                    {/* Level */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: '#75697c' }}>
                            Nivelul grupei <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <select
                            value={levelId}
                            onChange={(e) => { setLevelId(e.target.value); if (error) setError(null); }}
                            className="w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all"
                            style={{
                                background: '#fffdfb',
                                border: error && !levelId ? '1.5px solid #ef4444' : '1.5px solid #eadfeb',
                                color: '#17141f',
                            }}
                            onFocus={(e) => {
                                if (!(error && !levelId)) (e.target as HTMLElement).style.borderColor = '#df6f98'
                                    ; (e.target as HTMLElement).style.boxShadow = error && !levelId
                                        ? '0 0 0 3px rgba(239,68,68,0.1)'
                                        : '0 0 0 3px rgba(223,111,152,0.12)'
                            }}
                            onBlur={(e) => {
                                if (!(error && !levelId)) (e.target as HTMLElement).style.borderColor = '#eadfeb'
                                    ; (e.target as HTMLElement).style.boxShadow = 'none'
                            }}
                        >
                            <option value="">Selectează nivelul</option>
                            {levels.map((level) => (
                                <option key={level.id} value={level.id}>
                                    {level.code} - {level.title}
                                </option>
                            ))}
                        </select>
                        {levelsError ? (
                            <p className="text-xs" style={{ color: '#ef4444' }}>
                                {levelsError}
                            </p>
                        ) : null}
                    </div>
                </div>

                {/* Footer */}
                <div
                    className="relative z-10 flex items-center justify-end gap-3 px-7 py-5"
                    style={{ borderTop: '1px solid #f1e4ec' }}
                >
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-full px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                        style={{ color: '#75697c' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fff1f6' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
                    >
                        Anulează
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                        style={{ background: '#9697f3', boxShadow: '0 16px 34px rgba(150,151,243,0.3)' }}
                    >
                        {loading ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Se creează...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Creează grupa
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
