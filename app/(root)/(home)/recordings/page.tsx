import CallList from "@/components/CallList";
import HomeSectionShell from "@/components/HomeSectionShell";
import React from "react";

const Recordings = () => {
  return (
    <HomeSectionShell
      eyebrow="Bibliotecă video"
      title="Înregistrări"
      description=""
    >
      <CallList type="recordings" />
    </HomeSectionShell>
  );
};

export default Recordings;
