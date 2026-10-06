import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

import pkg from "@next/env";
const { loadEnvConfig } = pkg;

const projectDir = process.cwd();
loadEnvConfig(projectDir);

import { env } from "./env.mjs";

const dev = env.NODE_ENV !== "production";
const hostname = "localhost";
const port = env.PORT;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    cors: {
      origin: env.SITE_URL,
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    socket.on("join_room", async ({ roomId, username }) => {
      socket.join(roomId);
      socket.data.username = username;
      socket.data.roomId = roomId;

      const socketsInRoom = await io.in(roomId).fetchSockets();
      const players = socketsInRoom.map((s) => ({
        id: s.id,
        username: s.data.username
      }));

      io.in(roomId).emit("room_state", { players });
    });

    socket.on("submit_guess", (data) => {
      socket.to(data.roomId).emit("opponent_guessed", data);
    });

    socket.on("disconnect", async () => {
      if (socket.data.roomId) {
        const socketsInRoom = await io.in(socket.data.roomId).fetchSockets();
        const players = socketsInRoom
          .filter((s) => s.id !== socket.id)
          .map((s) => ({
            id: s.id,
            username: s.data.username
          }));

        io.in(socket.data.roomId).emit("room_state", { players });
      }
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> CORS locked on: ${env.SITE_URL}`);
    });
});
