"use client";
import { io } from "socket.io-client";

const url = process.env.SITE_URL;

export const socket = io(url, {
  autoConnect: false
});
