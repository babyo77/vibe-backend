// using in new

import { CustomSocket } from "../../types";
import { VibeCache } from "../cache/cache";
import { emitMessage } from "../lib/customEmit";

import RoomUser from "../models/roomUsers";

export async function handleDisconnect(socket: CustomSocket) {
  try {
    const { userInfo, roomInfo } = socket;
    if (!roomInfo || !userInfo) return;
    VibeCache.del(roomInfo.roomId + "listeners");
    const data = await RoomUser.findOneAndUpdate(
      { userId: userInfo?.id, roomId: roomInfo?._id },
      {
        active: false,
      }
    )
      .populate("userId")
      .select("username");

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
