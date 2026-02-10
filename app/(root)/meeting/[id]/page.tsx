"use client";

import { Loader } from "@/components/Loader";
import MeetingRoom from "@/components/MeetingRoom";
import MeetingSetup from "@/components/MeetingSetup";
import { useGetCallById } from "@/hooks/useGetCallById";
import { useUser } from "@clerk/nextjs";
import { StreamCall, StreamTheme } from "@stream-io/video-react-sdk";
import { useState } from "react";

interface MeetingPageProps {
  params: Promise<{ id: string }>;
}

const Meeting = async ({ params }: MeetingPageProps) => {
  const { id } = await params; // ✅ deblocăm promisiunea params

  const {user, isLoaded } = useUser();
  const [isSetupComplete, setIsSetupComplete ] = useState (false)
  const{ call, isCallLoading } = useGetCallById(id);

  if(!isLoaded || isCallLoading) return <Loader />
  
  
  return (
    <main className="h-screen w-full">
      <StreamCall call={call}>
        <StreamTheme>
          {!isSetupComplete ? (
            <MeetingSetup />
          ) : (
            <MeetingRoom/>
          )}
        </StreamTheme>
      </StreamCall>
    </main>
  )
};

export default Meeting;