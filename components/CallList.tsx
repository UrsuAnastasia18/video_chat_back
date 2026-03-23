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

type RecordingPersistPayload = {
  streamRecordingId: string;
  streamCallId: string;
  recordingUrl: string;
  filename: string | null;
  startTime: string | null;
  endTime: string | null;
  sessionId: string | null;
};

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

        const persistPayload: RecordingPersistPayload[] = [];
        callData.forEach((callResult, index) => {
          const streamCallId = callRecordings[index]?.id;
          if (!streamCallId) return;

          callResult.recordings.forEach((recording) => {
            if (!recording.url || !recording.session_id || !recording.filename) return;

            persistPayload.push({
              streamRecordingId: `${recording.session_id}:${recording.filename}`,
              streamCallId,
              recordingUrl: recording.url,
              filename: recording.filename ?? null,
              startTime: recording.start_time ?? null,
              endTime: recording.end_time ?? null,
              sessionId: recording.session_id ?? null,
            });
          });
        });

        setRecordings(recs);

        if (persistPayload.length > 0) {
          void fetch("/api/recordings/persist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recordings: persistPayload }),
          });
        }
      } catch {
        toast("Încearcă din nou");
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
          throw new Error(data.error ?? "Nu am putut încărca lecțiile");
        }

        setLessons((data.lessons ?? []) as LessonItem[]);
      } catch {
        toast.error("Nu am putut încărca lecțiile");
      } finally {
        setIsLessonsLoading(false);
      }
    };

    fetchLessons();
  }, [type]);

  const noCallsMessage = useMemo(() => {
    switch (type) {
      case "ended":
        return "Nu există lecții anterioare";
      case "recordings":
        return "Nu există înregistrări";
      case "upcoming":
        return "Nu există lecții viitoare sau în desfășurare";
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
              title={rec.filename?.substring(0, 20) || "Înregistrare"}
              date={new Date(rec.start_time).toLocaleString()}
              variant="banner"
              isPreviousMeeting={false}
              buttonIcon1="/icons/play.svg"
              buttonText="Redă"
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

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {lessons.length > 0 ? (
        (() => {
          const now = new Date();
          const inProgressLessons = lessons.filter((lesson) => {
            const scheduledStart = new Date(lesson.scheduledStart);
            const scheduledEnd = new Date(lesson.scheduledEnd);
            return scheduledStart <= now && scheduledEnd > now;
          });
          const futureLessons = lessons.filter((lesson) => {
            const scheduledStart = new Date(lesson.scheduledStart);
            return scheduledStart > now;
          });
          const renderLessonCard = (lesson: LessonItem, forceLive: boolean) => {
            const scheduledStart = new Date(lesson.scheduledStart);
            const scheduledEnd = new Date(lesson.scheduledEnd);
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
                status={forceLive ? "LIVE NOW" : lesson.status}
                variant="banner"
                date={`${scheduledStart.toLocaleString()} - ${scheduledEnd.toLocaleString()}`}
                isPreviousMeeting={type === "ended"}
                buttonText="Deschide ședința"
                hideActions={false}
                primaryDisabled={!hasCallLink}
                emptyStateText={!hasCallLink ? "Nu există apel asociat" : undefined}
                handleClick={() => {
                  if (!hasCallLink) {
                    return;
                  }
                  router.push(meetingPath);
                }}
                link={shareLink}
                secondaryButtonText={isTeacher ? "Deschide lecția" : undefined}
                onSecondaryClick={
                  isTeacher
                    ? () => router.push(`/teacher/lessons/${lesson.id}`)
                    : undefined
                }
              />
            );
          };

          if (type !== "upcoming") {
            return lessons.map((lesson) => renderLessonCard(lesson, false));
          }

          return (
            <div className="col-span-full flex flex-col gap-5">
              {inProgressLessons.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-700">
                    În desfășurare acum
                  </p>
                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    {inProgressLessons.map((lesson) => renderLessonCard(lesson, true))}
                  </div>
                </div>
              ) : null}

              {futureLessons.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                    Urmează
                  </p>
                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    {futureLessons.map((lesson) => renderLessonCard(lesson, false))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })()
      ) : (
        <h1>{noCallsMessage}</h1>
      )}
    </div>
  );
};

export default CallList;
