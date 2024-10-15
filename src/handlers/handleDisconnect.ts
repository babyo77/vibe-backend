import { CustomSocket } from "../../types";
import { getListener } from "../lib/utils";
import Room from "../models/roomModel";
import RoomUser from "../models/roomUsers";

export async function handleDisconnect(socket: CustomSocket) {
  try {
    const { userId, roomInfo } = socket;
    if (!roomInfo) return;
    const data = await RoomUser.findOneAndUpdate(
      { userId, roomId: roomInfo?._id },
      {
        active: false,
      }
    ).populate("userId");
    const listeners = await getListener(roomInfo._id);
    if (roomInfo.roomId) {
      socket.to(roomInfo.roomId).emit("userLeftRoom", {
        user: data?.userId || { username: "Someone" },
        listeners,
      });
    }
  } catch (error) {
    console.log(error);
  }
}
