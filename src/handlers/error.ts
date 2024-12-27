import { CustomSocket } from "../../types";
import { encrypt } from "../lib/lock";
import { getRandomEmoji } from "../lib/utils";
import { socketIoErrorCounter } from "../metrics/metrics";

export async function errorHandler(socket: CustomSocket, err: any) {
  const message = err?.message || err;
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
    "⚡️",
  ];

  const randomEmoji = getRandomEmoji(emojiArray);
  socketIoErrorCounter.inc({
    event: "error",
    error_message: err?.message || "Unknown error",
  });
  const finalMessage = message || "Fuck 😭, An unexpected error occurred";
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
