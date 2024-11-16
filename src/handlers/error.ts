import { CustomSocket } from "../../types";
import { encrypt } from "../lib/lock";

function getRandomEmoji(emojis: string[]): string {
  const randomIndex = Math.floor(Math.random() * emojis.length);
  return emojis[randomIndex];
}

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
