"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useGetCalls } from "@/hooks/useGetCalls";
import { useRouter } from "next/navigation";
import { CallRecording } from "@stream-io/video-react-sdk";
import MeetingCard from "./MeetingCard";
import { Loader } from "./Loader";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

interface LessonItem {
  id: string;
  title: string;
  description: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
  streamCallId: string | null;
  group: {
    id: string;
    name: string;
    level: {
      id: string;
      code: string;
      title: string;
    };
  };
}

const CallList = ({ type }: { type: "ended" | "upcoming" | "recordings" }) => {
  const { user } = useUser();
  const { callRecordings, isLoading: recordingsLoading } = useGetCalls({
    enabled: type === "recordings",
  });
  const router = useRouter();
  const [recordings, setRecordings] = useState<CallRecording[]>([]);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [isLessonsLoading, setIsLessonsLoading] = useState(false);
  const role = user?.publicMetadata?.role;
  const isTeacher = role === "TEACHER_ADMIN";

  useEffect(() => {
    if (type !== "recordings") return;

    const fetchRecordings = async () => {
      try {
        const callData = await Promise.all(
          callRecordings.map((meeting) => meeting.queryRecordings())
        );

        const recs = callData
          .filter((c) => c.recordings.length > 0)
          .flatMap((c) => c.recordings);

        setRecordings(recs);
      } catch  {
        toast("Try again");
      }
    };

    fetchRecordings();
  }, [type, callRecordings]);

  useEffect(() => {
    if (type === "recordings") return;

    const fetchLessons = async () => {
      setIsLessonsLoading(true);
      try {
        const query = type === "upcoming" ? "?upcoming=true" : "?previous=true";
        const res = await fetch(`/api/lessons${query}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? "Failed to load lessons");
        }

        setLessons((data.lessons ?? []) as LessonItem[]);
      } catch {
        toast.error("Failed to load lessons");
      } finally {
        setIsLessonsLoading(false);
      }
    };

    fetchLessons();
  }, [type]);

  const noCallsMessage = useMemo(() => {
    switch (type) {
      case "ended":
       return "No previous lessons";
      case "recordings":
        return "No recordings";
      case "upcoming":
        return "No upcoming lessons";
    }
  }, [type]);

  if ((type === "recordings" && recordingsLoading) || (type !== "recordings" && isLessonsLoading)) {
    return <Loader />;
  }

  if (type === "recordings") {
    return (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {recordings.length > 0 ? (
          recordings.map((rec) => (
            <MeetingCard
              key={rec.url}
              icon="/icons/recording.svg"
              title={rec.filename?.substring(0, 20) || "Recording"}
              date={new Date(rec.start_time).toLocaleString()}
              isPreviousMeeting={false}
              buttonIcon1="/icons/play.svg"
              buttonText="Play"
              handleClick={() => router.push(rec.url)}
              link={rec.url}
            />
          ))
        ) : (
          <h1>{noCallsMessage}</h1>
        )}
      </div>
    );
  }
   // ✅ CALLS render (Call)
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {lessons.length > 0 ? (
        lessons.map((lesson) => {
          const hasCallLink = !!lesson.streamCallId;
          const meetingPath = hasCallLink ? `/meeting/${lesson.streamCallId}` : "";
          const shareLink = hasCallLink
            ? `${process.env.NEXT_PUBLIC_BASE_URL}${meetingPath}`
            : undefined;

          return (
          <MeetingCard
            key={lesson.id}
            icon={type === "ended" ? "/icons/previous.svg" : "/icons/upcoming.svg"}
            title={lesson.title}
              subtitle={`${lesson.group.name} (${lesson.group.level.code})`}
              status={lesson.status}
              date={`${new Date(lesson.scheduledStart).toLocaleString()} - ${new Date(
                lesson.scheduledEnd
              ).toLocaleString()}`}
            isPreviousMeeting={type === "ended"}
            buttonText={hasCallLink ? "Open Meeting" : "No Link"}
              hideActions={type === "upcoming" && !hasCallLink}
              handleClick={() => {
                if (!hasCallLink) {
                  toast.info("This lesson has no meeting link yet.");
                  return;
                }
                router.push(meetingPath);
              }}
              link={shareLink}
              secondaryButtonText={isTeacher ? "Grade Students" : undefined}
              onSecondaryClick={
                isTeacher
                  ? () => router.push(`/teacher/lessons/${lesson.id}`)
                  : undefined
              }
          />
            );
          })
      ) : (
        <h1>{noCallsMessage}</h1>
      )}
    </div>
  );
};

export default CallList;