import { SignIn } from "@clerk/nextjs";
import React from "react";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";

const SignInPage = () => {
  return (
    <AuthShell
      title="Autentifică-te și intră direct în lecții"
      subtitle="Accesează rapid sesiunile, materialele și progresul din platformă dintr-un ecran care păstrează stilul prietenos al aplicației."
      hideIntroPanel
      hideAsideCard
      compactCardShell
      footer={
        <>
          Nu ai cont?{" "}
          <Link href="/sign-up-role" className="font-semibold text-[#6465c8] transition hover:text-[#4f50ab]">
            Creează unul aici
          </Link>
        </>
      }
      asideTitle="Totul pregătit pentru o experiență fluidă"
      asideDescription="Te conectezi rapid și ajungi direct la lecțiile, fișele și resursele potrivite rolului tău."
    >
      <SignIn />
    </AuthShell>
  );
};

export default SignInPage;
