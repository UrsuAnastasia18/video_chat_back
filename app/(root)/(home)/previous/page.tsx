import React from "react";
import CallList from "@/components/CallList";
import HomeSectionShell from "@/components/HomeSectionShell";

const Previous = () => {
  return (
    <HomeSectionShell
      eyebrow="Istoric"
      title="Anterioare"
      description=""
    >
      <CallList type="ended" />
    </HomeSectionShell>
  );
};

export default Previous;
