"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, BookOpen } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";

type PendingRole = "STUDENT" | "TEACHER_ADMIN";
const PENDING_ROLE_STORAGE_KEY = "pending_sign_up_role";
const PENDING_ROLE_COOKIE_KEY = "pending_sign_up_role";

export default function SignUpRolePage() {
  const router = useRouter();

  const selectRole = (role: PendingRole, targetPath: string) => {
    localStorage.setItem(PENDING_ROLE_STORAGE_KEY, role);
    document.cookie = `${PENDING_ROLE_COOKIE_KEY}=${role}; Path=/; Max-Age=1800; SameSite=Lax`;
    router.push(targetPath);
  };

  return (
    <AuthShell
      title="Alege rolul potrivit înainte să îți creezi contul"
      subtitle="Fiecare rol deschide o experiență diferită în platformă, așa că primul pas este să alegi traseul corect."
      hideIntroPanel
      hideAsideCard
      footer={
        <>
          Ai deja un cont?{" "}
          <Link href="/sign-in" className="font-semibold text-[#6465c8] transition hover:text-[#4f50ab]">
            Autentifică-te
          </Link>
        </>
      }
      asideTitle="Două intrări, aceeași experiență coerentă"
      asideDescription="Elevii ajung rapid la lecții și resurse, iar profesorii primesc instrumentele pentru grupe, planificare și organizare."
    >
      <div className="space-y-5">
        <div className="text-center">
          
          <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#17141f]">
Creează-ți contul
          </h2>
          
        </div>

        <div className="grid gap-4">
          <button
            type="button"
            onClick={() => selectRole("STUDENT", "/sign-up/student")}
            className="group flex w-full items-center gap-4 rounded-3xl border border-[#eadfeb] bg-white px-5 py-5 text-left shadow-[0_14px_30px_rgba(58,36,72,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-[#9697f3] hover:bg-[#eef0ff]"
          >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#eef0ff] text-[#6465c8] transition group-hover:bg-white">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xl font-black text-[#17141f]">Elev</p>
              <p className="mt-1 text-sm leading-6 text-[#75697c]">
                Intri la lecții, găsești materialele tale și urmărești progresul din cont.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => selectRole("TEACHER_ADMIN", "/sign-up/teacher")}
            className="group flex w-full items-center gap-4 rounded-3xl border border-[#eadfeb] bg-white px-5 py-5 text-left shadow-[0_14px_30px_rgba(58,36,72,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-[#df6f98] hover:bg-[#fff0f5]"
          >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#ffe6ef] text-[#df6f98] transition group-hover:bg-white">
              <BookOpen className="h-8 w-8" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xl font-black text-[#17141f]">Profesor</p>
              <p className="mt-1 text-sm leading-6 text-[#75697c]">
                Creezi grupe, organizezi lecții și gestionezi resursele și activitatea elevilor.
              </p>
            </div>
          </button>
        </div>
      </div>
    </AuthShell>
  );
}
