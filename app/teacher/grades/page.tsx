import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

export default async function TeacherGradesPage() {
  const teacher = await requireTeacher();

  const firstGroup = await prisma.studyGroup.findFirst({
    where: { teacherId: teacher.teacherProfile.id },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!firstGroup) {
    redirect("/teacher/groups");
  }

  redirect(`/teacher/gradebook/${firstGroup.id}`);
}
