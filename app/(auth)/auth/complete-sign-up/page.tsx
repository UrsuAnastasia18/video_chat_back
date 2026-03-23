"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
    <main className="flex h-screen w-full items-center justify-center bg-dark-2 px-6">
      <div className="w-full max-w-md rounded-2xl border border-dark-3 bg-dark-1 p-6 text-center text-white">
        <h1 className="text-2xl font-semibold">Finalizăm înregistrarea...</h1>
        <p className="mt-3 text-sm text-sky-1">
          Salvăm rolul tău și pregătim contul.
        </p>
        {error ? (
          <div className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : (
          <p className="mt-4 text-xs text-gray-400">Te rog așteaptă puțin.</p>
        )}
        {error ? (
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-md bg-blue-1 px-3 py-2 text-xs font-medium text-white"
            >
              Reîncearcă
            </button>
            <button
              type="button"
              onClick={() => router.push("/sign-up-role")}
              className="rounded-md border border-dark-3 px-3 py-2 text-xs font-medium text-gray-200"
            >
              Alege din nou rolul
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
