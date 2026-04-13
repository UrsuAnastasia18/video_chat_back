"use client";

import { Button } from "./ui/button";
import { DeviceSettings, VideoPreview, useCall } from "@stream-io/video-react-sdk";
import { Settings2 } from "lucide-react";
import React, { useEffect, useState } from "react";

const MeetingSetup = ({
  setIsSetupComplete,
}: {
  setIsSetupComplete: (value: boolean) => void;
}) => {
  const [isMicCamToggledOn, setIsMicCamToggledOn] = useState(false);
  const call = useCall();

  useEffect(() => {
    if (!call) {
      throw new Error("useCall trebuie folosit în interiorul componentei StreamCall");
    }

    if (isMicCamToggledOn) {
      call.camera.disable();
      call.microphone.disable();
      return;
    }

    call.camera.enable();
    call.microphone.enable();
  }, [isMicCamToggledOn, call]);

  return (
    <section
      className="relative min-h-screen overflow-hidden px-4 py-8 text-[#17141f] sm:px-6 lg:px-8"
      style={{
        background:
          "radial-gradient(circle at 0% 10%, #f3a9c2 0 90px, transparent 91px)," +
          "radial-gradient(circle at 100% 28%, #ffe48c 0 150px, transparent 151px)," +
          "radial-gradient(circle at 8% 100%, #9697f3 0 130px, transparent 131px)," +
          "#fbf6f1",
      }}
    >
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="relative w-full max-w-[760px]">
          <span className="pointer-events-none absolute -left-10 top-14 h-24 w-24 rounded-full bg-[#f3a9c2]/65" />
          <span className="pointer-events-none absolute -right-12 top-24 h-36 w-36 rounded-full bg-[#ffe48c]/75" />
          <span className="pointer-events-none absolute -bottom-4 left-1/2 h-16 w-16 -translate-x-1/2 rounded-full bg-[#9697f3]/60" />

          <div className="relative z-10 flex w-full flex-col rounded-[28px] border border-[#eadfeb] bg-[#fbf6f1] p-4 shadow-[0_26px_80px_rgba(58,36,72,0.14)] sm:p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="mt-1 text-2xl font-black text-[#17141f]">Intră în ședință</h2>
                <p className="mt-1 text-sm text-[#75697c]">
                  Verifică imaginea și alege cum vrei să înceapă apelul.
                </p>
              </div>
            </div>

            <div className="mx-auto w-fit max-w-full overflow-hidden rounded-3xl border border-[#eadfeb] bg-[#17141f] shadow-[0_20px_44px_rgba(23,20,31,0.18)]">
              <div className="[&_.str-video__video-preview]:mx-auto [&_.str-video__video-preview]:w-auto [&_.str-video__video-preview]:max-w-full [&_.str-video__video-preview]:min-h-0 [&_.str-video__video-preview]:bg-[#17141f] [&_.str-video__video-preview-container]:mx-auto [&_.str-video__video-preview-container]:w-auto [&_.str-video__video-preview-container]:max-w-full [&_.str-video__video-preview-container]:rounded-3xl">
                <VideoPreview />
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#eadfeb] bg-white px-4 py-3">
                <input
                  type="checkbox"
                  checked={isMicCamToggledOn}
                  onChange={(e) => setIsMicCamToggledOn(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-[#d4bfd7] text-[#df6f98] focus:ring-[#df6f98]"
                />
                <span>
                  <span className="block text-sm font-semibold text-[#17141f]">
                    Intră cu microfonul și camera oprite
                  </span>

                </span>
              </label>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#eadfeb] bg-white px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#17141f]">
                  <Settings2 size={16} className="text-[#9697f3]" />
                  Setări dispozitive
                </div>
                <div
                  className="
    [&_.str-video__menu-container]:rounded-[28px]
    [&_.str-video__menu-container]:border
    [&_.str-video__menu-container]:border-[#ddd3e4]
    [&_.str-video__menu-container]:bg-white
    [&_.str-video__menu-container]:shadow-[0_24px_60px_rgba(58,36,72,0.18)]

    [&_.str-video__device-settings]:bg-white
    [&_.str-video__device-settings]:text-[#17141f]

    [&_.str-video__device-settings__button]:rounded-full
    [&_.str-video__device-settings__button]:border
    [&_.str-video__device-settings__button]:border-[#ddd3e4]
    [&_.str-video__device-settings__button]:bg-[#f7f3ee]
    [&_.str-video__device-settings__button]:text-[#17141f]
    [&_.str-video__device-settings__button]:shadow-none

    [&_.str-video__device-settings__button:hover]:bg-[#f3eee8]
    [&_.str-video__device-settings__button:focus]:ring-0
  "
                >
                  <DeviceSettings />
                </div>
              </div>

              <Button
                className="h-12 w-full rounded-2xl bg-[#9697f3] text-sm font-bold text-white shadow-[0_14px_30px_rgba(150,151,243,0.34)] hover:bg-[#7f80ea]"
                onClick={() => {
                  call?.join();
                  setIsSetupComplete(true);
                }}
              >
                Intră în ședință
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MeetingSetup;
