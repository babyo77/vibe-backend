// using in new

import { CustomSocket } from "../../types";
import { VibeCacheDb } from "../cache/cache-db";
import { emitMessage } from "../lib/customEmit";
import { GET_ROOM_LISTENERS_CACHE_KEY, IS_EMITTER_ON } from "../lib/utils";
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

    if (IS_EMITTER_ON(roomInfo.roomId)) {
      socket
        .to(roomInfo.roomId)
        .emit("seekable", !IS_EMITTER_ON(roomInfo.roomId));
    }
    if (VibeCacheDb[roomDbKey].get().length === 0) {
      VibeCacheDb[roomDbKey].delete();
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

    const stayDuration =
      Date.now() - data.userId.time - data.userId?.pausedFor || 0;

    await RoomUser.updateOne(
      { userId: userInfo.id, roomId: roomInfo._id },
      { $max: { maxStayDuration: stayDuration } }
    ).exec();
  } catch (error) {
    console.log(error);
  }
}
