"use client";

import { useRouter } from "next/navigation";
import { GraduationCap, BookOpen } from "lucide-react";

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
    <main className="flex h-screen w-full items-center justify-center bg-dark-2">
      <div className="flex flex-col items-center gap-8 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Create your account
          </h1>
          <p className="text-sky-1 text-base">
            Choose your role to get started
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Student Card */}
          <button
            onClick={() => selectRole("STUDENT", "/sign-up/student")}
            className="group flex flex-col items-center gap-4 rounded-2xl border border-dark-3 bg-dark-1 px-10 py-10 transition-all duration-300 hover:border-blue-1 hover:bg-dark-3 hover:scale-[1.03] hover:shadow-lg hover:shadow-blue-1/10 cursor-pointer w-64"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-1/10 transition-colors duration-300 group-hover:bg-blue-1/20">
              <GraduationCap className="h-10 w-10 text-blue-1" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white mb-1">
                Student
              </h2>
              <p className="text-sm text-gray-400">
                Join classes and learn English
              </p>
            </div>
          </button>

          {/* Teacher Card */}
          <button
            onClick={() => selectRole("TEACHER_ADMIN", "/sign-up/teacher")}
            className="group flex flex-col items-center gap-4 rounded-2xl border border-dark-3 bg-dark-1 px-10 py-10 transition-all duration-300 hover:border-purple-1 hover:bg-dark-3 hover:scale-[1.03] hover:shadow-lg hover:shadow-purple-1/10 cursor-pointer w-64"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-1/10 transition-colors duration-300 group-hover:bg-purple-1/20">
              <BookOpen className="h-10 w-10 text-purple-1" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white mb-1">
                Teacher
              </h2>
              <p className="text-sm text-gray-400">
                Create groups and manage lessons
              </p>
            </div>
          </button>
        </div>

        <p className="text-sm text-gray-500">
          Already have an account?{" "}
          <a href="/sign-in" className="text-blue-1 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}
