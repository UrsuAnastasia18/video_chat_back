import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";

export default function SignUpTeacherPage() {
  return (
    <AuthShell
      title="Creează contul de profesor"
      subtitle="Configurează-ți accesul pentru a organiza grupe, lecții, materiale și evaluări într-un flux coerent."
      hideIntroPanel
      hideAsideCard
      compactCardShell
      footer={
        <>
          Ai deja cont?{" "}
          <Link href="/sign-in" className="font-semibold text-[#6465c8] transition hover:text-[#4f50ab]">
            Autentifică-te
          </Link>
        </>
      }
      asideTitle="Control simplu pentru profesori"
      asideDescription="Din contul de profesor poți planifica lecții, gestiona grupe și urmări activitatea elevilor într-un singur dashboard."
    >
      <SignUp forceRedirectUrl="/auth/complete-sign-up" />
    </AuthShell>
  );
}
