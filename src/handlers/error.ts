import { CustomSocket } from "../../types";
import { encrypt } from "../lib/lock";
import { getRandomEmoji, storeLogs } from "../lib/utils";

export async function errorHandler(socket: CustomSocket, err: any) {
  const message = err.message;
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

  const finalMessage = message || "Fuck 😭, An unexpected error occurred";
  storeLogs(socket, err, finalMessage, "SOCKET");
  socket.emit("error", encrypt(`${finalMessage} ${randomEmoji}`));
}

export const asyncHandlerSocket = async (
  socket: CustomSocket,
  fn: Function,
  ...args: any[]
) => {
  try {
    await fn(...args);
  } catch (error: any) {
    errorHandler(socket, error);
  }
};
