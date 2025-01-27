// using in new

import { CustomSocket } from "../../types";
import { VibeCache } from "../cache/cache";
import { VibeCacheDb } from "../cache/cacheDB";
import { emitMessage } from "../lib/customEmit";
import { GET_ROOM_LISTENERS_CACHE_KEY } from "../lib/utils";
import RoomUser from "../models/roomUsers";

export async function handleDisconnect(socket: CustomSocket) {
  try {
    const { userInfo, roomInfo } = socket;
    if (!roomInfo || !userInfo) return;
    const roomDbKey = GET_ROOM_LISTENERS_CACHE_KEY(roomInfo.roomId);
    const data = VibeCacheDb[roomDbKey].find({
      userId: { id: socket.id },
    }) as any;
    VibeCacheDb[roomDbKey].deleteWhere({
      userId: { id: socket.id },
    });

    if (userInfo?.role == "admin") {
      VibeCache.del(roomInfo._id + "isaAminOnline");
      socket.to(roomInfo.roomId).emit("seekable", true);
    }
    socket.removeAllListeners();
    socket.leave(roomInfo.roomId);
    if (roomInfo.roomId) {
      emitMessage(
        socket,
        roomInfo.roomId,
        "userLeftRoom",
        data?.userId || { username: "@Someone" }
      );
    }
  } catch (error) {
    console.log(error);
  }
}
