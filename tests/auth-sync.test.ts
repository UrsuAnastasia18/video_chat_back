import { beforeEach, describe, expect, it, vi } from "vitest";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { syncClerkUserToDatabase } from "@/lib/sync-user";

const mocks = vi.hoisted(() => ({
  currentUser: vi.fn(),
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: mocks.currentUser,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mocks.prisma,
}));

describe("modulul de autentificare, conturi si acces", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("nu sincronizeaza utilizatorul daca rolul Clerk lipseste sau este invalid", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "clerk_1",
      publicMetadata: {},
    } as Awaited<ReturnType<typeof currentUser>>);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(syncClerkUserToDatabase()).resolves.toBeNull();

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("creeaza profil StudentProfile cu nivelul implicit pentru rolul STUDENT", async () => {
    const syncedUser = {
      id: "user_1",
      email: "student@example.com",
      role: "STUDENT",
      studentProfile: { id: "student_1" },
      teacherProfile: null,
    };
    const tx = {
      user: {
        create: vi.fn().mockResolvedValue({ id: "user_1" }),
        findUniqueOrThrow: vi.fn().mockResolvedValue(syncedUser),
      },
      englishLevel: {
        findFirst: vi.fn().mockResolvedValue({ id: "level_a1" }),
      },
      studentProfile: {
        create: vi.fn().mockResolvedValue({ id: "student_1" }),
      },
      teacherProfile: {
        create: vi.fn(),
      },
    };

    vi.mocked(currentUser).mockResolvedValue({
      id: "clerk_student",
      publicMetadata: { role: "STUDENT" },
      emailAddresses: [{ emailAddress: "student@example.com" }],
      firstName: "Ana",
      lastName: "Popescu",
      imageUrl: "https://example.com/avatar.png",
    } as Awaited<ReturnType<typeof currentUser>>);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(tx));

    await expect(syncClerkUserToDatabase()).resolves.toEqual(syncedUser);

    expect(tx.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        clerkUserId: "clerk_student",
        email: "student@example.com",
        role: "STUDENT",
        isActive: true,
      }),
    });
    expect(tx.englishLevel.findFirst).toHaveBeenCalledWith({
      orderBy: { orderIndex: "asc" },
    });
    expect(tx.studentProfile.create).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        currentLevelId: "level_a1",
      },
    });
    expect(tx.teacherProfile.create).not.toHaveBeenCalled();
  });
});
