"use client";

import {
  useState,
  useEffect,
  useRef,
  useSyncExternalStore,
  Suspense,
} from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { socket } from "@/socket";
import { GAME_COMPONENTS } from "@/components/registry";
import { ShareButton } from "@/components/ShareButtons";

type Player = { id: string; username: string };
type LeaderboardEntry = { username: string; score: number };
type JoinAck = { ok: boolean; error?: string };

const subscribe = () => () => {};

const ERROR_MESSAGES: Record<string, string> = {
  name_taken: "Nickname already taken in this room.",
  bad_username: "Invalid nickname (max 20 characters).",
  already_joined: "You are already in this room from another session.",
  room_exists: "Room code already in use, go back and create a new room.",
};

function getPlayerId() {
  let id = sessionStorage.getItem("minigames_pid");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("minigames_pid", id);
  }
  return id;
}

function MultiplayerLobbyContent() {
  const { game, roomId } = useParams<{ game: string; roomId: string }>();
  const searchParams = useSearchParams();

  const savedUsername = useSyncExternalStore(
    subscribe,
    () => sessionStorage.getItem(`minigames_${roomId}`) ?? "",
    () => null,
  );
  const mounted = savedUsername !== null;

  const createRef = useRef(searchParams.get("create") === "1");

  const [typedUsername, setTypedUsername] = useState<string | null>(null);
  const [joinedNow, setJoinedNow] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameData, setGameData] = useState<unknown>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const rawUsername = typedUsername ?? savedUsername ?? "";
  const username = rawUsername.trim();
  const isJoined = !joinError && (joinedNow || !!savedUsername);
  const hasSubmitted = leaderboard.some((e) => e.username === username);

  const ActiveGame = GAME_COMPONENTS[game];

  useEffect(() => {
    if (!isJoined || !ActiveGame) return;

    let cancelled = false;

    const onRoomState = (d: { players: Player[] }) => setPlayers(d.players);
    const onGameData = (d: unknown) => setGameData(d);
    const onLeaderboard = (l: LeaderboardEntry[]) => setLeaderboard(l);

    socket.on("room_state", onRoomState);
    socket.on("game_data", onGameData);
    socket.on("leaderboard", onLeaderboard);

    if (!socket.connected) socket.connect();

    const join = (create: boolean) => {
      socket.emit(
        "join_room",
        { roomId, username, gameType: game, playerId: getPlayerId(), create },
        (res: JoinAck) => {
          if (cancelled) return;

          if (res.ok) {
            sessionStorage.setItem(`minigames_${roomId}`, username);
            if (createRef.current) {
              createRef.current = false;
              window.history.replaceState(
                null,
                "",
                `/${game}/multiplayer/${roomId}`,
              );
            }
            return;
          }

          if (res.error === "room_exists" && create) {
            createRef.current = false;
            return join(false);
          }

          sessionStorage.removeItem(`minigames_${roomId}`);
          setTypedUsername(username);
          setJoinError(res.error ?? "unknown");
          setJoinedNow(false);
        },
      );
    };

    join(createRef.current);

    return () => {
      cancelled = true;
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

  if (joinError === "not_found") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black gap-4 text-white">
        <p className="text-red-500">Room not found or expired.</p>
        <Link
          href={`/${game}/multiplayer`}
          className="bg-blue-600 hover:bg-blue-500 font-bold px-4 py-2 rounded"
        >
          Back to multiplayer
        </Link>
      </div>
    );
  }

  const handleJoin = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username) return;
    setJoinError(null);
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
            value={rawUsername}
            maxLength={20}
            onChange={(e) => {
              setTypedUsername(e.target.value);
              setJoinError(null);
            }}
            className="border-none p-3 rounded bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          {joinError && (
            <p className="text-red-500 text-sm text-center">
              {ERROR_MESSAGES[joinError] ?? "Could not join the room."}
            </p>
          )}
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
        <div className="flex items-center gap-3">
          <span>
            Room: <span className="font-mono text-blue-400">{roomId}</span>
          </span>
          <ShareButton roomId={roomId} />
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
