import { GAMES } from "./games/index.js";
import { randomInt } from "node:crypto";

const rooms = new Map();

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ROOM_ID_REGEX = /^[A-HJ-NP-Z2-9]{5}$/;
const EMPTY_TTL = 30_000;
const MAX_USERNAME = 20;

function generateRoomId() {
  let id;
  do {
    id = Array.from(
      { length: 5 },
      () => ALPHABET[randomInt(ALPHABET.length)],
    ).join("");
  } while (rooms.has(id));
  return id;
}

function getRoom(roomId) {
  return typeof roomId === "string" && ROOM_ID_REGEX.test(roomId)
    ? rooms.get(roomId)
    : undefined;
}

function scheduleCleanup(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  clearTimeout(room.cleanupTimer);
  room.cleanupTimer = setTimeout(() => {
    const r = rooms.get(roomId);
    if (r && r.players.size === 0) rooms.delete(roomId);
  }, EMPTY_TTL);
}

function buildLeaderboard(room) {
  const asc = GAMES[room.gameType].order === "asc";
  return [...room.results]
    .map(([username, score]) => ({ username, score }))
    .sort((a, b) => (asc ? a.score - b.score : b.score - a.score));
}

function playersOf(room) {
  return [...room.players].map(([id, p]) => ({ id, username: p.username }));
}

export function registerRoomHandlers(io) {
  io.on("connection", (socket) => {
    socket.on("create_room", ({ gameType } = {}, ack) => {
      if (!GAMES[gameType]) return ack?.({ ok: false });
      ack?.({ ok: true, roomId: generateRoomId() });
    });

    socket.on("room_exists", ({ roomId, gameType } = {}, ack) => {
      const room = getRoom(roomId);
      ack?.({ exists: !!room && room.gameType === gameType });
    });

    socket.on(
      "join_room",
      ({ roomId, username, gameType, playerId, create } = {}, ack) => {
        if (socket.data.roomId)
          return ack?.({ ok: false, error: "already_joined" });

        const def = GAMES[gameType];
        if (!def) return ack?.({ ok: false, error: "bad_game" });
        if (typeof playerId !== "string" || !playerId || playerId.length > 64) {
          return ack?.({ ok: false, error: "bad_request" });
        }
        if (typeof roomId !== "string" || !ROOM_ID_REGEX.test(roomId)) {
          return ack?.({ ok: false, error: "not_found" });
        }
        const name = typeof username === "string" ? username.trim() : "";
        if (!name || name.length > MAX_USERNAME) {
          return ack?.({ ok: false, error: "bad_username" });
        }

        let room = rooms.get(roomId);
        if (create) {
          if (room) return ack?.({ ok: false, error: "room_exists" });
          room = {
            gameType,
            data: def.generate(),
            players: new Map(), // playerId -> { username, socketId }
            names: new Map(), // name (lowercase) -> playerId
            results: new Map(), // username -> score
            cleanupTimer: null,
          };
          rooms.set(roomId, room);
        } else if (!room || room.gameType !== gameType) {
          return ack?.({ ok: false, error: "not_found" });
        }

        const key = name.toLowerCase();
        const owner = room.names.get(key);
        if (owner && owner !== playerId)
          return ack?.({ ok: false, error: "name_taken" });

        const prev = room.players.get(playerId);
        if (prev && prev.username.toLowerCase() !== key) {
          return ack?.({ ok: false, error: "already_joined" });
        }

        if (prev && prev.socketId !== socket.id) {
          io.sockets.sockets.get(prev.socketId)?.disconnect(true);
        }

        clearTimeout(room.cleanupTimer);
        room.names.set(key, playerId);
        room.players.set(playerId, { username: name, socketId: socket.id });

        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.data.username = name;
        socket.data.playerId = playerId;

        socket.emit("game_data", def.toPublic(room.data));
        socket.emit("leaderboard", buildLeaderboard(room));
        io.to(roomId).emit("room_state", { players: playersOf(room) });
        ack?.({ ok: true });
      },
    );

    socket.on("submit_result", (submission) => {
      const { roomId, username } = socket.data;
      const room = rooms.get(roomId);
      if (!room || room.results.has(username)) return;

      let score;
      try {
        score = GAMES[room.gameType].score(room.data, submission);
      } catch {
        return socket.emit("error_msg", "Result not valid");
      }
      if (!Number.isFinite(score)) return;

      room.results.set(username, score);
      io.to(roomId).emit("leaderboard", buildLeaderboard(room));
    });

    socket.on("disconnect", () => {
      const { roomId, playerId } = socket.data;
      const room = rooms.get(roomId);
      if (!room) return;

      if (room.players.get(playerId)?.socketId === socket.id) {
        room.players.delete(playerId);
      }
      io.to(roomId).emit("room_state", { players: playersOf(room) });
      if (room.players.size === 0) scheduleCleanup(roomId);
    });
  });
}
