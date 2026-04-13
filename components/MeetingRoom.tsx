import { cn } from "@/lib/utils";
import {
  CallControls,
  CallingState,
  CallParticipantsList,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import React, { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutList, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import EndCallButton from "./EndCallButton";
import { Loader } from "./Loader";

type CallLayoutType = "grid" | "speaker-left" | "speaker-right";

const layoutLabels: Record<CallLayoutType, string> = {
  grid: "Grilă",
  "speaker-left": "Vorbitor stânga",
  "speaker-right": "Vorbitor dreapta",
};

const MeetingRoom = () => {
  const searchParams = useSearchParams();
  const isPersonalRoom = !!searchParams.get("personal");
  const [layout, setLayout] = useState<CallLayoutType>("speaker-left");
  const [showParticipants, setShowParticipants] = useState(false);
  const router = useRouter();

  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  if (callingState !== CallingState.JOINED) return <Loader />;

  const CallLayout = () => {
    switch (layout) {
      case "grid":
        return <PaginatedGridLayout />;
      case "speaker-right":
        return <SpeakerLayout participantsBarPosition="left" />;
      default:
        return <SpeakerLayout participantsBarPosition="right" />;
    }
  };

  return (
    <section
      className="relative min-h-screen overflow-hidden px-4 pb-32 pt-4 text-[#17141f] sm:px-6 lg:px-8"
      style={{
        background:
          "radial-gradient(circle at 0% 14%, #f3a9c2 0 90px, transparent 91px)," +
          "radial-gradient(circle at 100% 24%, #ffe48c 0 150px, transparent 151px)," +
          "radial-gradient(circle at 8% 100%, #9697f3 0 130px, transparent 131px)," +
          "#fbf6f1",
      }}
    >
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-7xl flex-col gap-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="overflow-hidden rounded-4xl border border-[#eadfeb] bg-white shadow-[0_26px_80px_rgba(58,36,72,0.14)]">
            <div className="p-3 sm:p-4">
              <div className="meeting-stage-light overflow-hidden rounded-[28px] border border-[#eadfeb] bg-[#17141f] shadow-[0_24px_54px_rgba(23,20,31,0.2)] [&_.str-video__speaker-layout]:min-h-[480px] [&_.str-video__paginated-grid-layout]:min-h-[480px] [&_.str-video__participant-view]:rounded-3xl [&_.str-video__participant-view_.str-video__call-controls__button]:border [&_.str-video__participant-view_.str-video__call-controls__button]:border-[#eadfeb] [&_.str-video__participant-view_.str-video__call-controls__button]:bg-[#fff8f1] [&_.str-video__participant-view_.str-video__call-controls__button]:text-[#17141f] [&_.str-video__participant-view_.str-video__call-controls__button:hover]:bg-[#ffeef4] [&_.str-video__participant-view_.str-video__call-controls__button_.str-video__icon]:text-[#17141f]">
                <CallLayout />
              </div>
            </div>
          </div>

          <aside
            className={cn(
              "rounded-4xl border border-[#eadfeb] bg-white shadow-[0_18px_48px_rgba(58,36,72,0.08)]",
              !showParticipants && "hidden lg:block"
            )}
          >
            <div className="flex items-center justify-between border-b border-[#f5e8ef] px-5 py-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#df6f98]">
                  Participanți
                </p>
              </div>
              <button
                onClick={() => setShowParticipants(false)}
                className="rounded-full border border-[#eadfeb] px-3 py-1 text-xs font-semibold text-[#75697c] lg:hidden"
              >
                Închide
              </button>
            </div>
            <div className="participant-panel-light h-[calc(100vh-17rem)] min-h-[420px] overflow-hidden p-3 [&_.str-video__participant-list]:h-full [&_.str-video__participant-list]:rounded-3xl [&_.str-video__participant-list]:border [&_.str-video__participant-list]:border-[#eadfeb] [&_.str-video__participant-list]:bg-[linear-gradient(180deg,#ffffff_0%,#fff8f1_100%)]">
              <CallParticipantsList onClose={() => setShowParticipants(false)} />
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-4 z-20 px-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-center gap-3 rounded-[28px] border border-[#eadfeb] bg-white/95 px-4 py-3 shadow-[0_20px_60px_rgba(58,36,72,0.14)] backdrop-blur">
          <div className="meeting-controls-light [&_.str-video__call-controls]:flex [&_.str-video__call-controls]:flex-wrap [&_.str-video__call-controls]:justify-center [&_.str-video__call-controls]:gap-4 [&_.str-video__call-controls]:py-0">
            <CallControls onLeave={() => router.push("/")} />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="cursor-pointer rounded-full border border-[#eadfeb] bg-[#fff8f1] px-4 py-2 text-sm font-semibold text-[#17141f] transition hover:bg-[#ffeef4]">
              <span className="flex items-center gap-2">
                <LayoutList size={18} className="text-[#9697f3]" />
                Layout
              </span>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="border-[#eadfeb] bg-white text-[#17141f]">
              {(["grid", "speaker-left", "speaker-right"] as CallLayoutType[]).map((item) => (
                <div key={item}>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setLayout(item)}
                  >
                    {layoutLabels[item]}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="border-[#f5e8ef]" />
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={() => setShowParticipants((prev) => !prev)}
            className="rounded-full border border-[#eadfeb] bg-[#fff8f1] px-4 py-2 text-sm font-semibold text-[#17141f] transition hover:bg-[#ffeef4]"
          >
            <span className="flex items-center gap-2">
              <Users size={18} className="text-[#df6f98]" />
              Participanți
            </span>
          </button>

          {!isPersonalRoom && <EndCallButton />}
        </div>
      </div>
    </section>
  );
};

export default MeetingRoom;
