"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import ColorGame from "@/components/ColorGame";
import TimeGame from "@/components/TimeGame";

const GAMES = {
  color: ColorGame,
  time: TimeGame,
};

const mockSocket = {
  emit: (event: string, data: any) => {
    console.log(`[Singleplayer Offline] Caught event '${event}':`, data);
  },
  on: () => { },
  off: () => { },
  connect: () => { },
  disconnect: () => { },
  connected: false,
} as any;

function SinglePlayerContent() {
  const { game } = useParams();

  const ActiveGame = GAMES[game as keyof typeof GAMES];

  if (!ActiveGame) {
    return <div className="p-8 text-red-500 text-center">Error: lobby "{game}" not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white">
      <header className="max-w-4xl mx-auto flex justify-between border-b border-gray-700 pb-4 mb-8">
        <div>Mode: <span className="font-mono text-green-400">Singleplayer</span></div>
        <div>Player: <span className="font-bold">Tu (Offline)</span></div>
      </header>

      <ActiveGame socket={mockSocket} roomId="offline" username="SoloPlayer" />
    </div>
  );
}

export default function SinglePlayerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>}>
      <SinglePlayerContent />
    </Suspense>
  );
}
