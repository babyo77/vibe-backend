// using in new

import { CustomSocket } from "../../types";
import { VibeCache } from "../cache/cache";
import { VibeCacheDb } from "../cache/cache-db";
import { emitMessage } from "../lib/customEmit";
import {
  GET_ROOM_LISTENERS_CACHE_KEY,
  GET_SET_PROGRESS_STATUS,
} from "../lib/utils";
import RoomUser from "../models/roomUsers";

export async function handleDisconnect(socket: CustomSocket) {
  try {
    const { userInfo, roomInfo } = socket;
    if (!roomInfo || !userInfo) return;
    const roomDbKey = GET_ROOM_LISTENERS_CACHE_KEY(roomInfo.roomId);
    const data = VibeCacheDb[roomDbKey].find({
      userId: { id: socket.id },
    })[0] as any;
    VibeCacheDb[roomDbKey].deleteWhere({
      userId: { id: socket.id },
    });

    if (userInfo?.role == "admin") {
      VibeCache.del(roomInfo._id + "isaAminOnline");
      VibeCacheDb[GET_SET_PROGRESS_STATUS(roomInfo.roomId)].delete();
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
    console.log(data);

    const stayDuration = Date.now() - data.userId.time;

    await RoomUser.updateOne(
      { userId: userInfo.id, roomId: roomInfo._id },
      { $max: { maxStayDuration: stayDuration } }
    ).exec();
  } catch (error) {
    console.log(error);
  }
}
