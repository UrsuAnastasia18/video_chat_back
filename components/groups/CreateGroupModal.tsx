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
                className="relative w-full max-w-md rounded-2xl"
                style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 py-4"
                    style={{ borderBottom: '1px solid #f1f5f9' }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="flex h-8 w-8 items-center justify-center rounded-lg"
                            style={{ background: 'rgba(79,142,247,0.1)' }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="#4f8ef7" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                            </svg>
                        </div>
                        <h2 className="text-base font-semibold" style={{ color: '#1e293b' }}>
                            Creează o grupă nouă
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                        style={{ color: '#94a3b8' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f1f5f9' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-col gap-4 px-6 py-5">
                    {/* Name */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>
                            Numele grupei <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            ref={nameRef}
                            type="text"
                            value={name}
                            onChange={(e) => { setName(e.target.value); if (error) setError(null); }}
                            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                            placeholder="ex. B2 avansați – Luni"
                            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                            style={{
                                background: '#f8fafc',
                                border: error ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0',
                                color: '#1e293b',
                            }}
                            onFocus={(e) => {
                                if (!error) (e.target as HTMLElement).style.borderColor = '#4f8ef7'
                                    ; (e.target as HTMLElement).style.boxShadow = error
                                        ? '0 0 0 3px rgba(239,68,68,0.1)'
                                        : '0 0 0 3px rgba(79,142,247,0.12)'
                            }}
                            onBlur={(e) => {
                                if (!error) (e.target as HTMLElement).style.borderColor = '#e2e8f0'
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
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>
                            Descriere <span className="normal-case font-normal" style={{ color: '#94a3b8' }}>(opțional)</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Scurtă descriere a focusului sau programului grupei..."
                            rows={3}
                            className="w-full resize-none rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                            style={{
                                background: '#f8fafc',
                                border: '1.5px solid #e2e8f0',
                                color: '#1e293b',
                            }}
                            onFocus={(e) => {
                                ; (e.target as HTMLElement).style.borderColor = '#4f8ef7'
                                    ; (e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(79,142,247,0.12)'
                            }}
                            onBlur={(e) => {
                                ; (e.target as HTMLElement).style.borderColor = '#e2e8f0'
                                    ; (e.target as HTMLElement).style.boxShadow = 'none'
                            }}
                        />
                    </div>

                    {/* Level */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>
                            Nivelul grupei <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <select
                            value={levelId}
                            onChange={(e) => { setLevelId(e.target.value); if (error) setError(null); }}
                            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                            style={{
                                background: '#f8fafc',
                                border: error && !levelId ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0',
                                color: '#1e293b',
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
                    className="flex items-center justify-end gap-3 px-6 py-4"
                    style={{ borderTop: '1px solid #f1f5f9' }}
                >
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                        style={{ color: '#64748b' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f1f5f9' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
                    >
                        Anulează
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                        style={{ background: '#4f8ef7', boxShadow: '0 4px 12px rgba(79,142,247,0.3)' }}
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
