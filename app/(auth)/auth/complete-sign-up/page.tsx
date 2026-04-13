"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AuthShell from "@/components/auth/AuthShell";

type PendingRole = "STUDENT" | "TEACHER_ADMIN";

const PENDING_ROLE_STORAGE_KEY = "pending_sign_up_role";
const PENDING_ROLE_COOKIE_KEY = "pending_sign_up_role";
const VALID_ROLES: PendingRole[] = ["STUDENT", "TEACHER_ADMIN"];

function readPendingRoleFromCookie(): string | null {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [rawKey, rawValue] = cookie.trim().split("=");
    if (rawKey === PENDING_ROLE_COOKIE_KEY) {
      return decodeURIComponent(rawValue ?? "");
    }
  }
  return null;
}

function clearPendingRole() {
  localStorage.removeItem(PENDING_ROLE_STORAGE_KEY);
  document.cookie = `${PENDING_ROLE_COOKIE_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export default function CompleteSignUpPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const hasStarted = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || hasStarted.current) {
      return;
    }

    if (!isSignedIn) {
      hasStarted.current = true;
      router.replace("/sign-in");
      return;
    }

    hasStarted.current = true;

    const roleFromStorage = localStorage.getItem(PENDING_ROLE_STORAGE_KEY);
    const roleFromCookie = readPendingRoleFromCookie();
    const role = (roleFromStorage ?? roleFromCookie) as PendingRole | null;

    if (!role || !VALID_ROLES.includes(role)) {
      queueMicrotask(() => {
        setError("Selecția rolului lipsește. Te rog alege din nou rolul.");
      });
      return;
    }

    const complete = async () => {
      const response = await fetch("/api/set-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Nu am putut salva rolul selectat.");
      }

      clearPendingRole();
      router.replace("/");
    };

    complete().catch((err: unknown) => {
      const message =
        err instanceof Error ? err.message : "A apărut o eroare neașteptată la setarea rolului.";
      setError(message);
    });
  }, [isLoaded, isSignedIn, router]);

  return (
    <AuthShell
      title="Finalizăm înregistrarea"
      subtitle="Asociem rolul ales cu noul cont și pregătim accesul către experiența potrivită din platformă."
      hideIntroPanel
      hideAsideCard
      asideTitle="Încă un pas și ești gata"
      asideDescription="După confirmare, platforma îți pregătește accesul în funcție de rolul ales la înregistrare."
    >
      <div className="text-center">
        <h2 className="text-3xl font-black tracking-[-0.03em] text-[#17141f]">
          Pregătim contul tău
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#75697c]">
          Salvăm rolul tău și configurăm pașii următori.
        </p>

        {error ? (
          <div className="mt-5 rounded-2xl border border-[#f0b3c7] bg-[#fff1f5] px-4 py-3 text-sm text-[#a04469]">
            {error}
          </div>
        ) : (
          <div className="mt-6">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#eadfeb] border-t-[#6465c8]" />
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#9697f3]">
              Te rog așteaptă puțin
            </p>
          </div>
        )}

        {error ? (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-2xl bg-[#6465c8] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(100,101,200,0.24)] transition hover:bg-[#5557b8]"
            >
              Reîncearcă
            </button>
            <button
              type="button"
              onClick={() => router.push("/sign-up-role")}
              className="rounded-2xl border border-[#eadfeb] bg-[#fff8f1] px-4 py-3 text-sm font-semibold text-[#17141f] transition hover:bg-[#ffeef4]"
            >
              Alege din nou rolul
            </button>
          </div>
        ) : null}
      </div>
    </AuthShell>
  );
}
