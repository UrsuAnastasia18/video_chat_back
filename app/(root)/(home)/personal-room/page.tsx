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

  const roomTopic = `Camera de ședințe a lui ${user?.username ?? "mine"}`;

  return (
    <section className="flex size-full flex-col gap-6 text-black">
      <div>
        <h1 className="text-3xl font-bold">Camera personală</h1>
        <p className="mt-1 text-sm text-slate-500">
          Spațiul tău privat pentru apeluri instant și invitații directe.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <PremiumPanel>
          <h2 className="text-lg font-semibold text-white">Detalii cameră</h2>
          <p className="mt-1 text-sm text-white/70">
            Trimite aceste detalii când cineva trebuie să intre în camera ta.
          </p>

          <div className="mt-4 space-y-3">
            <DetailItem label="Subiect" value={roomTopic} />
            <DetailItem label="ID ședință" value={meetingId ?? "Se încarcă..."} mono />
            <DetailItem label="Link invitație" value={meetingLink} mono />
          </div>
        </PremiumPanel>

        <PremiumPanel>
          <h2 className="text-lg font-semibold text-white">Acțiuni ședință</h2>
          <p className="mt-1 text-sm text-white/70">
            Pornește camera sau copiază invitația pentru participanți.
          </p>

          <div className="mt-5 flex flex-col gap-3">
            <Button className="bg-blue-1 py-5 text-sm font-semibold hover:bg-blue-1/90" onClick={startRoom}>
              Pornește ședința
            </Button>
            <Button
              className="bg-white/10 py-5 text-sm font-semibold text-white hover:bg-white/20"
              onClick={() => {
                navigator.clipboard.writeText(meetingLink);
                toast.success("Linkul de invitație a fost copiat");
              }}
            >
              Copiază invitația
            </Button>
          </div>

          <div className="mt-5 rounded-lg border border-white/15 bg-white/10 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/65">
              Informații invitație
            </p>
            <p className="mt-1 break-all text-xs text-white/85">{meetingLink}</p>
          </div>
        </PremiumPanel>
      </div>
    </section>
  );
};

export default PersonalRoom;
