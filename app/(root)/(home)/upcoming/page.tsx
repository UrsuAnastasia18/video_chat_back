import CallList from "@/components/CallList";
import HomeSectionShell from "@/components/HomeSectionShell";
import React from "react";

const Upcoming = () => {
  return (
    <HomeSectionShell
      eyebrow="Planificate"
      title="Urmează"
      description=""
    >
      <CallList type="upcoming" />
    </HomeSectionShell>
  );
};

export default Upcoming;
