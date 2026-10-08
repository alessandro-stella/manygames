import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

import pkg from "@next/env";
const { loadEnvConfig } = pkg;

const projectDir = process.cwd();
loadEnvConfig(projectDir);

import { env } from "./env.mjs";
import { registerRoomHandlers } from "./rooms.js";

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
      methods: ["GET", "POST"],
    },
  });

  registerRoomHandlers(io);

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`Server ready on http://${hostname}:${port}`);
      console.log(`CORS locked on: ${env.SITE_URL}`);
    });
});
