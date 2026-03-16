"use client";

import { useEffect, useState } from "react";
import HomeCard from "./HomeCard";
import { useRouter } from "next/navigation";
import MeetingModal from "./MeetingModal";
import { useUser } from "@clerk/nextjs";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
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
  level: { id: string; code: string; title: string };
}

type CallLinkMode = "create" | "attach" | "none";

/* ── shared field styles ─────────────────────────────────────────────────── */
const labelStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#64748b",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: "0.75rem",
  padding: "9px 13px",
  fontSize: "13px",
  background: "#f8fafc",
  border: "1.5px solid #e2e8f0",
  color: "#1e293b",
  outline: "none",
  transition: "border-color 0.15s",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
  appearance: "none" as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  backgroundSize: "14px",
  paddingRight: "36px",
};

const fieldWrap = "flex flex-col gap-1.5";

const MeetingTypeList = () => {
  const router = useRouter();
  const [meetingState, setMeetingState] = useState<MeetingState>();
  const { user } = useUser();
  const role = user?.publicMetadata?.role as "STUDENT" | "TEACHER_ADMIN" | undefined;
  const isTeacher = role === "TEACHER_ADMIN";
  const isStudent = role === "STUDENT";
  const canUseGeneralCallTools = isTeacher || isStudent || !role;
  const client = useStreamVideoClient();

  const [values, setValues] = useState({
    title: "",
    dateTime: new Date(),
    endDateTime: new Date(Date.now() + 60 * 60 * 1000),
    description: "",
    groupId: "",
    callLinkMode: "create" as CallLinkMode,
    existingCallId: "",
  });

  const [teacherGroups, setTeacherGroups] = useState<TeacherGroupOption[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [scheduledLessonResult, setScheduledLessonResult] = useState<{
    lessonId: string;
    streamCallId: string | null;
  } | null>(null);

  useEffect(() => {
    if (!isTeacher || meetingState !== "isScheduleMeeting") return;
    const fetchGroups = async () => {
      setGroupsLoading(true);
      try {
        const res = await fetch("/api/groups", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to fetch groups");
        const groups = (data.groups ?? []) as TeacherGroupOption[];
        setTeacherGroups(groups);
        setValues((prev) => ({ ...prev, groupId: prev.groupId || groups[0]?.id || "" }));
      } catch (error) {
        console.error("Failed to load teacher groups:", error);
        toast.error("Failed to load teacher groups");
      } finally {
        setGroupsLoading(false);
      }
    };
    fetchGroups();
  }, [isTeacher, meetingState]);

  const createStreamCall = async (
    startsAtIso: string,
    description: string,
    title: string,
    groupId?: string
  ) => {
    if (!client) throw new Error("Stream client is not ready");
    if (!user) throw new Error("User is not ready");
    const id = crypto.randomUUID();
    const call = client.call("default", id);
    const custom: Record<string, string> = { title, description };
    if (groupId) custom.groupId = groupId;
    try {
      await call.getOrCreate({ data: { starts_at: new Date(startsAtIso).toISOString(), custom } });
    } catch (error) {
      throw error instanceof Error ? error : new Error("Failed to create Stream call");
    }
    return call;
  };

  const resetScheduleState = () => {
    setValues({
      title: "",
      dateTime: new Date(),
      endDateTime: new Date(Date.now() + 60 * 60 * 1000),
      description: "",
      groupId: teacherGroups[0]?.id || "",
      callLinkMode: "create",
      existingCallId: "",
    });
    setScheduledLessonResult(null);
  };

  const createScheduledMeeting = async () => {
    if (!isTeacher) { toast.error("Only teachers can schedule lessons."); return; }
    const title = values.title.trim();
    const description = values.description.trim();
    if (!title) { toast.error("Please add a lesson title"); return; }
    if (!values.groupId) { toast.error("Please select a group"); return; }
    if (!values.dateTime || !values.endDateTime) { toast.error("Please select start and end date"); return; }
    if (values.dateTime >= values.endDateTime) { toast.error("End time must be after start time"); return; }

    try {
      const startsAtIso = values.dateTime.toISOString();
      const endsAtIso = values.endDateTime.toISOString();

      const lessonRes = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description: description || null,
          groupId: values.groupId,
          scheduledStart: startsAtIso,
          scheduledEnd: endsAtIso,
          streamCallId: null,
        }),
      });
      const lessonData = await lessonRes.json();
      if (!lessonRes.ok) throw new Error(lessonData.error ?? "Failed to create lesson");
      const lessonId: string | undefined = lessonData.lesson?.id;
      if (!lessonId) throw new Error("Lesson created but response is missing lesson id");

      let linkedCallId: string | null = null;
      const attachCallId = values.existingCallId.trim();
      const shouldCreate = values.callLinkMode === "create";
      const shouldAttach = values.callLinkMode === "attach";

      if (shouldAttach) {
        if (!attachCallId) throw new Error("Please provide an existing call ID to attach.");
        linkedCallId = attachCallId;
      } else if (shouldCreate) {
        const call = await createStreamCall(startsAtIso, description || "Scheduled class meeting", title, values.groupId);
        linkedCallId = call.id;
      }

      if (linkedCallId) {
        const patchRes = await fetch(`/api/lessons/${lessonId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ streamCallId: linkedCallId }),
        });
        const patchData = await patchRes.json();
        if (!patchRes.ok) throw new Error(patchData.error ?? "Failed to link call to lesson");
      }

      setScheduledLessonResult({ lessonId, streamCallId: linkedCallId });
      toast.success(linkedCallId ? "Lesson scheduled. Call linked." : "Lesson scheduled.");
    } catch (error) {
      console.error("createScheduledMeeting error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to schedule");
    }
  };

  const createInstantMeeting = async () => {
    try {
      const call = await createStreamCall(new Date().toISOString(), "Instant meeting", "Instant Meeting");
      router.push(`/meeting/${call.id}`);
      toast.success("Meeting created");
    } catch (error) {
      console.error("createInstantMeeting error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create meeting");
    }
  };

  const meetingLink =
    scheduledLessonResult?.streamCallId && process.env.NEXT_PUBLIC_BASE_URL
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${scheduledLessonResult.streamCallId}`
      : "";

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {canUseGeneralCallTools && (
        <HomeCard
          img="/icons/add-meeting.svg"
          title="New Meeting"
          description="Start an instant call"
          handleClick={() => setMeetingState("isInstantMeeting")}
          className="bg-orange-1"
        />
      )}

      {isTeacher && (
        <HomeCard
          img="/icons/schedule.svg"
          title="Schedule Lesson"
          description="Plan a lesson and optional call"
          handleClick={() => setMeetingState("isScheduleMeeting")}
          className="bg-blue-1"
        />
      )}

      {isTeacher && (
        <HomeCard
          img="/icons/recordings.svg"
          title="View Recordings"
          description="Check lesson and call recordings"
          handleClick={() => router.push("/recordings")}
          className="bg-purple-1"
        />
      )}

      {canUseGeneralCallTools && (
        <HomeCard
          img="/icons/join-meeting.svg"
          title="Join Meeting"
          description="Join via invitation link"
          handleClick={() => setMeetingState("isJoiningMeeting")}
          className="bg-yellow-1"
        />
      )}

      {isStudent && (
        <HomeCard
          img="/icons/add-personal.svg"
          title="Personal Room"
          description="Open your personal room"
          handleClick={() => router.push("/personal-room")}
          className="bg-blue-1"
        />
      )}

      {/* ── Schedule modal ── */}
      {!scheduledLessonResult ? (
        <MeetingModal
          isOpen={meetingState === "isScheduleMeeting"}
          onClose={() => { setMeetingState(undefined); resetScheduleState(); }}
          title="Schedule a Lesson"
          handleClick={createScheduledMeeting}
          buttonText="Create Lesson"
        >
          {!isTeacher ? (
            <p className="text-sm" style={{ color: "#ef4444" }}>Only teachers can schedule lessons.</p>
          ) : (
            <>
              <div className={fieldWrap}>
                <label style={labelStyle}>Lesson title</label>
                <input
                  style={inputStyle}
                  value={values.title}
                  onChange={(e) => setValues((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. A1 Speaking Practice"
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "#4f8ef7"; }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "#e2e8f0"; }}
                />
              </div>

              <div className={fieldWrap}>
                <label style={labelStyle}>Select group</label>
                <select
                  style={selectStyle}
                  value={values.groupId}
                  onChange={(e) => setValues((p) => ({ ...p, groupId: e.target.value }))}
                  disabled={groupsLoading || teacherGroups.length === 0}
                >
                  {teacherGroups.length === 0 ? (
                    <option value="">{groupsLoading ? "Loading groups..." : "No groups available"}</option>
                  ) : (
                    teacherGroups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name} ({g.level.code})</option>
                    ))
                  )}
                </select>
              </div>

              <div className={fieldWrap}>
                <label style={labelStyle}>Description (optional)</label>
                <Textarea
                  value={values.description}
                  onChange={(e) => setValues((p) => ({ ...p, description: e.target.value }))}
                  className="resize-none rounded-xl border-none text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                  style={{ background: "#f8fafc", color: "#1e293b", fontSize: "13px", border: "1.5px solid #e2e8f0" }}
                  rows={2}
                />
              </div>

              <div className={fieldWrap}>
                <label style={labelStyle}>Call link mode</label>
                <select
                  style={selectStyle}
                  value={values.callLinkMode}
                  onChange={(e) => setValues((p) => ({ ...p, callLinkMode: e.target.value as CallLinkMode }))}
                >
                  <option value="create">Create a new call now</option>
                  <option value="attach">Attach existing call ID</option>
                  <option value="none">No call link yet</option>
                </select>
              </div>

              {values.callLinkMode === "attach" && (
                <div className={fieldWrap}>
                  <label style={labelStyle}>Existing call ID</label>
                  <input
                    style={inputStyle}
                    value={values.existingCallId}
                    onChange={(e) => setValues((p) => ({ ...p, existingCallId: e.target.value }))}
                    placeholder="Paste Stream call ID"
                    onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "#4f8ef7"; }}
                    onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "#e2e8f0"; }}
                  />
                </div>
              )}

              <div className={fieldWrap}>
                <label style={labelStyle}>Start date & time</label>
                <ReactDatePicker
                  selected={values.dateTime}
                  onChange={(date: Date | null) => setValues((p) => ({ ...p, dateTime: date ?? new Date() }))}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  timeCaption="time"
                  dateFormat="MMM d, yyyy HH:mm"
                  className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                  wrapperClassName="w-full"
                  calendarClassName="!font-sans"
                // inline input styling via wrapperClassName + global or module CSS
                />
              </div>

              <div className={fieldWrap}>
                <label style={labelStyle}>End date & time</label>
                <ReactDatePicker
                  selected={values.endDateTime}
                  onChange={(date: Date | null) => setValues((p) => ({ ...p, endDateTime: date ?? new Date() }))}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  timeCaption="time"
                  dateFormat="MMM d, yyyy HH:mm"
                  className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                  wrapperClassName="w-full"
                />
              </div>
            </>
          )}
        </MeetingModal>
      ) : (
        <MeetingModal
          isOpen={meetingState === "isScheduleMeeting"}
          onClose={() => { setMeetingState(undefined); resetScheduleState(); }}
          title="Lesson Scheduled!"
          className="text-center"
          handleClick={() => {
            if (!scheduledLessonResult.streamCallId) { setMeetingState(undefined); resetScheduleState(); return; }
            if (!meetingLink) { toast.error("Meeting link is not available"); return; }
            navigator.clipboard.writeText(meetingLink);
            toast.success("Link copied");
          }}
          image="/icons/checked.svg"
          buttonIcon={scheduledLessonResult.streamCallId ? "/icons/copy.svg" : undefined}
          buttonText={scheduledLessonResult.streamCallId ? "Copy Meeting Link" : "Close"}
          description={
            scheduledLessonResult.streamCallId
              ? "Lesson scheduled and call linked."
              : "Lesson scheduled without a linked call."
          }
        />
      )}

      {/* ── Instant meeting modal ── */}
      <MeetingModal
        isOpen={meetingState === "isInstantMeeting"}
        onClose={() => setMeetingState(undefined)}
        title="Start Instant Meeting"
        className="text-center"
        buttonText="Start Meeting"
        handleClick={createInstantMeeting}
      />

      {/* ── Join meeting modal ── */}
      <MeetingModal
        isOpen={meetingState === "isJoiningMeeting"}
        onClose={() => setMeetingState(undefined)}
        title="Join Meeting"
        buttonText="Join"
        handleClick={() => {
          if (values.existingCallId.trim()) {
            router.push(`/meeting/${values.existingCallId.trim()}`);
          } else {
            toast.error("Please enter a meeting link or ID");
          }
        }}
      >
        <div className={fieldWrap}>
          <label style={labelStyle}>Meeting link or call ID</label>
          <input
            style={inputStyle}
            value={values.existingCallId}
            onChange={(e) => setValues((p) => ({ ...p, existingCallId: e.target.value }))}
            placeholder="Paste link or call ID"
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "#4f8ef7"; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "#e2e8f0"; }}
          />
        </div>
      </MeetingModal>
    </section>
  );
};

export default MeetingTypeList;
