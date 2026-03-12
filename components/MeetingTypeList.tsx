"use client";

import { useEffect, useState } from "react";
import HomeCard from "./HomeCard";
import { useRouter } from "next/navigation";
import MeetingModal from "./MeetingModal";
import { useUser } from "@clerk/nextjs";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";
import { toast } from "sonner";
import { Textarea } from "./ui/textarea";
import ReactDatePicker from "react-datepicker";

type MeetingState =
  | "isScheduleMeeting"
  | "isJoiningMeeting"
  | "isInstantMeeting"
  | undefined;

interface TeacherGroupOption {
  id: string;
  name: string;
  level: {
    id: string;
    code: string;
    title: string;
  };
}

const MeetingTypeList = () => {
  const router = useRouter();
  const [meetingState, setMeetingState] = useState<MeetingState>();
  const { user } = useUser();
  const role = user?.publicMetadata?.role as "STUDENT" | "TEACHER_ADMIN" | undefined;
  const isTeacher = role === "TEACHER_ADMIN";
  const client = useStreamVideoClient();

  const [values, setValues] = useState({
    title: "",
    dateTime: new Date(),
    endDateTime: new Date(Date.now() + 60 * 60 * 1000),
    description: "",
    groupId: "",
  });

  const [teacherGroups, setTeacherGroups] = useState<TeacherGroupOption[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [callDetails, setCallDetails] = useState<Call>();

  useEffect(() => {
    if (!isTeacher || meetingState !== "isScheduleMeeting") {
      return;
    }

    const fetchGroups = async () => {
      setGroupsLoading(true);
      try {
        const res = await fetch("/api/groups");
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Failed to fetch groups");
        }
        const groups = (data.groups ?? []) as TeacherGroupOption[];
        setTeacherGroups(groups);
        setValues((prev) => ({
          ...prev,
          groupId: prev.groupId || groups[0]?.id || "",
        }));
      } catch (error) {
        toast.error("Failed to load teacher groups");
      } finally {
        setGroupsLoading(false);
      }
    };

    fetchGroups();
  }, [isTeacher, meetingState]);

  const createStreamCall = async (startsAtIso: string, description: string, title: string, groupId?: string) => {
    if (!client || !user) {
      throw new Error("Missing Stream client or user");
    }

    const id = crypto.randomUUID();
    const call = client.call("default", id);
    if (!call) {
      throw new Error("Failed to create call");
    }

    await call.getOrCreate({
      data: {
        starts_at: startsAtIso,
        custom: {
          description,
          title,
          groupId: groupId ?? null,
        },
      },
    });

    return call;
  };

  const createScheduledMeeting = async () => {
    if (!isTeacher) {
      toast.error("Only teachers can schedule lessons.");
      return;
    }

    const title = values.title.trim();
    if (!title) {
      toast.error("Please add a lesson title");
      return;
    }
    if (!values.groupId) {
      toast.error("Please select a group");
      return;
    }
    if (!values.dateTime || !values.endDateTime) {
      toast.error("Please select start and end date");
      return;
    }
    if (values.dateTime >= values.endDateTime) {
      toast.error("End time must be after start time");
      return;
    }

    try {
      const startsAtIso = values.dateTime.toISOString();
      const endsAtIso = values.endDateTime.toISOString();
      const description = values.description.trim();

      const call = await createStreamCall(
        startsAtIso,
        description || "Scheduled class meeting",
        title,
        values.groupId
      );

      const lessonRes = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          groupId: values.groupId,
          scheduledStart: startsAtIso,
          scheduledEnd: endsAtIso,
          streamCallId: call.id,
        }),
      });

      const lessonData = await lessonRes.json();
      if (!lessonRes.ok) {
        throw new Error(lessonData.error ?? "Failed to create lesson");
      }

      setCallDetails(call);
      toast.success("Meeting and lesson scheduled");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to schedule");
    }
  };

  const createInstantMeeting = async () => {
    if (!client || !user) return;

    try {
      const startsAt = new Date().toISOString();
      const call = await createStreamCall(startsAt, "Instant meeting", "Instant Meeting");
      router.push(`/meeting/${call.id}`);
      toast.success("Meeting created");
    } catch (error) {
      toast.error("Failed to create meeting");
    }
  };

  const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${callDetails?.id}`;

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      <HomeCard
        img="/icons/add-meeting.svg"
        title="New Meeting"
        description="Start an instant meeting"
        handleClick={() => setMeetingState("isInstantMeeting")}
        className="bg-orange-1"
      />
      <HomeCard
        img="/icons/schedule.svg"
        title="Schedule Meeting"
        description="Plan your meeting"
        handleClick={() => setMeetingState("isScheduleMeeting")}
        className="bg-blue-1"
      />
      <HomeCard
        img="/icons/recordings.svg"
        title="View Recordings"
        description="Check out your recordings"
        handleClick={() => router.push("/recordings")}
        className="bg-purple-1"
      />
      <HomeCard
        img="/icons/join-meeting.svg"
        title="Join Meeting"
        description="Join via invitation link"
        handleClick={() => setMeetingState("isJoiningMeeting")}
        className="bg-yellow-1"
      />

      {!callDetails ? (
        <MeetingModal
          isOpen={meetingState === "isScheduleMeeting"}
          onClose={() => setMeetingState(undefined)}
          title="Create Scheduled Lesson"
          handleClick={createScheduledMeeting}
        >
          {!isTeacher ? (
            <p className="text-sm text-red-300">
              Only teachers can schedule lessons.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-2.5">
                <label className="text-base text-normal leading-[22px] text-sky-2">
                  Lesson title
                </label>
                <input
                  value={values.title}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g. A1 Speaking Practice"
                  className="w-full rounded bg-dark-3 p-2 text-white focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-2.5">
                <label className="text-base text-normal leading-[22px] text-sky-2">
                  Select group
                </label>
                <select
                  value={values.groupId}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, groupId: e.target.value }))
                  }
                  className="w-full rounded bg-dark-3 p-2 text-white focus:outline-none"
                  disabled={groupsLoading || teacherGroups.length === 0}
                >
                  {teacherGroups.length === 0 ? (
                    <option value="">
                      {groupsLoading ? "Loading groups..." : "No groups available"}
                    </option>
                  ) : (
                    teacherGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name} ({group.level.code})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex flex-col gap-2.5">
                <label className="text-base text-normal leading-[22px] text-sky-2">
                  Add a description
                </label>
                <Textarea
                  className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, description: e.target.value }))
                  }
                />
              </div>

              <div className="flex w-full flex-col gap-2.5">
                <label className="text-base text-normal leading-[22px] text-sky-2">
                  Start date and time
                </label>
                <ReactDatePicker
                  selected={values.dateTime}
                  onChange={(date: Date | null) =>
                    setValues((prev) => ({ ...prev, dateTime: date ?? new Date() }))
                  }
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  timeCaption="time"
                  dateFormat="MMM d, yyyy h:mm aa"
                  className="w-full rounded bg-dark-3 p-2 focus:outline-none"
                />
              </div>

              <div className="flex w-full flex-col gap-2.5">
                <label className="text-base text-normal leading-[22px] text-sky-2">
                  End date and time
                </label>
                <ReactDatePicker
                  selected={values.endDateTime}
                  onChange={(date: Date | null) =>
                    setValues((prev) => ({
                      ...prev,
                      endDateTime: date ?? new Date(),
                    }))
                  }
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  timeCaption="time"
                  dateFormat="MMM d, yyyy h:mm aa"
                  className="w-full rounded bg-dark-3 p-2 focus:outline-none"
                />
              </div>
            </>
          )}
        </MeetingModal>
      ) : (
        <MeetingModal
          isOpen={meetingState === "isScheduleMeeting"}
          onClose={() => {
            setMeetingState(undefined);
            setCallDetails(undefined);
          }}
          title="Meeting Created"
          className="text-center"
          handleClick={() => {
            navigator.clipboard.writeText(meetingLink);
            toast("Link copied");
          }}
          image="/icons/checked.svg"
          buttonIcon="/icons/copy.svg"
          buttonText="Copy Meeting Link"
        />
      )}

      <MeetingModal
        isOpen={meetingState === "isInstantMeeting"}
        onClose={() => setMeetingState(undefined)}
        title="Start Instant Meeting"
        className="text-center"
        buttonText="Start Meeting"
        handleClick={createInstantMeeting}
      />
    </section>
  );
};

export default MeetingTypeList;
