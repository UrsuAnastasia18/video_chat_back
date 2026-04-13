import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";

export default function SignUpStudentPage() {
  return (
    <AuthShell
      title="Creează contul de elev"
      subtitle="Alege un cont simplu de folosit, din care poți intra la lecții, vedea materialele și urmări activitatea ta."
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
      asideTitle="Un spațiu clar pentru elevi"
      asideDescription="După înregistrare, elevul găsește lecțiile, fișele, cărțile și notele într-un singur loc."
    >
      <SignUp forceRedirectUrl="/auth/complete-sign-up" />
    </AuthShell>
  );
}
