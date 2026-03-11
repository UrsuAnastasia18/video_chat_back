import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { syncClerkUserToDatabase } from "@/lib/sync-user";

/**
 * Gets the current authenticated user from DB using Clerk session.
 * If the user exists in Clerk but not in DB, auto-creates them via syncClerkUserToDatabase().
 * Includes teacherProfile and studentProfile.
 * Returns null if not authenticated.
 */
export async function getCurrentUser() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return null;
  }

  // Try to find existing user in DB
  let user = await prisma.user.findUnique({
    where: { clerkUserId },
    include: {
      teacherProfile: true,
      studentProfile: true,
    },
  });

  // If not found, auto-sync from Clerk
  if (!user) {
    user = await syncClerkUserToDatabase();
  }

  return user;
}

/**
 * Same as getCurrentUser but throws if not authenticated or not found.
 */
export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

/**
 * Gets current user and ensures they have a TEACHER_ADMIN role.
 * Throws if not authenticated, not found, or not a teacher.
 */
export async function requireTeacher() {
  const user = await requireCurrentUser();

  if (user.role !== "TEACHER_ADMIN") {
    throw new Error("Forbidden: Teacher role required");
  }

  if (!user.teacherProfile) {
    throw new Error("Forbidden: Teacher profile not found");
  }

  return user;
}

