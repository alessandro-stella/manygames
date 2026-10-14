"use client";

import { Suspense, useState } from "react";
import { useParams } from "next/navigation";
import { GAME_COMPONENTS, GAME_LOGIC } from "@/components/registry";

function SinglePlayerContent() {
  const { game } = useParams<{ game: string }>();

  const ActiveGame = GAME_COMPONENTS[game];
  const logic = GAME_LOGIC[game];

  const [fullData, setFullData] = useState<unknown>(() => {
    return logic ? logic.generate() : null;
  });
  const [score, setScore] = useState<number | null>(null);
  const [round, setRound] = useState(0);

  const start = () => {
    if (!logic) return;
    setFullData(logic.generate());
    setScore(null);
    setRound((r) => r + 1);
  };

  const submit = (submission: unknown) => {
    if (!logic) return;

    const calculatedScore = logic.score(fullData, submission);

    setScore(calculatedScore);
  };

  if (!ActiveGame || !logic) {
    return (
      <div className="p-8 text-red-500 text-center">Error: game not found.</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white grid place-content-center">
      {fullData === null ? (
        <div className="text-center">
          <button
            onClick={start}
            className="bg-green-600 hover:bg-green-500 font-bold px-8 py-4 rounded"
          >
            Start
          </button>
        </div>
      ) : (
        <>
          <ActiveGame
            key={round}
            data={logic.toPublic(fullData)}
            submit={submit}
            hasSubmitted={score !== null}
          />
          {score !== null && (
            <div className="text-center mt-8">
              <p className="text-2xl font-bold">
                Score:{" "}
                {Number.isNaN(score) ? "Errore di calcolo!" : score.toFixed(1)}
              </p>
              <button
                onClick={start}
                className="mt-4 bg-blue-600 hover:bg-blue-500 font-bold px-6 py-3 rounded"
              >
                Play again
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SinglePlayerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
          Loading...
        </div>
      }
    >
      <SinglePlayerContent />
    </Suspense>
  );
}
