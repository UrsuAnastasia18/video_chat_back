// app/(root)/meeting/[id]/page.tsx
import React from "react";

interface MeetingPageProps {
  params: Promise<{ id: string }>;
}

const Meeting = async ({ params }: MeetingPageProps) => {
  const { id } = await params; // ✅ deblocăm promisiunea params
  return <div>Meeting Room: #{id}</div>;
};

export default Meeting;