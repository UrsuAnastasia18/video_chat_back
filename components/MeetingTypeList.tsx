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
import { sidebarLinks } from "@/constants";
import { getAppBaseUrl } from "@/lib/app-url";

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
  const recordingsIcon =
    sidebarLinks.find((link) => link.route === "/recordings")?.imgUrl ?? "/icons/video-camera-alt.png";
  const personalRoomIcon =
    sidebarLinks.find((link) => link.route === "/personal-room")?.imgUrl ?? "/icons/plus.png";

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
        if (!res.ok) throw new Error(data.error ?? "Nu am putut încărca grupele");
        const groups = (data.groups ?? []) as TeacherGroupOption[];
        setTeacherGroups(groups);
        setValues((prev) => ({ ...prev, groupId: prev.groupId || groups[0]?.id || "" }));
      } catch (error) {
        console.error("Nu am putut încărca grupele profesorului:", error);
        toast.error("Nu am putut încărca grupele profesorului");
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
    if (!client) throw new Error("Clientul Stream nu este pregătit");
    if (!user) throw new Error("Utilizatorul nu este pregătit");
    const id = crypto.randomUUID();
    const call = client.call("default", id);
    const custom: Record<string, string> = { title, description };
    if (groupId) custom.groupId = groupId;
    try {
      await call.getOrCreate({ data: { starts_at: new Date(startsAtIso).toISOString(), custom } });
    } catch (error) {
      throw error instanceof Error ? error : new Error("Nu am putut crea apelul Stream");
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
    if (!isTeacher) { toast.error("Doar profesorii pot programa lecții."); return; }
    const title = values.title.trim();
    const description = values.description.trim();
    if (!title) { toast.error("Te rog adaugă un titlu pentru lecție"); return; }
    if (!values.groupId) { toast.error("Te rog selectează o grupă"); return; }
    if (!values.dateTime || !values.endDateTime) { toast.error("Te rog selectează data de început și de sfârșit"); return; }
    if (values.dateTime >= values.endDateTime) { toast.error("Ora de sfârșit trebuie să fie după ora de început"); return; }

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
      if (!lessonRes.ok) throw new Error(lessonData.error ?? "Nu am putut crea lecția");
      const lessonId: string | undefined = lessonData.lesson?.id;
      if (!lessonId) throw new Error("Lecția a fost creată, dar răspunsul nu conține ID-ul lecției");

      let linkedCallId: string | null = null;
      const attachCallId = values.existingCallId.trim();
      const shouldCreate = values.callLinkMode === "create";
      const shouldAttach = values.callLinkMode === "attach";

      if (shouldAttach) {
        if (!attachCallId) throw new Error("Te rog introdu un ID de apel existent pentru asociere.");
        linkedCallId = attachCallId;
      } else if (shouldCreate) {
        const call = await createStreamCall(startsAtIso, description || "Ședință programată pentru lecție", title, values.groupId);
        linkedCallId = call.id;
      }

      if (linkedCallId) {
        const patchRes = await fetch(`/api/lessons/${lessonId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ streamCallId: linkedCallId }),
        });
        const patchData = await patchRes.json();
        if (!patchRes.ok) throw new Error(patchData.error ?? "Nu am putut asocia apelul cu lecția");
      }

      setScheduledLessonResult({ lessonId, streamCallId: linkedCallId });
      toast.success(linkedCallId ? "Lecția a fost programată și apelul a fost asociat." : "Lecția a fost programată.");
    } catch (error) {
      console.error("createScheduledMeeting error:", error);
      toast.error(error instanceof Error ? error.message : "Nu am putut programa lecția");
    }
  };

  const createInstantMeeting = async () => {
    try {
      const call = await createStreamCall(new Date().toISOString(), "Ședință instant", "Ședință instant");
      router.push(`/meeting/${call.id}`);
      toast.success("Ședința a fost creată");
    } catch (error) {
      console.error("createInstantMeeting error:", error);
      toast.error(error instanceof Error ? error.message : "Nu am putut crea ședința");
    }
  };

  const meetingLink =
    scheduledLessonResult?.streamCallId
      ? `${getAppBaseUrl()}/meeting/${scheduledLessonResult.streamCallId}`
      : "";

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {canUseGeneralCallTools && (
        <HomeCard
          img="/icons/add-meeting.svg"
          title="Ședință nouă"
          description="Pornește un apel instant"
          handleClick={() => setMeetingState("isInstantMeeting")}
          className="bg-orange-1"
        />
      )}

      {isTeacher && (
        <HomeCard
          img="/icons/schedule.svg"
          title="Programează lecție"
          description="Planifică o lecție și, opțional, un apel"
          handleClick={() => setMeetingState("isScheduleMeeting")}
          className="bg-blue-1"
        />
      )}

      {isTeacher && (
        <HomeCard
          img={recordingsIcon}
          title="Vezi înregistrările"
          description="Verifică înregistrările lecțiilor și apelurilor"
          handleClick={() => router.push("/recordings")}
          className="bg-purple-1"
        />
      )}

      {canUseGeneralCallTools && (
        <HomeCard
          img="/icons/join-meeting.svg"
          title="Intră în ședință"
          description="Intră folosind linkul de invitație"
          handleClick={() => setMeetingState("isJoiningMeeting")}
          className="bg-yellow-1"
        />
      )}

      {isStudent && (
        <HomeCard
          img={personalRoomIcon}
          title="Camera personală"
          description="Deschide camera ta personală"
          handleClick={() => router.push("/personal-room")}
          className="bg-blue-1"
        />
      )}

      {/* ── Schedule modal ── */}
      {!scheduledLessonResult ? (
        <MeetingModal
          isOpen={meetingState === "isScheduleMeeting"}
          onClose={() => { setMeetingState(undefined); resetScheduleState(); }}
          title="Programează o lecție"
          handleClick={createScheduledMeeting}
          buttonText="Creează lecția"
        >
          {!isTeacher ? (
            <p className="text-sm" style={{ color: "#ef4444" }}>Doar profesorii pot programa lecții.</p>
          ) : (
            <>
              <div className={fieldWrap}>
                <label style={labelStyle}>Titlul lecției</label>
                <input
                  style={inputStyle}
                  value={values.title}
                  onChange={(e) => setValues((p) => ({ ...p, title: e.target.value }))}
                  placeholder="ex. Practică de vorbire A1"
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "#4f8ef7"; }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "#e2e8f0"; }}
                />
              </div>

              <div className={fieldWrap}>
                <label style={labelStyle}>Selectează grupa</label>
                <select
                  style={selectStyle}
                  value={values.groupId}
                  onChange={(e) => setValues((p) => ({ ...p, groupId: e.target.value }))}
                  disabled={groupsLoading || teacherGroups.length === 0}
                >
                  {teacherGroups.length === 0 ? (
                    <option value="">{groupsLoading ? "Se încarcă grupele..." : "Nu există grupe disponibile"}</option>
                  ) : (
                    teacherGroups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name} ({g.level.code})</option>
                    ))
                  )}
                </select>
              </div>

              <div className={fieldWrap}>
                <label style={labelStyle}>Descriere (opțional)</label>
                <Textarea
                  value={values.description}
                  onChange={(e) => setValues((p) => ({ ...p, description: e.target.value }))}
                  className="resize-none rounded-xl border-none text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                  style={{ background: "#f8fafc", color: "#1e293b", fontSize: "13px", border: "1.5px solid #e2e8f0" }}
                  rows={2}
                />
              </div>

              <div className={fieldWrap}>
                <label style={labelStyle}>Modul de asociere a apelului</label>
                <select
                  style={selectStyle}
                  value={values.callLinkMode}
                  onChange={(e) => setValues((p) => ({ ...p, callLinkMode: e.target.value as CallLinkMode }))}
                >
                  <option value="create">Creează acum un apel nou</option>
                  <option value="attach">Asociază un ID de apel existent</option>
                  <option value="none">Fără link de apel momentan</option>
                </select>
              </div>

              {values.callLinkMode === "attach" && (
                <div className={fieldWrap}>
                  <label style={labelStyle}>ID apel existent</label>
                  <input
                    style={inputStyle}
                    value={values.existingCallId}
                    onChange={(e) => setValues((p) => ({ ...p, existingCallId: e.target.value }))}
                    placeholder="Lipește ID-ul apelului Stream"
                    onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "#4f8ef7"; }}
                    onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "#e2e8f0"; }}
                  />
                </div>
              )}

              <div className={fieldWrap}>
                <label style={labelStyle}>Data și ora de început</label>
                <ReactDatePicker
                  selected={values.dateTime}
                  onChange={(date: Date | null) => setValues((p) => ({ ...p, dateTime: date ?? new Date() }))}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  timeCaption="ora"
                  dateFormat="MMM d, yyyy HH:mm"
                  className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                  wrapperClassName="w-full"
                  calendarClassName="!font-sans"
                // inline input styling via wrapperClassName + global or module CSS
                />
              </div>

              <div className={fieldWrap}>
                <label style={labelStyle}>Data și ora de sfârșit</label>
                <ReactDatePicker
                  selected={values.endDateTime}
                  onChange={(date: Date | null) => setValues((p) => ({ ...p, endDateTime: date ?? new Date() }))}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  timeCaption="ora"
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
          title="Lecție programată!"
          className="text-center"
          handleClick={() => {
            if (!scheduledLessonResult.streamCallId) { setMeetingState(undefined); resetScheduleState(); return; }
            if (!meetingLink) { toast.error("Linkul ședinței nu este disponibil"); return; }
            navigator.clipboard.writeText(meetingLink);
            toast.success("Link copiat");
          }}
          image="/icons/checked.svg"
          buttonIcon={scheduledLessonResult.streamCallId ? "/icons/copy.svg" : undefined}
          buttonText={scheduledLessonResult.streamCallId ? "Copiază linkul ședinței" : "Închide"}
          description={
            scheduledLessonResult.streamCallId
              ? "Lecția a fost programată și apelul a fost asociat."
              : "Lecția a fost programată fără un apel asociat."
          }
        />
      )}

      {/* ── Instant meeting modal ── */}
      <MeetingModal
        isOpen={meetingState === "isInstantMeeting"}
        onClose={() => setMeetingState(undefined)}
        title="Pornește o ședință instant"
        className="text-center"
        buttonText="Pornește ședința"
        handleClick={createInstantMeeting}
      />

      {/* ── Join meeting modal ── */}
      <MeetingModal
        isOpen={meetingState === "isJoiningMeeting"}
        onClose={() => setMeetingState(undefined)}
        title="Intră în ședință"
        buttonText="Intră"
        handleClick={() => {
          if (values.existingCallId.trim()) {
            router.push(`/meeting/${values.existingCallId.trim()}`);
          } else {
            toast.error("Te rog introdu un link sau un ID de ședință");
          }
        }}
      >
        <div className={fieldWrap}>
          <label style={labelStyle}>Linkul ședinței sau ID-ul apelului</label>
          <input
            style={inputStyle}
            value={values.existingCallId}
            onChange={(e) => setValues((p) => ({ ...p, existingCallId: e.target.value }))}
            placeholder="Lipește linkul sau ID-ul apelului"
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "#4f8ef7"; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "#e2e8f0"; }}
          />
        </div>
      </MeetingModal>
    </section>
  );
};

export default MeetingTypeList;
