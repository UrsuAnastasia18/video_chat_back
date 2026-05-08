import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";
import { POST } from "@/app/api/groups/[groupId]/students/route";

const mocks = vi.hoisted(() => ({
  requireTeacher: vi.fn(),
  revalidatePath: vi.fn(),
  prisma: {
    studyGroup: {
      findUnique: vi.fn(),
    },
    studentProfile: {
      findUnique: vi.fn(),
    },
    groupMembership: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  requireTeacher: mocks.requireTeacher,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mocks.prisma,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

describe("modulul de management academic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adauga studentul in grupa si actualizeaza nivelul lui in aceeasi tranzactie", async () => {
    const tx = {
      groupMembership: {
        create: vi.fn().mockResolvedValue({
          id: "membership_1",
          groupId: "group_1",
          studentId: "student_1",
          isActive: true,
        }),
        update: vi.fn(),
      },
      studentProfile: {
        update: vi.fn().mockResolvedValue({ id: "student_1" }),
      },
    };

    vi.mocked(requireTeacher).mockResolvedValue({
      id: "user_teacher",
      role: "TEACHER_ADMIN",
      teacherProfile: { id: "teacher_1" },
    });
    vi.mocked(prisma.studyGroup.findUnique).mockResolvedValue({
      id: "group_1",
      teacherId: "teacher_1",
      levelId: "level_b1",
      level: { id: "level_b1", code: "B1", title: "Intermediate" },
    });
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue({
      id: "student_1",
    });
    vi.mocked(prisma.groupMembership.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.groupMembership.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(tx));

    const response = await POST(
      new Request("http://localhost/api/groups/group_1/students", {
        method: "POST",
        body: JSON.stringify({ studentId: "student_1" }),
      }) as never,
      { params: Promise.resolve({ groupId: "group_1" }) }
    );

    await expect(response.json()).resolves.toEqual({
      membership: {
        id: "membership_1",
        groupId: "group_1",
        studentId: "student_1",
        isActive: true,
      },
      group: {
        id: "group_1",
        level: { id: "level_b1", code: "B1", title: "Intermediate" },
      },
    });
    expect(response.status).toBe(201);
    expect(tx.groupMembership.create).toHaveBeenCalledWith({
      data: { groupId: "group_1", studentId: "student_1" },
    });
    expect(tx.studentProfile.update).toHaveBeenCalledWith({
      where: { id: "student_1" },
      data: { currentLevelId: "level_b1" },
    });
  });
});
