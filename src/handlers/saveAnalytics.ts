import { analytics, CustomSocket } from "../../types";
import { VibeCache } from "../cache/cache";
import { getCurrentlyPlaying } from "../lib/utils";
import { Listening } from "../models/listeningModel";

export async function saveAnalytics(socket: CustomSocket, data: analytics) {
  const { roomInfo, userInfo } = socket;
  if (!roomInfo || !userInfo) return;

  const currentSong = VibeCache.has(roomInfo.roomId + "isplaying")
    ? VibeCache.get(roomInfo.roomId + "isplaying")
    : ((
        await getCurrentlyPlaying(roomInfo._id, socket.userInfo?.id)
      )[0] as any);

  switch (data.type) {
    case "listening":
      await Listening.findOneAndUpdate(
        {
          userId: userInfo.id,
          songId: currentSong.id as string,
        },
        {
          $inc: { playCount: 1 },
        },
        { upsert: true }
      );
      break;
    case "streak":
      break;
    default:
      break;
  }
}
