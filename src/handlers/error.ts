import { CustomSocket } from "../../types";
import { encrypt } from "../lib/lock";
import { getRandomEmoji } from "../lib/utils";

export async function errorHandler(socket: CustomSocket, message?: string) {
  const emojiArray = [
    "😂",
    "😎",
    "😭",
    "🥺",
    "💀",
    "🤡",
    "🤪",
    "🥴",
    "😜",
    "🫠",
  ];

  const randomEmoji = getRandomEmoji(emojiArray);

  const finalMessage = message || "An unexpected error occurred";

  socket.emit("error", encrypt(`${finalMessage} ${randomEmoji}`));
}
