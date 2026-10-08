"use client";

import GameCard from "@/components/GemeCard";
import { GAME_INFO } from "@/components/registry";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-8">ManyGames</h1>

      <div className="flex gap-4">
        {GAME_INFO.map((gameData) => (
          <GameCard
            key={gameData.link}
            title={gameData.title}
            description={gameData.description}
            img={gameData.img}
            link={gameData.link}
          />
        ))}
      </div>
    </main>
  );
}
