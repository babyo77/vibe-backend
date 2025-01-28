import { analytics, CustomSocket } from "../../types";

export async function saveAnalytics(socket: CustomSocket, data: analytics) {
  const { roomInfo, userInfo } = socket;
  if (!roomInfo || !userInfo) return;

  switch (data.type) {
    case "stayedFor":
      break;
    case "listening":
      break;
    case "streak":
      break;
    default:
      break;
  }
}
