import { analytics, CustomSocket } from "../../types";
import { GET_CURRENTLY_PLAYING } from "../lib/utils";
import { Listening } from "../models/listeningModel";

export async function saveAnalytics(socket: CustomSocket, data: analytics) {
  const { roomInfo, userInfo } = socket;
  if (!roomInfo || !userInfo) return;

  const currentSong = await GET_CURRENTLY_PLAYING(socket);

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
