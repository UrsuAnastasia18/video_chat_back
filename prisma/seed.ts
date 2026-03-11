import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── English Levels ───────────────────────────────────────────
  const levels = [
    { code: "A1", title: "Beginner", orderIndex: 1, description: "Basic English – introductions, simple phrases" },
    { code: "A2", title: "Elementary", orderIndex: 2, description: "Everyday expressions, basic communication" },
    { code: "B1", title: "Intermediate", orderIndex: 3, description: "Can deal with most travel situations, describe experiences" },
    { code: "B2", title: "Upper Intermediate", orderIndex: 4, description: "Can interact fluently with native speakers" },
    { code: "C1", title: "Advanced", orderIndex: 5, description: "Can use language flexibly for social, academic and professional purposes" },
  ];

  const levelRecords: Record<string, { id: string }> = {};

  for (const level of levels) {
    const record = await prisma.englishLevel.upsert({
      where: { code: level.code },
      update: { title: level.title, orderIndex: level.orderIndex, description: level.description },
      create: level,
    });
    levelRecords[level.code] = record;
    console.log(`  ✅ Level: ${level.code} — ${level.title}`);
  }

  // ─── Demo Teacher ─────────────────────────────────────────────
  const teacherUser = await prisma.user.upsert({
    where: { clerkUserId: "demo_teacher_clerk" },
    update: {},
    create: {
      clerkUserId: "demo_teacher_clerk",
      email: "teacher@demo.com",
      firstName: "Demo",
      lastName: "Teacher",
      role: "TEACHER_ADMIN",
      teacherProfile: {
        create: {},
      },
    },
    include: { teacherProfile: true },
  });
  console.log(`  ✅ Teacher: ${teacherUser.firstName} ${teacherUser.lastName} (${teacherUser.email})`);

  // ─── Demo Students ───────────────────────────────────────────
  const studentsData = [
    { clerkUserId: "demo_student_1_clerk", email: "maria@demo.com", firstName: "Maria", lastName: "Popescu", levelCode: "A1" },
    { clerkUserId: "demo_student_2_clerk", email: "andrei@demo.com", firstName: "Andrei", lastName: "Ionescu", levelCode: "A2" },
    { clerkUserId: "demo_student_3_clerk", email: "elena@demo.com", firstName: "Elena", lastName: "Dumitrescu", levelCode: "B1" },
  ];

  const studentRecords: { id: string; userId: string; firstName: string; lastName: string }[] = [];

  for (const s of studentsData) {
    const studentUser = await prisma.user.upsert({
      where: { clerkUserId: s.clerkUserId },
      update: {},
      create: {
        clerkUserId: s.clerkUserId,
        email: s.email,
        firstName: s.firstName,
        lastName: s.lastName,
        role: "STUDENT",
        studentProfile: {
          create: {
            currentLevelId: levelRecords[s.levelCode].id,
          },
        },
      },
      include: { studentProfile: true },
    });

    if (studentUser.studentProfile) {
      studentRecords.push({
        id: studentUser.studentProfile.id,
        userId: studentUser.id,
        firstName: studentUser.firstName,
        lastName: studentUser.lastName,
      });
    }

    console.log(`  ✅ Student: ${studentUser.firstName} ${studentUser.lastName} (${studentUser.email})`);
  }

  // ─── Demo Study Group ────────────────────────────────────────
  if (teacherUser.teacherProfile) {
    const demoGroupLevel = levelRecords["A1"];

    const group = await prisma.studyGroup.upsert({
      where: {
        teacherId_name: {
          teacherId: teacherUser.teacherProfile.id,
          name: "Grupa Alpha",
        },
      },
      update: {
        levelId: demoGroupLevel.id,
      },
      create: {
        name: "Grupa Alpha",
        description: "Grup demo pentru testarea platformei",
        teacherId: teacherUser.teacherProfile.id,
        levelId: demoGroupLevel.id,
      },
    });
    console.log(`  ✅ Group: ${group.name} (A1)`);

    // Add students to group
    for (const student of studentRecords) {
      await prisma.groupMembership.upsert({
        where: {
          groupId_studentId: {
            groupId: group.id,
            studentId: student.id,
          },
        },
        update: {},
        create: {
          groupId: group.id,
          studentId: student.id,
        },
      });
      await prisma.studentProfile.update({
        where: { id: student.id },
        data: { currentLevelId: demoGroupLevel.id },
      });
      console.log(`    ↳ Added ${student.firstName} ${student.lastName} to ${group.name}`);
    }
  }

  console.log("\n🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
