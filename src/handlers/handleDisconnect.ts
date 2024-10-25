// using in new

import { CustomSocket } from "../../types";
import { emitMessage } from "../lib/customEmit";

import RoomUser from "../models/roomUsers";

export async function handleDisconnect(socket: CustomSocket) {
  try {
    const { userInfo, roomInfo } = socket;
    if (!roomInfo || !userInfo) return;
    const data = await RoomUser.findOneAndUpdate(
      { userId: userInfo?.id, roomId: roomInfo?._id },
      {
        active: false,
      }
    )
      .populate("userId")
      .select("username");
    if (roomInfo.roomId) {
      emitMessage(
        socket,
        roomInfo.roomId,
        "userLeftRoom",
        data?.userId || { username: "Someone" }
      );
    }
    socket.leave(roomInfo.roomId);
  } catch (error) {
    console.log(error);
  }
}
