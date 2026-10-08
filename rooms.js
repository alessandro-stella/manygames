import { GAMES } from "./games/index.js";

const rooms = new Map();

function buildLeaderboard(room) {
  const asc = GAMES[room.gameType].order === "asc";
  return [...room.results]
    .map(([username, score]) => ({ username, score }))
    .sort((a, b) => (asc ? a.score - b.score : b.score - a.score));
}

function playersOf(room) {
  return [...room.players].map(([id, username]) => ({ id, username }));
}

export function registerRoomHandlers(io) {
  io.on("connection", (socket) => {
    socket.on("join_room", ({ roomId, username, gameType }) => {
      const def = GAMES[gameType];
      if (!def) return socket.emit("error_msg", "Game not valid");

      let room = rooms.get(roomId);
      if (!room) {
        room = {
          gameType,
          data: def.generate(),
          players: new Map(),
          results: new Map(),
        };
        rooms.set(roomId, room);
      }
      if (room.gameType !== gameType) {
        return socket.emit("error_msg", "This room is for another game");
      }

      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.username = username;
      room.players.set(socket.id, username);

      socket.emit("game_data", GAMES[room.gameType].toPublic(room.data));
      socket.emit("leaderboard", buildLeaderboard(room));
      io.to(roomId).emit("room_state", { players: playersOf(room) });
    });

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
      const { roomId } = socket.data;
      const room = rooms.get(roomId);
      if (!room) return;
      room.players.delete(socket.id);
      io.to(roomId).emit("room_state", { players: playersOf(room) });
      if (room.players.size === 0) rooms.delete(roomId);
    });
  });
}
