"use client";

import { useState, useEffect, useSyncExternalStore, Suspense } from "react";
import { useParams } from "next/navigation";
import { socket } from "@/socket";
import { GAME_COMPONENTS } from "@/components/registry";

type Player = { id: string; username: string };
type LeaderboardEntry = { username: string; score: number };

const subscribe = () => () => {};

function MultiplayerLobbyContent() {
  const { game, roomId } = useParams<{ game: string; roomId: string }>();

  const savedUsername = useSyncExternalStore(
    subscribe,
    () => sessionStorage.getItem(`minigames_${roomId}`) ?? "",
    () => null,
  );
  const mounted = savedUsername !== null;

  const [typedUsername, setTypedUsername] = useState<string | null>(null);
  const [joinedNow, setJoinedNow] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameData, setGameData] = useState<unknown>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const username = typedUsername ?? savedUsername ?? "";
  const isJoined = joinedNow || !!savedUsername;
  const hasSubmitted = leaderboard.some((e) => e.username === username);

  const ActiveGame = GAME_COMPONENTS[game];

  useEffect(() => {
    if (!isJoined || !ActiveGame) return;

    const onRoomState = (d: { players: Player[] }) => setPlayers(d.players);
    const onGameData = (d: unknown) => setGameData(d);
    const onLeaderboard = (l: LeaderboardEntry[]) => setLeaderboard(l);

    socket.on("room_state", onRoomState);
    socket.on("game_data", onGameData);
    socket.on("leaderboard", onLeaderboard);

    if (!socket.connected) socket.connect();
    socket.emit("join_room", { roomId, username, gameType: game });

    return () => {
      socket.off("room_state", onRoomState);
      socket.off("game_data", onGameData);
      socket.off("leaderboard", onLeaderboard);
      socket.disconnect();
    };
  }, [isJoined, roomId, username, game, ActiveGame]);

  if (!mounted) {
    return <div className="min-h-screen bg-black"></div>;
  }

  if (!ActiveGame) {
    return (
      <div className="p-8 text-red-500 text-center">Error: Game not found.</div>
    );
  }

  const handleJoin = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username.trim()) return;
    sessionStorage.setItem(`minigames_${roomId}`, username);
    setJoinedNow(true);
  };

  const submit = (submission: unknown) =>
    socket.emit("submit_result", submission);

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
            onChange={(e) => setTypedUsername(e.target.value)}
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

  const opponents = players
    .map((p) => p.username)
    .filter((u) => u !== username);

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
            Opponents: {opponents.length > 0 ? opponents.join(", ") : "None"}
          </div>
        </div>
      </header>

      {gameData === null ? (
        <div className="text-center text-gray-400">Loading game...</div>
      ) : (
        <ActiveGame
          data={gameData}
          submit={submit}
          hasSubmitted={hasSubmitted}
        />
      )}

      {hasSubmitted && leaderboard.length > 0 && (
        <ol className="mt-8 max-w-md mx-auto">
          {leaderboard.map((e, i) => (
            <li
              key={e.username}
              className="flex justify-between py-1 border-b border-gray-800"
            >
              <span>
                {i + 1}. {e.username}
              </span>
              <span className="font-mono">{e.score.toFixed(1)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function MultiplayerLobby() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
          Loading room...
        </div>
      }
    >
      <MultiplayerLobbyContent />
    </Suspense>
  );
}
