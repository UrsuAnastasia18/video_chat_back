import React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function StudentPageHeader({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon?: string;
}) {
  return (
    <div className="flex items-start gap-4">
      {icon ? (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#f0b3c7] bg-[#ffe6ef] shadow-[0_10px_22px_rgba(223,111,152,0.18)]">
          <Image src={icon} alt={title} width={22} height={22} className="opacity-90" />
        </div>
      ) : null}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[#17141f]">{title}</h1>
        <p className="mt-0.5 text-sm text-[#75697c]">{subtitle}</p>
      </div>
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
      className="relative overflow-hidden rounded-3xl border border-[#eadfeb] px-7 py-7 text-[#17141f] shadow-[0_18px_42px_rgba(58,36,72,0.08)]"
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #fff8f1 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,#df6f98 0,#df6f98 1px,transparent 1px,transparent 48px)," +
            "repeating-linear-gradient(90deg,#f6a43a 0,#f6a43a 1px,transparent 1px,transparent 48px)",
          opacity: 0.05,
        }}
      />
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(243,169,194,0.3) 0%, transparent 65%)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-12 h-52 w-52 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(150,151,243,0.2) 0%, transparent 65%)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-6 right-10 h-24 w-24 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,228,140,0.38) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-3xl font-black leading-none tracking-[-0.03em]">{title}</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#75697c]">{subtitle}</p>
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
    <span className="inline-flex items-center rounded-full border border-[#f0b3c7] bg-[#ffe6ef] px-3 py-1 text-xs font-semibold text-[#a04469]">
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
      className={cn("overflow-hidden rounded-3xl border border-[#eadfeb] bg-white shadow-[0_12px_28px_rgba(58,36,72,0.06)]", className)}
    >
      {title || rightSlot ? (
        <div className="flex items-center justify-between border-b border-[#f5e8ef] px-6 py-4">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#df6f98]">
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
        background: "linear-gradient(180deg,#ffffff 0%,#fff8f1 100%)",
        border: "2px dashed #eadfeb",
      }}
    >
      <p className="text-base font-semibold text-[#17141f]">{title}</p>
      <p className="text-sm text-[#75697c]">{description}</p>
    </div>
  );
}

export function StudentError({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rounded-xl border border-[#f0b3c7] bg-[#fff1f5] px-4 py-3 text-sm text-[#a04469]">
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
          style={{ background: "#f7ecf1", animationDelay: `${i * 55}ms` }}
        />
      ))}
    </div>
  );
}
