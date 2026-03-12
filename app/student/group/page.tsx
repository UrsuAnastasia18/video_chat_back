"use client";

import { useEffect, useState } from "react";

interface GroupData {
  id: string;
  name: string;
  description: string | null;
  level: {
    id: string;
    code: string;
    title: string;
  };
  teacher: {
    firstName: string;
    lastName: string;
  } | null;
}

interface MemberData {
  id: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

interface StudentGroupResponse {
  group: GroupData | null;
  membership: { joinedAt: string } | null;
  members: MemberData[];
}

export default function StudentGroupPage() {
  const [data, setData] = useState<StudentGroupResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroup = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/student/group");
        const payload = (await res.json()) as unknown;

        if (!res.ok) {
          const errorPayload = payload as { error?: string };
          throw new Error(errorPayload.error ?? "Failed to load group");
        }

        setData(payload as StudentGroupResponse);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load group");
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, []);

  return (
    <section className="flex size-full flex-col gap-6 text-black">
      <div>
        <h1 className="text-3xl font-bold">My Group</h1>
        <p className="text-sm text-slate-500">
          View your active group and your classmates.
        </p>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading group information...</p>
      ) : !data?.group ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          You are not assigned to an active group yet.
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-semibold">{data.group.name}</h2>
            {data.group.description ? (
              <p className="mt-2 text-sm text-slate-600">{data.group.description}</p>
            ) : null}
            <div className="mt-3 grid gap-1 text-sm text-slate-700">
              <p>
                <span className="font-semibold">Level:</span> {data.group.level.code} -{" "}
                {data.group.level.title}
              </p>
              {data.group.teacher ? (
                <p>
                  <span className="font-semibold">Teacher:</span>{" "}
                  {data.group.teacher.firstName} {data.group.teacher.lastName}
                </p>
              ) : null}
              {data.membership ? (
                <p>
                  <span className="font-semibold">Joined:</span>{" "}
                  {new Date(data.membership.joinedAt).toLocaleString()}
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-semibold">Group Members</h3>
            {data.members.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No members found.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {data.members.map((member) => (
                  <li
                    key={member.id}
                    className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  >
                    {member.user.firstName} {member.user.lastName}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}
