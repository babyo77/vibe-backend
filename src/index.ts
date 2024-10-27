import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { runServer } from "./lib/db";
import { CustomSocket } from "../types";
import { handleDisconnect } from "./handlers/handleDisconnect";
import { sendMessage } from "./handlers/sendMessage";
import { middleware } from "./handlers/middleware";
import { cors } from "./lib/utils";
import { sendHeart } from "./handlers/sendHeart";
import { handleProgress } from "./handlers/handleProgress";
import { handleSeek } from "./handlers/handleSeek";
import { handlePlay } from "./handlers/handlePlay";
import deleteSong from "./handlers/deleteSong";
import { deleteAll } from "./handlers/deleteAll";
import upVote from "./handlers/upVote";
import { bulkDelete } from "./handlers/bulkDelete";
import { PlayNextSong } from "./handlers/nextSong";
import { SongEnded } from "./handlers/songEnded";
import { PlayPrevSong } from "./handlers/prevSong";
import cookieParser from "cookie-parser";
import useCors from "cors";
import router from "./router/router";
const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: cors,
  httpCompression: true,
});

app.use(
  useCors({
    origin: true,
    credentials: true,
  })
);
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "https://getvibe.in");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});
app.use(express.json());
app.use(cookieParser()); // For cookie parsing
app.use(router);

io.use(async (socket: CustomSocket, next) => {
  socket.compress(true);
  await middleware(socket, next);
});

io.on("connection", (socket: CustomSocket) => {
  const eventHandlers = {
    message: async (message: string) => sendMessage(io, socket, message),
    heart: async (heart: any) => sendHeart(socket, heart),
    progress: async (progress: any) => handleProgress(socket, progress),
    seek: async (seek: number) => handleSeek(socket, seek),
    play: async (play: any) => handlePlay(io, socket, play),
    update: () => io.to(socket.roomInfo?.roomId || "").emit("update"),
    deleteSong: async (data: any) => deleteSong(io, socket, data),
    deleteAll: async () => deleteAll(io, socket),
    upvote: async (upvote: any) => upVote(io, socket, upvote),
    bulkDelete: async (data: any) => bulkDelete(io, socket, data),
    playNext: async () => PlayNextSong(io, socket),
    songEnded: async () => SongEnded(io, socket),
    playPrev: async () => PlayPrevSong(io, socket),
  };

  for (const [event, handler] of Object.entries(eventHandlers)) {
    socket.on(event, handler);
  }

  socket.on("disconnect", () => handleDisconnect(socket));
});

runServer(server);
