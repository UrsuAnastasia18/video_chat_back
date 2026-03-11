import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

/**
 * Syncs the currently authenticated Clerk user to the database.
 *
 * - If the user already exists in DB (by clerkUserId), returns it.
 * - If not, creates a new User + the appropriate profile (StudentProfile or TeacherProfile).
 *
 * Role strategy:
 *   1. Reads Clerk publicMetadata.role
 *   2. If role is missing or invalid, aborts sync and returns null
 *
 * StudentProfile is created with the default level (A1, orderIndex = 1).
 *
 * This function is idempotent — safe to call on every request.
 */
export async function syncClerkUserToDatabase() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  // Check if user already exists in DB
  const existingUser = await prisma.user.findUnique({
    where: { clerkUserId: clerkUser.id },
    include: {
      teacherProfile: true,
      studentProfile: true,
    },
  });

  if (existingUser) {
    return existingUser;
  }

  // Role is mandatory from Clerk metadata. No fallback allowed.
  const metadataRole = (clerkUser.publicMetadata as { role?: string })?.role;
  if (metadataRole !== "STUDENT" && metadataRole !== "TEACHER_ADMIN") {
    console.error(
      `Cannot sync Clerk user ${clerkUser.id}: missing or invalid publicMetadata.role (${String(
        metadataRole
      )})`
    );
    return null;
  }
  const role: UserRole = metadataRole;

  // Extract user data with fallbacks
  const email =
    clerkUser.emailAddresses?.[0]?.emailAddress ?? `${clerkUser.id}@placeholder.local`;
  const firstName = clerkUser.firstName ?? "";
  const lastName = clerkUser.lastName ?? "";
  const imageUrl = clerkUser.imageUrl ?? null;

  // Create user + profile in a transaction
  const newUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        clerkUserId: clerkUser.id,
        email,
        firstName,
        lastName,
        imageUrl,
        role,
        isActive: true,
      },
    });

    if (role === "STUDENT") {
      // Find default level (A1, the lowest orderIndex)
      const defaultLevel = await tx.englishLevel.findFirst({
        orderBy: { orderIndex: "asc" },
      });

      if (!defaultLevel) {
        throw new Error(
          "Cannot create StudentProfile: no English levels found in DB. Run `npx prisma db seed` first."
        );
      }

      await tx.studentProfile.create({
        data: {
          userId: user.id,
          currentLevelId: defaultLevel.id,
        },
      });
    } else if (role === "TEACHER_ADMIN") {
      await tx.teacherProfile.create({
        data: {
          userId: user.id,
        },
      });
    }

    // Re-fetch with profiles included
    return tx.user.findUniqueOrThrow({
      where: { id: user.id },
      include: {
        teacherProfile: true,
        studentProfile: true,
      },
    });
  });

  console.log(
    `✅ Synced new user to DB: ${newUser.email} (role: ${newUser.role})`
  );

  return newUser;
}
