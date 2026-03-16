import CallList from "@/components/CallList";
import React from "react";

const Upcoming = () => {
  return (
    <section className="flex size-full flex-col gap-10 text-black">
      <div>
        <h1 className="text-3xl font-bold">Upcoming</h1>
        <p className="mt-1 text-sm text-slate-500">
          Includes lessons that are currently in progress.
        </p>
      </div>

      <CallList type="upcoming" />
    </section>
  );
};

export default Upcoming;
