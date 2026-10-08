import { Suspense } from "react";
import { GAME_INFO } from "@/components/registry";
import GameLinks from "@/components/GameLinks";

export function generateStaticParams() {
  return GAME_INFO.map((g) => ({ game: g.link }));
}

export default function Page({
  params,
}: {
  params: Promise<{ game: string }>;
}) {
  return (
    <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
      <GameContent params={params} />
    </Suspense>
  );
}

async function GameContent({ params }: { params: Promise<{ game: string }> }) {
  const { game } = await params;

  const gameExists = GAME_INFO.some((g) => g.link === game);
  if (!gameExists) {
    return <div className="text-red-500">Game not found!</div>;
  }

  return <GameLinks game={game} />;
}
