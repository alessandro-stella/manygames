"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [randomRoomId, setRandomRoomId] = useState("");

  useEffect(() => {
    setRandomRoomId(Math.random().toString(36).substring(2, 8));
  }, []);

  if (!randomRoomId) return <main className="min-h-screen flex items-center justify-center p-8">Caricamento...</main>;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-8">Piattaforma Minigiochi</h1>

      <div className="flex gap-4">
        <Link
          href={`/color/multiplayer/${randomRoomId}`}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition"
        >
          Crea Stanza: Colore
        </Link>
        <Link
          href={`/time/multiplayer/${randomRoomId}`}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition"
        >
          Crea Stanza: Tempo
        </Link>
      </div>
    </main>
  );
}
