import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { POST } from "@/app/api/recordings/persist/route";

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  prisma: {
    lesson: {
      findMany: vi.fn(),
    },
    lessonRecording: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  requireCurrentUser: mocks.requireCurrentUser,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mocks.prisma,
}));

describe("modulul de inregistrari si istoric educational", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("salveaza prin upsert doar inregistrarile asociate lectiilor accesibile", async () => {
    vi.mocked(requireCurrentUser).mockResolvedValue({
      id: "user_teacher",
      role: "TEACHER_ADMIN",
      teacherProfile: { id: "teacher_1" },
    });
    vi.mocked(prisma.lesson.findMany).mockResolvedValue([
      { id: "lesson_1", streamCallId: "call_1" },
    ]);
    vi.mocked(prisma.lessonRecording.upsert).mockResolvedValue({ id: "recording_1" });

    const response = await POST(
      new Request("http://localhost/api/recordings/persist", {
        method: "POST",
        body: JSON.stringify({
          recordings: [
            {
              streamCallId: "call_1",
              streamRecordingId: "rec_1",
              recordingUrl: "https://stream.example/rec_1.mp4",
              title: "Lesson recording",
              startedAt: "2026-05-08T10:00:00.000Z",
              endedAt: "2026-05-08T11:00:00.000Z",
            },
            {
              streamCallId: "call_2",
              streamRecordingId: "rec_2",
              recordingUrl: "https://stream.example/rec_2.mp4",
            },
          ],
        }),
      }) as never
    );

    await expect(response.json()).resolves.toEqual({
      persisted: 1,
      skipped: 1,
    });
    expect(prisma.lesson.findMany).toHaveBeenCalledWith({
      where: {
        streamCallId: { in: ["call_1", "call_2"] },
        group: {
          teacherId: "teacher_1",
        },
      },
      select: {
        id: true,
        streamCallId: true,
      },
    });
    expect(prisma.lessonRecording.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.lessonRecording.upsert).toHaveBeenCalledWith({
      where: { streamRecordingId: "rec_1" },
      create: expect.objectContaining({
        lessonId: "lesson_1",
        streamCallId: "call_1",
        streamRecordingId: "rec_1",
        recordingUrl: "https://stream.example/rec_1.mp4",
      }),
      update: expect.objectContaining({
        lessonId: "lesson_1",
        streamCallId: "call_1",
        recordingUrl: "https://stream.example/rec_1.mp4",
      }),
    });
  });
});
