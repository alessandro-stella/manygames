"use client";

import { Suspense, useState } from "react";
import { useParams } from "next/navigation";
import { GAME_COMPONENTS, GAME_LOGIC } from "@/components/registry";

function SinglePlayerContent() {
  const { game } = useParams<{ game: string }>();

  const ActiveGame = GAME_COMPONENTS[game];
  const logic = GAME_LOGIC[game];

  const [fullData, setFullData] = useState<unknown>(null);
  const [score, setScore] = useState<number | null>(null);
  const [round, setRound] = useState(0);

  if (!ActiveGame || !logic) {
    return (
      <div className="p-8 text-red-500 text-center">Error: game not found.</div>
    );
  }

  const start = () => {
    setFullData(logic.generate());
    setScore(null);
    setRound((r) => r + 1);
  };

  const submit = (submission: unknown) => {
    setScore(logic.score(fullData, submission));
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white">
      <header className="max-w-4xl mx-auto flex justify-between border-b border-gray-700 pb-4 mb-8">
        <div>
          Mode: <span className="font-mono text-green-400">Singleplayer</span>
        </div>
      </header>

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
              <p className="text-2xl font-bold">Score: {score.toFixed(1)}</p>
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
