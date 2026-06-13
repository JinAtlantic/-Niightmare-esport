import React from "react";
import TeamLogo from "@/components/TeamLogo";

/** Route-level loading fallback: the team logo pulses on the void. */
export default function Loading() {
  return (
    <div className="grid min-h-[70vh] place-items-center bg-void">
      <TeamLogo size={120} pulse />
    </div>
  );
}
