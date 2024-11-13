// used in new src
import { CustomSocket } from "../../types";
import { VibeCache } from "../cache/cache";
import Room from "../models/roomModel";
import RoomUser from "../models/roomUsers";

export async function handleProgress(socket: CustomSocket, progress: number) {
  try {
    const { roomInfo, userInfo } = socket;
    if (!roomInfo || !progress) return;
    let isAdminOnline = null;
    if (VibeCache.has(roomInfo._id + "isaAminOnline")) {
      isAdminOnline = VibeCache.get(roomInfo._id + "isaAminOnline");
    } else {
      console.log("called api");

      isAdminOnline = await RoomUser.findOne({
        roomId: roomInfo?._id,
        role: "admin",
        active: true,
        status: true,
      });
    }

    VibeCache.set(roomInfo._id + "isaAminOnline", isAdminOnline);
    if (isAdminOnline && userInfo?.role !== "admin") return;
    if (userInfo?.role == "admin") {
      socket.to(roomInfo.roomId).emit("seekable", false);
    } else {
      socket.to(roomInfo.roomId).emit("seekable", true);
    }
    VibeCache.set(roomInfo._id + "progress", progress);
    await Room.findByIdAndUpdate(roomInfo._id, { progress });
  } catch (error) {
    console.log(error);
  }
}
