import { SignUp } from "@clerk/nextjs";

export default function SignUpStudentPage() {
  return (
    <main className="flex h-screen w-full items-center justify-center">
      <SignUp forceRedirectUrl="/auth/complete-sign-up" />
    </main>
  );
}
