// used in new src
import { CustomSocket } from "../../types";
import { VibeCache } from "../cache/cache";
import RoomUser from "../models/roomUsers";

export async function handleUpdateStatus(
  socket: CustomSocket,
  status?: boolean
) {
  try {
    const { roomInfo, userInfo } = socket;
    if (!roomInfo) return;
    VibeCache.del(roomInfo._id + "isaAminOnline");
    await RoomUser.updateOne(
      { roomId: roomInfo._id, userId: userInfo?.id },
      { status }
    );
    if (userInfo?.role == "admin") {
      socket.to(roomInfo.roomId).emit("seekable", !status ? true : false);
    }
    const progress = VibeCache.has(roomInfo._id + "progress");
    if (progress && status) {
      socket.emit("seek", VibeCache.get(roomInfo._id + "progress"));
    }
  } catch (error) {
    console.log(error);
  }
}
