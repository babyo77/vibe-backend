// used in new src
import { CustomSocket } from "../../types";
import { VibeCache } from "../cache/cache";
import { VibeCacheDb } from "../cache/cache-db";
import { GET_ROOM_LISTENERS_CACHE_KEY, IS_EMITTER_ON } from "../lib/utils";

export async function handleUpdateStatus(
  socket: CustomSocket,
  status?: boolean
) {
  try {
    const { roomInfo } = socket;
    if (!roomInfo) return;

    socket
      .to(roomInfo.roomId)
      .emit("seekable", !IS_EMITTER_ON(roomInfo.roomId));

    if (!status) {
      const currentTime = Date.now();
      const user = VibeCacheDb[
        GET_ROOM_LISTENERS_CACHE_KEY(roomInfo.roomId)
      ].find({
        id: socket.id,
      })[0];
      VibeCacheDb[GET_ROOM_LISTENERS_CACHE_KEY(roomInfo.roomId)].update(
        {
          userId: {
            id: socket.id,
          },
        },
        {
          userId: {
            pausedFor:
              (user?.pausedFor || 0) +
              (currentTime - (user?.lastPauseStart || currentTime)),
            lastPauseStart: currentTime, // Track when the pause started
          },
        }
      );
    }
    const progress = VibeCache.has(roomInfo._id + "progress");
    if (progress && status) {
      socket.emit("seek", VibeCache.get(roomInfo._id + "progress"));
    }
  } catch (error) {
    console.log(error);
  }
}
