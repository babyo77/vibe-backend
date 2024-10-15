import { CustomSocket } from "../../types";
import Room from "../models/roomModel";

export async function handleProgress(socket: CustomSocket, progress: number) {
  try {
    const { roomInfo, userId } = socket;
    if (!roomInfo || !progress || !userId) return;
    await Room.findByIdAndUpdate(roomInfo._id, { progress });
  } catch (error) {
    console.log(error);
  }
}
