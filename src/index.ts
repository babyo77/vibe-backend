import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { runServer } from "./lib/db";
import { CustomSocket } from "../types";
import { handleDisconnect } from "./handlers/handleDisconnect";
import { sendMessage } from "./handlers/sendMessage";
import { middleware } from "./handlers/middleware";
import { cors, getFormattedDateTime } from "./lib/utils";
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
import { rateLimit } from "express-rate-limit";
import { updateDetails } from "./handlers/updateDetails";
import { handleUpdateStatus } from "./handlers/handleUpdateStatus";
import emitUpdates from "./handlers/emitUpdates";
import { errorHandler } from "./functions/apiError";
import { asyncHandlerSocket } from "./handlers/error";

const limiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
  },
});

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

app.use(limiter);
app.use(express.json());
app.use(cookieParser());
app.use(router);
app.use(errorHandler);

io.use(async (socket: CustomSocket, next) => {
  try {
    socket.compress(true);
    await middleware(socket, next);
  } catch (error: any) {
    next(new Error(error.message));
  }
});

io.on("connection", (socket: CustomSocket) => {
  const eventHandlers = {
    message: async (message: string) =>
      asyncHandlerSocket(socket, sendMessage, io, socket, message),
    heart: async (heart: any) =>
      asyncHandlerSocket(socket, sendHeart, socket, heart),
    progress: async (progress: any) =>
      asyncHandlerSocket(socket, handleProgress, socket, progress),
    seek: async (seek: number) =>
      asyncHandlerSocket(socket, handleSeek, socket, seek),
    play: async (play: any) =>
      asyncHandlerSocket(socket, handlePlay, io, socket, play),
    update: () => io.to(socket.roomInfo?.roomId || "").emit("update"),
    deleteSong: async (data: any) =>
      asyncHandlerSocket(socket, deleteSong, io, socket, data),
    deleteAll: async () => asyncHandlerSocket(socket, deleteAll, io, socket),
    upvote: async (upvote: any) =>
      asyncHandlerSocket(socket, upVote, io, socket, upvote),
    bulkDelete: async (data: any) =>
      asyncHandlerSocket(socket, bulkDelete, io, socket, data),
    playNext: async () =>
      asyncHandlerSocket(
        socket,
        asyncHandlerSocket,
        socket,
        PlayNextSong,
        io,
        socket
      ),
    songEnded: async () => asyncHandlerSocket(socket, SongEnded, io, socket),
    playPrev: async () => asyncHandlerSocket(socket, PlayPrevSong, io, socket),
    updateDetails: async (data: any) =>
      asyncHandlerSocket(socket, updateDetails, socket, data),
    status: async (status: any) =>
      asyncHandlerSocket(socket, handleUpdateStatus, socket, status),
    profile: async () => asyncHandlerSocket(socket, emitUpdates, socket),
  };

  for (const [event, handler] of Object.entries(eventHandlers)) {
    socket.on(event, handler);
  }

  socket.on("disconnect", () => handleDisconnect(socket));
});

runServer(server);
