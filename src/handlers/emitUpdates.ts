import { CustomSocket } from "../../types";
import { emitMessage } from "../lib/customEmit";
import { errorHandler } from "./error";
import { VibeCache } from "../cache/cache";

export default async function emitUpdates(socket: CustomSocket) {
  try {
    const { roomInfo, userInfo } = socket;
    if (!roomInfo || !userInfo) return;
    VibeCache.del(roomInfo.roomId + "listeners");
    emitMessage(socket, roomInfo?.roomId, "profile", "profile");
  } catch (error: any) {
    console.log("UPDATE PROFILE ERROR:", error.message);
    errorHandler(socket, error.message);
  }
}
