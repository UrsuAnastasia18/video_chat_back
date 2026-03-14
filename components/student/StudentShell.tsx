import React from "react";
import { cn } from "@/lib/utils";

export function StudentPageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-800">{title}</h1>
      <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

export function StudentHero({
  title,
  subtitle,
  rightSlot,
  chips,
}: {
  title: string;
  subtitle: string;
  rightSlot?: React.ReactNode;
  chips?: React.ReactNode;
}) {
  return (
    <section
      className="relative overflow-hidden rounded-3xl px-7 py-7 text-white"
      style={{
        background: "linear-gradient(140deg, #1a2740 0%, #1e3a60 55%, #152c4a 100%)",
        boxShadow: "0 12px 48px rgba(20,40,70,0.28)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(79,142,247,0.2) 0%, transparent 65%)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-12 h-52 w-52 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-3xl font-bold leading-none tracking-[-0.03em]">{title}</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">{subtitle}</p>
          </div>
          {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
        </div>
        {chips ? <div className="mt-5 flex flex-wrap gap-2.5">{chips}</div> : null}
      </div>
    </section>
  );
}

export function StudentChip({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">
      {children}
    </span>
  );
}

export function StudentPanel({
  title,
  rightSlot,
  children,
  className,
}: {
  title?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)]", className)}
    >
      {title || rightSlot ? (
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            {title}
          </p>
          {rightSlot}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StudentEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-3xl py-20 text-center"
      style={{
        background: "linear-gradient(135deg,#f8fafc,#f1f5f9)",
        border: "2px dashed #e2e8f0",
      }}
    >
      <p className="text-base font-semibold text-slate-700">{title}</p>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
  );
}

export function StudentError({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

export function StudentLoadingGrid({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="h-36 animate-pulse rounded-2xl"
          style={{ background: "#e8edf4", animationDelay: `${i * 55}ms` }}
        />
      ))}
    </div>
  );
}

