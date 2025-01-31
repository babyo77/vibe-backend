// used in new src
import { CustomSocket } from "../../types";
import redisClient from "../cache/redis";
import { IS_EMITTER_ON } from "../lib/utils";

export async function handleProgress(socket: CustomSocket, progress: number) {
  try {
    const { roomInfo } = socket;
    if (!roomInfo || !progress) return;

    const isEmitterOnline = IS_EMITTER_ON(roomInfo.roomId);

    if (isEmitterOnline) {
      socket.to(roomInfo.roomId).emit("seekable", true);
    } else {
      socket.to(roomInfo.roomId).emit("seekable", false);
    }

    await redisClient.set(roomInfo._id + "progress", progress);
  } catch (error) {
    console.log(error);
  }
}
