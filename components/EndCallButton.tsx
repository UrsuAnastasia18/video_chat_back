"use client";

import { useCall, useCallStateHooks } from "@stream-io/video-react-sdk";
import React from "react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

const EndCallButton = () => {
  const call = useCall();
  const router = useRouter();

  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();

  const isMeetingOwner =
    localParticipant &&
    call?.state.createdBy &&
    localParticipant.userId === call.state.createdBy.id;

  if (!isMeetingOwner) return null;

  return (
    <Button
      onClick={async () => {
        await call.endCall();
        router.push("/");
      }}
      className="rounded-full bg-[#df6f98] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(223,111,152,0.26)] hover:bg-[#cf5f88]"
    >
      Încheie apelul pentru toți
    </Button>
  );
};

export default EndCallButton;
