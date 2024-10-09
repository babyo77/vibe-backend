import { CustomSocket } from "../../types";
import User from "../models/userModel";

export async function sendMessage(socket: CustomSocket, message: string) {
  const { roomInfo, userId } = socket;
  if (!roomInfo || !userId || !message) return;
  const user = await User.findById(userId);
  const payload = {
    user,
    message,
  };
  socket.emit("message", payload);
  socket.to(roomInfo?.roomId).emit("message", payload);
}
