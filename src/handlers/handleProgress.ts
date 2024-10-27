// used in new src
import { CustomSocket } from "../../types";
import Room from "../models/roomModel";

export async function handleProgress(socket: CustomSocket, progress: number) {
  try {
    const { roomInfo } = socket;
    if (!roomInfo || !progress) return;

    await Room.findByIdAndUpdate(roomInfo._id, { progress });
  } catch (error) {
    console.log(error);
  }
}
