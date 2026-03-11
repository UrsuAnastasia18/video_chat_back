import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { syncClerkUserToDatabase } from "@/lib/sync-user";

const VALID_ROLES = ["STUDENT", "TEACHER_ADMIN"] as const;
type ValidRole = (typeof VALID_ROLES)[number];

/**
 * POST /api/set-role
 *
 * Body: { role: "STUDENT" | "TEACHER_ADMIN" }
 *
 * Called from /auth/complete-sign-up after Clerk session is established.
 * Sets publicMetadata.role on the authenticated Clerk user
 * and immediately syncs the user to PostgreSQL.
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let role: string | undefined;
  try {
    const body = (await request.json()) as { role?: string };
    role = body.role;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!role || !VALID_ROLES.includes(role as ValidRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  try {
    const client = await clerkClient();

    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role },
    });

    const syncedUser = await syncClerkUserToDatabase();

    if (!syncedUser) {
      console.error("Failed to sync user to DB after setting role");
      return NextResponse.json(
        { error: "Failed to sync user to DB after setting role" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      role,
      user: {
        id: syncedUser.id,
        email: syncedUser.email,
        role: syncedUser.role,
      },
    });
  } catch (error) {
    console.error("Failed to set role in Clerk metadata / sync user:", error);
    return NextResponse.json(
      { error: "Failed to set role and sync user" },
      { status: 500 }
    );
  }
}