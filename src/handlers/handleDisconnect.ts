import { CustomSocket } from "../../types";
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
    if (roomInfo.roomId && data?.userId) {
      socket.to(roomInfo.roomId).emit("userLeftRoom", data?.userId);
    }
  } catch (error) {
    console.log(error);
  }
}
