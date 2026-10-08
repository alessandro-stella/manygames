"use client";

import { useState } from "react";
import type { GameProps } from "./types";

type TimeData = { targetMs: number };
type TimeSubmission = { stoppedMs: number };

export default function TimeGame({
  data,
  submit,
  hasSubmitted,
}: GameProps<TimeData, TimeSubmission>) {
  const [startedAt, setStartedAt] = useState<number | null>(null);

  if (hasSubmitted) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-bold">Result submitted!</h2>
        <p className="text-gray-400">Check the leaderboard below.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-xl font-bold">
        Stop the timer at {(data.targetMs / 1000).toFixed(2)} seconds
      </h2>
      <p className="text-gray-400">The timer is hidden. Count in your head!</p>

      {startedAt === null ? (
        <button
          onClick={() => setStartedAt(performance.now())}
          className="bg-green-600 hover:bg-green-500 font-bold px-8 py-4 rounded"
        >
          Start
        </button>
      ) : (
        <button
          onClick={() => submit({ stoppedMs: performance.now() - startedAt })}
          className="bg-red-600 hover:bg-red-500 font-bold px-8 py-4 rounded"
        >
          Stop
        </button>
      )}
    </div>
  );
}
