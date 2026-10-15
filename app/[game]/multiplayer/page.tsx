"use client";

import { useParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { socket } from "@/socket";

const ROOM_ID_REGEX = /^[A-HJ-NP-Z2-9]{5}$/;

function request<T>(event: string, payload: unknown): Promise<T | null> {
  return new Promise((resolve) => {
    if (!socket.connected) socket.connect();
    socket.timeout(5000).emit(event, payload, (err: Error | null, res: T) => {
      socket.disconnect();
      resolve(err ? null : res);
    });
  });
}

function MultiplayerPageContent() {
  const { game } = useParams<{ game: string }>();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const create = async () => {
    setError("");
    setLoading(true);
    const res = await request<{ ok: boolean; roomId?: string }>("create_room", {
      gameType: game,
    });
    setLoading(false);

    if (res?.ok && res.roomId) {
      router.push(`/${game}/multiplayer/${res.roomId}?create=1`);
    } else {
      setError("Could not create room.");
    }
  };

  const join = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const id = code.trim().toUpperCase();
    if (!ROOM_ID_REGEX.test(id)) return setError("Invalid room code.");

    setError("");
    setLoading(true);
    const res = await request<{ exists: boolean }>("room_exists", {
      roomId: id,
      gameType: game,
    });
    setLoading(false);

    if (res?.exists) router.push(`/${game}/multiplayer/${id}`);
    else setError(res ? "Room not found." : "Could not reach the server.");
  };

  return (
    <div className="flex-1 flex gap-4 items-center justify-center">
      <button
        onClick={create}
        disabled={loading}
        className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold p-3 rounded"
      >
        Create new room
      </button>

      <div className="flex flex-col items-center justify-center">
        <form
          onSubmit={join}
          className="bg-gray-800 p-8 rounded-xl flex flex-col gap-4 shadow-xl"
        >
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Join existing room
          </h2>
          <input
            type="text"
            placeholder="Room Id"
            value={code}
            maxLength={5}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError("");
            }}
            className="border-none p-3 rounded bg-gray-700 text-white font-mono uppercase focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold p-3 rounded"
          >
            Join Game
          </button>
        </form>
      </div>
    </div>
  );
}

export default function MultiplayerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
          Loading...
        </div>
      }
    >
      <MultiplayerPageContent />
    </Suspense>
  );
}
