// used in new src
import { CustomSocket } from "../../types";
import { VibeCache } from "../cache/cache";
import { VibeCacheDb } from "../cache/cache-db";
import { GET_SET_PROGRESS_STATUS } from "../lib/utils";

export async function handleProgress(socket: CustomSocket, progress: number) {
  try {
    const { roomInfo, userInfo } = socket;
    if (!roomInfo || !progress) return;
    let isAdminOnline = null;
    if (VibeCache.has(roomInfo._id + "isaAminOnline")) {
      isAdminOnline = VibeCache.get(roomInfo._id + "isaAminOnline");
    } else {
      if (userInfo?.role == "admin") {
        isAdminOnline = true;
        VibeCacheDb[GET_SET_PROGRESS_STATUS(roomInfo.roomId)].add({});
      } else {
        VibeCacheDb[GET_SET_PROGRESS_STATUS(roomInfo.roomId)].delete();
        isAdminOnline = false;
      }
    }

    VibeCache.set(roomInfo._id + "isaAminOnline", isAdminOnline);
    if (
      VibeCacheDb[GET_SET_PROGRESS_STATUS(roomInfo.roomId)].has() &&
      userInfo?.role !== "admin"
    )
      return;
    if (userInfo?.role == "admin") {
      socket.to(roomInfo.roomId).emit("seekable", false);
    } else {
      socket.to(roomInfo.roomId).emit("seekable", true);
    }
    VibeCache.set(roomInfo._id + "progress", progress);
    // await Room.findByIdAndUpdate(roomInfo._id, { progress });
  } catch (error) {
    console.log(error);
  }
}
