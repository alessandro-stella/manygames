"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import { socket } from "@/socket";
import ColorGame from "@/components/ColorGame";
import TimeGame from "@/components/TimeGame";

const GAMES = {
  color: ColorGame,
  time: TimeGame,
};

function MultiplayerLobbyContent() {
  const { game, roomId } = useParams();
  const [username, setUsername] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [players, setPlayers] = useState<{ id: string; username: string }[]>(
    [],
  );

  const ActiveGame = GAMES[game as keyof typeof GAMES];

  useEffect(() => {
    const onRoomState = (data: {
      players: { id: string; username: string }[];
    }) => {
      setPlayers(data.players);
    };

    const onPlayerJoined = (data: { id: string; username: string }) => {
      setPlayers((prev) => [...prev, data]);
    };

    const savedSession = sessionStorage.getItem(`minigames_${roomId}`);
    if (savedSession && !socket.connected) {
      setUsername(savedSession);
      setIsJoined(true);
      socket.connect();
      socket.emit("join_room", {
        roomId,
        username: savedSession,
        gameType: game,
      });
    }

    socket.on("room_state", onRoomState);
    socket.on("player_joined", onPlayerJoined);

    return () => {
      socket.off("room_state", onRoomState);
      socket.off("player_joined", onPlayerJoined);
      if (socket.connected) socket.disconnect();
    };
  }, [roomId, game]);

  if (!ActiveGame) {
    return (
      <div className="p-8 text-red-500 text-center">
        Error: Game "{game}" not found.
      </div>
    );
  }

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    sessionStorage.setItem(`minigames_${roomId}`, username);

    socket.connect();
    socket.emit("join_room", { roomId, username, gameType: game });
    setIsJoined(true);
  };

  if (!isJoined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black">
        <form
          onSubmit={handleJoin}
          className="bg-gray-800 p-8 rounded-xl flex flex-col gap-4 shadow-xl"
        >
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Room: {roomId}
          </h2>
          <input
            type="text"
            placeholder="Your Nickname..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border-none p-3 rounded bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-500 text-white font-bold p-3 rounded"
          >
            Join Game
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white">
      <header className="max-w-4xl mx-auto flex justify-between items-center border-b border-gray-700 pb-4 mb-8">
        <div>
          Room: <span className="font-mono text-blue-400">{roomId}</span>
        </div>
        <div className="text-right">
          <div>
            Player: <span className="font-bold">{username}</span>
          </div>
          <div className="text-sm text-gray-400 mt-1">
            Opponents waiting:{" "}
            {players.length > 0
              ? players.map((p) => p.username).join(", ")
              : "None"}
          </div>
        </div>
      </header>

      <ActiveGame
        socket={socket as any}
        roomId={roomId as string}
        username={username}
      />
    </div>
  );
}

export default function MultiplayerLobby() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-white">
          Loading room...
        </div>
      }
    >
      <MultiplayerLobbyContent />
    </Suspense>
  );
}
