"use client";

import { Button } from "@/components/ui/button";
import { useGetCallById } from "@/hooks/useGetCallById";
import { useUser } from "@clerk/nextjs";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

const DetailItem = ({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <div className="rounded-lg border border-white/15 bg-white/10 p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-white/65">{label}</p>
    <p className={`mt-2 break-all text-sm font-semibold text-white ${mono ? "font-mono" : ""}`}>
      {value}
    </p>
  </div>
);

const premiumPanelStyle = {
  background:
    "linear-gradient(135deg, #1e2d40 0%, #243650 55%, #1a3a5c 100%)",
};

const PremiumPanel = ({ children }: { children: React.ReactNode }) => (
  <article
    className="relative overflow-hidden rounded-xl p-5 text-white"
    style={premiumPanelStyle}
  >
    <div
      className="absolute inset-0 opacity-[0.035]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 48px)," +
          "repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 48px)",
      }}
    />
    <div
      className="absolute -right-16 -top-16 h-44 w-44 rounded-full opacity-[0.08]"
      style={{ background: "radial-gradient(circle, #4f8ef7 0%, transparent 70%)" }}
    />
    <div
      className="absolute -bottom-12 left-1/3 h-32 w-32 rounded-full opacity-[0.05]"
      style={{ background: "radial-gradient(circle, #818cf8 0%, transparent 70%)" }}
    />
    <div className="relative z-10">{children}</div>
  </article>
);

const PersonalRoom = () => {
  const { user } = useUser();
  const meetingId = user?.id;
  const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${meetingId}?personal=true`;
  const client = useStreamVideoClient();
  const { call } = useGetCallById(meetingId!);
  const router = useRouter();

  const startRoom = async () => {
    if (!client || !user) return;

    if (!call) {
      const newCall = client.call("default", meetingId!);

      await newCall.getOrCreate({
        data: {
          starts_at: new Date().toISOString(),
        },
      });
    }
    router.push(`/meeting/${meetingId}?personal=true`);
  };

  const roomTopic = `${user?.username ?? "My"}'s Meeting Room`;

  return (
    <section className="flex size-full flex-col gap-6 text-black">
      <div>
        <h1 className="text-3xl font-bold">Personal Room</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your private space for instant calls and direct invitations.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <PremiumPanel>
          <h2 className="text-lg font-semibold text-white">Room Details</h2>
          <p className="mt-1 text-sm text-white/70">
            Share these details when someone needs to join your room.
          </p>

          <div className="mt-4 space-y-3">
            <DetailItem label="Topic" value={roomTopic} />
            <DetailItem label="Meeting ID" value={meetingId ?? "Loading..."} mono />
            <DetailItem label="Invite Link" value={meetingLink} mono />
          </div>
        </PremiumPanel>

        <PremiumPanel>
          <h2 className="text-lg font-semibold text-white">Meeting Actions</h2>
          <p className="mt-1 text-sm text-white/70">
            Start your room or copy the invitation for guests.
          </p>

          <div className="mt-5 flex flex-col gap-3">
            <Button className="bg-blue-1 py-5 text-sm font-semibold hover:bg-blue-1/90" onClick={startRoom}>
              Start Meeting
            </Button>
            <Button
              className="bg-white/10 py-5 text-sm font-semibold text-white hover:bg-white/20"
              onClick={() => {
                navigator.clipboard.writeText(meetingLink);
                toast.success("Invitation link copied");
              }}
            >
              Copy Invitation
            </Button>
          </div>

          <div className="mt-5 rounded-lg border border-white/15 bg-white/10 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/65">
              Invitation Info
            </p>
            <p className="mt-1 break-all text-xs text-white/85">{meetingLink}</p>
          </div>
        </PremiumPanel>
      </div>
    </section>
  );
};

export default PersonalRoom;
