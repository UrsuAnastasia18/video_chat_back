import { revalidatePath } from "next/cache";

export function revalidateTeacherGroupPaths(groupIds: string[]) {
  revalidatePath("/teacher/groups");

  for (const groupId of new Set(groupIds.filter(Boolean))) {
    revalidatePath(`/teacher/groups/${groupId}`);
    revalidatePath(`/teacher/gradebook/${groupId}`);
  }
}
