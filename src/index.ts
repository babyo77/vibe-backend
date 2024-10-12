import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { runServer } from "./lib/db";
import { CustomSocket, prevSongT, nextSongT, searchResults } from "../types";
import { prevSong } from "./handlers/prevSong";
import { nextSong } from "./handlers/nextSong";
import { handleJoinRoom } from "./handlers/handleJoinRoom";
import { handleDisconnect } from "./handlers/handleDisconnect";
import addQueue from "./handlers/addQueue";
import upVote from "./handlers/upVote";
import deleteSong from "./handlers/deleteSong";
import { sendMessage } from "./handlers/sendMessage";
import { songEnded } from "./handlers/songEnded";
import { getQueueList } from "./handlers/getQueueList";
import { handleSeek } from "./handlers/handleSeek";
import { sendDuration } from "./handlers/sendDuration";
import { middleware } from "./handlers/middleware";
import { cors, homeResponse } from "./lib/utils";
import { handleProgress } from "./handlers/handleProgress";
const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: cors,
});

app.get("/", (_req, res) => {
  res.json(homeResponse);
});
io.use(async (socket: CustomSocket, next) => {
  middleware(socket, next);
});

io.on("connection", (socket: CustomSocket) => {
  // Initial setup for the socket connection
  handleJoinRoom(socket);

  // Socket event handlers mapping
  const eventHandlers = {
    nextSong: async (data: nextSongT) => nextSong(socket, data),
    prevSong: async (data: prevSongT) => prevSong(socket, data),
    seek: async (seek: number) => handleSeek(socket, seek),
    getProgress: async () => sendDuration(socket),
    progress: async (progress: number) => handleProgress(socket, progress),
    addToQueue: async (data: searchResults) => addQueue(socket, data),
    deleteSong: async (data: searchResults) => deleteSong(socket, data),
    upVote: async (data: searchResults) => upVote(socket, data),
    message: async (message: string) => sendMessage(socket, message),
    getSongQueue: async () => getQueueList(socket),
    songEnded: async (data: searchResults) => songEnded(io, socket, data),
  };

  // Registering all socket event handlers
  for (const [event, handler] of Object.entries(eventHandlers)) {
    socket.on(event, handler);
  }

  // Handle disconnection
  socket.on("disconnect", () => handleDisconnect(socket));
});

runServer(server);
