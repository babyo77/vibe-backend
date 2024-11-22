//used in new src
import { Server } from "socket.io";
import { CustomSocket, searchResults } from "../../types";
import { getCurrentlyPlaying, getPreviousSongByOrder } from "../lib/utils";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { broadcast } from "../lib/customEmit";
import Queue from "../models/queueModel";
import Vote from "../models/voteModel";
import { VibeCache } from "../cache/cache";

export async function PlayPrevSong(
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: CustomSocket
) {
  const { roomInfo, userInfo } = socket;
  if (!roomInfo || !userInfo) throw new Error("Login required");
  if (userInfo.role !== "admin")
    throw new Error("Only admin is allowed to play prev");
  let nextSong: any = [];
  const value = VibeCache.has(roomInfo.roomId + "isplaying")
    ? (VibeCache.get(roomInfo.roomId + "isplaying") as searchResults)
    : (await getCurrentlyPlaying(roomInfo._id, userInfo.id))[0];
  await Queue.updateOne(
    { roomId: roomInfo._id, isPlaying: true },
    {
      isPlaying: false,
    }
  );
  if (!value?.order) throw new Error("Queue is empty");
  nextSong = await getPreviousSongByOrder(
    roomInfo?._id,
    value?.order,
    userInfo?.id,
    value
  );
  if (nextSong.length == 0) throw new Error("Queue is empty");
  await Promise.all([
    Queue.updateOne(
      {
        roomId: roomInfo._id,
        "songData.id": nextSong[0].id,
      },
      { isPlaying: true }
    ),
    Vote.deleteMany({
      roomId: roomInfo._id,
      queueId: nextSong[0].queueId,
    }),
  ]);
  VibeCache.set(roomInfo.roomId + "isplaying", nextSong[0]);
  broadcast(io, roomInfo.roomId, "play", nextSong[0]);
  broadcast(io, roomInfo.roomId, "update", "update");
}
