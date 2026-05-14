"use client";

import HomeSectionShell from "@/components/HomeSectionShell";
import { Button } from "@/components/ui/button";
import { useGetCallById } from "@/hooks/useGetCallById";
import { useUser } from "@clerk/nextjs";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import { getAppBaseUrl } from "@/lib/app-url";

const DetailItem = ({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <div className="rounded-[20px] border border-[#eadfeb] bg-white p-4 shadow-[0_12px_24px_rgba(58,36,72,0.06)]">
    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#df6f98]">{label}</p>
    <p className={`mt-2 break-all text-sm font-semibold text-[#17141f] ${mono ? "font-mono" : ""}`}>
      {value}
    </p>
  </div>
);

const PremiumPanel = ({ children }: { children: React.ReactNode }) => (
  <article
    className="relative overflow-hidden rounded-3xl border border-[#eadfeb] bg-[linear-gradient(180deg,#ffffff_0%,#fff8f1_100%)] p-5 text-[#17141f] shadow-[0_18px_42px_rgba(58,36,72,0.08)]"
  >
    <div
      className="absolute inset-0 opacity-[0.05]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg,#df6f98 0,#df6f98 1px,transparent 1px,transparent 48px)," +
          "repeating-linear-gradient(90deg,#f6a43a 0,#f6a43a 1px,transparent 1px,transparent 48px)",
      }}
    />
    <div
      className="absolute -right-16 -top-16 h-44 w-44 rounded-full opacity-[0.08]"
      style={{ background: "radial-gradient(circle, #f3a9c2 0%, transparent 70%)" }}
    />
    <div
      className="absolute -bottom-12 left-1/3 h-32 w-32 rounded-full opacity-[0.05]"
      style={{ background: "radial-gradient(circle, #9697f3 0%, transparent 70%)" }}
    />
    <div
      className="absolute bottom-6 right-8 h-24 w-24 rounded-full opacity-[0.08]"
      style={{ background: "radial-gradient(circle, #ffe48c 0%, transparent 70%)" }}
    />
    <div className="relative z-10">{children}</div>
  </article>
);

const PersonalRoom = () => {
  const { user } = useUser();
  const meetingId = user?.id;
  const meetingLink = `${getAppBaseUrl()}/meeting/${meetingId}?personal=true`;
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

  const roomTopic = `Camera de ședințe a lui ${user?.username ?? "mine"}`;

  return (
    <HomeSectionShell
      eyebrow="Spațiu privat"
      title="Camera personală"
      description=""
    >
      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <PremiumPanel>
          <h2 className="text-base font-black text-[#17141f]">Detalii cameră</h2>
          <p className="mt-1 text-sm text-[#75697c]">
            Trimite aceste detalii când cineva trebuie să intre în camera ta.
          </p>

          <div className="mt-4 space-y-3">
            <DetailItem label="Subiect" value={roomTopic} />
            <DetailItem label="ID ședință" value={meetingId ?? "Se încarcă..."} mono />
            <DetailItem label="Link invitație" value={meetingLink} mono />
          </div>
        </PremiumPanel>

        <PremiumPanel>
          <h2 className="text-base font-black text-[#17141f]">Acțiuni ședință</h2>
          <p className="mt-1 text-sm text-[#75697c]">
            Pornește camera sau copiază invitația pentru participanți.
          </p>

          <div className="mt-5 flex flex-col gap-3">
            <Button
              className="bg-[#9697f3] py-5 text-sm font-semibold text-white hover:bg-[#7c7de8]"
              onClick={startRoom}
            >
              Pornește ședința
            </Button>
            <Button
              className="border border-[#eadfeb] bg-white py-5 text-sm font-semibold text-[#17141f] hover:bg-[#fff8f1]"
              onClick={() => {
                navigator.clipboard.writeText(meetingLink);
                toast.success("Linkul de invitație a fost copiat");
              }}
            >
              Copiază invitația
            </Button>
          </div>

          <div className="mt-5 rounded-[20px] border border-[#eadfeb] bg-white p-3 shadow-[0_12px_24px_rgba(58,36,72,0.06)]">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#df6f98]">
              Informații invitație
            </p>
            <p className="mt-1 break-all text-xs text-[#17141f]">{meetingLink}</p>
          </div>
        </PremiumPanel>
      </div>
    </HomeSectionShell>
  );
};

export default PersonalRoom;
