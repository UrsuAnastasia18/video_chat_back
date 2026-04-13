import Image from "next/image";
import Link from "next/link";
import React from "react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  eyebrow?: string;
  footer?: React.ReactNode;
  asideTitle?: string;
  asideDescription?: string;
  hideIntroPanel?: boolean;
  hideAsideCard?: boolean;
  compactCardShell?: boolean;
  children: React.ReactNode;
};

export default function AuthShell({
  title,
  subtitle,
  eyebrow = "Hello English",
  footer,
  asideTitle = "Învață cu ritm, claritate și bucurie",
  asideDescription = "Lecții live, materiale bine organizate și un spațiu prietenos pentru elevi și profesori.",
  hideIntroPanel = false,
  hideAsideCard = false,
  compactCardShell = false,
  children,
}: AuthShellProps) {
  const compactAuthLayout = hideIntroPanel;

  return (
    <main
      className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10"
      style={{
        background:
          "radial-gradient(circle at 0% 12%, #f3a9c2 0 86px, transparent 87px)," +
          "radial-gradient(circle at 100% 42%, #ffe48c 0 170px, transparent 171px)," +
          "radial-gradient(circle at 8% 92%, #9697f3 0 132px, transparent 133px)," +
          "#fbf6f1",
      }}
    >
      <span className="pointer-events-none absolute left-8 top-18 h-28 w-28 rounded-full bg-[#f3a9c2]/70" />
      <span className="pointer-events-none absolute right-0 top-40 h-56 w-56 rounded-full bg-[#ffe48c]/70 blur-[2px]" />
      <span className="pointer-events-none absolute bottom-0 left-10 h-44 w-44 rounded-full bg-[#9697f3]/70" />

      <div
        className={`relative mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-6 ${
          hideIntroPanel ? "lg:max-w-2xl lg:grid-cols-1" : "lg:grid-cols-[1.05fr_0.95fr]"
        }`}
      >
        {!hideIntroPanel ? (
          <section className="relative overflow-hidden rounded-4xl border border-[#eadfeb] bg-white px-6 py-7 shadow-[0_26px_80px_rgba(58,36,72,0.14)] sm:px-9 sm:py-9">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg,#df6f98 0,#df6f98 1px,transparent 1px,transparent 46px)," +
                "repeating-linear-gradient(90deg,#f6a43a 0,#f6a43a 1px,transparent 1px,transparent 46px)",
              opacity: 0.05,
            }}
          />
          <span className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#ffe48c]/70" />
          <span className="pointer-events-none absolute bottom-4 left-4 h-20 w-20 rounded-full bg-[#f3a9c2]/55" />

          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffe48c] shadow-[0_10px_24px_rgba(246,181,70,0.24)]">
                <Image src="/icons/logo.svg" alt="Hello English" width={26} height={26} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#df6f98]">
                  {eyebrow}
                </p>
                <p className="text-lg font-black text-[#17141f]">club pentru copii</p>
              </div>
            </Link>

            <div className="mt-8 max-w-lg">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#9697f3]">
                Bun venit
              </p>
              <h1 className="mt-3 text-4xl font-black leading-none tracking-[-0.04em] text-[#17141f] sm:text-5xl">
                {title}
              </h1>
              <p className="mt-4 text-sm leading-7 text-[#75697c] sm:text-base">
                {subtitle}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full border border-[#f0b3c7] bg-[#ffe6ef] px-4 py-1.5 text-xs font-semibold text-[#a04469]">
                Lecții live
              </span>
              <span className="rounded-full border border-[#ffe1a3] bg-[#fff3cd] px-4 py-1.5 text-xs font-semibold text-[#9a6313]">
                Resurse pentru elevi
              </span>
              <span className="rounded-full border border-[#cfd0ff] bg-[#eef0ff] px-4 py-1.5 text-xs font-semibold text-[#5b5db4]">
                Workflow clar pentru profesori
              </span>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[26px] bg-[#fbf6f1] p-4 shadow-[0_16px_36px_rgba(58,36,72,0.08)]">
                <p className="text-3xl font-black leading-none text-[#17141f]">1</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-[#df6f98]">
                  Alegi rolul
                </p>
              </div>
              <div className="rounded-[26px] bg-[#fbf6f1] p-4 shadow-[0_16px_36px_rgba(58,36,72,0.08)]">
                <p className="text-3xl font-black leading-none text-[#17141f]">2</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-[#9697f3]">
                  Intri în cont
                </p>
              </div>
              <div className="rounded-[26px] bg-[#fbf6f1] p-4 shadow-[0_16px_36px_rgba(58,36,72,0.08)]">
                <p className="text-3xl font-black leading-none text-[#17141f]">3</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-[#f6a43a]">
                  Începi lecțiile
                </p>
              </div>
            </div>
          </div>
          </section>
        ) : null}

        <section
          className={`relative overflow-hidden rounded-4xl border border-[#eadfeb] bg-[linear-gradient(180deg,#ffffff_0%,#fff8f1_100%)] shadow-[0_22px_64px_rgba(58,36,72,0.12)] ${
            compactCardShell
              ? "px-4 py-4 sm:px-5 sm:py-5"
              : "px-5 py-5 sm:px-7 sm:py-7"
          } ${
            compactAuthLayout
              ? compactCardShell
                ? "mx-auto w-full max-w-[560px]"
                : "mx-auto w-full max-w-[760px]"
              : ""
          }`}
        >
          {!compactCardShell ? (
            <>
              <span className="pointer-events-none absolute -left-5 top-12 h-14 w-14 rounded-full bg-[#f3a9c2]" />
              <span className="pointer-events-none absolute right-7 top-7 h-3 w-16 -rotate-6 rounded-full bg-[#df6f98]" />
              <span className="pointer-events-none absolute bottom-8 right-8 h-16 w-16 rounded-full bg-[#ffe48c]/80" />
            </>
          ) : null}

          <div
            className={`relative z-10 ${
              compactAuthLayout
                ? compactCardShell
                  ? "mx-auto flex w-full max-w-[500px] flex-col items-center"
                  : "mx-auto flex w-full max-w-[640px] flex-col items-center"
                : ""
            }`}
          >
            <div
              className={
                compactAuthLayout
                  ? compactCardShell
                    ? "flex w-full max-w-full justify-center"
                    : "w-full max-w-[480px]"
                  : ""
              }
            >
              {children}
            </div>

            {!hideAsideCard ? (
              <div className="mt-5 rounded-3xl bg-[#17141f] px-5 py-5 text-white shadow-[0_16px_36px_rgba(23,20,31,0.22)]">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ffe48c]">
                  De ce Hello English
                </p>
                <p className="mt-2 text-xl font-black leading-tight">{asideTitle}</p>
                <p className="mt-3 text-sm leading-6 text-white/72">{asideDescription}</p>
              </div>
            ) : null}

            {footer && !compactCardShell ? (
              <div
                className={`text-center text-sm text-[#75697c] ${
                  compactCardShell ? "mt-2" : "mt-5"
                } ${compactAuthLayout ? "w-full max-w-[480px]" : ""}`}
              >
                {footer}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
