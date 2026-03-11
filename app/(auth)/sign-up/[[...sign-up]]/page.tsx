import { redirect } from "next/navigation";

/**
 * If a user lands on /sign-up directly, redirect them to the role selection page.
 * The actual sign-up happens at /sign-up/student or /sign-up/teacher.
 */
export default function SignUpPage() {
  redirect("/sign-up-role");
}