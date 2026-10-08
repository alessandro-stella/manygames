// GameLinks.tsx
"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function GameLinks({ game }: { game: string }) {
  const router = useRouter();

  const handleMultiplayerClick = () => {
    const randomRoomId = Math.random().toString(36).substring(2, 8);
    router.push(`/${game}/multiplayer/${randomRoomId}`);
  };

  return (
    <>
      <Link
        href={`/${game}/singleplayer`}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition"
      >
        Singleplayer
      </Link>
      <button
        onClick={handleMultiplayerClick}
        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition"
      >
        Multiplayer
      </button>
    </>
  );
}
