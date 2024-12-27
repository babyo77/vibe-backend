import { DefaultEventsMap, Server } from "socket.io";
import { CustomSocket } from "../../types";
import { sendMessage } from "../handlers/sendMessage";
import { asyncHandlerSocket } from "../handlers/error";
import { sendHeart } from "../handlers/sendHeart";
import { handleProgress } from "../handlers/handleProgress";
import { handleSeek } from "../handlers/handleSeek";
import { handlePlay } from "../handlers/handlePlay";
import deleteSong from "../handlers/deleteSong";
import { deleteAll } from "../handlers/deleteAll";
import upVote from "../handlers/upVote";
import { bulkDelete } from "../handlers/bulkDelete";
import { PlayNextSong } from "../handlers/nextSong";
import { SongEnded } from "../handlers/songEnded";
import { PlayPrevSong } from "../handlers/prevSong";
import { updateDetails } from "../handlers/updateDetails";
import { handleUpdateStatus } from "../handlers/handleUpdateStatus";
import emitUpdates from "../handlers/emitUpdates";
import { handleDisconnect } from "../handlers/handleDisconnect";
// const middlewareEvents = ["message", "heart"];
export function setSocketListeners(
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) {
  console.log("SOCKET LISTENERS SET ⚡️");

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
      playPrev: async () =>
        asyncHandlerSocket(socket, PlayPrevSong, io, socket),
      updateDetails: async (data: any) =>
        asyncHandlerSocket(socket, updateDetails, socket, data),
      status: async (status: any) =>
        asyncHandlerSocket(socket, handleUpdateStatus, socket, status),
      profile: async () => asyncHandlerSocket(socket, emitUpdates, socket),
      event: async (roomId?: string) => io.to(roomId || "").emit("update"),
    };

    for (const [event, handler] of Object.entries(eventHandlers)) {
      socket.on(event, handler);
    }

    socket.on("disconnect", () => handleDisconnect(socket));
  });
}
