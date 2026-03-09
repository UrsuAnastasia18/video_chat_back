"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useGetCalls } from "@/hooks/useGetCalls";
import { useRouter } from "next/navigation";
import { Call, CallRecording } from "@stream-io/video-react-sdk";
import MeetingCard from "./MeetingCard";
import { Loader } from "./Loader";
import { toast } from "sonner";

const CallList = ({ type }: { type: "ended" | "upcoming" | "recordings" }) => {
  const { endedCalls, upcomingCalls, callRecordings, isLoading } = useGetCalls();
  const router = useRouter();
  const [recordings, setRecordings] = useState<CallRecording[]>([]);

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
      } catch (error) {
        toast("Try again");
      }
    };

    fetchRecordings();
  }, [type, callRecordings]);

  const noCallsMessage = useMemo(() => {
    switch (type) {
      case "ended":
        return "No previous calls";
      case "recordings":
        return "No recordings";
      case "upcoming":
        return "No upcoming calls";
    }
  }, [type]);

  const calls: Call[] = useMemo(() => {
    if (type === "ended") return endedCalls;
    if (type === "upcoming") return upcomingCalls;
    return [];
  }, [type, endedCalls, upcomingCalls]);

  if (isLoading) return <Loader />;

  // ✅ RECORDINGS render (CallRecording)
  if (type === "recordings") {
    return (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {recordings.length > 0 ? (
          recordings.map((rec) => (
            <MeetingCard
              key={rec.url} // recordings nu au id ca un Call
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
      {calls.length > 0 ? (
        calls.map((call) => (
          <MeetingCard
            key={call.id}
            icon={type === "ended" ? "/icons/previous.svg" : "/icons/upcoming.svg"}
            title={call.state?.custom?.description?.substring(0, 25) || "No description"}
            date={call.state?.startsAt ? call.state.startsAt.toLocaleString() : ""}
            isPreviousMeeting={type === "ended"}
            buttonText={type === "ended" ? "Start" : "Start"}
            handleClick={() => router.push(`/meeting/${call.id}`)}
            link={`${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${call.id}`}
          />
        ))
      ) : (
        <h1>{noCallsMessage}</h1>
      )}
    </div>
  );
};

export default CallList;